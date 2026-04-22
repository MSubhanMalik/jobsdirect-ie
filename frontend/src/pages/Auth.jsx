import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Briefcase, Building2, ShieldCheck, UserRound } from 'lucide-react';
import { digify } from '@/api/digifyClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => new URLSearchParams(location.search).get('redirect') || '/dashboard', [location.search]);

  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const heading = form.role === 'employer' ? 'Employer access' : form.role === 'admin' ? 'Admin access' : 'Candidate access';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') {
        await digify.auth.register(form);
      } else {
        await digify.auth.login(form);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to continue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-accent/20 text-accent border-0 mb-5">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                JobsDirect.ie Access
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight mb-4">
                Continue your hiring or job search journey.
              </h1>
              <p className="text-primary-foreground/75 text-lg max-w-xl mb-8">
                Sign in or create your JobsDirect.ie account with secure email and password access.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-primary-foreground/5 border-primary-foreground/10 shadow-none"><CardContent className="p-5"><Building2 className="w-5 h-5 text-accent mb-3" /><h3 className="font-semibold mb-1">For Employers</h3><p className="text-sm text-primary-foreground/70">Post roles, manage listings, and review applications.</p></CardContent></Card>
                <Card className="bg-primary-foreground/5 border-primary-foreground/10 shadow-none"><CardContent className="p-5"><UserRound className="w-5 h-5 text-accent mb-3" /><h3 className="font-semibold mb-1">For Employees</h3><p className="text-sm text-primary-foreground/70">Build your profile and apply to jobs across Ireland.</p></CardContent></Card>
                <Card className="bg-primary-foreground/5 border-primary-foreground/10 shadow-none"><CardContent className="p-5"><ShieldCheck className="w-5 h-5 text-accent mb-3" /><h3 className="font-semibold mb-1">Admin Access</h3><p className="text-sm text-primary-foreground/70">Moderate jobs, employers, and platform activity.</p></CardContent></Card>
              </div>
            </div>

            <Card className="border-border/50 shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary-foreground" /></div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">JobsDirect.ie</p>
                    <h2 className="text-2xl font-display font-bold">{heading}</h2>
                  </div>
                </div>

                <Tabs value={mode} onValueChange={setMode} className="w-full mb-6">
                  <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="register">Register</TabsTrigger><TabsTrigger value="login">Login</TabsTrigger></TabsList>
                  <TabsContent value="register" className="mt-4 text-sm text-muted-foreground">Create a real account to continue into the same employer or candidate flow.</TabsContent>
                  <TabsContent value="login" className="mt-4 text-sm text-muted-foreground">Use your existing email and password to return to your dashboard.</TabsContent>
                </Tabs>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" required />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required minLength={6} />
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-2">
                      <Label htmlFor="role">I am joining as</Label>
                      <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                        <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Job Seeker</SelectItem>
                          <SelectItem value="employer">Employer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5" /> <span>{error}</span></div>}

                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" type="submit" disabled={submitting}>
                    {submitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Login to Dashboard'}
                    {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </form>

                <div className="mt-5 rounded-xl bg-muted/60 border border-border/60 p-4 text-sm text-muted-foreground space-y-1">
                  <div><span className="font-semibold text-foreground">Admin:</span> admin@jobsdirect.ie / Admin123!</div>
                  <div><span className="font-semibold text-foreground">Employer:</span> sarah.murphy@lumenlabs.ie / Employer123!</div>
                  <div><span className="font-semibold text-foreground">Employee:</span> liam.oconnor@gmail.com / Employee123!</div>
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  By continuing, you agree to the platform terms and privacy policy for JobsDirect.ie. <Link to="/terms" className="text-primary font-medium hover:underline">Terms</Link> · <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy</Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
