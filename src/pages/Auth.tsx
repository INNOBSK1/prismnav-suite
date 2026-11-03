import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GoogleTranslate } from '@/components/GoogleTranslate';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import landscape from '@/assets/green-horizon.jpg';
import { lovable } from '@/integrations/lovable/index';
import { useTermsHtml, termsArticleCls } from '@/components/TermsText';
import logoAsset from '@/assets/nimalunda-login-logo.asset.json';
import { canCreateAccount } from '@/lib/signup-agreement';

const BRAND = 'NIMALUNDA';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72),
  fullName: z.string().trim().max(100).optional(),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const termsHtml = useTermsHtml();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const type = e.data?.type;
      if (type === 'termsAccepted') {
        setTermsRead(true);
        setAgreed(true);
        setTermsOpen(false);
        toast.success('Thanks — you agreed to the Terms & Policies.');
      } else if (type === 'termsDeclined') {
        setAgreed(false);
        setTermsOpen(false);
        toast.error('You must accept the Terms & Policies to create an account.');
      } else if (type === 'termsClosed') {
        setTermsOpen(false);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = authSchema.safeParse({ email, password });
    if (!v.success) return toast.error(v.error.errors[0].message);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) toast.error(error.message.includes('Invalid login credentials') ? t.auth.invalidCredentials : error.message);
      else toast.success(t.auth.signedIn);
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateAccount(termsRead, agreed)) {
      toast.error('Please read and agree to the Terms & Policies first.');
      setTermsOpen(true);
      return;
    }
    const v = authSchema.safeParse({ email, password, fullName });
    if (!v.success) return toast.error(v.error.errors[0].message);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName.trim(), terms_accepted_at: new Date().toISOString() },
        },
      });
      if (error) toast.error(error.message.includes('already registered') ? t.auth.accountExists : error.message);
      else toast.success(data.session ? t.auth.accountCreated : `${t.auth.accountCreated} Check your email to confirm.`);
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!z.string().email().safeParse(email.trim()).success) {
      toast.error('Please enter your email above first');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        toast.error(error.message);
      } else {
        await supabase.functions.invoke('send-email', {
          body: {
            to: email.trim(),
            subject: `Confirm your ${BRAND} account`,
            html: `<div style="font-family:DM Sans,Arial,sans-serif;padding:24px;color:#1b1b1b">
              <h2 style="color:#166534;margin:0 0 12px">Welcome to ${BRAND} 🌱</h2>
              <p>We just re-sent your confirmation email. Please check your inbox (and spam folder) for the link to verify your account.</p>
              <p>If you didn't request this, you can safely ignore this message.</p>
              <p style="margin-top:24px;color:#666;font-size:13px">— The ${BRAND} Team</p>
            </div>`,
          },
        });
        toast.success('Confirmation email sent! Check your inbox.');
      }
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (authMode === 'signup' && !canCreateAccount(termsRead, agreed)) {
      setTermsOpen(true);
      toast.info('Please read and agree to the Terms & Policies first.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: { prompt: 'select_account' },
      });
      if (result.error) toast.error(result.error.message || t.auth.unexpectedError);
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'h-11 rounded-md bg-muted/50 pl-10 focus-visible:ring-primary/40 border border-input text-sm placeholder:text-muted-foreground';

  const passwordField = (id: string, withPlaceholder: boolean) => (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={withPlaceholder ? t.auth.passwordPlaceholder : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${inputCls} pr-10`}
        required
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );

  const emailField = (id: string) => (
    <div className="relative">
      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="email"
        placeholder={t.auth.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
        required
      />
    </div>
  );

  return (
    <div className="dark auth-page relative isolate text-foreground h-dvh w-full overflow-y-auto bg-background">
      <img src={landscape} alt="" width={1264} height={848} className="fixed inset-0 -z-20 h-full w-full object-cover" />
      <div className="auth-backdrop fixed inset-0 -z-10" />
      <header className="flex justify-end px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 rounded-lg bg-background/90 p-1 backdrop-blur-md">
          <GoogleTranslate />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col px-5 pb-10 pt-2 sm:px-4">
        <div className="auth-frame w-full flex flex-col gap-4 rounded-lg border border-border bg-card/95 p-5 backdrop-blur-md sm:p-7">
          <div className="text-center space-y-3">
            <img src={logoAsset.url} alt="NIMALUNDA logo" className="mx-auto h-14 w-14 rounded-full ring-1 ring-primary/40" />
            <h1 translate="no" className="notranslate font-display text-3xl font-semibold text-foreground tracking-normal">{BRAND}</h1>
            <p className="text-sm text-muted-foreground">Digitally Ensuring Prosperity</p>
          </div>
          {searchParams.get('password') === 'updated' && <p role="status" className="text-center text-sm text-primary">Your password has been updated. Sign in with your new password.</p>}

          {/* Auth Tabs */}
          <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg bg-primary/10 p-0.5">
              <TabsTrigger value="signin" className="rounded-md text-sm font-medium data-[state=active]:text-primary">
                {t.auth.signIn}
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md text-sm font-medium data-[state=active]:text-primary">
                {t.auth.signUp}
              </TabsTrigger>
            </TabsList>

            {/* SIGN IN TAB */}
            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium">
                    {t.auth.emailLabel}
                  </Label>
                  {emailField('signin-email')}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">{t.auth.passwordLabel}</Label>
                    <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/forgot-password">Forgot password?</Link></Button>
                  </div>
                  {passwordField('signin-password', false)}
                </div>
                
                <Button
                  type="submit"
                  className="auth-submit h-12 w-full rounded-md font-semibold text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? t.auth.signingIn : t.auth.continueBtn}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP TAB */}
            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">
                    {t.auth.fullNameLabel}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={t.auth.fullNamePlaceholder}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    {t.auth.emailLabel}
                  </Label>
                  {emailField('signup-email')}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">
                    {t.auth.passwordLabel}
                  </Label>
                  {passwordField('signup-password', true)}
                </div>

                {/* Terms agreement */}
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                  <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(v) => {
                      if (!termsRead) {
                        toast.info('Please open and read the Terms & Policies first.');
                        setTermsOpen(true);
                        return;
                      }
                      setAgreed(v === true);
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="terms" className="leading-relaxed text-muted-foreground cursor-pointer">
                    I have read and agree to the{' '}
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => setTermsOpen(true)}
                      className="h-auto p-0 whitespace-normal text-left font-semibold"
                    >
                      Terms of Service & Policies
                    </Button>{' '}
                    of {BRAND}.
                    {!termsRead && (
                      <span className="mt-1 block text-xs">You must read them before you can agree.</span>
                    )}
                  </label>
                </div>

                <Button
                  type="submit"
                  className="auth-submit h-12 w-full rounded-md font-semibold text-sm"
                  disabled={isLoading || !canCreateAccount(termsRead, agreed)}
                >
                  {isLoading ? t.auth.creatingAccount : t.auth.createAccount}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    className="h-auto whitespace-normal p-0 text-sm"
                  >
                    Didn't receive an email? Resend confirmation
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="h-12 w-full gap-2 rounded-md border-border bg-muted/30 font-semibold" onClick={handleGoogle} disabled={isLoading || (authMode === 'signup' && !canCreateAccount(termsRead, agreed))}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          {/* Footer text */}
          <Button variant="link" className="h-auto self-center whitespace-normal text-xs text-muted-foreground" onClick={() => setTermsOpen(true)}>NIMALUNDA · Terms & Policies</Button>
        </div>
      </main>

      {/* TERMS DIALOG */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="dark bg-background text-foreground flex h-[90vh] max-w-4xl flex-col gap-3 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ShieldCheck className="h-5 w-5 text-primary" /> {BRAND} Terms & Policies
            </DialogTitle>
            <DialogDescription>
              Scroll to the end, then press Accept to continue creating your account.
            </DialogDescription>
          </DialogHeader>
          <div
            onScroll={(e) => {
              const d = e.currentTarget;
              if (d.scrollTop + d.clientHeight >= d.scrollHeight - 80) setTermsRead(true);
            }}
            className="w-full flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-card p-4 sm:p-6"
          >
            <article className={termsArticleCls} dangerouslySetInnerHTML={{ __html: termsHtml }} />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {termsRead ? 'Thank you for reading.' : 'Please scroll the full text to the end.'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setAgreed(false); setTermsOpen(false); }}>
                Decline
              </Button>
              <Button
                disabled={!termsRead}
                onClick={() => {
                  setAgreed(true);
                  setTermsOpen(false);
                  toast.success('Thanks — you agreed to the Terms & Policies.');
                }}
              >
                {termsRead ? 'I agree' : 'Scroll to the end to agree'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
