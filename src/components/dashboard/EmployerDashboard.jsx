import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase, Plus, CreditCard, Users, FileText, Eye,
  CheckCircle, Clock, XCircle, LogOut
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

export default function EmployerDashboard({ user, employer, setEmployer }) {
  const navigate = useNavigate();
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
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

  const activeJobs = jobs.filter((j) => j.status === "approved");
  const pendingJobs = jobs.filter((j) => j.status === "pending_review");

  useEffect(() => {
    if (!showJobForm || !editingJob || !formContainerRef.current) return;
    formContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showJobForm, editingJob]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Stats */}
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
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-xs text-muted-foreground">Applications</p>
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

        {/* Verification Banner */}
        {employer.verification_status !== "approved" && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-sm">Account Verification {employer.verification_status === "submitted" ? "Pending" : "Required"}</p>
                  <p className="text-xs text-muted-foreground">
                    {employer.verification_status === "submitted" ? "Your documents are under review." : "Complete your profile and submit documents for verification."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="jobs">
          <TabsList className="mb-6">
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

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
                    <p className="text-muted-foreground">No jobs posted yet. Create your first listing!</p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
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

          <TabsContent value="profile">
            <EmployerProfile employer={employer} setEmployer={setEmployer} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
