import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Briefcase, Plus, CreditCard, Users, FileText, Eye,
  CheckCircle, Clock, XCircle, LogOut, ShieldAlert, Lock
} from "lucide-react";
import JobPostForm from "./JobPostForm";
import EmployerProfile from "./EmployerProfile";

const statusIcons = {
  draft: <FileText className="w-4 h-4" />,
  pending_review: <Clock className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle className="w-4 h-4 text-accent" />,
  rejected: <XCircle className="w-4 h-4 text-destructive" />,
  expired: <Clock className="w-4 h-4 text-muted-foreground" />,
};

function getVerificationMeta(employer) {
  switch (employer.verification_status) {
    case "approved":
      return {
        label: "Approved",
        description: "Your employer account is verified. Full access is unlocked.",
      };
    case "pending":
    case "submitted":
      return {
        label: "Pending Review",
        description: "Your verification request is with the admin team. You can continue reviewing your dashboard and profile while you wait.",
      };
    case "rejected":
      return {
        label: "Rejected",
        description: employer.admin_review_note || "Your submission needs updates before approval. Review the reason below, update your profile, and resubmit.",
      };
    default:
      return {
        label: "Not Submitted",
        description: "Complete your company profile, then submit your account for admin verification.",
      };
  }
}

function isProfileReadyForSubmission(employer) {
  return Boolean(
    employer?.first_name &&
    employer?.last_name &&
    employer?.company_name &&
    employer?.phone &&
    employer?.date_of_birth &&
    employer?.website &&
    employer?.cro_number &&
    employer?.employer_number
  );
}

export default function EmployerDashboard({ user, employer, setEmployer }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const formContainerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", user.email],
    queryFn: () => digify.entities.Job.filter({ created_by: user.email }, "-created_date"),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications", user.email],
    queryFn: () => digify.entities.Application.filter({ employer_email: user.email }, "-created_date"),
  });

  const isApproved = employer.verification_status === "approved";
  const profileReady = isProfileReadyForSubmission(employer);
  const verificationMeta = getVerificationMeta(employer);
  const activeJobs = jobs.filter((j) => j.status === "approved");
  const pendingJobs = jobs.filter((j) => j.status === "pending_review");

  useEffect(() => {
    if (!showJobForm || !editingJob || !formContainerRef.current) return;
    formContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showJobForm, editingJob]);

  const handleSubmitForVerification = async () => {
    if (!profileReady) {
      toast({
        title: "Complete your profile first",
        description: "Add your contact details, website, CRO number, employer number, and date of birth before submitting for verification.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingVerification(true);
    try {
      const updated = await digify.entities.Employer.update(employer.id, {
        verification_status: "pending",
        admin_review_note: "",
        approval_submitted_at: new Date().toISOString(),
      });
      setEmployer(updated);
      toast({
        title: "Submitted for Verification",
        description: "Your employer account is now pending admin approval.",
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">Employer Dashboard</h1>
              <p className="text-primary-foreground/70 mt-1">{employer.company_name}</p>
            </div>
            <Button
              variant="ghost"
              className="text-primary-foreground/60 hover:text-primary-foreground"
              onClick={() => digify.auth.logout("/")}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeJobs.length}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingJobs.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isApproved ? applications.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Candidate Access</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employer.credits || 0}</p>
                  <p className="text-xs text-muted-foreground">Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!isApproved && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                {employer.verification_status === "rejected" ? (
                  <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">Verification Status</p>
                    <Badge variant="secondary" className="capitalize">{verificationMeta.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{verificationMeta.description}</p>
                  {employer.verification_status === "rejected" && employer.admin_review_note && (
                    <p className="text-sm text-destructive">Reason: {employer.admin_review_note}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Limited mode allows dashboard access and profile setup only. Posting jobs and employee database access stay locked until admin approval.
                  </p>
                </div>
              </div>

              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSubmitForVerification}
                disabled={submittingVerification || employer.verification_status === "pending" || employer.verification_status === "submitted"}
              >
                {submittingVerification
                  ? "Submitting..."
                  : employer.verification_status === "rejected"
                    ? "Resubmit for Verification"
                    : employer.verification_status === "pending" || employer.verification_status === "submitted"
                      ? "Pending Admin Review"
                      : "Submit for Verification"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isApproved ? "jobs" : "overview"}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile Setup</TabsTrigger>
            {isApproved && <TabsTrigger value="jobs">My Jobs</TabsTrigger>}
            {isApproved && <TabsTrigger value="applications">Applications</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Access Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-800">Allowed now</p>
                    <p className="text-sm text-emerald-700 mt-1">View your dashboard and start profile setup immediately after email verification.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Next step</p>
                    <p className="text-sm text-muted-foreground mt-1">Fill in your company profile and submit your account for admin verification.</p>
                  </div>
                  {!isApproved && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Blocked until approval</p>
                          <p className="text-sm text-amber-800 mt-1">Posting jobs and employee database access are disabled while your employer account is in limited mode.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email verified</span>
                    <Badge>{user.email}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Profile ready</span>
                    <Badge variant={profileReady ? "default" : "secondary"}>
                      {profileReady ? "Ready" : "Incomplete"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admin decision</span>
                    <Badge variant={isApproved ? "default" : "secondary"} className="capitalize">
                      {employer.verification_status || "draft"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <EmployerProfile employer={employer} setEmployer={setEmployer} />
          </TabsContent>

          {isApproved && (
            <TabsContent value="jobs">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{editingJob ? "Edit Job" : "Job Listings"}</h2>
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => {
                    setEditingJob(null);
                    setShowJobForm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Job
                </Button>
              </div>

              {showJobForm && (
                <div className="mb-6" ref={formContainerRef}>
                  <JobPostForm
                    employer={employer}
                    user={user}
                    initialJob={editingJob}
                    autoFocusTitle={Boolean(editingJob)}
                    onClose={() => {
                      setShowJobForm(false);
                      setEditingJob(null);
                    }}
                    onSuccess={() => {
                      setShowJobForm(false);
                      setEditingJob(null);
                      queryClient.invalidateQueries({ queryKey: ["employer-jobs", user.email] });
                    }}
                  />
                </div>
              )}

              <div className="space-y-3">
                {jobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No jobs posted yet. Create your first listing.</p>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {statusIcons[job.status]}
                          <div>
                            <p className="font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-muted-foreground">{job.location} · {job.job_type?.replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={job.status === "approved" ? "default" : "secondary"} className="text-xs">
                            {job.status?.replace("_", " ")}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingJob(job);
                              setShowJobForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {job.views_count || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}

          {isApproved && (
            <TabsContent value="applications">
              <h2 className="text-lg font-semibold mb-6">Received Applications</h2>
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No applications received yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{app.employee_name}</p>
                          <p className="text-xs text-muted-foreground">Applied for: {app.job_title}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{app.status}</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
