import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
          <p className="text-primary-foreground/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-muted-foreground">
            <h2 className="text-foreground font-display">1. Information We Collect</h2>
            <p>We collect personal information you provide when registering, creating a profile, posting jobs, or contacting us. This includes your name, email address, phone number, work experience, education, and any documents you upload.</p>

            <h2 className="text-foreground font-display">2. How We Use Your Information</h2>
            <p>We use your information to provide our services, process payments, match employers with candidates, send notifications, and improve our platform. We do not sell your personal data to third parties.</p>

            <h2 className="text-foreground font-display">3. Data Sharing</h2>
            <p>Your profile information may be visible to employers with active subscriptions. Job postings are publicly visible. We may share data with payment processors (Stripe) and email service providers as necessary.</p>

            <h2 className="text-foreground font-display">4. Data Security</h2>
            <p>We implement industry-standard security measures including SSL encryption, secure data storage, and regular security audits to protect your information.</p>

            <h2 className="text-foreground font-display">5. Your Rights</h2>
            <p>Under GDPR, you have the right to access, correct, delete, or export your personal data. Contact us at info@jobsdirect.ie to exercise these rights.</p>

            <h2 className="text-foreground font-display">6. Contact</h2>
            <p>For privacy-related inquiries, email us at info@jobsdirect.ie or write to us at our Dublin office.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}