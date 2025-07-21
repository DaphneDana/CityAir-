"use client"
import { motion } from "framer-motion"
import { FileText, Scale, AlertTriangle, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <motion.div variants={itemVariants} className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-primary" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tight mb-4">
            Terms of Service
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Last updated: March 14, 2025
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-muted-foreground">
            Please read these Terms of Service carefully before using the FactoryAirWatch platform. By accessing or
            using our service, you agree to be bound by these Terms.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="usage">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usage">Service Usage</TabsTrigger>
              <TabsTrigger value="accuracy">Data Accuracy</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Service Usage
                  </CardTitle>
                  <CardDescription>Terms governing the use of FactoryAirWatch services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Account Registration</h3>
                    <p className="text-muted-foreground">
                      To use certain features of the Service, you must register for an account. You agree to provide
                      accurate, current, and complete information during the registration process and to update such
                      information to keep it accurate, current, and complete.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Account Security</h3>
                    <p className="text-muted-foreground">
                      You are responsible for safeguarding the password that you use to access the Service and for any
                      activities or actions under your password. You agree not to disclose your password to any third
                      party. You must notify us immediately upon becoming aware of any breach of security or
                      unauthorized use of your account.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Subscription and Billing</h3>
                    <p className="text-muted-foreground">
                      Some aspects of the Service may be provided for a fee. You will be required to select a payment
                      plan and provide accurate information regarding your payment method. You agree to pay all fees in
                      accordance with the payment plan you select.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. Acceptable Use</h3>
                    <p className="text-muted-foreground">
                      You agree not to use the Service for any purpose that is illegal or prohibited by these Terms. You
                      may not use the Service in any manner that could damage, disable, overburden, or impair the
                      Service or interfere with any other party's use of the Service.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Termination</h3>
                    <p className="text-muted-foreground">
                      We may terminate or suspend your account and access to the Service immediately, without prior
                      notice or liability, for any reason whatsoever, including without limitation if you breach the
                      Terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accuracy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Data Accuracy
                  </CardTitle>
                  <CardDescription>Terms regarding the accuracy and reliability of data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Sensor Accuracy</h3>
                    <p className="text-muted-foreground">
                      While we strive to provide accurate air quality measurements, the accuracy of data depends on
                      proper installation, calibration, and maintenance of sensors. We do not guarantee 100% accuracy of
                      all measurements.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Calibration Requirements</h3>
                    <p className="text-muted-foreground">
                      To maintain data accuracy, sensors must be calibrated according to the schedule provided in your
                      service agreement. Failure to maintain proper calibration may result in inaccurate readings.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Data Interpretation</h3>
                    <p className="text-muted-foreground">
                      The Service provides tools for data interpretation, but the interpretation of air quality data
                      requires expertise. We recommend consulting with environmental health professionals for critical
                      decisions based on the data.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. System Limitations</h3>
                    <p className="text-muted-foreground">
                      The Service may experience downtime, delays, or other problems inherent in the use of internet and
                      electronic communications. We do not guarantee that the Service will be uninterrupted, timely,
                      secure, or error-free.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Data Backup</h3>
                    <p className="text-muted-foreground">
                      While we implement backup procedures, you are responsible for maintaining your own backups of
                      critical data. We are not responsible for data loss due to system failures or other causes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Compliance
                  </CardTitle>
                  <CardDescription>Terms regarding regulatory compliance and legal matters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Regulatory Compliance</h3>
                    <p className="text-muted-foreground">
                      While our Service is designed to help you monitor air quality, it is your responsibility to ensure
                      compliance with all applicable environmental regulations. The Service does not guarantee
                      regulatory compliance.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Data Retention</h3>
                    <p className="text-muted-foreground">
                      We retain data in accordance with our data retention policy and applicable laws. You may be
                      required to maintain certain data for longer periods to comply with regulatory requirements.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Intellectual Property</h3>
                    <p className="text-muted-foreground">
                      The Service and its original content, features, and functionality are and will remain the
                      exclusive property of FactoryAirWatch and its licensors. The Service is protected by copyright,
                      trademark, and other laws.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. Limitation of Liability</h3>
                    <p className="text-muted-foreground">
                      In no event shall FactoryAirWatch, its directors, employees, partners, agents, suppliers, or
                      affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
                      including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Governing Law</h3>
                    <p className="text-muted-foreground">
                      These Terms shall be governed and construed in accordance with the laws of the United States,
                      without regard to its conflict of law provisions. Any disputes relating to these Terms shall be
                      subject to the exclusive jurisdiction of the courts located within the United States.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-muted-foreground">
            By using FactoryAirWatch, you acknowledge that you have read and understood these Terms of Service and agree
            to be bound by them.
          </p>
          <p className="font-medium mt-2">For questions about these Terms, please contact legal@factoryairwatch.com</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

