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
            Last updated: July 23, 2025
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-muted-foreground">
            Please read these Terms of Service carefully before using the CityAir+ community-based carbon emission 
            monitoring platform. By accessing our air quality data, alerts, or dashboard, you agree to be bound by these Terms 
            and join our mission to combat climate change through community action.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="usage">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usage">Platform Usage</TabsTrigger>
              <TabsTrigger value="accuracy">Data & Climate Action</TabsTrigger>
              <TabsTrigger value="compliance">Community Guidelines</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Platform Usage
                  </CardTitle>
                  <CardDescription>Terms governing the use of CityAir+ community climate monitoring services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Public Access & Community Participation</h3>
                    <p className="text-muted-foreground">
                      CityAir+ provides free public access to real-time air quality data through LED indicators, digital displays, 
                      and our web dashboard. No registration is required for basic access. By using our platform, you join a 
                      community committed to climate action and environmental transparency.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Government & Agency Access</h3>
                    <p className="text-muted-foreground">
                      Government officials and environmental agencies may request enhanced access to historical data, reports, 
                      and analytics. Such access is granted for legitimate climate policy making, environmental research, 
                      and public health protection purposes only.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Educational & Research Use</h3>
                    <p className="text-muted-foreground">
                      Our platform welcomes educational institutions, researchers, and climate advocates to use our data for 
                      academic research, climate studies, and environmental advocacy. We encourage data sharing that advances 
                      climate science and community awareness.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. Responsible Usage</h3>
                    <p className="text-muted-foreground">
                      You agree to use CityAir+ data responsibly for climate action, health protection, and environmental 
                      awareness. Do not misuse our platform to spread misinformation about climate change or air quality, 
                      or attempt to interfere with our sensor network operations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Community Standards</h3>
                    <p className="text-muted-foreground">
                      Our platform serves diverse communities across Eastern and Southern Africa. We maintain the right to 
                      restrict access for any use that undermines community safety, spreads false climate information, 
                      or violates the spirit of collaborative environmental action.
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
                    Data & Climate Action
                  </CardTitle>
                  <CardDescription>Terms regarding air quality data accuracy and climate action guidance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Sensor Network Accuracy</h3>
                    <p className="text-muted-foreground">
                      Our IoT sensors (MQ-135, DHT11, and MQ-9 sensors) are calibrated to provide reliable air quality 
                      measurements including CO2, temperature, humidity, and particulate matter. While we strive for accuracy, 
                      environmental factors may occasionally affect readings.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Real-Time Alert System</h3>
                    <p className="text-muted-foreground">
                      Our LED indicators and digital displays provide real-time air quality alerts based on WHO air quality 
                      guidelines adapted for African urban contexts. Alerts are designed to enable immediate protective actions, 
                      but individual health decisions should consider personal circumstances.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Climate Data Interpretation</h3>
                    <p className="text-muted-foreground">
                      Our platform provides air quality data and health recommendations to support climate-conscious decisions. 
                      However, complex climate and health decisions should involve consultation with environmental health 
                      professionals and climate scientists.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. System Availability</h3>
                    <p className="text-muted-foreground">
                      We utilize a WiFi connection through an ESP32 for real-time data transmission to ensure high availability. 
                      However, internet connectivity, power outages, or extreme weather may occasionally affect sensor operations 
                      and data transmission.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Data Backup & Climate Records</h3>
                    <p className="text-muted-foreground">
                      We maintain secure backups of environmental data to preserve climate records for research and policy making. 
                      This data contributes to long-term climate monitoring efforts and supports evidence-based environmental 
                      decision making in our partner communities.
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
                    Community Guidelines
                  </CardTitle>
                  <CardDescription>Terms regarding community participation and regional compliance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Climate Action & Environmental Justice</h3>
                    <p className="text-muted-foreground">
                      CityAir+ supports climate justice by providing equal access to environmental information across all 
                      socioeconomic levels. Our platform aims to democratize air quality data and empower communities to 
                      advocate for environmental improvements and climate adaptation measures.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Regional Compliance</h3>
                    <p className="text-muted-foreground">
                      Our platform operates across Eastern and Southern African urban centers and respects local regulations 
                      regarding environmental monitoring and data sharing. We collaborate with local authorities to ensure 
                      our climate monitoring supports rather than conflicts with existing environmental policies.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Academic & Open Source Commitment</h3>
                    <p className="text-muted-foreground">
                      As a project developed by Makerere University software engineering students, CityAir+ maintains academic 
                      integrity and open collaboration principles. Our technology and methodologies are shared to advance 
                      climate monitoring capabilities across the region.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">4. Limitation of Liability</h3>
                    <p className="text-muted-foreground">
                      CityAir+ is provided as a community service to support climate awareness and action. While we strive 
                      for accuracy and reliability, we cannot be held liable for decisions made based solely on our air 
                      quality data. Users should combine our information with other sources for critical health and safety decisions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">5. Collaborative Governance</h3>
                    <p className="text-muted-foreground">
                      These Terms are governed by principles of community collaboration, climate action, and environmental 
                      justice. Disputes are resolved through community dialogue and consultation with local environmental 
                      authorities, prioritizing the collective benefit of climate monitoring and community health protection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-muted-foreground">
            By using CityAir+, you acknowledge that you have read and understood these Terms of Service and agree 
            to support our mission of community-based climate action through transparent air quality monitoring.
          </p>
          <div className="mt-4 space-y-2">
            <p className="font-medium">For questions about these Terms, please contact: terms@cityairplus.org</p>
            <p className="text-sm text-muted-foreground">CityAir+ Team - Makerere University Software Engineering</p>
            <div className="text-sm text-muted-foreground">
              <p>Nakamyuka Daphne • Kisakye Martha • Namugga Martha</p>
              <p>Innovating for Climate Change Adaptation and Mitigation</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}