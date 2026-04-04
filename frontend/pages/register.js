import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { AuthShell } from '../components/layout/AuthShell';
import { Button, Card, InputGroup, ProgressBar, TextInput } from '../components/ui/primitives';
import { useToast } from '../components/ui/toast';
import { api } from '../lib/api';
import { setAuth } from '../lib/auth';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 35;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return Math.min(score, 100);
}

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      const message = 'Passwords do not match';
      setError(message);
      toast({ type: 'error', title: 'Check your password', message });
      return;
    }

    if (form.password.length < 6) {
      const message = 'Password must be at least 6 characters';
      setError(message);
      toast({ type: 'error', title: 'Password too short', message });
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setAuth(token, user);
      toast({
        title: 'Account created',
        message: 'Your dashboard is ready.',
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      toast({
        type: 'error',
        title: 'Registration failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Bring trips, apartments, and every shared payment into one polished dashboard. The experience looks new, but every backend endpoint and calculation stays exactly where it is."
    >
      <Card className="p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Create account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Start using SplitMint AI</h1>
          <p className="mt-2 text-sm text-slate-500">A clean setup flow for a cleaner shared money experience.</p>
        </div>

        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputGroup label="Full name">
            <TextInput
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </InputGroup>

          <InputGroup label="Email address">
            <TextInput
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </InputGroup>

          <InputGroup label="Password" hint="At least 6 characters">
            <TextInput
              id="reg-password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </InputGroup>

          <div className="rounded-md border border-border bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Password strength</span>
              <span>{passwordStrength}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={passwordStrength}
                tone={passwordStrength >= 70 ? 'emerald' : passwordStrength >= 40 ? 'violet' : 'rose'}
              />
            </div>
          </div>

          <InputGroup label="Confirm password">
            <TextInput
              id="reg-confirm"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={(event) => setForm({ ...form, confirm: event.target.value })}
              required
            />
          </InputGroup>

          <Button id="reg-submit" type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
