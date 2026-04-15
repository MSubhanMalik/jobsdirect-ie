import React, { useEffect, useRef, useState } from "react";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { X, Send, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

const categories = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "construction", label: "Construction" },
  { value: "transport", label: "Transport" },
  { value: "admin", label: "Admin" },
  { value: "legal", label: "Legal" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

function createInitialForm(initialJob) {
  return {
    title: initialJob?.title || "",
    description: initialJob?.description || "",
    short_description: initialJob?.short_description || "",
    location: initialJob?.location || "",
    country: initialJob?.country || "Ireland",
    job_type: initialJob?.job_type || "full_time",
    category: initialJob?.category || "technology",
    hours_per_week: initialJob?.hours_per_week ?? "",
    positions_count: initialJob?.positions_count ?? "",
    salary_min: initialJob?.salary_min ?? "",
    salary_max: initialJob?.salary_max ?? "",
    salary_type: initialJob?.salary_type || "",
    salary_period: initialJob?.salary_period || "annual",
    career_level: initialJob?.career_level || "",
    benefits: initialJob?.benefits || "",
    application_method: initialJob?.application_method || "platform",
    application_email: initialJob?.application_email || "",
    application_url: initialJob?.application_url || "",
    is_featured: Boolean(initialJob?.is_featured),
    is_highlighted: Boolean(initialJob?.is_highlighted),
  };
}

export default function JobPostForm({ employer, user, initialJob = null, autoFocusTitle = false, onClose, onSuccess }) {
  const { toast } = useToast();
  const titleInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyFromJobsIreland, setCopyFromJobsIreland] = useState(false);
  const [jobRef, setJobRef] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(initialJob));

  useEffect(() => {
    setForm(createInitialForm(initialJob));
    setCopyFromJobsIreland(false);
    setJobRef("");
    setScraped(false);
  }, [initialJob]);

  useEffect(() => {
    if (!autoFocusTitle || !titleInputRef.current) return;
    const focusTimer = setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select?.();
    }, 200);
    return () => clearTimeout(focusTimer);
  }, [autoFocusTitle, initialJob]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : undefined,
      salary_max: form.salary_max ? Number(form.salary_max) : undefined,
      company_name: employer.company_name,
      employer_id: employer.id,
      status: initialJob?.status || "pending_review",
      source: copyFromJobsIreland && scraped ? "jobsireland" : (initialJob?.source || "manual"),
      jobsireland_ref: copyFromJobsIreland && scraped ? jobRef : initialJob?.jobsireland_ref,
    };
    if (initialJob?.id) {
      await digify.entities.Job.update(initialJob.id, payload);
    } else {
      await digify.entities.Job.create(payload);
    }
    setSubmitting(false);
    toast({
      title: initialJob?.id ? "Job Updated" : "Job Submitted",
      description: initialJob?.id ? "Your job listing has been updated." : "Your job listing has been submitted for review.",
    });
    onSuccess();
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  const handleScrape = async () => {
    if (!/^\d{7}$/.test(jobRef)) {
      toast({ title: "Invalid Reference", description: "Please enter a valid 7-digit Job Reference Number.", variant: "destructive" });
      return;
    }
    setScraping(true);
    try {
      const res = await digify.functions.invoke("scrapeJobsIreland", { ref: jobRef });
      const data = res.data?.data?.response || res.data?.data || {};
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        short_description: data.short_description || prev.short_description,
        location: data.location || prev.location,
        job_type: data.job_type || prev.job_type,
        category: data.category || prev.category,
        country: data.country || prev.country,
        hours_per_week: data.hours_per_week ?? prev.hours_per_week,
        positions_count: data.positions_count ?? prev.positions_count,
        salary_min: data.salary_min ?? prev.salary_min,
        salary_max: data.salary_max ?? prev.salary_max,
        salary_type: data.salary_type || prev.salary_type,
        salary_period: data.salary_period || prev.salary_period,
        career_level: data.career_level || prev.career_level,
        benefits: data.benefits || prev.benefits,
        application_method: data.application_method || prev.application_method,
        application_email: data.application_email || prev.application_email,
        application_url: data.application_url || prev.application_url,
      }));
      setScraped(true);
      toast({ title: "Job Details Imported!", description: "Fields have been pre-filled. Please review and edit before submitting." });
    } catch (err) {
      toast({ title: "Import Failed", description: err.message || "Could not fetch job from JobsIreland.ie", variant: "destructive" });
    }
    setScraping(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{initialJob?.id ? "Edit Job" : "Post a New Job"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* JobsIreland Copy Add-On */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="copyJobsIreland"
                checked={copyFromJobsIreland}
                onCheckedChange={(v) => { setCopyFromJobsIreland(v); setScraped(false); }}
              />
              <label htmlFor="copyJobsIreland" className="flex flex-col cursor-pointer">
                <span className="text-sm font-semibold">Copy Job from JobsIreland.ie</span>
                <span className="text-xs text-muted-foreground">Paid Add-On — Import job details automatically</span>
              </label>
            </div>

            {copyFromJobsIreland && (
              <div className="space-y-3 pt-1">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="jobRef" className="text-xs">Job Reference Number (7 digits)</Label>
                    <Input
                      id="jobRef"
                      value={jobRef}
                      onChange={(e) => { setJobRef(e.target.value.replace(/\D/g, "").slice(0, 7)); setScraped(false); }}
                      placeholder="e.g. 1234567"
                      maxLength={7}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || jobRef.length !== 7}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    {scraping ? "Importing..." : "Import"}
                  </Button>
                </div>
                {jobRef.length === 7 && (
                  <a
                    href={`https://jobsireland.ie/en-US/job-Details?id=${jobRef}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Preview on JobsIreland.ie
                  </a>
                )}
                {scraped && (
                  <p className="text-xs text-accent flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fields pre-filled — review and edit below before submitting.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Job Title *</Label>
              <Input ref={titleInputRef} value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Short Description</Label>
              <Input value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Brief summary for listings" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Full Description *</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} required className="min-h-[150px]" />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} required placeholder="e.g. Dublin" />
            </div>
            <div className="space-y-2">
              <Label>Job Type</Label>
              <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Period</Label>
              <Select value={form.salary_period} onValueChange={(v) => update("salary_period", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Min (€)</Label>
              <Input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Salary Max (€)</Label>
              <Input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Benefits</Label>
              <Textarea value={form.benefits} onChange={(e) => update("benefits", e.target.value)} placeholder="e.g. Health insurance, pension..." />
            </div>
          </div>

          {/* Add-ons */}
          <div className="border-t pt-5 space-y-3">
            <h3 className="text-sm font-semibold">Add-Ons</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Featured Listing</p>
                <p className="text-xs text-muted-foreground">Highlighted at the top of search results</p>
              </div>
              <Switch checked={form.is_featured} onCheckedChange={(v) => update("is_featured", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Highlighted</p>
                <p className="text-xs text-muted-foreground">Eye-catching visual emphasis</p>
              </div>
              <Switch checked={form.is_highlighted} onCheckedChange={(v) => update("is_highlighted", v)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? (initialJob?.id ? "Saving..." : "Submitting...") : (initialJob?.id ? "Save Changes" : "Submit for Review")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
