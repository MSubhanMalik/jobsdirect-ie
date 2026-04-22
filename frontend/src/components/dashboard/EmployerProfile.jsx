import React, { useState } from "react";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getAdultDateMax, isAtLeast18 } from "@/lib/age";
import { Save } from "lucide-react";

export default function EmployerProfile({ employer, setEmployer }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    first_name: employer.first_name || "",
    last_name: employer.last_name || "",
    company_name: employer.company_name || "",
    phone: employer.phone || "",
    date_of_birth: employer.date_of_birth || "",
    website: employer.website || "",
    cro_number: employer.cro_number || "",
    employer_number: employer.employer_number || "",
  });
  const [saving, setSaving] = useState(false);
  const maxDateOfBirth = getAdultDateMax();

  const handleSave = async () => {
    if (!isAtLeast18(form.date_of_birth)) {
      toast({
        title: "Invalid Date of Birth",
        description: "Employer profile users must be at least 18 years old.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const updated = await digify.entities.Employer.update(employer.id, form);
    setEmployer({ ...employer, ...updated });
    setSaving(false);
    toast({ title: "Profile Updated", description: "Your employer profile has been saved." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              max={maxDateOfBirth}
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label>CRO Number</Label>
            <Input value={form.cro_number} onChange={(e) => setForm({ ...form, cro_number: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Employer Number</Label>
            <Input value={form.employer_number} onChange={(e) => setForm({ ...form, employer_number: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
