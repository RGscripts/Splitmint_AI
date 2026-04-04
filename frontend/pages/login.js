import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { AuthShell } from '../components/layout/AuthShell';
import { Button, Card, InputGroup, TextInput } from '../components/ui/primitives';
import { CheckCircleIcon, SearchIcon } from '../components/ui/icons';
import { useToast } from '../components/ui/toast';
import { api } from '../lib/api';
import { setAuth } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user } = await api.post('/auth/login', form);
      setAuth(token, user);
      toast({
        title: 'Welcome back',
        message: 'Your workspace is ready.',
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      toast({
        type: 'error',
        title: 'Sign in failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="SplitMint AI gives shared money a calmer home, with clean group dashboards, dependable balances, and an AI assistant that feels built into the product instead of bolted on."
    >
      <Card className="p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in to your workspace</h1>
          <p className="mt-2 text-sm text-slate-500">Pick up where your last expense left off.</p>
        </div>


        {error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputGroup label="Email address" icon={SearchIcon}>
            <TextInput
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              icon
            />
          </InputGroup>

          <InputGroup label="Password">
            <TextInput
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </InputGroup>

          <Button id="login-submit" type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{' '}
          <Link href="/register" className="font-medium text-primary">
            Create your account
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
