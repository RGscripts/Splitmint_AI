import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/layout/AppShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  InputGroup,
  LoadingScreen,
  Modal,
  Pill,
  ProgressBar,
  SectionHeader,
  StatCard,
  TextInput,
  formatCompactCurrency,
} from '../components/ui/primitives';
import {
  AnalyticsIcon,
  BoltIcon,
  BrainIcon,
  CurrencyIcon,
  GroupIcon,
  PieChartIcon,
  PlusIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
} from '../components/ui/icons';
import { useToast } from '../components/ui/toast';
import { api } from '../lib/api';
import { clearAuth, getUser, isLoggedIn } from '../lib/auth';

function GroupCard({ group, onOpen }) {
  const expensesCount = group._count?.expenses ?? 0;
  const participants = group.participants || [];
  const visibleParticipants = participants.slice(0, 4);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left"
    >
      <Card className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-border bg-slate-100 text-base font-semibold text-slate-700">
              {group.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900">{group.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {participants.length} member{participants.length !== 1 ? 's' : ''} · {expensesCount} expense{expensesCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Badge>{expensesCount} logs</Badge>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex -space-x-3">
            {visibleParticipants.map((participant) => (
              <div key={participant.id} className="rounded-full ring-2 ring-white">
                <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={40} />
              </div>
            ))}
            {participants.length > 4 ? (
              <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-slate-50 text-xs font-medium text-slate-600 ring-2 ring-white">
                +{participants.length - 4}
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium text-slate-700">Ready to split</p>
          </div>
        </div>
      </Card>
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeNav, setActiveNav] = useState('dashboard');

  const dashboardRef = useRef(null);
  const groupsRef = useRef(null);
  const analyticsRef = useRef(null);
  const mintsenseRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    setUser(getUser());
    loadData();
  }, [router]);

  async function loadData() {
    setLoading(true);
    try {
      const [groupResponse, summaryResponse] = await Promise.all([
        api.get('/groups'),
        api.post('/ai/summary', {}),
      ]);
      setGroups(groupResponse.groups || []);
      setAiSummary(summaryResponse.summary || null);
    } catch (err) {
      if (err.status === 401) {
        clearAuth();
        router.replace('/login');
      } else {
        toast({ type: 'error', title: 'Dashboard unavailable', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    if (!newGroupName.trim()) return;

    setCreating(true);
    setError('');
    try {
      await api.post('/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      setShowCreate(false);
      toast({ title: 'Group created', message: `${newGroupName.trim()} is ready for expenses.` });
      loadData();
    } catch (err) {
      setError(err.message);
      toast({ type: 'error', title: 'Could not create group', message: err.message });
    } finally {
      setCreating(false);
    }
  }

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  function handleNavChange(key) {
    setActiveNav(key);
    const sectionMap = {
      dashboard: dashboardRef.current,
      groups: groupsRef.current,
      analytics: analyticsRef.current,
      mintsense: mintsenseRef.current,
    };
    sectionMap[key]?.scrollIntoView({ block: 'start' });
  }

  const topCategory = useMemo(() => {
    return Object.entries(aiSummary?.categoryBreakdown || {}).sort((a, b) => b[1] - a[1])[0] || null;
  }, [aiSummary]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = Object.entries(aiSummary?.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
    const total = breakdown.reduce((sum, [, amount]) => sum + Number(amount || 0), 0);
    return breakdown.map(([name, amount]) => ({
      name,
      amount,
      percent: total ? (amount / total) * 100 : 0,
    }));
  }, [aiSummary]);

  if (loading) {
    return <LoadingScreen label="Loading your dashboard" />;
  }

  return (
    <>
      <Head>
        <title>Dashboard | SplitMint AI</title>
      </Head>

      <AppShell
        activeNav={activeNav}
        onNavChange={handleNavChange}
        user={user}
        // title="Financial clarity for every shared moment"
        // subtitle="Review groups, track spending trends, and surface AI-ready insights in one polished workspace."
        onLogout={logout}
      >
        <section ref={dashboardRef} className="space-y-6">
          <SectionHeader
            eyebrow="Overview"
            title="Your shared expense command center"
            // description="The numbers below still come from your existing APIs and business logic. They just have a cleaner visual hierarchy now."
          />

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon={CurrencyIcon} label="Total spent" value={formatCompactCurrency(aiSummary?.totalSpent || 0)} subtext="Last 30 days" tone="accent" />
            <StatCard icon={GroupIcon} label="Active groups" value={groups.length} subtext="All your shared circles" />
            <StatCard icon={ReceiptIcon} label="Expense count" value={aiSummary?.expenseCount || 0} subtext="Last 30 days" />
            <StatCard icon={PieChartIcon} label="Top category" value={topCategory?.[0] || 'No data'} subtext={topCategory ? formatCompactCurrency(topCategory[1]) : 'Waiting on first expense'} tone="success" />
          </div>
        </section>

        <section ref={groupsRef} className="space-y-6">
          <SectionHeader
            eyebrow="Groups"
            title="Every group, ready for action"
            // description="A more recruiter-friendly presentation for your live data, with member previews and clearer hierarchy."
            action={(
              <Button icon={PlusIcon} onClick={() => setShowCreate(true)}>
                Create group
              </Button>
            )}
          />

          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">No groups yet. Create your first group.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} onOpen={() => router.push(`/groups/${group.id}`)} />
              ))}
            </div>
          )}
        </section>

        <section ref={analyticsRef} className="space-y-6">
          <SectionHeader
            eyebrow="Analytics"
            title="Spending distribution at a glance"
            // description="Simple visual analytics, no logic changes. Category distribution and activity summaries are driven by your existing AI summary endpoint."
          />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Category mix</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Where money is going</h3>
                </div>
                <AnalyticsIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="mt-6 space-y-4">
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">Add expenses to unlock category insights.</p>
                ) : (
                  categoryBreakdown.map((item, index) => (
                    <div key={item.name} className="rounded-md border border-border bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatCompactCurrency(item.amount)}</p>
                        </div>
                        <Badge>{Math.round(item.percent)}%</Badge>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={item.percent} tone={index % 2 === 0 ? 'violet' : 'emerald'} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Operational snapshot</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Product-style health checks</h3>
                </div>
                <BoltIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-md border border-border bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Average expenses per group</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {groups.length ? ((aiSummary?.expenseCount || 0) / groups.length).toFixed(1) : '0.0'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Based on the current 30-day dashboard data.</p>
                </div>
                <div className="rounded-md border border-border bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Most valuable signal</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{topCategory?.[0] || 'Waiting on data'}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {topCategory ? `${formatCompactCurrency(topCategory[1])} contributed the strongest category signal.` : 'As soon as expenses appear, this card will update.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section ref={mintsenseRef} className="space-y-6">
          <SectionHeader
            eyebrow="MintSense"
            title="AI summaries that feel built into the dashboard"
            // description="The UI is upgraded here too, but your existing `ai/summary` feature remains the source of truth."
          />

          <div className="mx-auto max-w-[860px]">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">AI insight stream</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">What MintSense is noticing</h3>
                </div>
                <SparklesIcon className="h-6 w-6 text-slate-500" />
              </div>
              <div className="mt-6 space-y-3">
                {aiSummary?.insights?.length ? (
                  aiSummary.insights.map((insight, index) => (
                    <div key={`${insight}-${index}`} className="rounded-md border border-border bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md border border-border bg-white p-2 text-slate-500">
                          <SparklesIcon className="h-4 w-4" />
                        </div>
                        <p className="leading-6">{insight}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">MintSense will start surfacing insights once your data has enough history.</p>
                )}
              </div>
            </Card>
          </div>
        </section>
      </AppShell>

      {showCreate ? (
        <Modal
          title="Create a new group"
          description="Give the group a clear name now. All existing backend constraints and participant limits still apply."
          onClose={() => {
            setShowCreate(false);
            setError('');
          }}
          maxWidth="max-w-lg"
        >
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <form onSubmit={createGroup} className="space-y-5">
            <InputGroup label="Group name" hint="Examples: Goa Trip, Flatmates, Team Dinner">
              <TextInput
                id="new-group-name"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder="Enter group name"
                autoFocus
                required
              />
            </InputGroup>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button id="create-group-submit" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create group'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
