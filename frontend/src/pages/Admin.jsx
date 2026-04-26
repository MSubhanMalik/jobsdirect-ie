import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { digify } from "@/api/digifyClient";
import { useAuth } from "@/lib/AuthContext";
import FormFieldRenderer from "@/components/forms/FormFieldRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  COMPANY_FIELD_GROUPS,
  COMPANY_FIELDS,
  DEFAULT_SITE_SETTINGS,
  EMPLOYER_EDITOR_DEFAULTS,
  JOB_EDITOR_DEFAULTS,
  JOB_FIELD_GROUPS,
  JOB_FIELDS,
  buildEntityFormValues,
  mergeSiteSettingsWithDefaults,
} from "@/lib/siteSettings";
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const queryKeys = {
  jobs: ["admin-jobs"],
  employers: ["admin-employers"],
  employees: ["admin-employees"],
  applications: ["admin-applications"],
  messages: ["admin-messages"],
  payments: ["admin-payments"],
  users: ["admin-users"],
  settings: ["admin-site-settings"],
};

const jobTypes = [
  ["full_time", "Full time"],
  ["part_time", "Part time"],
  ["contract", "Contract"],
  ["temporary", "Temporary"],
  ["internship", "Internship"],
  ["remote", "Remote"],
];

const categories = [
  ["technology", "Technology"],
  ["healthcare", "Healthcare"],
  ["finance", "Finance"],
  ["education", "Education"],
  ["engineering", "Engineering"],
  ["sales", "Sales"],
  ["marketing", "Marketing"],
  ["hospitality", "Hospitality"],
  ["retail", "Retail"],
  ["construction", "Construction"],
  ["transport", "Transport"],
  ["admin", "Admin"],
  ["legal", "Legal"],
  ["manufacturing", "Manufacturing"],
  ["other", "Other"],
];

const statusMeta = {
  approved: { label: "Live", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pending_review: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
  rejected: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700" },
  draft: { label: "Draft", className: "border-slate-200 bg-slate-50 text-slate-700" },
  archived: { label: "Archived", className: "border-slate-200 bg-slate-100 text-slate-600" },
  submitted: { label: "Submitted", className: "border-blue-200 bg-blue-50 text-blue-700" },
  shortlisted: { label: "Shortlisted", className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  hired: { label: "Hired", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  new: { label: "New", className: "border-blue-200 bg-blue-50 text-blue-700" },
  read: { label: "Read", className: "border-slate-200 bg-slate-50 text-slate-700" },
};

const defaultSiteSettings = mergeSiteSettingsWithDefaults({ id: "site_settings", ...DEFAULT_SITE_SETTINGS });

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs CMS", icon: Briefcase },
  { id: "employers", label: "Companies", icon: Building2 },
  { id: "employees", label: "Candidates", icon: Users },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "users", label: "Users", icon: UserCog },
  { id: "settings", label: "Site CMS", icon: SlidersHorizontal },
];

function humanize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatSalary(job) {
  const min = Number(job?.salary_min);
  const max = Number(job?.salary_max);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return "Not listed";
  const currency = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  if (Number.isFinite(min) && Number.isFinite(max) && min !== max) {
    return `${currency.format(min)} - ${currency.format(max)}`;
  }
  return currency.format(Number.isFinite(min) ? min : max);
}

function formatMoneyFromCents(amount, currency = "eur") {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: String(currency || "eur").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(Number(amount || 0) / 100);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function splitList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function searchRecords(items, search, fields) {
  const term = search.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) =>
    fields.some((field) => String(item?.[field] || "").toLowerCase().includes(term)),
  );
}

