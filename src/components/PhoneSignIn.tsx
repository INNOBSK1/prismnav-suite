import { useState } from 'react';
import { Phone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const phonePattern = /^\+[1-9]\d{7,14}$/;

export function PhoneSignIn() {
  const [phone, setPhone] = useState('+256');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const p = phone.replace(/\s/g, '');
    if (!phonePattern.test(p)) return toast.error('Enter your phone with country code, e.g. +256700000000');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: p });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success('SMS code sent.');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sent) return send();
    if (!/^\d{6}$/.test(code.trim())) return toast.error('Enter the 6-digit code from the SMS.');
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s/g, ''), token: code.trim(), type: 'sms' });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const cls = 'h-11 rounded-md bg-muted/50 pl-10 text-sm';
  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className={cls} disabled={sent} />
        </div>
      </div>
      {sent && (
        <div className="space-y-2">
          <Label htmlFor="sms-code">SMS code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="sms-code" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} className={cls} />
          </div>
        </div>
      )}
      <Button type="submit" className="auth-submit h-12 w-full font-semibold" disabled={busy}>
        {sent ? 'Verify code' : 'Send SMS code'}
      </Button>
      {sent && <Button type="button" variant="link" className="w-full" onClick={() => { setSent(false); setCode(''); }}>Change number</Button>}
    </form>
  );
}
