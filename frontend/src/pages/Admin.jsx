import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Briefcase, Building2, Users, Mail, CheckCircle, XCircle,
  Clock, Eye, CreditCard, LogOut, Shield, MessageSquare
} from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const load = async () => {
      const authed = await digify.auth.isAuthenticated();
      if (!authed) { digify.auth.redirectToLogin("/admin"); return; }
      const me = await digify.auth.me();
      if (me.role !== "admin") { navigate("/dashboard"); return; }
      setUser(me);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const { data: pendingJobs = [] } = useQuery({
    queryKey: ["admin-pending-jobs"],
    queryFn: () => digify.entities.Job.filter({ status: "pending_review" }, "-created_date"),
    enabled: !loading,
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ["admin-all-jobs"],
    queryFn: () => digify.entities.Job.list("-created_date", 50),
    enabled: !loading,
  });

  const { data: employers = [] } = useQuery({
    queryKey: ["admin-employers"],
    queryFn: () => digify.entities.Employer.list("-created_date", 50),
    enabled: !loading,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: () => digify.entities.Employee.list("-created_date", 50),
    enabled: !loading,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => digify.entities.ContactMessage.list("-created_date", 50),
    enabled: !loading,
  });

  const approveJob = async (job) => {
    await digify.entities.Job.update(job.id, { status: "approved" });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] });
    toast({ title: "Job Approved", description: `"${job.title}" is now live.` });
  };

  const rejectJob = async () => {
    await digify.entities.Job.update(rejectDialog.id, { status: "rejected", rejection_reason: rejectReason });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] });
    setRejectDialog(null);
    setRejectReason("");
    toast({ title: "Job Rejected" });
  };

  const approveEmployer = async (emp) => {
    await digify.entities.Employer.update(emp.id, { verification_status: "approved" });
    queryClient.invalidateQueries({ queryKey: ["admin-employers"] });
    toast({ title: "Employer Verified", description: `${emp.company_name} has been approved.` });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const approvedJobs = allJobs.filter((j) => j.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-accent" />
              <div>
                <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
                <p className="text-primary-foreground/70 text-sm">JobsDirect.ie Management</p>
              </div>
            </div>
            <Button variant="ghost" className="text-primary-foreground/60" onClick={() => digify.auth.logout("/")}>
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Clock, label: "Pending Jobs", value: pendingJobs.length, color: "text-yellow-500" },
            { icon: Briefcase, label: "Active Jobs", value: approvedJobs.length, color: "text-accent" },
            { icon: Building2, label: "Employers", value: employers.length, color: "text-primary" },
            { icon: Users, label: "Employees", value: employees.length, color: "text-accent" },
            { icon: MessageSquare, label: "Messages", value: messages.filter((m) => m.status === "new").length, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="pending">
              Pending Jobs
              {pendingJobs.length > 0 && <Badge className="ml-2 bg-yellow-500 text-white text-xs">{pendingJobs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="jobs">All Jobs</TabsTrigger>
            <TabsTrigger value="employers">Employers</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Pending Jobs */}
          <TabsContent value="pending">
            <div className="space-y-3">
              {pendingJobs.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-muted-foreground">No pending jobs</CardContent></Card>
              ) : (
                pendingJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company_name} · {job.location}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description?.slice(0, 200)}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => approveJob(job)}>
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejectDialog(job)}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* All Jobs */}
          <TabsContent value="jobs">
            <div className="space-y-3">
              {allJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company_name} · {job.location}</p>
                    </div>
                    <Badge variant={job.status === "approved" ? "default" : "secondary"} className="text-xs capitalize">
                      {job.status?.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Employers */}
          <TabsContent value="employers">
            <div className="space-y-3">
              {employers.map((emp) => (
                <Card key={emp.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{emp.company_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.first_name} {emp.last_name} · {emp.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={emp.verification_status === "approved" ? "default" : "secondary"} className="text-xs capitalize">
                        {emp.verification_status}
                      </Badge>
                      {emp.verification_status !== "approved" && (
                        <Button size="sm" variant="outline" onClick={() => approveEmployer(emp)}>Verify</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Employees */}
          <TabsContent value="employees">
            <div className="space-y-3">
              {employees.map((emp) => (
                <Card key={emp.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.user_email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {emp.profile_completed ? "Complete" : "Incomplete"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-muted-foreground">No messages</CardContent></Card>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground">{msg.name} · {msg.email}</p>
                          <p className="text-sm text-muted-foreground mt-2">{msg.message}</p>
                        </div>
                        <Badge variant={msg.status === "new" ? "default" : "secondary"} className="text-xs">{msg.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) setRejectDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Job: {rejectDialog?.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectJob}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}