function StatusBadge({ value }) {
  const meta = statusMeta[value] || { label: humanize(value || "Unknown"), className: "border-slate-200 bg-slate-50 text-slate-700" };
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

function StatCard({ icon: Icon, label, value, subtext, tone = "primary" }) {
  const toneClass = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    amber: "bg-amber-500 text-white",
    blue: "bg-blue-600 text-white",
  }[tone];

  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-background p-8 text-center">
      <Icon className="h-9 w-9 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function FieldControlMatrix({ title, description, groups, value, onToggle }) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => {
          const configurableFields = group.fields.filter((field) => !field.adminOnly && field.manageInEmployerForm !== false);
          if (!configurableFields.length) return null;

          return (
            <section key={group.id} className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
              </div>
              <div className="space-y-2">
                {configurableFields.map((field) => {
                  const control = value?.[field.key] || { visible: false, required: false };
                  return (
                    <div
                      key={field.key}
                      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_110px_110px]"
                    >
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 md:justify-self-end">
                        <Label>Visible</Label>
                        <Switch checked={Boolean(control.visible)} onCheckedChange={(checked) => onToggle(field.key, { visible: checked })} />
                      </div>
                      <div className="flex items-center justify-between gap-2 md:justify-self-end">
                        <Label>Required</Label>
                        <Switch
                          checked={Boolean(control.required)}
                          disabled={field.supportsRequired === false || !control.visible}
                          onCheckedChange={(checked) => onToggle(field.key, { required: checked })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

function createJobForm(job = {}, employers = []) {
  const firstEmployer = employers[0] || {};
  const formValues = buildEntityFormValues(JOB_EDITOR_DEFAULTS, JOB_FIELDS, job);
  return {
    ...formValues,
    company_name: job.company_name || firstEmployer.company_name || "",
    employer_id: job.employer_id || firstEmployer.id || "",
  };
}

function createEmployerForm(employer = {}) {
  const formValues = buildEntityFormValues(EMPLOYER_EDITOR_DEFAULTS, COMPANY_FIELDS, employer);
  return {
    ...formValues,
    user_email: employer.user_email || "",
  };
}

function createEmployeeForm(employee = {}) {
  return {
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    user_email: employee.user_email || "",
    phone: employee.phone || "",
    title: employee.title || "",
    location: employee.location || employee.desired_location || "",
    bio: employee.bio || "",
    skills: Array.isArray(employee.skills) ? employee.skills.join(", ") : employee.skills || "",
    desired_job_type: employee.desired_job_type || "full_time",
    availability: employee.availability || "negotiable",
    profile_completed: Boolean(employee.profile_completed),
    is_searchable: employee.is_searchable !== false,
  };
}

function createUserForm(user = {}) {
  return {
    full_name: user.full_name || "",
    email: user.email || "",
    role: user.role || "employee",
    email_verified: user.email_verified !== false,
    password: "",
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { loadPublicSettings } = useAuth();
  const [authUser, setAuthUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("all");
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [settingsForm, setSettingsForm] = useState(() => mergeSiteSettingsWithDefaults(defaultSiteSettings));

  useEffect(() => {
    const load = async () => {
      const authed = await digify.auth.isAuthenticated();
      if (!authed) {
        digify.auth.redirectToLogin("/admin");
        return;
      }
      const me = await digify.auth.me();
      if (!ADMIN_ROLES.has(me.role)) {
        navigate("/dashboard");
        return;
      }
      setAuthUser(me);
      setCheckingAuth(false);
    };
    load();
  }, [navigate]);

  const enabled = !checkingAuth;
  const jobsQuery = useQuery({ queryKey: queryKeys.jobs, queryFn: () => digify.entities.Job.list("-created_date", 500), enabled });
  const employersQuery = useQuery({ queryKey: queryKeys.employers, queryFn: () => digify.entities.Employer.list("-created_date", 500), enabled });
  const employeesQuery = useQuery({ queryKey: queryKeys.employees, queryFn: () => digify.entities.Employee.list("-created_date", 500), enabled });
  const applicationsQuery = useQuery({ queryKey: queryKeys.applications, queryFn: () => digify.entities.Application.list("-created_date", 500), enabled });
  const messagesQuery = useQuery({ queryKey: queryKeys.messages, queryFn: () => digify.entities.ContactMessage.list("-created_date", 500), enabled });
  const paymentsQuery = useQuery({ queryKey: queryKeys.payments, queryFn: () => digify.entities.Payment.list("-created_date", 500), enabled });
  const usersQuery = useQuery({ queryKey: queryKeys.users, queryFn: () => digify.admin.listUsers(), enabled });
  const settingsQuery = useQuery({ queryKey: queryKeys.settings, queryFn: () => digify.entities.SiteSetting.filter({ id: "site_settings" }, "-updated_date", 1), enabled });

  const jobs = jobsQuery.data || [];
  const employers = employersQuery.data || [];
  const employees = employeesQuery.data || [];
  const applications = applicationsQuery.data || [];
  const messages = messagesQuery.data || [];
  const payments = paymentsQuery.data || [];
  const users = usersQuery.data || [];
  const siteSettings = settingsQuery.data?.[0] || null;
  const dataLoading = [jobsQuery, employersQuery, employeesQuery, applicationsQuery, messagesQuery, paymentsQuery, usersQuery].some((query) => query.isLoading);

  useEffect(() => {
    if (!settingsQuery.isLoading) {
      setSettingsForm(mergeSiteSettingsWithDefaults(siteSettings || defaultSiteSettings));
    }
  }, [settingsQuery.isLoading, siteSettings?.id, siteSettings?.updated_date]);

  const stats = useMemo(() => {
    const pendingJobs = jobs.filter((job) => job.status === "pending_review").length;
    const liveJobs = jobs.filter((job) => job.status === "approved").length;
    const pendingEmployers = employers.filter((employer) => ["pending", "submitted"].includes(employer.verification_status)).length;
    const newMessages = messages.filter((message) => message.status === "new").length;
    const paidPayments = payments.filter((payment) => payment.status === "paid");
    const revenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount_total || 0), 0);

    return { pendingJobs, liveJobs, pendingEmployers, newMessages, paidPayments: paidPayments.length, revenue };
  }, [jobs, employers, messages, payments]);

  const filteredJobs = useMemo(() => {
    const bySearch = searchRecords(jobs, search, ["title", "company_name", "location", "category", "status"]);
    return jobStatus === "all" ? bySearch : bySearch.filter((job) => job.status === jobStatus);
  }, [jobs, search, jobStatus]);

  const filteredEmployers = useMemo(
    () => searchRecords(employers, search, ["company_name", "first_name", "last_name", "user_email", "verification_status"]),
    [employers, search],
  );

  const filteredEmployees = useMemo(
    () => searchRecords(employees, search, ["first_name", "last_name", "user_email", "title", "location"]),
    [employees, search],
  );

  const filteredApplications = useMemo(
    () => searchRecords(applications, search, ["job_title", "employee_name", "employee_email", "company_name", "status"]),
    [applications, search],
  );

  const filteredMessages = useMemo(
    () => searchRecords(messages, search, ["name", "email", "subject", "message", "status"]),
    [messages, search],
  );

  const filteredPayments = useMemo(
    () => searchRecords(payments, search, ["stripe_session_id", "user_email", "company_name", "plan_id", "status", "kind"]),
    [payments, search],
  );

  const filteredUsers = useMemo(
    () => searchRecords(users, search, ["full_name", "email", "role"]),
    [users, search],
  );

  const invalidate = (...keys) => {
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const updateEntity = async (entity, id, updates, keys, title) => {
    await digify.entities[entity].update(id, updates);
    invalidate(...keys);
    toast({ title });
  };

  const openEditor = (entity, item = null) => {
    const mode = item ? "edit" : "create";
    const form = {
      job: createJobForm(item || {}, employers),
      employer: createEmployerForm(item || {}),
      employee: createEmployeeForm(item || {}),
      user: createUserForm(item || {}),
    }[entity];
    setEditor({ entity, mode, item, form });
  };

  const updateEditor = (field, value) => {
    setEditor((current) => ({
      ...current,
      form: { ...current.form, [field]: value },
    }));
  };

  const updateSettingsFieldControl = (configKey, fieldKey, updates) => {
    setSettingsForm((current) => ({
      ...current,
      [configKey]: {
        ...(current?.[configKey] || {}),
        [fieldKey]: {
          ...(current?.[configKey]?.[fieldKey] || {}),
          ...updates,
          ...(updates.visible === false ? { required: false } : {}),
        },
      },
    }));
  };

  const saveEditor = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editor.entity === "job") {
        const selectedEmployer = employers.find((employer) => employer.id === editor.form.employer_id);
        const payload = {
          ...editor.form,
          company_name: editor.form.company_name || selectedEmployer?.company_name || "Direct listing",
          employer_id: editor.form.employer_id || selectedEmployer?.id || "",
          salary_min: toNumber(editor.form.salary_min),
          salary_max: toNumber(editor.form.salary_max),
          hours_per_week: toNumber(editor.form.hours_per_week),
          positions_count: toNumber(editor.form.positions_count),
        };
        if (editor.mode === "edit") {
          await digify.entities.Job.update(editor.item.id, payload);
        } else {
          await digify.entities.Job.create(payload);
        }
        invalidate(queryKeys.jobs);
      }

      if (editor.entity === "employer") {
        if (editor.mode === "edit") {
          await digify.entities.Employer.update(editor.item.id, editor.form);
        } else {
          await digify.entities.Employer.create(editor.form);
        }
        invalidate(queryKeys.employers);
      }

      if (editor.entity === "employee") {
        const payload = { ...editor.form, skills: splitList(editor.form.skills) };
        if (editor.mode === "edit") {
          await digify.entities.Employee.update(editor.item.id, payload);
        } else {
          await digify.entities.Employee.create(payload);
        }
        invalidate(queryKeys.employees);
      }

      if (editor.entity === "user") {
        const payload = { ...editor.form };
        if (editor.mode === "edit") {
          delete payload.email;
          if (!payload.password) delete payload.password;
          await digify.admin.updateUser(editor.item.id, payload);
        } else {
          await digify.admin.createUser(payload);
        }
        invalidate(queryKeys.users);
      }

      toast({ title: editor.mode === "edit" ? "Changes saved" : "Record created" });
      setEditor(null);
    } catch (error) {
      toast({
        title: "Could not save",
        description: error.message || "Please check the details and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = mergeSiteSettingsWithDefaults({ ...settingsForm, id: "site_settings" });
      if (siteSettings?.id) {
        await digify.entities.SiteSetting.update(siteSettings.id, payload);
      } else {
        await digify.entities.SiteSetting.create(payload);
      }
      invalidate(queryKeys.settings);
      await loadPublicSettings?.();
      toast({ title: "Site settings updated" });
    } catch (error) {
      toast({
        title: "Could not update settings",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setSaving(true);
    try {
      if (deleteDialog.kind === "user") {
        await digify.admin.deleteUser(deleteDialog.id);
        invalidate(queryKeys.users);
      } else {
        await digify.entities[deleteDialog.entity].remove(deleteDialog.id);
        invalidate(...deleteDialog.keys);
      }
      toast({ title: "Deleted", description: deleteDialog.label });
      setDeleteDialog(null);
    } catch (error) {
      toast({
        title: "Could not delete",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderOverview = () => {
    const pendingQueue = [
      ...jobs.filter((job) => job.status === "pending_review").slice(0, 4).map((job) => ({
        id: job.id,
        title: job.title,
        detail: `${job.company_name || "Company"} - ${job.location || "Location"}`,
        type: "Job",
        action: () => updateEntity("Job", job.id, { status: "approved" }, [queryKeys.jobs], "Job approved"),
      })),
      ...employers.filter((employer) => ["pending", "submitted"].includes(employer.verification_status)).slice(0, 3).map((employer) => ({
        id: employer.id,
        title: employer.company_name,
        detail: employer.user_email,
        type: "Company",
        action: () => updateEntity("Employer", employer.id, { verification_status: "approved", approved_at: new Date().toISOString() }, [queryKeys.employers], "Company approved"),
      })),
    ];

    const recentActivity = [
      ...jobs.map((item) => ({ type: "Job", title: item.title, date: item.updated_date || item.created_date })),
      ...applications.map((item) => ({ type: "Application", title: item.job_title || item.employee_email, date: item.updated_date || item.created_date })),
      ...messages.map((item) => ({ type: "Message", title: item.subject, date: item.updated_date || item.created_date })),
      ...payments.map((item) => ({ type: "Payment", title: item.plan_id || item.stripe_session_id, date: item.updated_date || item.created_date })),
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    const pipeline = [
      { label: "Pending jobs", value: stats.pendingJobs, total: Math.max(jobs.length, 1), tone: "bg-amber-500" },
      { label: "Live jobs", value: stats.liveJobs, total: Math.max(jobs.length, 1), tone: "bg-emerald-500" },
      { label: "Applications", value: applications.length, total: Math.max(applications.length + jobs.length, 1), tone: "bg-blue-600" },
      { label: "New messages", value: stats.newMessages, total: Math.max(messages.length, 1), tone: "bg-indigo-500" },
    ];

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Command center"
          description="Run publishing, moderation, accounts, and site content from one place."
          action={
            <Button onClick={() => openEditor("job")}>
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Briefcase} label="Live jobs" value={stats.liveJobs} subtext={`${jobs.length} total listings`} tone="accent" />
          <StatCard icon={Gauge} label="Needs review" value={stats.pendingJobs + stats.pendingEmployers} subtext="Jobs and companies" tone="amber" />
          <StatCard icon={ClipboardList} label="Applications" value={applications.length} subtext="Candidate pipeline" tone="blue" />
          <StatCard icon={Mail} label="New messages" value={stats.newMessages} subtext={`${messages.length} inbox items`} tone="primary" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Approval queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingQueue.length ? (
                <div className="space-y-3">
                  {pendingQueue.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <p className="truncate text-sm font-medium">{item.title}</p>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={item.action}>
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No approvals waiting" description="Everything that needs review has been cleared." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-accent" />
                Marketplace health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipeline.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${item.tone}`}
                      style={{ width: `${Math.min(100, Math.round((item.value / item.total) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length ? (
              <div className="divide-y">
                {recentActivity.map((item, index) => (
                  <div key={`${item.type}-${item.title}-${index}`} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title || item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No activity yet" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderJobs = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Jobs CMS"
        description="Publish, edit, feature, approve, reject, archive, or remove listings."
        action={
          <Button onClick={() => openEditor("job")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        }
      />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search jobs, company, location" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={jobStatus} onValueChange={setJobStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Live</SelectItem>
                <SelectItem value="pending_review">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company_name || "Direct listing"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.location || "Remote"}</TableCell>
                  <TableCell className="text-sm">{formatSalary(job)}</TableCell>
                  <TableCell><StatusBadge value={job.status} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {job.is_featured && <Badge variant="secondary">Featured</Badge>}
                      {job.is_highlighted && <Badge variant="secondary">Highlighted</Badge>}
                      {!job.is_featured && !job.is_highlighted && <span className="text-xs text-muted-foreground">Standard</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditor("job", job)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Job", job.id, { status: "approved" }, [queryKeys.jobs], "Job approved")}><CheckCircle2 className="h-4 w-4" /> Approve</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Job", job.id, { status: "rejected" }, [queryKeys.jobs], "Job rejected")}><XCircle className="h-4 w-4" /> Reject</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Job", job.id, { status: "archived" }, [queryKeys.jobs], "Job archived")}><FileText className="h-4 w-4" /> Archive</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ entity: "Job", id: job.id, label: job.title, keys: [queryKeys.jobs] })}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredJobs.length && <div className="p-6"><EmptyState title="No jobs found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployers = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Company CMS"
        description="Manage employer profiles, company verification, and account readiness."
        action={<Button onClick={() => openEditor("employer")}><Plus className="h-4 w-4" /> New Company</Button>}
      />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployers.map((employer) => (
                <TableRow key={employer.id}>
                  <TableCell>
                    <p className="font-medium">{employer.company_name || "Unnamed company"}</p>
                    <p className="text-xs text-muted-foreground">{employer.website || "No website"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{employer.first_name} {employer.last_name}</p>
                    <p className="text-xs text-muted-foreground">{employer.user_email}</p>
                  </TableCell>
                  <TableCell><StatusBadge value={employer.verification_status || "draft"} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(employer.updated_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditor("employer", employer)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Employer", employer.id, { verification_status: "approved", approved_at: new Date().toISOString(), admin_review_note: "" }, [queryKeys.employers], "Company approved")}>
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Employer", employer.id, { verification_status: "rejected" }, [queryKeys.employers], "Company rejected")}>
                          <XCircle className="h-4 w-4" /> Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ entity: "Employer", id: employer.id, label: employer.company_name, keys: [queryKeys.employers] })}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredEmployers.length && <div className="p-6"><EmptyState title="No companies found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Candidate CMS"
        description="Edit profiles, search visibility, skills, availability, and profile completion."
        action={<Button onClick={() => openEditor("employee")}><Plus className="h-4 w-4" /> New Candidate</Button>}
      />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                    <p className="text-xs text-muted-foreground">{employee.user_email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{employee.title || "Open to work"}</p>
                    <p className="text-xs text-muted-foreground">{employee.location || employee.desired_location || "No location"}</p>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {splitList(employee.skills).slice(0, 4).join(", ") || "No skills"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.profile_completed ? "default" : "secondary"}>
                      {employee.profile_completed ? "Complete" : "Incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditor("employee", employee)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("Employee", employee.id, { is_searchable: !employee.is_searchable }, [queryKeys.employees], "Candidate visibility updated")}>
                          <Eye className="h-4 w-4" /> Toggle visibility
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ entity: "Employee", id: employee.id, label: `${employee.first_name} ${employee.last_name}`, keys: [queryKeys.employees] })}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredEmployees.length && <div className="p-6"><EmptyState title="No candidates found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <SectionHeader title="Applications" description="Track candidate flow and update application outcomes." />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <p className="font-medium">{application.employee_name || "Candidate"}</p>
                    <p className="text-xs text-muted-foreground">{application.employee_email}</p>
                  </TableCell>
                  <TableCell className="max-w-sm">{application.job_title || application.job_id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{application.company_name || application.employer_email}</TableCell>
                  <TableCell>
                    <Select
                      value={application.status || "submitted"}
                      onValueChange={(status) => updateEntity("Application", application.id, { status }, [queryKeys.applications], "Application updated")}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(application.created_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredApplications.length && <div className="p-6"><EmptyState title="No applications found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <SectionHeader title="Inbox" description="Review contact messages, partnerships, and support requests." />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="max-w-xl">
                    <p className="font-medium">{message.subject}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{message.message}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{message.name}</p>
                    <p className="text-xs text-muted-foreground">{message.email}</p>
                  </TableCell>
                  <TableCell><StatusBadge value={message.status || "new"} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(message.created_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateEntity("ContactMessage", message.id, { status: "read" }, [queryKeys.messages], "Message marked read")}>
                          <CheckCircle2 className="h-4 w-4" /> Mark read
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateEntity("ContactMessage", message.id, { status: "archived" }, [queryKeys.messages], "Message archived")}>
                          <FileText className="h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialog({ entity: "ContactMessage", id: message.id, label: message.subject, keys: [queryKeys.messages] })}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredMessages.length && <div className="p-6"><EmptyState title="No messages found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Payments"
        description="Stripe Checkout sessions, fulfilled credits, and candidate database subscriptions."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CreditCard} label="Paid sessions" value={stats.paidPayments} subtext={`${payments.length} total records`} tone="accent" />
        <StatCard icon={BarChart3} label="Revenue" value={formatMoneyFromCents(stats.revenue)} subtext="Fulfilled payments" tone="primary" />
        <StatCard icon={Users} label="Subscriptions" value={payments.filter((payment) => payment.kind === "candidate_database" && payment.status === "paid").length} subtext="Candidate database access" tone="blue" />
      </div>
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="font-medium">{humanize(payment.plan_id)}</p>
                    <p className="text-xs text-muted-foreground">{payment.stripe_session_id || payment.id}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{payment.company_name || "Employer"}</p>
                    <p className="text-xs text-muted-foreground">{payment.user_email}</p>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatMoneyFromCents(payment.amount_total, payment.currency)}</TableCell>
                  <TableCell><StatusBadge value={payment.status || "checkout_created"} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(payment.created_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredPayments.length && <div className="p-6"><EmptyState icon={CreditCard} title="No payments found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <SectionHeader
        title="User access"
        description="Create admins, employers, candidates, and manage verification state."
        action={<Button onClick={() => openEditor("user")}><Plus className="h-4 w-4" /> New User</Button>}
      />
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.id}</p>
                  </TableCell>
                  <TableCell><Badge variant={user.role === "super_admin" ? "default" : "secondary"}>{humanize(user.role)}</Badge></TableCell>
                  <TableCell>
                    <p className="text-sm">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email_verified ? "Verified" : "Not verified"}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditor("user", user)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => digify.admin.updateUser(user.id, { email_verified: !user.email_verified }).then(() => invalidate(queryKeys.users))}>
                          <CheckCircle2 className="h-4 w-4" /> Toggle verification
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={user.id === authUser?.id}
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ kind: "user", id: user.id, label: user.email })}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredUsers.length && <div className="p-6"><EmptyState title="No users found" /></div>}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <form onSubmit={saveSettings} className="space-y-6">
      <SectionHeader
        title="Site CMS"
        description="Customize brand text, publishing rules, and the employer-facing company and job forms."
        action={
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Save Settings
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Brand and homepage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Brand name">
              <Input value={settingsForm.brand_name} onChange={(event) => setSettingsForm({ ...settingsForm, brand_name: event.target.value })} />
            </Field>
            <Field label="Hero eyebrow">
              <Input value={settingsForm.hero_eyebrow} onChange={(event) => setSettingsForm({ ...settingsForm, hero_eyebrow: event.target.value })} />
            </Field>
            <Field label="Hero title">
              <Input value={settingsForm.hero_title} onChange={(event) => setSettingsForm({ ...settingsForm, hero_title: event.target.value })} />
            </Field>
            <Field label="Hero highlight">
              <Input value={settingsForm.hero_highlight} onChange={(event) => setSettingsForm({ ...settingsForm, hero_highlight: event.target.value })} />
            </Field>
            <Field label="Hero subtitle">
              <Textarea className="min-h-24" value={settingsForm.hero_subtitle} onChange={(event) => setSettingsForm({ ...settingsForm, hero_subtitle: event.target.value })} />
            </Field>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Contact and rules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Contact email">
              <Input type="email" value={settingsForm.contact_email} onChange={(event) => setSettingsForm({ ...settingsForm, contact_email: event.target.value })} />
            </Field>
            <Field label="Contact phone">
              <Input value={settingsForm.contact_phone} onChange={(event) => setSettingsForm({ ...settingsForm, contact_phone: event.target.value })} />
            </Field>
            <Field label="Office location">
              <Input value={settingsForm.office_location} onChange={(event) => setSettingsForm({ ...settingsForm, office_location: event.target.value })} />
            </Field>
            <Field label="Footer blurb">
              <Textarea className="min-h-24" value={settingsForm.footer_blurb} onChange={(event) => setSettingsForm({ ...settingsForm, footer_blurb: event.target.value })} />
            </Field>
            <Separator />
            <div className="space-y-3">
              {[
                ["featured_jobs_enabled", "Featured jobs enabled"],
                ["employer_approval_required", "Employer approval required"],
                ["job_approval_required", "Job approval required"],
              ].map(([field, label]) => (
                <div key={field} className="flex items-center justify-between gap-4">
                  <Label>{label}</Label>
                  <Switch checked={Boolean(settingsForm[field])} onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, [field]: checked })} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FieldControlMatrix
          title="Employer Company Form"
          description="Show, hide, and require fields for the employer company profile form."
          groups={COMPANY_FIELD_GROUPS}
          value={settingsForm.employer_company_form_config}
          onToggle={(fieldKey, updates) => updateSettingsFieldControl("employer_company_form_config", fieldKey, updates)}
        />

        <FieldControlMatrix
          title="Employer Job Post Form"
          description="Control which vacancy fields employers can see when they create or edit jobs."
          groups={JOB_FIELD_GROUPS}
          value={settingsForm.employer_job_form_config}
          onToggle={(fieldKey, updates) => updateSettingsFieldControl("employer_job_form_config", fieldKey, updates)}
        />
      </div>
    </form>
  );

  const renderEditorFields = () => {
    if (!editor) return null;

    if (editor.entity === "job") {
      const requiredKeys = new Set(["title", "description", "location"]);
      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Select value={editor.form.employer_id || "manual"} onValueChange={(value) => {
                const employer = employers.find((item) => item.id === value);
                updateEditor("employer_id", value === "manual" ? "" : value);
                updateEditor("company_name", employer?.company_name || editor.form.company_name);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Direct listing</SelectItem>
                  {employers.map((employer) => <SelectItem key={employer.id} value={employer.id}>{employer.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Company name"><Input required value={editor.form.company_name} onChange={(event) => updateEditor("company_name", event.target.value)} /></Field>
          </div>

          {JOB_FIELD_GROUPS.map((group) => (
            <section key={group.id} className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={editor.form[field.key]}
                    onChange={(value) => updateEditor(field.key, value)}
                    required={requiredKeys.has(field.key)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      );
    }

    if (editor.entity === "employer") {
      const requiredKeys = new Set(["company_name", "first_name", "last_name"]);
      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" className="sm:col-span-2">
              <Input type="email" value={editor.form.user_email} onChange={(event) => updateEditor("user_email", event.target.value)} />
            </Field>
          </div>

          {COMPANY_FIELD_GROUPS.map((group) => (
            <section key={group.id} className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <FormFieldRenderer
                    key={field.key}
                    field={field}
                    value={editor.form[field.key]}
                    onChange={(value) => updateEditor(field.key, value)}
                    required={requiredKeys.has(field.key)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      );
    }

    if (editor.entity === "employee") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input required value={editor.form.first_name} onChange={(event) => updateEditor("first_name", event.target.value)} /></Field>
          <Field label="Last name"><Input required value={editor.form.last_name} onChange={(event) => updateEditor("last_name", event.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={editor.form.user_email} onChange={(event) => updateEditor("user_email", event.target.value)} /></Field>
          <Field label="Phone"><Input value={editor.form.phone} onChange={(event) => updateEditor("phone", event.target.value)} /></Field>
          <Field label="Current title"><Input value={editor.form.title} onChange={(event) => updateEditor("title", event.target.value)} /></Field>
          <Field label="Location"><Input value={editor.form.location} onChange={(event) => updateEditor("location", event.target.value)} /></Field>
          <Field label="Desired job type">
            <Select value={editor.form.desired_job_type} onValueChange={(value) => updateEditor("desired_job_type", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{jobTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Availability">
            <Select value={editor.form.availability} onValueChange={(value) => updateEditor("availability", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Immediately</SelectItem>
                <SelectItem value="two_weeks">Two weeks</SelectItem>
                <SelectItem value="one_month">One month</SelectItem>
                <SelectItem value="negotiable">Negotiable</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Skills" className="sm:col-span-2"><Input value={editor.form.skills} onChange={(event) => updateEditor("skills", event.target.value)} /></Field>
          <Field label="Bio" className="sm:col-span-2"><Textarea className="min-h-28" value={editor.form.bio} onChange={(event) => updateEditor("bio", event.target.value)} /></Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Profile complete</Label>
            <Switch checked={editor.form.profile_completed} onCheckedChange={(checked) => updateEditor("profile_completed", checked)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Searchable</Label>
            <Switch checked={editor.form.is_searchable} onCheckedChange={(checked) => updateEditor("is_searchable", checked)} />
          </div>
        </div>
      );
    }

    if (editor.entity === "user") {
      return (
        <div className="grid gap-4">
          <Field label="Full name"><Input required value={editor.form.full_name} onChange={(event) => updateEditor("full_name", event.target.value)} /></Field>
          <Field label="Email"><Input required disabled={editor.mode === "edit"} type="email" value={editor.form.email} onChange={(event) => updateEditor("email", event.target.value)} /></Field>
          <Field label="Role">
            <Select value={editor.form.role} onValueChange={(value) => updateEditor("role", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="employer">Employer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={editor.mode === "edit" ? "New password" : "Password"}>
            <Input type="password" required={editor.mode === "create"} value={editor.form.password} onChange={(event) => updateEditor("password", event.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Email verified</Label>
            <Switch checked={editor.form.email_verified} onCheckedChange={(checked) => updateEditor("email_verified", checked)} />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderActiveSection = () => ({
    overview: renderOverview,
    jobs: renderJobs,
    employers: renderEmployers,
    employees: renderEmployees,
    applications: renderApplications,
    messages: renderMessages,
    payments: renderPayments,
    users: renderUsers,
    settings: renderSettings,
  }[activeSection]?.());

  if (checkingAuth || dataLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const navCounts = {
    jobs: stats.pendingJobs,
    employers: stats.pendingEmployers,
    messages: stats.newMessages,
    applications: applications.length,
    payments: payments.length,
    users: users.length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Super Admin CMS</h1>
              <p className="text-xs text-muted-foreground">JobsDirect operations dashboard</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search current workspace" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{humanize(authUser?.role)}</Badge>
              <Button variant="outline" size="sm" onClick={() => digify.auth.logout("/")}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="border-b bg-background lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r">
          <div className="sticky top-16 space-y-6 p-4">
            <nav className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex h-10 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {navCounts[item.id] ? (
                      <Badge variant={isActive ? "secondary" : "outline"} className="h-5 px-1.5 text-[10px]">
                        {navCounts[item.id]}
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </nav>
            <Separator />
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Signed in as</p>
              <p className="mt-2 truncate text-sm font-medium">{authUser?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{authUser?.email}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderActiveSection()}</div>
        </main>
      </div>

      <Sheet open={!!editor} onOpenChange={(open) => { if (!open) setEditor(null); }}>
        <SheetContent className="w-full p-0 sm:max-w-2xl">
          <form onSubmit={saveEditor} className="flex h-full flex-col">
            <SheetHeader className="border-b p-6">
              <SheetTitle>{editor?.mode === "edit" ? "Edit" : "Create"} {humanize(editor?.entity)}</SheetTitle>
              <SheetDescription>Changes are saved directly to the CMS store.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-6">{renderEditorFields()}</div>
            </ScrollArea>
            <SheetFooter className="border-t p-4">
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.label ? `"${deleteDialog.label}" will be removed from the CMS.` : "This record will be removed from the CMS."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete} disabled={saving}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
