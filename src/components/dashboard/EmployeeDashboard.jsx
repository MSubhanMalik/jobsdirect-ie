import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase, FileText, Send, Eye, LogOut, Clock, CheckCircle, XCircle
} from "lucide-react";
import EmployeeProfile from "./EmployeeProfile";

const statusIcons = {
  submitted: <Clock className="w-4 h-4 text-yellow-500" />,
  reviewed: <Eye className="w-4 h-4 text-primary" />,
  shortlisted: <CheckCircle className="w-4 h-4 text-accent" />,
  rejected: <XCircle className="w-4 h-4 text-destructive" />,
  hired: <CheckCircle className="w-4 h-4 text-accent" />,
};

export default function EmployeeDashboard({ user, employee, setEmployee }) {
  const { data: applications = [] } = useQuery({
    queryKey: ["my-applications", user.email],
    queryFn: () => digify.entities.Application.filter({ employee_email: user.email }, "-created_date"),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-accent text-accent-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">My Dashboard</h1>
              <p className="text-accent-foreground/70 mt-1">{employee.first_name} {employee.last_name}</p>
            </div>
            <Button
              variant="ghost"
              className="text-accent-foreground/60 hover:text-accent-foreground"
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-accent" />
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
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employee.cv_url ? "1" : "0"}</p>
                  <p className="text-xs text-muted-foreground">CVs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employee.is_searchable ? "Yes" : "No"}</p>
                  <p className="text-xs text-muted-foreground">Visible to Employers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="mb-6">
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Application History</h2>
              <Link to="/jobs">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Send className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">You haven't applied to any jobs yet.</p>
                    <Link to="/jobs">
                      <Button variant="outline">Browse Jobs</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                applications.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcons[app.status]}
                        <div>
                          <Link to={`/jobs/${app.job_id}`} className="font-medium text-sm hover:text-accent transition-colors">
                            {app.job_title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{app.company_name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{app.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <EmployeeProfile employee={employee} setEmployee={setEmployee} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}