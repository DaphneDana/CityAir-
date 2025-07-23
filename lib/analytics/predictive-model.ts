/**
 * Predictive Analytics Module
 * Uses historical data to predict future air quality trends and potential issues
 */

import type { SensorData } from "@prisma/client"

interface PredictionResult {
  timestamp: Date
  predictions: {
    co: number
    pm2_5: number
    pm10: number
    voc: number
    methane: number
    temperature: number
    humidity: number
  }
  confidence: number // 0-1 confidence score
  potentialIssues: string[]
}

export class PredictiveModel {
  // Simple moving average window size
  private readonly windowSize = 24 // 24 data points

  /**
   * Predicts future values based on historical data using simple moving average
   * In a production system, this would use more sophisticated ML models
   */
  predictNextValues(historicalData: SensorData[], hoursAhead = 1): PredictionResult[] {
    if (historicalData.length < this.windowSize) {
      throw new Error(`Insufficient data for prediction. Need at least ${this.windowSize} data points.`)
    }

    const predictions: PredictionResult[] = []

    // Sort data by timestamp
    const sortedData = [...historicalData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // For each hour we want to predict
    for (let hour = 1; hour <= hoursAhead; hour++) {
      // Calculate the timestamp for this prediction
      const lastTimestamp = new Date(sortedData[sortedData.length - 1].timestamp)
      const predictionTimestamp = new Date(lastTimestamp)
      predictionTimestamp.setHours(predictionTimestamp.getHours() + hour)

      // Get the most recent window of data
      const recentData = sortedData.slice(-this.windowSize)

      // Calculate moving averages for each metric
      const co = this.calculateMovingAverage(recentData, "co")
      const pm2_5 = this.calculateMovingAverage(recentData, "pm2_5")
      const pm10 = this.calculateMovingAverage(recentData, "pm10")
      const voc = this.calculateMovingAverage(recentData, "voc")
      const methane = this.calculateMovingAverage(recentData, "methane")
      const temperature = this.calculateMovingAverage(recentData, "temperature")
      const humidity = this.calculateMovingAverage(recentData, "humidity")

      // Calculate trend direction for each metric
      const coTrend = this.calculateTrend(recentData, "co")
      const pm2_5Trend = this.calculateTrend(recentData, "pm2_5")
      const pm10Trend = this.calculateTrend(recentData, "pm10")
      const vocTrend = this.calculateTrend(recentData, "voc")
      const methaneTrend = this.calculateTrend(recentData, "methane")

      // Apply trend adjustments to predictions
      const predictedValues = {
        co: co + coTrend * hour * 0.05 * co, // Adjust by 5% per hour based on trend
        pm2_5: pm2_5 + pm2_5Trend * hour * 0.05 * pm2_5,
        pm10: pm10 + pm10Trend * hour * 0.05 * pm10,
        voc: voc + vocTrend * hour * 0.05 * voc,
        methane: methane + methaneTrend * hour * 0.05 * methane,
        temperature: temperature,
        humidity: humidity,
      }

      // Identify potential issues based on predicted values and thresholds
      const potentialIssues = this.identifyPotentialIssues(predictedValues)

      // Calculate confidence score (decreases as we predict further into the future)
      const confidence = Math.max(0.3, 1 - hour * 0.1)

      predictions.push({
        timestamp: predictionTimestamp,
        predictions: predictedValues,
        confidence,
        potentialIssues,
      })

      // For the next iteration, add our prediction to the data
      // This allows us to build predictions on top of predictions
      sortedData.push({
        ...sortedData[sortedData.length - 1],
        timestamp: predictionTimestamp,
        co: predictedValues.co,
        pm2_5: predictedValues.pm2_5,
        pm10: predictedValues.pm10,
        voc: predictedValues.voc,
        methane: predictedValues.methane,
        temperature: predictedValues.temperature,
        humidity: predictedValues.humidity,
      } as SensorData)
    }

    return predictions
  }

  /**
   * Calculates moving average for a specific metric
   */
  private calculateMovingAverage(data: SensorData[], metric: keyof SensorData): number {
    const validValues = data
      .map((item) => item[metric])
      .filter((value) => value !== null && value !== undefined) as number[]

    if (validValues.length === 0) return 0

    const sum = validValues.reduce((acc, val) => acc + val, 0)
    return sum / validValues.length
  }

  /**
   * Calculates trend direction (-1 for decreasing, 0 for stable, 1 for increasing)
   */
  private calculateTrend(data: SensorData[], metric: keyof SensorData): number {
    if (data.length < 2) return 0

    // Split data into two halves and compare averages
    const midpoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midpoint)
    const secondHalf = data.slice(midpoint)

    const firstAvg = this.calculateMovingAverage(firstHalf, metric)
    const secondAvg = this.calculateMovingAverage(secondHalf, metric)

    // Calculate percent change
    const percentChange = (secondAvg - firstAvg) / firstAvg

    // Determine trend direction
    if (Math.abs(percentChange) < 0.05) return 0 // Less than 5% change is considered stable
    return percentChange > 0 ? 1 : -1
  }

