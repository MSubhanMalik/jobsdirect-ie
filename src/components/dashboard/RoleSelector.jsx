import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { digify } from "@/api/digifyClient";
import { Building2, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelector({ user, onCreated }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(" ")[0] || "",
    last_name: user?.full_name?.split(" ").slice(1).join(" ") || "",
    company_name: "",
    phone: "",
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    if (selected === "employer") {
      const employer = await digify.entities.Employer.create({
        user_email: user.email,
        first_name: form.first_name,
        last_name: form.last_name,
        company_name: form.company_name,
        phone: form.phone,
      });
      onCreated("employer", employer);
    } else {
      const employee = await digify.entities.Employee.create({
        user_email: user.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
      });
      onCreated("employee", employee);
    }
    setCreating(false);
  };

  if (!selected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Welcome to JobsDirect.ie</h1>
            <p className="text-muted-foreground">How would you like to use the platform?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                onClick={() => setSelected("employer")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">I'm an Employer</h3>
                  <p className="text-sm text-muted-foreground">Post jobs, search candidates, and grow your team.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card
                className="cursor-pointer hover:shadow-lg hover:border-accent transition-all"
                onClick={() => setSelected("employee")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <User className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">I'm a Job Seeker</h3>
                  <p className="text-sm text-muted-foreground">Create your profile, apply to jobs, and get hired.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-6">
            {selected === "employer" ? "Employer Registration" : "Job Seeker Registration"}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            {selected === "employer" && (
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Back</Button>
              <Button
                className={`flex-1 ${selected === "employer" ? "bg-primary hover:bg-primary/90" : "bg-accent hover:bg-accent/90 text-accent-foreground"}`}
                onClick={handleCreate}
                disabled={creating || !form.first_name || !form.last_name || (selected === "employer" && !form.company_name)}
              >
                {creating ? "Creating..." : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}