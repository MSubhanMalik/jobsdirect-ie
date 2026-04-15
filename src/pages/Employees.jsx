import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, FileText, Send, Eye, ArrowRight, Zap,
  CheckCircle, User
} from "lucide-react";
import { motion } from "framer-motion";
import { digify } from "@/api/digifyClient";

const steps = [
  { icon: UserPlus, title: "Create Your Account", description: "Sign up with your email and verify your identity." },
  { icon: User, title: "Build Your Profile", description: "Add your work experience, education, skills, and certifications." },
  { icon: FileText, title: "Generate a CV", description: "Use our professional templates to create a polished CV instantly." },
  { icon: Send, title: "Apply to Jobs", description: "Browse jobs and apply with one click — your profile is pre-filled." },
  { icon: Eye, title: "Get Discovered", description: "Employers with subscriptions can find and reach out to you directly." },
  { icon: CheckCircle, title: "Track Applications", description: "Monitor your application status from your personal dashboard." },
];

export default function Employees() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-accent/90 to-accent text-accent-foreground py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent-foreground/20 text-accent-foreground border-0 mb-4">
              <User className="w-3.5 h-3.5 mr-1" />
              For Job Seekers
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4">
              Your Next Career Move Starts Here
            </h1>
            <p className="text-accent-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
              Create your profile, build your CV, and apply to hundreds of opportunities across Ireland — all for free.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => digify.auth.redirectToLogin()}
            >
              Register as Employee
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Getting started is quick and easy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 relative">
                      <step.icon className="w-6 h-6 text-accent" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Start Your Journey Today</h2>
          <p className="text-muted-foreground mb-8">Join thousands of job seekers finding their dream roles across Ireland.</p>
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={() => digify.auth.redirectToLogin()}
          >
            <Zap className="w-4 h-4 mr-2" />
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
}