  /**
   * Identifies potential issues based on predicted values
   */
  private identifyPotentialIssues(values: Record<string, number>): string[] {
    const issues: string[] = []

    // These thresholds should be configurable in a production system
    if (values.co > 9) issues.push("High CO levels predicted")
    if (values.pm2_5 > 25) issues.push("Elevated PM2.5 levels predicted")
    if (values.pm10 > 50) issues.push("Elevated PM10 levels predicted")
    if (values.voc > 400) issues.push("High VOC levels predicted")
    if (values.methane > 25) issues.push("Elevated methane levels predicted")

    // Check for combined issues that might indicate specific problems
    if (values.co > 7 && values.methane > 20) {
      issues.push("Potential combustion issue detected")
    }

    if (values.pm2_5 > 20 && values.pm10 > 40 && values.humidity < 30) {
      issues.push("Dry conditions with high particulate matter - check filtration systems")
    }

    return issues
  }

  /**
   * Analyzes correlations between different metrics
   */
  analyzeCorrelations(data: SensorData[]): Record<string, Record<string, number>> {
    const metrics = ["co", "pm2_5", "pm10", "voc", "methane", "temperature", "humidity"]
    const correlations: Record<string, Record<string, number>> = {}

    // Initialize correlation matrix
    metrics.forEach((metric1) => {
      correlations[metric1] = {}
      metrics.forEach((metric2) => {
        correlations[metric1][metric2] = metric1 === metric2 ? 1 : 0
      })
    })

    // Calculate correlations between each pair of metrics
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i] as keyof SensorData
        const metric2 = metrics[j] as keyof SensorData

        const correlation = this.calculateCorrelation(data, metric1, metric2)
        correlations[metrics[i]][metrics[j]] = correlation
        correlations[metrics[j]][metrics[i]] = correlation // Correlation is symmetric
      }
    }

    return correlations
  }

  /**
   * Calculates Pearson correlation coefficient between two metrics
   */
  private calculateCorrelation(data: SensorData[], metric1: keyof SensorData, metric2: keyof SensorData): number {
    // Filter out entries where either metric is null
    const validData = data.filter((item) => item[metric1] !== null && item[metric2] !== null)

    if (validData.length < 3) return 0 // Need at least 3 points for meaningful correlation

    const values1 = validData.map((item) => item[metric1]) as number[]
    const values2 = validData.map((item) => item[metric2]) as number[]

    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length

    let numerator = 0
    let denom1 = 0
    let denom2 = 0

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1
      const diff2 = values2[i] - mean2

      numerator += diff1 * diff2
      denom1 += diff1 * diff1
      denom2 += diff2 * diff2
    }

    if (denom1 === 0 || denom2 === 0) return 0

    return numerator / Math.sqrt(denom1 * denom2)
  }
}

// Export singleton instance
export const predictiveModel = new PredictiveModel()
