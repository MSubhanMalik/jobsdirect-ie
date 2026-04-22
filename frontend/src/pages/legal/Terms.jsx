import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
          <p className="text-primary-foreground/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-muted-foreground">
            <h2 className="text-foreground font-display">1. Acceptance of Terms</h2>
            <p>By accessing and using JobsDirect.ie, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

            <h2 className="text-foreground font-display">2. User Accounts</h2>
            <p>Users must provide accurate information during registration. You are responsible for maintaining the security of your account. Employer accounts require verification before posting jobs.</p>

            <h2 className="text-foreground font-display">3. Job Listings</h2>
            <p>All job listings are subject to compliance review before publication. We reserve the right to reject or remove any listing that violates our guidelines. Free listings are limited to 1 per employer per month (14 days).</p>

            <h2 className="text-foreground font-display">4. Payments & Credits</h2>
            <p>Payments are processed securely via Stripe. Credits are non-refundable once purchased. Subscription fees are billed monthly and can be cancelled at any time.</p>

            <h2 className="text-foreground font-display">5. Employer Responsibilities</h2>
            <p>Employers must ensure all job listings are legitimate and comply with Irish employment law. Misleading or discriminatory listings will be removed.</p>

            <h2 className="text-foreground font-display">6. Limitation of Liability</h2>
            <p>JobsDirect.ie acts as a platform connecting employers and job seekers. We do not guarantee employment outcomes and are not liable for any disputes between parties.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}