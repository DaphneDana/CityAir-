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
            Last updated: March 14, 2025
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-muted-foreground">
            At FactoryAirWatch, we take your privacy seriously. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our air quality monitoring service.
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
                <p>We collect several types of information to provide and improve our service to you:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Personal Information:</strong> When you create an account, we collect your name, email
                    address, phone number, and company information.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> We collect information on how you interact with our platform, including
                    login times, features used, and preferences.
                  </li>
                  <li>
                    <strong>Air Quality Data:</strong> We collect and store air quality measurements from sensors
                    installed in your facility.
                  </li>
                  <li>
                    <strong>Device Information:</strong> We collect information about the devices you use to access our
                    service, including IP address, browser type, and operating system.
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
                <p>We implement a variety of security measures to maintain the safety of your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Encryption:</strong> All data transmitted between your devices and our servers is encrypted
                    using industry-standard SSL/TLS protocols.
                  </li>
                  <li>
                    <strong>Secure Storage:</strong> Your data is stored in secure cloud environments with multiple
                    layers of protection.
                  </li>
                  <li>
                    <strong>Access Controls:</strong> We restrict access to your information to authorized personnel
                    only, based on the principle of least privilege.
                  </li>
                  <li>
                    <strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments to
                    ensure our systems remain secure.
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
                <p>We use the collected data for various purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Provision:</strong> To provide and maintain our service, including monitoring air
                    quality and sending alerts.
                  </li>
                  <li>
                    <strong>Improvement:</strong> To improve our service based on how you use it.
                  </li>
                  <li>
                    <strong>Communication:</strong> To communicate with you, including sending service updates and
                    responding to your inquiries.
                  </li>
                  <li>
                    <strong>Analytics:</strong> To analyze usage patterns and optimize our service performance.
                  </li>
                  <li>
                    <strong>Compliance:</strong> To comply with legal obligations and enforce our terms of service.
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
                <p>We may share your information with third parties in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Providers:</strong> We may share your information with third-party vendors who
                    provide services on our behalf, such as hosting, data analysis, and customer service.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets,
                    your information may be transferred as part of that transaction.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or
                    in response to valid requests by public authorities.
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> We may share your information with third parties when we have
                    your consent to do so.
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
                <p>You have certain rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Access:</strong> You can request access to your personal information.
                  </li>
                  <li>
                    <strong>Correction:</strong> You can request that we correct inaccurate or incomplete information.
                  </li>
                  <li>
                    <strong>Deletion:</strong> You can request that we delete your personal information.
                  </li>
                  <li>
                    <strong>Restriction:</strong> You can request that we restrict the processing of your information.
                  </li>
                  <li>
                    <strong>Data Portability:</strong> You can request a copy of your information in a structured,
                    commonly used, and machine- You can request a copy of your information in a structured, commonly
                    used, and machine-readable format.
                  </li>
                  <li>
                    <strong>Objection:</strong> You can object to the processing of your personal information.
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us using the information provided in the "Contact Us"
                  section.
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
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the
                  new Privacy Policy on this page and updating the "Last updated" date.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                  Policy are effective when they are posted on this page.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="font-medium mt-2">privacy@factoryairwatch.com</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

