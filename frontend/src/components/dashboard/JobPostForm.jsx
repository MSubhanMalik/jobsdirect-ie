import React, { useEffect, useMemo, useRef, useState } from "react";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import FormFieldRenderer from "@/components/forms/FormFieldRenderer";
import {
  JOB_FIELD_GROUPS,
  JOB_FIELDS,
  JOB_FORM_DEFAULTS,
  buildEntityFormValues,
  hasFieldValue,
} from "@/lib/siteSettings";
import { CheckCircle2, ExternalLink, Loader2, Send, X } from "lucide-react";

const EMPLOYER_JOB_FIELDS = JOB_FIELDS.filter((field) => !field.adminOnly && field.manageInEmployerForm !== false);

function createInitialForm(initialJob) {
  return buildEntityFormValues(JOB_FORM_DEFAULTS, EMPLOYER_JOB_FIELDS, initialJob);
}

export default function JobPostForm({ employer, user, initialJob = null, autoFocusTitle = false, onClose, onSuccess }) {
  const { toast } = useToast();
  const { appPublicSettings } = useAuth();
  const publicSettings = appPublicSettings?.public_settings || {};
  const approvalRequired = publicSettings.job_approval_required !== false;
  const titleInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyFromJobsIreland, setCopyFromJobsIreland] = useState(false);
  const [jobRef, setJobRef] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(initialJob));
  const jobFormConfig = publicSettings.employer_job_form_config || {};

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

  const visibleGroups = useMemo(
    () =>
      JOB_FIELD_GROUPS.map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          if (field.adminOnly || field.manageInEmployerForm === false) return false;
          return jobFormConfig?.[field.key]?.visible !== false;
        }),
      })).filter((group) => group.fields.length),
    [jobFormConfig],
  );

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const validateVisibleRequiredFields = () => {
    for (const group of visibleGroups) {
      for (const field of group.fields) {
        const control = jobFormConfig?.[field.key];
        if (control?.required && !hasFieldValue(field, form[field.key])) {
          toast({
            title: "Missing required field",
            description: `${field.label} is required before submitting this job.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateVisibleRequiredFields()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min === "" ? undefined : Number(form.salary_min),
        salary_max: form.salary_max === "" ? undefined : Number(form.salary_max),
        hours_per_week: form.hours_per_week === "" ? undefined : Number(form.hours_per_week),
        positions_count: form.positions_count === "" ? undefined : Number(form.positions_count),
        company_name: employer.company_name,
        employer_id: employer.id,
        status: initialJob?.status || (approvalRequired ? "pending_review" : "approved"),
        source: copyFromJobsIreland && scraped ? "jobsireland" : (initialJob?.source || "manual"),
        jobsireland_ref: copyFromJobsIreland && scraped ? jobRef : initialJob?.jobsireland_ref,
      };

      if (initialJob?.id) {
        await digify.entities.Job.update(initialJob.id, payload);
      } else {
        await digify.entities.Job.create(payload);
      }

      toast({
        title: initialJob?.id ? "Job Updated" : "Job Submitted",
        description: initialJob?.id ? "Your job listing has been updated." : "Your job listing has been submitted for review.",
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleScrape = async () => {
    if (!/^\d{7}$/.test(jobRef)) {
      toast({
        title: "Invalid Reference",
        description: "Please enter a valid 7-digit Job Reference Number.",
        variant: "destructive",
      });
      return;
    }

    setScraping(true);
    try {
      const response = await digify.functions.invoke("scrapeJobsIreland", { ref: jobRef });
      const data = response.data?.data?.response || response.data?.data || {};
      setForm((current) => ({
        ...current,
        title: data.title || current.title,
        description: data.description || current.description,
        short_description: data.short_description || current.short_description,
        location: data.location || current.location,
        job_type: data.job_type || current.job_type,
        category: data.category || current.category,
        country: data.country || current.country,
        hours_per_week: data.hours_per_week ?? current.hours_per_week,
        positions_count: data.positions_count ?? current.positions_count,
        salary_min: data.salary_min ?? current.salary_min,
        salary_max: data.salary_max ?? current.salary_max,
        salary_period: data.salary_period || current.salary_period,
        career_level: data.career_level || current.career_level,
        application_method: data.application_method || current.application_method,
        application_email: data.application_email || current.application_email,
        application_url: data.application_url || current.application_url,
      }));
      setScraped(true);
      toast({
        title: "Job Details Imported!",
        description: "Fields have been pre-filled. Please review and edit before submitting.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error.message || "Could not fetch job from JobsIreland.ie",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{initialJob?.id ? "Edit Job" : "Post a New Job"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="copyJobsIreland"
                checked={copyFromJobsIreland}
                onCheckedChange={(value) => {
                  setCopyFromJobsIreland(Boolean(value));
                  setScraped(false);
                }}
              />
              <label htmlFor="copyJobsIreland" className="flex cursor-pointer flex-col">
                <span className="text-sm font-semibold">Copy Job from JobsIreland.ie</span>
                <span className="text-xs text-muted-foreground">Paid add-on - import job details automatically</span>
              </label>
            </div>

            {copyFromJobsIreland ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="jobRef" className="text-xs">Job Reference Number (7 digits)</Label>
                    <Input
                      id="jobRef"
                      value={jobRef}
                      onChange={(event) => {
                        setJobRef(event.target.value.replace(/\D/g, "").slice(0, 7));
                        setScraped(false);
                      }}
                      placeholder="e.g. 1234567"
                      maxLength={7}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || jobRef.length !== 7}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    {scraping ? "Importing..." : "Import"}
                  </Button>
                </div>

                {jobRef.length === 7 ? (
                  <a
                    href={`https://jobsireland.ie/en-US/job-Details?id=${jobRef}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Preview on JobsIreland.ie
                  </a>
                ) : null}

                {scraped ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fields pre-filled - review and edit below before submitting.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {!visibleGroups.length ? (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              All employer job fields are currently hidden. Enable them from Super Admin Site CMS.
            </div>
          ) : null}

          {visibleGroups.map((group) => (
            <section key={group.id} className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    onChange={(value) => update(field.key, value)}
                    required={Boolean(jobFormConfig?.[field.key]?.required)}
                    inputRef={field.key === "title" ? titleInputRef : undefined}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? (initialJob?.id ? "Saving..." : "Submitting...") : (initialJob?.id ? "Save Changes" : "Submit for Review")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
