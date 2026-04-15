import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin, Clock, Building2, Euro, ArrowLeft, Share2, Star,
  Calendar, Briefcase, Send, CheckCircle
} from "lucide-react";

const jobTypeLabels = {
  full_time: "Full Time", part_time: "Part Time", contract: "Contract",
  temporary: "Temporary", internship: "Internship", remote: "Remote",
};
const categoryLabels = {
  technology: "Technology", healthcare: "Healthcare", finance: "Finance",
  education: "Education", engineering: "Engineering", sales: "Sales",
  marketing: "Marketing", hospitality: "Hospitality", retail: "Retail",
  construction: "Construction", transport: "Transport", admin: "Admin",
  legal: "Legal", manufacturing: "Manufacturing", other: "Other",
};

export default function JobDetail() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const results = await digify.entities.Job.filter({ id: jobId });
      return results[0] || null;
    },
    enabled: !!jobId,
  });

  useEffect(() => {
    digify.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await digify.auth.me();
        setUser(me);
        const emps = await digify.entities.Employee.filter({ user_email: me.email });
        if (emps.length > 0) setEmployee(emps[0]);
        // Check if already applied
        if (jobId) {
          const apps = await digify.entities.Application.filter({ job_id: jobId, employee_email: me.email });
          if (apps.length > 0) setApplied(true);
        }
      }
    });
  }, [jobId]);

  const handleApply = async () => {
    if (!user) {
      digify.auth.redirectToLogin(window.location.pathname);
      return;
    }
    if (!employee) {
      toast({ title: "Complete Your Profile", description: "Please set up your employee profile first.", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    setApplying(true);
    await digify.entities.Application.create({
      job_id: job.id,
      job_title: job.title,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: user.email,
      employer_email: job.created_by,
      company_name: job.company_name,
      cover_letter: coverLetter,
      cv_url: employee.cv_url || "",
      status: "submitted",
    });
    setApplying(false);
    setApplied(true);
    setShowApply(false);
    toast({ title: "Application Submitted!", description: "Your application has been sent to the employer." });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-5 w-1/3 mb-8" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <Link to="/jobs"><Button>Back to Jobs</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="text-primary-foreground/60 hover:text-primary-foreground mb-4 -ml-3" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              {job.is_featured && (
                <span className="inline-flex items-center gap-1 text-accent text-xs font-semibold mb-2">
                  <Star className="w-3.5 h-3.5 fill-accent" />
                  FEATURED
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">{job.title}</h1>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Building2 className="w-4 h-4" />
                <span>{job.company_name}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-0">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </Badge>
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-0">
              <Clock className="w-3 h-3 mr-1" />
              {jobTypeLabels[job.job_type]}
            </Badge>
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-0">
              <Briefcase className="w-3 h-3 mr-1" />
              {categoryLabels[job.category]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Job Description</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </div>
              </CardContent>
            </Card>
            {job.benefits && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Benefits</h2>
                  <p className="text-muted-foreground">{job.benefits}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {applied ? (
                  <Button className="w-full bg-accent/20 text-accent" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                    onClick={() => {
                      if (!user) { digify.auth.redirectToLogin(window.location.pathname); return; }
                      setShowApply(true);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link Copied", description: "Job link copied to clipboard." });
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Job
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-sm">Job Details</h3>
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span>€{job.salary_min?.toLocaleString()}{job.salary_max ? ` - €${job.salary_max.toLocaleString()}` : "+"} / {job.salary_period || "annual"}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{jobTypeLabels[job.job_type]}</span>
                </div>
                {job.expires_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Expires: {new Date(job.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {job.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {employee && (
              <p className="text-sm text-muted-foreground">
                Applying as <span className="font-medium text-foreground">{employee.first_name} {employee.last_name}</span>
              </p>
            )}
            <Textarea
              placeholder="Cover letter (optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}