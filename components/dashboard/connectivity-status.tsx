"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, RefreshCcw, Signal, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

interface ConnectionStatusProps {
    className?: string
    lastUpdated?: Date | null
    thingSpeakData?: any[]
}

export function ConnectionStatus({ className, lastUpdated, thingSpeakData = [] }: ConnectionStatusProps) {
    const [status, setStatus] = useState({
        isOnline: true,
        strength: 85,
        lastConnected: new Date().toISOString(),
        dataReceived: 0,
        dataPoints: 0,
    })
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Check if data is increasing from ThingSpeak
    useEffect(() => {
        if (thingSpeakData && thingSpeakData.length > 0) {
            // Data is coming in, connection is working
            setStatus((prev) => ({
                ...prev,
                isOnline: true,
                lastConnected: new Date().toISOString(),
                dataReceived: prev.dataReceived + 1,
                dataPoints: thingSpeakData.length,
            }))
        }

        // Update connection status when lastUpdated changes
        if (lastUpdated) {
            // Calculate signal strength based on time since last update
            const now = new Date().getTime()
            const lastUpdate = lastUpdated.getTime()
            const timeDiff = now - lastUpdate

            // If last update was more than 2 minutes ago, reduce signal strength
            let newStrength = 85
            if (timeDiff > 120000) {
                // 2 minutes
                newStrength = 40
            } else if (timeDiff > 60000) {
                // 1 minute
                newStrength = 60
            }

            setStatus((prev) => ({
                ...prev,
                strength: newStrength,
                isOnline: newStrength > 20,
                lastConnected: lastUpdated.toISOString(),
            }))
        }
    }, [lastUpdated, thingSpeakData])

    const handleRefresh = async () => {
        setIsRefreshing(true)

        try {
            // Attempt to fetch latest data from ThingSpeak
            const response = await fetch("/api/thingspeak/latest")
            if (response.ok) {
                setStatus((prev) => ({
                    ...prev,
                    isOnline: true,
                    strength: Math.min(100, prev.strength + 10),
                    lastConnected: new Date().toISOString(),
                }))
            } else {
                // Connection failed
                setStatus((prev) => ({
                    ...prev,
                    strength: Math.max(10, prev.strength - 20),
                    isOnline: false,
                }))
            }
        } catch (error) {
            // Connection error
            setStatus((prev) => ({
                ...prev,
                strength: Math.max(10, prev.strength - 20),
                isOnline: false,
            }))
        } finally {
            setIsRefreshing(false)
        }
    }

    const getLastConnectedText = () => {
        if (status.isOnline) return "Connected"

        const timeDiff = new Date().getTime() - new Date(status.lastConnected).getTime()
        const minutes = Math.floor(timeDiff / 60000)

        if (minutes < 1) return "Lost connection just now"
        if (minutes === 1) return "Lost connection 1 minute ago"
        if (minutes < 60) return `Lost connection ${minutes} minutes ago`

        const hours = Math.floor(minutes / 60)
        if (hours === 1) return "Lost connection 1 hour ago"
        return `Lost connection ${hours} hours ago`
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium">GSM Connection Status</CardTitle>
                        <CardDescription>Cellular network connectivity information</CardDescription>
                    </div>
                    <Badge variant={status.isOnline ? (status.strength > 60 ? "success" : "warning") : "destructive"}>
                        {status.isOnline ? "Connected" : "Offline"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {status.isOnline ? (
                                <Signal className="h-5 w-5 text-primary" />
                            ) : (
                                <WifiOff className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">{getLastConnectedText()}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="sr-only">Refresh</span>
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>Signal Strength</span>
                            <span className="font-medium">{status.strength}%</span>
                        </div>
                        <Progress value={status.strength} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span>Data Points Received</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="font-medium flex items-center">
                                        {status.dataPoints}
                                        {status.dataReceived > 0 && <span className="text-green-500 ml-1">+{status.dataReceived}</span>}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>New data points received since page load</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {!status.isOnline && (
                        <div className="flex items-center gap-2 text-sm text-amber-500 mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Data is being cached locally and will be synchronized when connection is restored.</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
