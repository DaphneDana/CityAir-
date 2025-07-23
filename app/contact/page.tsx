"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Building, Mail, MessageSquare, Phone, Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle subject selection
  const handleSubjectChange = (value: string) => {
    setFormData({
      ...formData,
      subject: value,
    })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields")
      setIsSubmitting(false)
      return
    }

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success("Your message has been sent successfully")
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
    }, 1500)
  }

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
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tight mb-4">
            Contact Us
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground max-w-2xl mx-auto">
            Have questions about CityAir+? Our team is here to help you with any inquiries about our air quality
            monitoring solutions.
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Your email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={formData.subject} onValueChange={handleSubjectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="sales">Sales Information</SelectItem>
                        <SelectItem value="feedback">Product Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Reach out to us through any of these channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-muted-foreground">info@CityAir+.com</p>
                    <p className="text-muted-foreground">support@CityAir+.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-muted-foreground">+256 780592205</p>
                    <p className="text-muted-foreground">Mon-Fri, 9AM-5PM EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Office</h3>
                    <p className="text-muted-foreground">123 Air Quality Avenue</p>
                    <p className="text-muted-foreground">Suite 456</p>
                    <p className="text-muted-foreground">Kampala, Uganda 02108</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Live Chat</h3>
                    <p className="text-muted-foreground">Available on our website</p>
                    <p className="text-muted-foreground">Mon-Fri, 9AM-5PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">How quickly can I set up CityAir+?</h3>
                  <p className="text-sm text-muted-foreground">
                    Most installations can be completed within 1-2 business days, depending on the size of your
                    facility.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Do you offer custom solutions?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, we can tailor our system to meet your specific industrial requirements and regulatory needs.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Is technical support included?</h3>
                  <p className="text-sm text-muted-foreground">
                    All plans include 24/7 technical support and regular system updates.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All FAQs
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

