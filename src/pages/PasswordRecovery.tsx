import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { validRecoveryCode, validNewPassword } from '@/lib/password-recovery';
import landscape from '@/assets/green-horizon.jpg';
import logoAsset from '@/assets/nimalunda-login-logo.asset.json';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastSent, setLastSent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const recoveryLink = hash.get('type') === 'recovery';
    const linkError = hash.get('error_description');
    if (linkError) setError(linkError);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStep('password');
    });
    if (recoveryLink) {
      supabase.auth.getUser().then(({ data, error: authError }) => {
        if (data.user && !authError) setStep('password');
        else setError('This reset link is invalid or expired. Request another email.');
      });
    }
    return () => subscription.unsubscribe();
  }, []);

  const sendEmail = async () => {
    if (Date.now() - lastSent < 60000) {
      setError('Please wait a minute before requesting another email.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (sendError) throw sendError;
      setLastSent(Date.now());
      setNotice('If an account uses this email, a recovery email has been requested. Check your inbox and spam folder.');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a recovery email. Please try again.');
    } finally { setBusy(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 'email') { await sendEmail(); return; }
    setError('');
    setNotice('');
    if (step === 'code' && !validRecoveryCode(code)) {
      setError('Enter the numeric code from your recovery email.');
      return;
    }
    if (step === 'password' && !validNewPassword(password, confirmation)) {
      setError('Passwords must match and contain 6–72 characters.');
      return;
    }
    setBusy(true);
    try {
      if (step === 'code') {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
        if (verifyError) throw verifyError;
        if (!data.session) throw new Error('The code could not be verified. Request another recovery email.');
        setCode('');
        setStep('password');
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        await supabase.auth.signOut();
        setPassword('');
        setConfirmation('');
        navigate('/auth?password=updated', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="dark auth-page relative isolate h-dvh overflow-y-auto bg-background text-foreground">
      <img src={landscape} alt="" className="fixed inset-0 -z-20 h-full w-full object-cover" />
      <div className="auth-backdrop fixed inset-0 -z-10" />
      <main className="mx-auto flex min-h-full max-w-md items-center px-5 py-10">
        <section className="auth-frame w-full space-y-5 rounded-lg border border-border bg-card/95 p-6 sm:p-8">
          <div className="space-y-2 text-center">
            <img src={logoAsset.url} alt="NIMALUNDA logo" className="mx-auto h-14 w-14 rounded-full" />
            <div translate="no" className="notranslate font-display text-xl">NIMALUNDA</div>
            <h1 className="font-display text-2xl tracking-normal">{step === 'password' ? 'Set a new password' : step === 'code' ? 'Check your email' : 'Forgot password?'}</h1>
          </div>
          {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
          {error && <p role="alert" className="text-sm text-foreground">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            {step === 'email' && <div className="space-y-2"><Label htmlFor="recovery-email">Account email</Label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" /></div>}
            {step === 'code' && <div className="space-y-2"><Label htmlFor="recovery-code">Reset code</Label><Input id="recovery-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} required value={code} onChange={e => setCode(e.target.value)} /><p className="text-xs text-muted-foreground">If your email contains a reset link instead, open that link to choose a new password.</p></div>}
            {step === 'password' && <><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={6} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div></>}
            <Button className="auth-submit h-11 w-full gap-2" disabled={busy}>{step === 'email' ? <Mail className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}{busy ? 'Please wait…' : step === 'email' ? 'Send recovery email' : step === 'code' ? 'Verify reset code' : 'Save new password'}</Button>
          </form>
          {step === 'code' && <div className="flex justify-between gap-3"><Button variant="link" className="h-auto p-0 text-sm" disabled={busy} onClick={sendEmail}>Resend email</Button><Button variant="link" className="h-auto p-0 text-sm" disabled={busy} onClick={() => { setStep('email'); setError(''); setNotice(''); setCode(''); }}>Change email</Button></div>}
          <Button asChild variant="link" className="h-auto gap-2 p-0"><Link to="/auth"><ArrowLeft className="h-4 w-4" />Back to sign in</Link></Button>
        </section>
      </main>
    </div>
  );
}