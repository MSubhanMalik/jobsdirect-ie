import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-display font-bold">Cookie Policy</h1>
          <p className="text-primary-foreground/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-muted-foreground">
            <h2 className="text-foreground font-display">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better experience by remembering your preferences.</p>

            <h2 className="text-foreground font-display">2. Essential Cookies</h2>
            <p>These cookies are necessary for the website to function and cannot be disabled. They include session cookies for authentication and security.</p>

            <h2 className="text-foreground font-display">3. Analytics Cookies</h2>
            <p>We use analytics cookies to understand how visitors interact with our platform. This data helps us improve our services.</p>

            <h2 className="text-foreground font-display">4. Managing Cookies</h2>
            <p>You can manage cookie preferences through your browser settings. Note that disabling essential cookies may affect website functionality.</p>

            <h2 className="text-foreground font-display">5. Contact</h2>
            <p>For questions about our cookie policy, contact us at info@jobsdirect.ie.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}