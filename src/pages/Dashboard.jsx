import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { digify } from "@/api/digifyClient";
import { Skeleton } from "@/components/ui/skeleton";
import EmployerDashboard from "../components/dashboard/EmployerDashboard";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";
import RoleSelector from "../components/dashboard/RoleSelector";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const authed = await digify.auth.isAuthenticated();
      if (!authed) {
        digify.auth.redirectToLogin("/dashboard");
        return;
      }
      const me = await digify.auth.me();
      setUser(me);

      if (me.role === "admin") {
        navigate("/admin");
        return;
      }

      // Check if user has employer or employee profile
      const employers = await digify.entities.Employer.filter({ user_email: me.email });
      if (employers.length > 0) setEmployer(employers[0]);

      const employees = await digify.entities.Employee.filter({ user_email: me.email });
      if (employees.length > 0) setEmployee(employees[0]);

      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If no profile yet, show role selection
  if (!employer && !employee) {
    return <RoleSelector user={user} onCreated={(type, data) => {
      if (type === "employer") setEmployer(data);
      else setEmployee(data);
    }} />;
  }

  if (employer) {
    return <EmployerDashboard user={user} employer={employer} setEmployer={setEmployer} />;
  }

  return <EmployeeDashboard user={user} employee={employee} setEmployee={setEmployee} />;
}