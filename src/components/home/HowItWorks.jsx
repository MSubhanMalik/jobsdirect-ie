import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, UserPlus, FileText, Search, Send, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const employerSteps = [
  {
    icon: UserPlus,
    title: "Register & Verify",
    description: "Create your employer account and complete verification.",
  },
  {
    icon: FileText,
    title: "Post Jobs",
    description: "Publish job listings with flexible pricing and add-ons.",
  },
  {
    icon: Search,
    title: "Find Talent",
    description: "Search our database of qualified candidates across Ireland.",
  },
];

const employeeSteps = [
  {
    icon: UserPlus,
    title: "Create Profile",
    description: "Sign up and build your professional profile.",
  },
  {
    icon: FileText,
    title: "Generate CV",
    description: "Use our templates to create a polished CV instantly.",
  },
  {
    icon: Send,
    title: "Apply & Get Hired",
    description: "Apply to jobs with one click and track your applications.",
  },
];

function StepCard({ step, index, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <Card className="text-center border-0 shadow-none bg-transparent h-full">
        <CardContent className="p-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5 relative">
            <step.icon className="w-6 h-6 text-accent" />
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're hiring or job searching, we make the process simple and efficient.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Employers */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">For Employers</h3>
            </div>
            <div className="space-y-2">
              {employerSteps.map((step, i) => (
                <StepCard key={i} step={step} index={i} delay={i * 0.1} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/employers">
                <Button className="bg-primary hover:bg-primary/90 group">
                  Get Started as Employer
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Employees */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">For Employees</h3>
            </div>
            <div className="space-y-2">
              {employeeSteps.map((step, i) => (
                <StepCard key={i} step={step} index={i} delay={i * 0.1 + 0.15} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/employees">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground group">
                  Get Started as Employee
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}