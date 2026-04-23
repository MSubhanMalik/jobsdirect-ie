import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Building2, KeyRound, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { digify } from '@/api/digifyClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 8.6-4.8 8.6-7.3 0-.5-.1-.9-.1-1.3H12Z" />
      <path fill="#34A853" d="M2.8 11.8c0 1.7.4 3.3 1.3 4.7l3.2-2.5c-.2-.6-.4-1.3-.4-2.2s.1-1.5.4-2.2L4.1 7.1C3.2 8.5 2.8 10.1 2.8 11.8Z" />
      <path fill="#FBBC05" d="M12 21c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.8.6-1.9 1-3.4 1-2.5 0-4.6-1.7-5.4-4l-3.3 2.5C5.1 18.9 8.3 21 12 21Z" />
      <path fill="#4285F4" d="M20.6 12.4c0-.6-.1-1.1-.2-1.6H12v3.9h4.8c-.2 1-.8 2-1.5 2.7l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7.4Z" />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(
    () => new URLSearchParams(location.search).get('redirect') || '/dashboard',
    [location.search]
  );
  const initialResetToken = useMemo(
    () => new URLSearchParams(location.search).get('token') || '',
    [location.search]
  );

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'employee',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({
    token: initialResetToken,
    password: '',
  });
  const [verifyForm, setVerifyForm] = useState({
    email: '',
    code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const ensureDashboardProfile = async (verifiedUser) => {
    const nameParts = String(verifiedUser?.full_name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    if (verifiedUser?.role === 'employer') {
      const employers = await digify.entities.Employer.filter({ user_email: verifiedUser.email });
      if (employers.length === 0) {
        await digify.entities.Employer.create({
          user_email: verifiedUser.email,
          first_name: firstName,
          last_name: lastName,
          company_name: '',
          phone: '',
          verification_status: 'draft',
          admin_review_note: '',
        });
      }
      return;
    }

    if (verifiedUser?.role === 'employee') {
      const employees = await digify.entities.Employee.filter({ user_email: verifiedUser.email });
      if (employees.length === 0) {
        await digify.entities.Employee.create({
          user_email: verifiedUser.email,
          first_name: firstName,
          last_name: lastName,
          phone: '',
          profile_completed: false,
        });
      }
    }
  };

  const title =
    mode === 'register-role'
      ? 'Choose your account type'
      : mode === 'register'
      ? `Create your ${form.role === 'employer' ? 'employer' : 'job seeker'} account`
      : mode === 'forgot'
        ? 'Recover your account'
        : mode === 'reset'
          ? 'Set a new password'
          : mode === 'verify'
            ? 'Verify your email'
          : 'Welcome to JobsDirect.ie';

  const subtitle =
    mode === 'register-role'
      ? 'How would you like to use the platform?'
      : mode === 'register'
      ? 'Sign up to continue'
      : mode === 'forgot'
        ? 'Generate a reset token to continue'
        : mode === 'reset'
          ? 'Use your token to continue'
          : mode === 'verify'
            ? 'Enter the 6-digit code sent to your email'
          : 'Sign in to continue';

  const isRoleStep = mode === 'register-role';
  const isWideCard = isRoleStep;
  const cardMaxWidth = isWideCard ? 'max-w-4xl' : 'max-w-md';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'register') {
        const result = await digify.auth.register(form);
        setVerifyForm({ email: result.email || form.email, code: '' });
        setInfo(
          result.demo_verification_code
            ? `Verification code sent. Demo code: ${result.demo_verification_code}`
            : result.message || 'Verification code sent to your email.'
        );
        setMode('verify');
        return;
      }

      if (mode === 'login') {
        await digify.auth.login(form);
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === 'verify') {
        const verifiedUser = await digify.auth.verifyEmail(verifyForm);
        await ensureDashboardProfile(verifiedUser);
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === 'forgot') {
        const result = await digify.auth.forgotPassword({ email: forgotEmail });
        setInfo(
          result.reset_token
            ? `Reset token generated: ${result.reset_token}`
            : result.message || 'Reset instructions generated.'
        );
        setResetForm((current) => ({
          ...current,
          token: result.reset_token || current.token,
          password: '',
        }));
        setMode('reset');
        return;
      }

      await digify.auth.resetPassword(resetForm);
      setInfo('Password reset successful. You can now sign in.');
      setResetForm((current) => ({ ...current, password: '' }));
      setForm((current) => ({ ...current, password: '' }));
      setMode('login');
    } catch (err) {
      if (mode === 'login' && err.code === 'EMAIL_NOT_VERIFIED') {
        setVerifyForm({ email: err.email || form.email, code: '' });
        setInfo('Please verify your email to activate your account.');
        setMode('verify');
        return;
      }
      setError(err.message || 'Unable to continue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fefefe_0%,#eef4fb_45%,#dfeaf7_100%)] px-3 py-3 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-slate-200/35 blur-3xl" />
      </div>

      <div className={`relative mx-auto flex min-h-[calc(100vh-1.5rem)] ${cardMaxWidth} items-center justify-center`}>
        <Card className="w-full rounded-[22px] border border-white/70 bg-white/95 shadow-[0_18px_54px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:rounded-[24px]">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className={`mx-auto ${isWideCard ? 'max-w-4xl' : 'max-w-[27rem]'}`}>
              <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle,#fff7e8_0%,#fffcf4_55%,#ffffff_100%)] shadow-[0_8px_20px_rgba(15,23,42,0.05)] sm:h-[4.5rem] sm:w-[4.5rem]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-inner sm:h-11 sm:w-11">
                    <Briefcase className="h-6 w-6 text-emerald-700" strokeWidth={1.8} />
                  </div>
                </div>

                <h1 className={`font-display font-bold tracking-tight text-slate-950 ${isRoleStep ? 'text-[1.35rem] leading-[1.02] sm:text-[1.65rem] lg:text-[1.85rem]' : 'text-[1.45rem] leading-[1] sm:text-[1.8rem] lg:text-[2rem]'}`}>
                  {title}
                </h1>
                <p className={`mt-2 max-w-xl font-medium text-slate-500 ${isRoleStep ? 'text-sm sm:text-[0.95rem]' : 'text-sm sm:text-base'}`}>{subtitle}</p>
              </div>

              {(mode === 'login' || mode === 'register' || mode === 'register-role') && (
                <>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 sm:h-13 sm:text-base"
                  >
                    <GoogleMark />
                    Continue with Google
                  </button>

                  <div className="my-4 flex items-center gap-3 sm:my-5">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold tracking-[0.24em] text-slate-400 sm:text-sm">OR</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </>
              )}

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                {mode === 'register-role' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="group rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] sm:p-5"
                      onClick={() => {
                        setForm((current) => ({ ...current, role: 'employer' }));
                        setMode('register');
                      }}
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-slate-200/80 sm:h-14 sm:w-14">
                        <Building2 className="h-6 w-6 text-slate-700 sm:h-7 sm:w-7" />
                      </div>
                      <p className="text-base font-semibold text-slate-950 sm:text-lg">I'm an Employer</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">Post jobs, build a verified company profile, and unlock hiring tools after approval.</p>
                    </button>

                    <button
                      type="button"
                      className="group rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6fffb_100%)] p-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] sm:p-5"
                      onClick={() => {
                        setForm((current) => ({ ...current, role: 'employee' }));
                        setMode('register');
                      }}
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition group-hover:bg-emerald-100 sm:h-14 sm:w-14">
                        <User className="h-6 w-6 text-emerald-700 sm:h-7 sm:w-7" />
                      </div>
                      <p className="text-base font-semibold text-slate-950 sm:text-lg">I'm a Job Seeker</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">Create your profile, apply for roles, and manage your applications from one place.</p>
                    </button>
                  </div>
                )}

                {(mode === 'login' || mode === 'register') && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 sm:h-13 sm:text-base"
                        required
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'register') && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Enter your password"
                        className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 sm:h-13 sm:text-base"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                      Selected role
                    </Label>
                    <div className="flex h-12 items-center justify-between rounded-[14px] border border-slate-200 bg-slate-50 px-4 sm:h-13">
                      <span className="text-sm font-medium text-slate-700 sm:text-base">{form.role === 'employer' ? 'Employer' : 'Job Seeker'}</span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
                        onClick={() => setMode('register-role')}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="verifyEmail" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="verifyEmail"
                          type="email"
                          value={verifyForm.email}
                          onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })}
                          className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-sm sm:h-13 sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verifyCode" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                        6-Digit Code
                      </Label>
                      <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="verifyCode"
                          inputMode="numeric"
                          maxLength={6}
                          value={verifyForm.code}
                          onChange={(e) => setVerifyForm({ ...verifyForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          placeholder="Enter code"
                          className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-center text-base tracking-[0.24em] placeholder:tracking-normal sm:h-13 sm:text-lg sm:tracking-[0.32em]"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 sm:h-13 sm:text-base"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'reset' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="resetToken" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                        Reset Token
                      </Label>
                      <Input
                        id="resetToken"
                        value={resetForm.token}
                        onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })}
                        placeholder="Paste your reset token"
                        className="h-12 rounded-[14px] border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 sm:h-13 sm:text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resetPassword" className="block text-center text-base font-semibold text-slate-700 sm:text-lg">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="resetPassword"
                          type="password"
                          value={resetForm.password}
                          onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                          placeholder="Enter a new password"
                          className="h-12 rounded-[14px] border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 sm:h-13 sm:text-base"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {info && (
                  <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{info}</span>
                  </div>
                )}

                {mode !== 'register-role' && (
                  <Button
                    className="h-12 w-full rounded-[14px] bg-slate-950 text-base font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition hover:bg-slate-800 sm:h-13 sm:text-lg"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Please wait...'
                      : mode === 'register'
                        ? 'Create account'
                        : mode === 'verify'
                          ? 'Verify email'
                        : mode === 'forgot'
                          ? 'Generate reset token'
                          : mode === 'reset'
                            ? 'Update password'
                            : 'Sign in'}
                  </Button>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-slate-500">
                  {mode === 'login' && (
                    <>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={() => {
                          setMode('forgot');
                          setError('');
                          setInfo('');
                          setForgotEmail(form.email);
                        }}
                      >
                        Forgot password?
                      </button>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={() => {
                          setMode('register-role');
                          setError('');
                          setInfo('');
                        }}
                      >
                        Need an account? <span className="font-semibold text-slate-800">Sign up</span>
                      </button>
                    </>
                  )}

                  {mode === 'register-role' && (
                    <button
                      type="button"
                      className="ml-auto font-medium hover:text-slate-800"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setInfo('');
                      }}
                    >
                      Already have an account? <span className="font-semibold text-slate-800">Sign in</span>
                    </button>
                  )}

                  {mode === 'register' && (
                    <>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={() => {
                          setMode('register-role');
                          setError('');
                          setInfo('');
                        }}
                      >
                        Back to role selection
                      </button>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setInfo('');
                        }}
                      >
                        Already have an account? <span className="font-semibold text-slate-800">Sign in</span>
                      </button>
                    </>
                  )}

                  {mode === 'verify' && (
                    <>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={async () => {
                          setSubmitting(true);
                          setError('');
                          try {
                            const result = await digify.auth.resendVerification({ email: verifyForm.email });
                            setInfo(
                              result.demo_verification_code
                                ? `New verification code sent. Demo code: ${result.demo_verification_code}`
                                : result.message || 'A new verification code has been sent.'
                            );
                          } catch (err) {
                            setError(err.message || 'Unable to resend the verification code.');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        className="font-medium hover:text-slate-800"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setInfo('');
                          setForm((current) => ({ ...current, email: verifyForm.email }));
                        }}
                      >
                        Back to sign in
                      </button>
                    </>
                  )}

                  {mode === 'forgot' && (
                    <button
                      type="button"
                      className="ml-auto font-medium hover:text-slate-800"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setInfo('');
                      }}
                    >
                      Back to sign in
                    </button>
                  )}

                  {mode === 'reset' && (
                    <button
                      type="button"
                      className="ml-auto font-medium hover:text-slate-800"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setInfo('');
                      }}
                    >
                      Return to sign in
                    </button>
                  )}
                </div>
              </form>

              <p className="mt-5 text-center text-[11px] leading-5 text-slate-400 sm:mt-6 sm:text-xs">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="font-medium text-slate-700 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-slate-700 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
