"use client"
import { motion } from "framer-motion"
import { Shield, Lock, FileText, Database, Server, Users } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function PrivacyPage() {
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
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <motion.div variants={itemVariants} className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Last updated: July 23, 2025
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-muted-foreground">
            At CityAir+, we are committed to protecting your privacy while empowering communities to combat climate change through real-time air quality monitoring. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our community-based carbon emission monitoring and response system.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <Database className="h-5 w-5 text-primary" />
                Data Collection
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>We collect several types of information to provide climate action insights and improve air quality monitoring in your community:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>User Information:</strong> When you access our dashboard, we may collect your location data, device information, and usage preferences to provide localized air quality alerts.
                  </li>
                  <li>
                    <strong>Community Interaction Data:</strong> We collect information on how citizens interact with our public displays, alert systems, and health recommendations.
                  </li>
                  <li>
                    <strong>Environmental Data:</strong> We collect real-time air quality measurements including CO2 levels, PM2.5, PM10, temperature, and humidity from our IoT sensor network deployed across urban locations.
                  </li>
                  <li>
                    <strong>Government Access Logs:</strong> For authorized government officials and environmental agencies, we track access to historical data, report generation, and policy intervention activities.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <Lock className="h-5 w-5 text-primary" />
                Data Protection
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>We implement robust security measures to protect environmental data and user privacy while maintaining transparent climate action:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Secure Transmission:</strong> All data from IoT sensors to our cloud infrastructure is encrypted using industry-standard protocols to prevent tampering with climate data.
                  </li>
                  <li>
                    <strong>Cloud Security:</strong> Environmental data is stored in secure Firebase and MongoDB databases with multiple layers of protection and regular backups.
                  </li>
                  <li>
                    <strong>Role-Based Access:</strong> We implement different access levels for citizens, government officials, environmental agencies, and system administrators based on the principle of data transparency with privacy protection.
                  </li>
                  <li>
                    <strong>Data Integrity:</strong> We conduct regular audits of our sensor network and database systems to ensure accurate climate monitoring and prevent data manipulation.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <Server className="h-5 w-5 text-primary" />
                Data Usage
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>We use collected data to drive climate action and support community-based environmental management:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Real-Time Alerts:</strong> To provide immediate air quality alerts through LED indicators and digital displays, enabling proactive climate action.
                  </li>
                  <li>
                    <strong>Health Protection:</strong> To deliver personalized health recommendations during high-emission periods and support vulnerable community members.
                  </li>
                  <li>
                    <strong>Policy Support:</strong> To generate evidence-based reports for government officials to make informed climate policy decisions and track intervention effectiveness.
                  </li>
                  <li>
                    <strong>Research & Analysis:</strong> To support environmental agencies with climate research data, regional pollution comparisons, and long-term trend analysis for adaptation planning.
                  </li>
                  <li>
                    <strong>System Optimization:</strong> To improve sensor accuracy, optimize alert thresholds, and enhance community engagement with our climate monitoring platform.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <Users className="h-5 w-5 text-primary" />
                Data Sharing
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>We may share environmental data with authorized parties to maximize climate action impact:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Government Agencies:</strong> We share aggregated air quality data and trend analysis with city councils, transport authorities, and environmental departments for policy making and climate intervention planning.
                  </li>
                  <li>
                    <strong>Research Institutions:</strong> We provide anonymized environmental data to academic researchers and international climate organizations studying air quality in Eastern and Southern Africa.
                  </li>
                  <li>
                    <strong>Public Access:</strong> Real-time air quality data is made publicly available through our dashboard and API as part of our commitment to democratic environmental information access.
                  </li>
                  <li>
                    <strong>Emergency Response:</strong> During extreme pollution events or climate emergencies, we may share location-specific data with health authorities and emergency services.
                  </li>
                  <li>
                    <strong>Climate Networks:</strong> We may contribute data to global climate monitoring networks and carbon tracking initiatives, always in anonymized and aggregated form.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <FileText className="h-5 w-5 text-primary" />
                Your Rights
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>As part of our commitment to community empowerment and climate justice, you have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Data Access:</strong> You can request access to air quality data collected in your area and understand how it affects your community's health and climate.
                  </li>
                  <li>
                    <strong>Alert Preferences:</strong> You can customize your notification preferences for air quality alerts and choose how you receive climate-related health recommendations.
                  </li>
                  <li>
                    <strong>Data Portability:</strong> You can request environmental data in machine-readable formats for personal analysis or community advocacy purposes.
                  </li>
                  <li>
                    <strong>Sensor Information:</strong> You can request information about sensor locations, calibration status, and data accuracy in your neighborhood.
                  </li>
                  <li>
                    <strong>Community Participation:</strong> You have the right to participate in discussions about sensor placement and contribute to improving climate monitoring in your area.
                  </li>
                  <li>
                    <strong>Objection:</strong> You can object to certain uses of data while still benefiting from public air quality information and climate alerts.
                  </li>
                </ul>
                <p>
                  To exercise any of these rights or participate in community climate action, please contact us using the information provided below.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="flex items-center gap-2 text-lg font-medium">
                <Shield className="h-5 w-5 text-primary" />
                Policy Updates
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pl-7">
                <p>
                  We may update our Privacy Policy to reflect changes in our climate monitoring technology, data practices, or legal requirements. We will notify the community of any significant changes through our public displays and dashboard announcements.
                </p>
                <p>
                  We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information while advancing community-based climate action. Changes to this Privacy Policy are effective when they are posted and updated on our platform.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or want to get involved in climate action in your community, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p className="font-medium">privacy@cityairplus.org</p>
            <p className="text-sm text-muted-foreground">CityAir+ Team - Makerere University Software Engineering</p>
            <div className="text-sm text-muted-foreground">
              <p>Nakamyuka Daphne • Kisakye Martha • Namugga Martha</p>
              <p>Empowering Communities for Climate Action</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}