import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FileText, Users, CreditCard, Search, Shield,
  CheckCircle, ArrowRight, Star, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { digify } from "@/api/digifyClient";

const benefits = [
  { icon: FileText, title: "Flexible Job Posting", description: "Post jobs with 14-day free listings or 28-day premium placements." },
  { icon: CreditCard, title: "Credit System", description: "Buy credits in bulk and use them for jobs, add-ons, and duplicates." },
  { icon: Users, title: "Talent Search", description: "Subscribe to search our database of qualified Irish professionals." },
  { icon: Search, title: "Copy from JobsIreland.ie", description: "Import job details directly from JobsIreland.ie with one click." },
  { icon: Star, title: "Featured Listings", description: "Highlight your jobs to attract more candidates and stand out." },
  { icon: Shield, title: "Verified Employers", description: "Build trust with a verified employer badge on all your listings." },
];

const pricing = [
  { label: "14-Day Free Listing", price: "Free", note: "1 per month" },
  { label: "28-Day Job Listing", price: "€15 + VAT", note: "or 1 credit" },
  { label: "Duplicate Job", price: "€5", note: "or fractional credit" },
  { label: "Copy from JobsIreland.ie", price: "€5", note: "or fractional credit" },
  { label: "Employee Database Access", price: "€20/month", note: "subscription" },
];

export default function Employers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent/20 text-accent border-0 mb-4">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              For Employers
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4">
              Hire Top Talent in Ireland
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto mb-8 text-lg">
              Post jobs, search candidates, and build your team with Ireland's fastest-growing job platform.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              onClick={() => digify.auth.redirectToLogin()}
            >
              Register as Employer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold mb-3">Why Choose JobsDirect.ie?</h2>
            <p className="text-muted-foreground">Everything you need to find the perfect candidates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                      <b.icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">No hidden fees. Pay only for what you need.</p>
          </div>
          <Card>
            <CardContent className="p-0">
              {pricing.map((item, i) => (
                <div key={item.label} className={`flex items-center justify-between p-5 ${i !== pricing.length - 1 ? "border-b" : ""}`}>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  <span className="font-bold text-accent">{item.price}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Hiring?</h2>
          <p className="text-muted-foreground mb-8">Create your employer account in minutes and post your first job today.</p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 font-semibold"
            onClick={() => digify.auth.redirectToLogin()}
          >
            <Zap className="w-4 h-4 mr-2" />
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
}