import React, { useEffect, useState } from "react";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

export default function EmployeeProfile({ employee, setEmployee }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    phone: employee.phone || "",
    address: employee.address || "",
    bio: employee.bio || "",
    date_of_birth: employee.date_of_birth || "",
    skills: employee.skills || [],
    desired_job_type: employee.desired_job_type || "full_time",
    desired_location: employee.desired_location || "",
    availability: employee.availability || "negotiable",
    is_searchable: employee.is_searchable !== false,
    work_experience: employee.work_experience || [],
    education: employee.education || [],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    setForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      phone: employee.phone || "",
      address: employee.address || "",
      bio: employee.bio || "",
      date_of_birth: employee.date_of_birth || "",
      skills: employee.skills || [],
      desired_job_type: employee.desired_job_type || "full_time",
      desired_location: employee.desired_location || "",
      availability: employee.availability || "negotiable",
      is_searchable: employee.is_searchable !== false,
      work_experience: employee.work_experience || [],
      education: employee.education || [],
    });
  }, [employee]);

  const handleSave = async () => {
    setSaving(true);
    await digify.entities.Employee.update(employee.id, { ...form, profile_completed: true });
    setEmployee({ ...employee, ...form, profile_completed: true });
    setSaving(false);
    toast({ title: "Profile Updated" });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setForm({ ...form, skills: [...form.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const addExperience = () => {
    setForm({
      ...form,
      work_experience: [...form.work_experience, { job_title: "", company: "", start_date: "", end_date: "", responsibilities: "" }],
    });
  };

  const addEducation = () => {
    setForm({
      ...form,
      education: [...form.education, { degree: "", institution: "", start_date: "", end_date: "", description: "" }],
    });
  };

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Professional Summary</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-[100px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Skills</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm">
                {skill}
                <button onClick={() => setForm({ ...form, skills: form.skills.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
            <Button variant="outline" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Work Experience</CardTitle>
          <Button variant="outline" size="sm" onClick={addExperience}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.work_experience.map((exp, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <p className="text-sm font-medium">Experience #{i + 1}</p>
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, work_experience: form.work_experience.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Job Title" value={exp.job_title} onChange={(e) => {
                  const updated = [...form.work_experience];
                  updated[i] = { ...updated[i], job_title: e.target.value };
                  setForm({ ...form, work_experience: updated });
                }} />
                <Input placeholder="Company" value={exp.company} onChange={(e) => {
                  const updated = [...form.work_experience];
                  updated[i] = { ...updated[i], company: e.target.value };
                  setForm({ ...form, work_experience: updated });
                }} />
                <Input type="date" placeholder="Start Date" value={exp.start_date} onChange={(e) => {
                  const updated = [...form.work_experience];
                  updated[i] = { ...updated[i], start_date: e.target.value };
                  setForm({ ...form, work_experience: updated });
                }} />
                <Input type="date" placeholder="End Date" value={exp.end_date} onChange={(e) => {
                  const updated = [...form.work_experience];
                  updated[i] = { ...updated[i], end_date: e.target.value };
                  setForm({ ...form, work_experience: updated });
                }} />
              </div>
              <Textarea placeholder="Key responsibilities" value={exp.responsibilities} onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], responsibilities: e.target.value };
                setForm({ ...form, work_experience: updated });
              }} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Education</CardTitle>
          <Button variant="outline" size="sm" onClick={addEducation}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.education.map((edu, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <p className="text-sm font-medium">Education #{i + 1}</p>
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, education: form.education.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Degree / Qualification" value={edu.degree} onChange={(e) => {
                  const updated = [...form.education];
                  updated[i] = { ...updated[i], degree: e.target.value };
                  setForm({ ...form, education: updated });
                }} />
                <Input placeholder="Institution" value={edu.institution} onChange={(e) => {
                  const updated = [...form.education];
                  updated[i] = { ...updated[i], institution: e.target.value };
                  setForm({ ...form, education: updated });
                }} />
                <Input type="date" value={edu.start_date} onChange={(e) => {
                  const updated = [...form.education];
                  updated[i] = { ...updated[i], start_date: e.target.value };
                  setForm({ ...form, education: updated });
                }} />
                <Input type="date" value={edu.end_date} onChange={(e) => {
                  const updated = [...form.education];
                  updated[i] = { ...updated[i], end_date: e.target.value };
                  setForm({ ...form, education: updated });
                }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Desired Job Type</Label>
              <Select value={form.desired_job_type} onValueChange={(v) => setForm({ ...form, desired_job_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desired Location</Label>
              <Input value={form.desired_location} onChange={(e) => setForm({ ...form, desired_location: e.target.value })} placeholder="e.g. Dublin" />
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="1_week">1 Week</SelectItem>
                  <SelectItem value="2_weeks">2 Weeks</SelectItem>
                  <SelectItem value="1_month">1 Month</SelectItem>
                  <SelectItem value="negotiable">Negotiable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">Visible to Employers</p>
              <p className="text-xs text-muted-foreground">Allow employers to find you in candidate search</p>
            </div>
            <Switch checked={form.is_searchable} onCheckedChange={(v) => setForm({ ...form, is_searchable: v })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}
