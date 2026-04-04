import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../../components/layout/AppShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  InputGroup,
  LoadingScreen,
  Modal,
  Pill,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  SelectInput,
  StatCard,
  TabButton,
  TextInput,
  formatCompactCurrency,
  formatCurrency,
} from '../../components/ui/primitives';
import {
  AlertIcon,
  AnalyticsIcon,
  ArrowLeftIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircleIcon,
  CurrencyIcon,
  FilterIcon,
  PencilIcon,
  PieChartIcon,
  PlusIcon,
  ReceiptIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
} from '../../components/ui/icons';
import { useToast } from '../../components/ui/toast';
import { api } from '../../lib/api';
import { clearAuth, getUser, isLoggedIn } from '../../lib/auth';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b', '#f97316', '#ec4899'];
const CATEGORIES = ['Food', 'Travel', 'Rent', 'Entertainment', 'Utilities', 'Health', 'Misc'];

function Spinner() {
  return <div className="text-sm text-slate-500">Loading...</div>;
}

function getGroupNav(tab) {
  if (tab === 'balances') return 'analytics';
  if (tab === 'mintsense') return 'mintsense';
  return 'groups';
}

function sumBy(items, key) {
  return items.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

function roundTo2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function inferSplitMode(expense) {
  if (!expense?.splits?.length) return 'equal';
  const amounts = expense.splits.map((split) => roundTo2(split.shareAmount));
  const firstAmount = amounts[0];
  return amounts.every((amount) => Math.abs(amount - firstAmount) <= 0.01) ? 'equal' : 'custom';
}

function getSelectedSplits(form) {
  return form.splits.filter((split) => split.selected);
}

function buildExpenseForm(expense, participants) {
  const today = new Date().toISOString().split('T')[0];
  const splitMode = inferSplitMode(expense);
  const amount = Number(expense?.amount || 0);
  const expenseSplits = expense?.splits || [];

  return {
    description: expense?.description || '',
    amount: expense?.amount || '',
    date: expense?.date ? expense.date.split('T')[0] : today,
    payerId: expense?.payerId || (participants[0]?.id || ''),
    category: expense?.category || 'Misc',
    splitMode,
    splits: participants.map((participant) => {
      const existingSplit = expenseSplits.find((split) => split.participantId === participant.id);
      return {
        participantId: participant.id,
        selected: expense ? Boolean(existingSplit) : true,
        amount: existingSplit ? String(roundTo2(existingSplit.shareAmount)) : '',
        percentage: existingSplit && amount
          ? String(roundTo2((existingSplit.shareAmount / amount) * 100))
          : '',
      };
    }),
  };
}

function ParticipantModal({ title, description, actionLabel, participant, values, setValues, submitting, error, onClose, onSubmit }) {
  return (
    <Modal title={title} description={description} onClose={onClose} maxWidth="max-w-lg">
      {error ? <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      <form onSubmit={onSubmit} className="space-y-5">
        <InputGroup label="Participant name">
          <TextInput value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. Priya" autoFocus required />
        </InputGroup>
        <InputGroup label="Avatar URL" hint="Optional image link for this participant">
          <TextInput value={values.avatar || ''} onChange={(e) => setValues({ ...values, avatar: e.target.value })} placeholder="https://example.com/avatar.png" />
        </InputGroup>
        <div>
          <span className="mb-3 block text-sm font-medium text-slate-700">Accent color</span>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValues({ ...values, color })}
                className={`h-10 w-10 rounded-full border-2 ${values.color === color ? 'border-slate-900' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
        {participant ? (
          <div className="rounded-md border border-border bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={values.name || participant.name} color={values.color} avatar={values.avatar || participant.avatar} size={48} />
              <div>
                <p className="text-sm font-medium text-slate-900">Live preview</p>
                <p className="mt-1 text-xs text-slate-500">Keep identity intact while improving presentation.</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : actionLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ExpenseModal({ groupId, participants, expense, onClose, onSaved, toast }) {
  const editing = Boolean(expense);
  const [form, setForm] = useState(() => buildExpenseForm(expense, participants));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(buildExpenseForm(expense, participants));
  }, [expense, participants]);

  function getSplitPayload() {
    const active = getSelectedSplits(form).filter((s) => participants.find((p) => p.id === s.participantId));
    if (form.splitMode === 'equal') return active.map((s) => ({ participantId: s.participantId }));
    if (form.splitMode === 'custom') return active.map((s) => ({ participantId: s.participantId, amount: parseFloat(s.amount) || 0 }));
    return active.map((s) => ({ participantId: s.participantId, percentage: parseFloat(s.percentage) || 0 }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.payerId) return setError('Select a payer');
    const totalAmount = roundTo2(form.amount);
    if (totalAmount <= 0) return setError('Enter a valid expense amount');
    const splits = getSplitPayload();
    if (!splits.length) return setError('Select at least one participant');
    if (form.splitMode === 'custom') {
      const customTotal = roundTo2(sumBy(getSelectedSplits(form), 'amount'));
      if (Math.abs(customTotal - totalAmount) > 0.01) {
        return setError('Custom split amounts must equal the total expense');
      }
    }
    if (form.splitMode === 'percentage') {
      const totalPercentage = roundTo2(sumBy(getSelectedSplits(form), 'percentage'));
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return setError('Percentages must total 100%');
      }
    }
    setLoading(true);
    try {
      const body = {
        groupId,
        amount: totalAmount,
        description: form.description,
        date: form.date,
        payerId: form.payerId,
        category: form.category,
        splitMode: form.splitMode,
        splits,
      };
      if (editing) {
        await api.put(`/expenses/${expense.id}`, body);
        toast({ title: 'Expense updated', message: `${form.description} has been refreshed.` });
      } else {
        await api.post('/expenses', body);
        toast({ title: 'Expense added', message: `${form.description} is now part of the group.` });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      toast({ type: 'error', title: 'Could not save expense', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  const selectedParticipants = participants.filter((participant) => form.splits.find((split) => split.participantId === participant.id)?.selected);
  const customTotal = sumBy(getSelectedSplits(form), 'amount');
  const percentageTotal = sumBy(getSelectedSplits(form), 'percentage');

  return (
    <Modal title={editing ? 'Edit expense' : 'Add expense'} description="The layout is improved, but the payload and business logic remain the same." onClose={onClose} maxWidth="max-w-3xl">
      {error ? <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <InputGroup label="Description">
              <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" required />
            </InputGroup>
          </div>
          <InputGroup label="Amount">
            <TextInput type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
          </InputGroup>
          <InputGroup label="Date" icon={CalendarIcon}>
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </InputGroup>
          <InputGroup label="Paid by">
            <SelectInput value={form.payerId} onChange={(e) => setForm({ ...form, payerId: e.target.value })}>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectInput>
          </InputGroup>
          <InputGroup label="Category">
            <SelectInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectInput>
          </InputGroup>
        </div>
        <Card className="bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Split mode</p>
              <p className="mt-1 text-xs text-slate-500">Equal, custom, and percentage flows keep existing rounding logic.</p>
            </div>
            <Badge>Current mode: {form.splitMode}</Badge>
          </div>
          <div className="mt-4">
            <SegmentedControl
              value={form.splitMode}
              onChange={(value) => setForm({ ...form, splitMode: value })}
              options={[{ value: 'equal', label: 'Equal' }, { value: 'custom', label: 'Custom' }, { value: 'percentage', label: 'Percentage' }]}
            />
          </div>
        </Card>
        <Card className="space-y-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Participants included</p>
              <p className="mt-1 text-xs text-slate-500">Choose exactly who this expense should be split across.</p>
            </div>
            <Badge>{selectedParticipants.length} selected</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {participants.map((participant, index) => {
              const isSelected = form.splits[index]?.selected;
              return (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => {
                    const splits = [...form.splits];
                    splits[index] = { ...splits[index], selected: !splits[index]?.selected };
                    setForm({ ...form, splits });
                  }}
                  className={`flex items-center gap-3 rounded-md border p-4 text-left ${isSelected ? 'border-primary bg-white' : 'border-border bg-white/60'}`}
                >
                  <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{participant.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{isSelected ? 'Included in this split' : 'Not included'}</p>
                  </div>
                  <Badge>{isSelected ? 'Selected' : 'Skipped'}</Badge>
                </button>
              );
            })}
          </div>
        </Card>
        {form.splitMode !== 'equal' ? (
          <Card className="space-y-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Split details</p>
                <p className="mt-1 text-xs text-slate-500">Fine-tune contribution values without changing backend processing.</p>
              </div>
              <Badge>{form.splitMode === 'custom' ? `${formatCurrency(customTotal)} / ${formatCurrency(form.amount || 0)}` : `${percentageTotal.toFixed(1)}% total`}</Badge>
            </div>
            {selectedParticipants.map((participant) => {
              const index = form.splits.findIndex((split) => split.participantId === participant.id);
              return (
              <div key={participant.id} className="grid gap-3 rounded-md border border-border bg-white p-4 sm:grid-cols-[auto_minmax(0,1fr)_140px] sm:items-center">
                <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={42} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{participant.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Participant share editor</p>
                </div>
                {form.splitMode === 'custom' ? (
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    className="text-right"
                    placeholder="Amount"
                    value={form.splits[index]?.amount || ''}
                    onChange={(e) => {
                      const splits = [...form.splits];
                      splits[index] = { ...splits[index], amount: e.target.value };
                      setForm({ ...form, splits });
                    }}
                  />
                ) : (
                  <TextInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="text-right"
                    placeholder="Percent"
                    value={form.splits[index]?.percentage || ''}
                    onChange={(e) => {
                      const splits = [...form.splits];
                      splits[index] = { ...splits[index], percentage: e.target.value };
                      setForm({ ...form, splits });
                    }}
                  />
                )}
              </div>
            );
            })}
          </Card>
        ) : (
          <Card className="bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Equal split preview</p>
            {selectedParticipants.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedParticipants.map((participant) => (
                  <Badge key={participant.id}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: participant.color || COLORS[0] }} />
                    {participant.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No participants added.</p>
            )}
          </Card>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editing ? 'Save changes' : 'Add expense'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function MintSensePanel({ groupId, participants, onExpenseCreated, toast }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const chips = ['Split equally', 'Dinner paid by Rajat', 'Cab fare among 3 people', 'Rent for this month'];

  async function parseSentence() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setParsed(null);
    setSuccess('');
    try {
      const response = await api.post('/ai/parse-expense', { text });
      setParsed(response.result.parsed);
      toast({ title: 'Expense parsed', message: 'Preview the result before creating it.' });
    } catch (err) {
      setError(err.message);
      toast({ type: 'error', title: 'Parsing failed', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function createFromParsed() {
    if (!parsed) return;
    setSaving(true);
    setError('');
    try {
      const payer = participants.find((p) => p.name.toLowerCase() === parsed.payerName?.toLowerCase()) || participants[0];
      const count = parsed.numPeople || participants.length;
      const involved = participants.slice(0, count);
      if (!involved.length) throw new Error('No participants to split between');
      const parsedSplits = parsed.splits || [];
      const requestedSplitMode = parsed.splitMode || 'equal';
      const hasStructuredSplits =
        (requestedSplitMode === 'percentage' || requestedSplitMode === 'custom') &&
        parsedSplits.length >= involved.length;
      const splitMode = hasStructuredSplits ? requestedSplitMode : 'equal';
      const splits = splitMode === 'percentage'
        ? involved.map((participant, index) => ({ participantId: participant.id, percentage: parsedSplits[index].percentage || 0 }))
        : splitMode === 'custom'
          ? involved.map((participant, index) => ({ participantId: participant.id, amount: parsedSplits[index].amount || 0 }))
          : involved.map((participant) => ({ participantId: participant.id }));
      await api.post('/expenses', {
        groupId,
        amount: parsed.amount,
        description: parsed.description,
        date: new Date().toISOString().split('T')[0],
        payerId: payer?.id,
        category: parsed.category,
        splitMode,
        splits,
      });
      setSuccess('Expense created from AI parse');
      setText('');
      setParsed(null);
      toast({ title: 'MintSense created an expense', message: 'The parsed expense has been added to this group.' });
      onExpenseCreated();
    } catch (err) {
      setError(err.message);
      toast({ type: 'error', title: 'Could not create parsed expense', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Pill icon={BrainIcon}>MintSense AI</Pill>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">Describe an expense naturally</h3>
            <p className="mt-2 text-sm text-slate-500">Example: &quot;Rajat paid 1000 for dinner split equally among 3 people&quot;</p>
          </div>
          <div className="rounded-md border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">Parse first, preview second, submit third.</div>
        </div>
        <div className="mt-6 rounded-md border border-border bg-slate-50 p-4">
          <textarea
            className="min-h-[140px] w-full resize-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Tell MintSense what happened..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setText((current) => current ? `${current} ${chip}` : chip)}
                  className="rounded-md border border-border bg-white px-4 py-2 text-xs font-medium text-slate-600"
                >
                  {chip}
                </button>
              ))}
            </div>
            <Button onClick={parseSentence} disabled={loading || !text.trim()}>{loading ? 'Parsing...' : 'Parse expense'}</Button>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-success">{success}</p> : null}
      </Card>
      {parsed ? (
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Pill icon={CheckCircleIcon}>Parsed preview</Pill>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">Review before submission</h3>
              <p className="mt-2 text-sm text-slate-500">Users can verify what AI understood before the real API call happens.</p>
            </div>
            <Badge>{parsed.splitMode || 'equal'}</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Amount', parsed.amount ? formatCurrency(parsed.amount) : '—'],
              ['Payer', parsed.payerName || '—'],
              ['People', parsed.numPeople || participants.length],
              ['Description', parsed.description || '—'],
              ['Category', parsed.category || 'Misc'],
              ['Split mode', parsed.splitMode || 'equal'],
            ].map(([label, value]) => (
              <Card key={label} className="bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 capitalize">{value}</p>
              </Card>
            ))}
          </div>
          {parsed.splits?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {parsed.splits.map((split, index) => (
                <Badge key={`${parsed.splitMode}-${index}`}>
                  {parsed.splitMode === 'percentage' ? `${split.percentage}%` : `${formatCurrency(split.amount)}`}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setParsed(null)}>Discard</Button>
            <Button type="button" onClick={createFromParsed} disabled={saving || !parsed.amount}>{saving ? 'Creating...' : 'Create expense'}</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function BalanceTab({ groupId }) {
  const [data, setData] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [balanceResult, settlementResult] = await Promise.allSettled([
        api.get(`/groups/${groupId}/balances`),
        api.get(`/groups/${groupId}/settlements`),
      ]);
      if (balanceResult.status === 'fulfilled') setData(balanceResult.value);
      if (settlementResult.status === 'fulfilled') setSettlements(settlementResult.value.settlements || []);
      setLoading(false);
    }
    load();
  }, [groupId]);

  if (loading) return <Card className="flex items-center justify-center py-16"><Spinner /></Card>;
  if (!data) return <EmptyState icon={AlertIcon} title="Could not load balances" description="The balances endpoint did not return usable data." />;

  const { balances, directional, participantMap } = data;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Balances" title="Who owes whom, made visual" description="Green means money to receive. Red means money owed. Settlement suggestions are unchanged underneath." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {balances.map(({ participant, netBalance }) => (
          <Card key={participant.id} className="bg-slate-50">
            <div className="flex items-center gap-3">
              <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={52} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{participant.name}</p>
                <p className="mt-1 text-xs text-slate-500">{netBalance > 0 ? 'Should receive' : netBalance < 0 ? 'Needs to pay' : 'All settled'}</p>
              </div>
            </div>
            <p className={`mt-5 text-2xl font-semibold ${netBalance > 0 ? 'text-success' : netBalance < 0 ? 'text-danger' : 'text-slate-900'}`}>
              {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance)}
            </p>
          </Card>
        ))}
      </div>
      {Object.keys(directional || {}).length ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Directional matrix</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Debt table</h3>
            </div>
            <AnalyticsIcon className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">From → To</th>
                  {Object.keys(directional).map((id) => <th key={id} className="px-3 py-3 text-right font-medium">{participantMap[id]?.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(directional).map((fromId) => (
                  <tr key={fromId} className="border-b border-border">
                    <td className="py-4 pr-4 font-medium text-slate-900">{participantMap[fromId]?.name}</td>
                    {Object.keys(directional).map((toId) => {
                      if (fromId === toId) return <td key={toId} className="px-3 py-4 text-right text-slate-600">—</td>;
                      const amount = directional[fromId]?.[toId] || 0;
                      return <td key={toId} className={`px-3 py-4 text-right font-medium ${amount > 0 ? 'text-rose-300' : 'text-slate-600'}`}>{amount > 0 ? formatCurrency(amount) : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
      <div>
        <SectionHeader eyebrow="Settlements" title="Suggested settlement path" description="Same settlement engine, better readability." />
        <div className="mt-4 space-y-3">
          {settlements.length === 0 ? (
            <EmptyState icon={CheckCircleIcon} title="All settled up" description="No outstanding balances remain in this group." />
          ) : (
            settlements.map((settlement, index) => (
              <Card key={`${settlement.from}-${settlement.to}-${index}`} className="bg-slate-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={settlement.fromName} color={participantMap[settlement.from]?.color} avatar={participantMap[settlement.from]?.avatar} size={44} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{settlement.fromName}</p>
                      <p className="mt-1 text-xs text-slate-500">will pay</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-700">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Amount</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(settlement.amount)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{settlement.toName}</p>
                      <p className="mt-1 text-xs text-slate-500">should receive</p>
                    </div>
                    <Avatar name={settlement.toName} color={participantMap[settlement.to]?.color} avatar={participantMap[settlement.to]?.avatar} size={44} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ summary, participants, onAddParticipant, onEditParticipant, onDeleteParticipant }) {
  const participantSummary = summary?.participants || participants;
  const maxPaid = Math.max(...participantSummary.map((participant) => Number(participant.totalPaid || 0)), 1);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Overview"
        title="Participant health and group momentum"
        description="A more product-ready overview with clearer cards, a leaderboard feel, and stronger visual hierarchy."
        action={participants.length < 4 ? <Button icon={PlusIcon} onClick={onAddParticipant}>Add participant</Button> : null}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={CurrencyIcon} label="Total spent" value={formatCompactCurrency(summary?.totalSpent || 0)} />
        <StatCard icon={CheckCircleIcon} label="Owed to you" value={formatCompactCurrency(summary?.owedToUser || 0)} tone="success" />
        <StatCard icon={PieChartIcon} label="You owe" value={formatCompactCurrency(summary?.youOwe || 0)} tone="danger" />
        <StatCard icon={ReceiptIcon} label="Expense count" value={summary?.expenseCount || 0} />
      </div>
      {participantSummary.length === 0 ? (
        <p className="text-sm text-slate-500">No participants added.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Leaderboard</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">Participant contributions</h3>
              </div>
              <PieChartIcon className="h-5 w-5 text-slate-500" />
            </div>
            <div className="mt-6 space-y-4">
              {participantSummary.map((participant) => (
                <div key={participant.id} className="rounded-md border border-border bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{participant.name}</p>
                        {participant.isPrimary ? <Badge>You</Badge> : null}
                      </div>
                      <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>Paid {formatCurrency(participant.totalPaid || 0)}</span>
                        <span>Share {formatCurrency(participant.totalShare || 0)}</span>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={((participant.totalPaid || 0) / maxPaid) * 100} tone={participant.netBalance > 0 ? 'emerald' : participant.netBalance < 0 ? 'rose' : 'violet'} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${participant.netBalance > 0 ? 'text-success' : participant.netBalance < 0 ? 'text-danger' : 'text-slate-900'}`}>
                        {participant.netBalance > 0 ? '+' : ''}{formatCurrency(participant.netBalance || 0)}
                      </p>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" icon={PencilIcon} onClick={() => onEditParticipant(participant)}>Edit</Button>
                        {!participant.isPrimary ? <Button type="button" variant="ghost" size="sm" icon={TrashIcon} className="text-danger" onClick={() => onDeleteParticipant(participant.id)}>Remove</Button> : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Participant stack</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Group roster</h3>
            <div className="mt-6 space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-md border border-border bg-slate-50 p-3">
                  <Avatar name={participant.name} color={participant.color} avatar={participant.avatar} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{participant.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{participant.isPrimary ? 'Primary account holder' : 'Participant'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ expenses, filters, setFilters, participants, onAddExpense, onEditExpense, onDeleteExpense }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Expenses" title="Track every transaction cleanly" description="Filtering, search, and editing behavior are preserved. The presentation is simply clearer." action={<Button icon={PlusIcon} onClick={onAddExpense}>Add expense</Button>} />
      <Card className="bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-border bg-white p-3 text-slate-500"><FilterIcon className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-medium text-slate-900">Smart filters</p>
            <p className="mt-1 text-xs text-slate-500">Search descriptions, narrow by participant, date, or amount.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InputGroup label="Search"><TextInput placeholder="Search descriptions" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></InputGroup>
          <InputGroup label="Participant">
            <SelectInput value={filters.participantId} onChange={(e) => setFilters({ ...filters, participantId: e.target.value })}>
              <option value="">All participants</option>
              {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
            </SelectInput>
          </InputGroup>
          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-1">
            <InputGroup label="From"><TextInput type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></InputGroup>
            <InputGroup label="To"><TextInput type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></InputGroup>
          </div>
          <InputGroup label="Min amount"><TextInput type="number" min="0" step="0.01" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} /></InputGroup>
          <InputGroup label="Max amount"><TextInput type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} /></InputGroup>
        </div>
      </Card>
      {expenses.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses yet. Add your first expense.</p>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">{expense.description}</p>
                    <CategoryBadge category={expense.category} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <Pill icon={CalendarIcon}>{new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Pill>
                    <Pill icon={UsersIcon}>Paid by {expense.payer?.name}</Pill>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {expense.splits?.map((split) => (
                      <Badge key={split.id}>
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: split.participant?.color || COLORS[0] }} />
                        {split.participant?.name}: {formatCurrency(split.shareAmount)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 xl:block xl:text-right">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Amount</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div className="flex gap-2 xl:mt-4 xl:justify-end">
                    <Button type="button" variant="ghost" size="sm" icon={PencilIcon} onClick={() => onEditExpense(expense)}>Edit</Button>
                    <Button type="button" variant="ghost" size="sm" icon={TrashIcon} className="text-danger" onClick={() => onDeleteExpense(expense.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const [group, setGroup] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [actionError, setActionError] = useState('');
  const [participantSubmitting, setParticipantSubmitting] = useState(false);
  const [groupDeleting, setGroupDeleting] = useState(false);
  const [filters, setFilters] = useState({ search: '', participantId: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });
  const [newParticipant, setNewParticipant] = useState({ name: '', color: COLORS[0], avatar: '' });
  const [editParticipantValues, setEditParticipantValues] = useState({ name: '', color: COLORS[0], avatar: '' });
  const [editGroupName, setEditGroupName] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    setUser(getUser());
    if (id) loadAll();
  }, [id, router]);

  useEffect(() => {
    if (editingParticipant) {
      setEditParticipantValues({ name: editingParticipant.name || '', color: editingParticipant.color || COLORS[0], avatar: editingParticipant.avatar || '' });
    }
  }, [editingParticipant]);

  useEffect(() => {
    if (id && tab === 'expenses') loadExpenses();
  }, [tab, id, filters.search, filters.participantId, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount]);

  async function loadAll() {
    setLoading(true);
    try {
      const [groupResponse, summaryResponse] = await Promise.all([api.get(`/groups/${id}`), api.get(`/groups/${id}/summary`)]);
      setGroup(groupResponse.group);
      setSummary(summaryResponse.summary);
      setEditGroupName(groupResponse.group.name);
    } catch (err) {
      if (err.status === 401) {
        clearAuth();
        router.replace('/login');
      } else {
        toast({ type: 'error', title: 'Could not load group', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses() {
    const params = new URLSearchParams({ groupId: id });
    if (filters.search) params.append('search', filters.search);
    if (filters.participantId) params.append('participantId', filters.participantId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
    try {
      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.expenses || []);
    } catch (err) {
      toast({ type: 'error', title: 'Could not load expenses', message: err.message });
    }
  }

  async function addParticipant(event) {
    event.preventDefault();
    setActionError('');
    setParticipantSubmitting(true);
    try {
      await api.post('/participants', { groupId: id, ...newParticipant });
      setShowAddParticipant(false);
      setNewParticipant({ name: '', color: COLORS[0], avatar: '' });
      toast({ title: 'Participant added', message: `${newParticipant.name} joined ${group?.name}.` });
      loadAll();
    } catch (err) {
      setActionError(err.message);
      toast({ type: 'error', title: 'Could not add participant', message: err.message });
    } finally {
      setParticipantSubmitting(false);
    }
  }

  async function updateParticipant(event) {
    event.preventDefault();
    if (!editingParticipant) return;
    setActionError('');
    setParticipantSubmitting(true);
    try {
      await api.put(`/participants/${editingParticipant.id}`, editParticipantValues);
      setEditingParticipant(null);
      toast({ title: 'Participant updated', message: `${editParticipantValues.name} has been refreshed.` });
      await Promise.all([loadAll(), loadExpenses()]);
    } catch (err) {
      setActionError(err.message);
      toast({ type: 'error', title: 'Could not update participant', message: err.message });
    } finally {
      setParticipantSubmitting(false);
    }
  }

  async function deleteParticipant(participantId) {
    if (!window.confirm('Delete this participant? Linked expenses will be reassigned and rebalanced automatically.')) return;
    try {
      await api.delete(`/participants/${participantId}`);
      toast({ title: 'Participant removed', message: 'Balances have been recalculated automatically.' });
      await Promise.all([loadAll(), loadExpenses()]);
    } catch (err) {
      toast({ type: 'error', title: 'Could not delete participant', message: err.message });
    }
  }

  async function deleteExpense(expenseId) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast({ title: 'Expense deleted', message: 'The transaction has been removed.' });
      loadExpenses();
      loadAll();
    } catch (err) {
      toast({ type: 'error', title: 'Could not delete expense', message: err.message });
    }
  }

  async function updateGroupName(event) {
    event.preventDefault();
    setActionError('');
    try {
      await api.put(`/groups/${id}`, { name: editGroupName });
      setShowEditGroup(false);
      toast({ title: 'Group renamed', message: `This group is now called ${editGroupName}.` });
      loadAll();
    } catch (err) {
      setActionError(err.message);
      toast({ type: 'error', title: 'Could not rename group', message: err.message });
    }
  }

  async function deleteGroup() {
    if (!window.confirm('Delete this group? All related expenses, balances, and participants will be removed permanently.')) return;
    setActionError('');
    setGroupDeleting(true);
    try {
      await api.delete(`/groups/${id}`);
      toast({ title: 'Group deleted', message: 'The group and all related records were removed.' });
      router.push('/dashboard');
    } catch (err) {
      setActionError(err.message);
      toast({ type: 'error', title: 'Could not delete group', message: err.message });
    } finally {
      setGroupDeleting(false);
    }
  }

  function openExpenseModal(expense = null) {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  }

  function handleSidebarSelect(key) {
    if (key === 'dashboard') return router.push('/dashboard');
    if (key === 'analytics') return setTab('balances');
    if (key === 'mintsense') return setTab('mintsense');
    setTab('overview');
  }

  if (loading) return <LoadingScreen label="Loading group workspace" />;
  if (!group) return <LoadingScreen label="Group not found" />;

  const participants = group.participants || [];
  const tabConfig = [
    { key: 'overview', label: 'Overview', icon: UsersIcon },
    { key: 'expenses', label: 'Expenses', icon: ReceiptIcon },
    { key: 'balances', label: 'Balances', icon: AnalyticsIcon },
    { key: 'mintsense', label: 'MintSense', icon: BrainIcon },
  ];

  return (
    <>
      <Head><title>{group.name} | SplitMint AI</title></Head>
      <AppShell
        activeNav={getGroupNav(tab)}
        onNavChange={handleSidebarSelect}
        user={user}
        onLogout={() => { clearAuth(); router.replace('/login'); }}
      >
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-1">
              <Button
                variant="ghost"
                icon={ArrowLeftIcon}
                className="w-fit px-0 text-slate-600"
                onClick={() => router.push('/dashboard')}
              >
                Back to dashboard
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {tabConfig.map((item) => <TabButton key={item.key} active={tab === item.key} icon={item.icon} onClick={() => setTab(item.key)}>{item.label}</TabButton>)}
              </div>
            </div>
            <Button variant="secondary" className="w-full sm:w-auto" icon={PencilIcon} onClick={() => { setActionError(''); setShowEditGroup(true); }}>
              Edit group
            </Button>
          </div>
        </Card>
        {tab === 'overview' ? <OverviewTab summary={summary} participants={participants} onAddParticipant={() => { setActionError(''); setShowAddParticipant(true); }} onEditParticipant={(participant) => { setActionError(''); setEditingParticipant(participant); }} onDeleteParticipant={deleteParticipant} /> : null}
        {tab === 'expenses' ? <ExpensesTab expenses={expenses} filters={filters} setFilters={setFilters} participants={participants} onAddExpense={() => openExpenseModal()} onEditExpense={(expense) => openExpenseModal(expense)} onDeleteExpense={deleteExpense} /> : null}
        {tab === 'balances' ? <BalanceTab groupId={id} /> : null}
        {tab === 'mintsense' ? <MintSensePanel groupId={id} participants={participants} onExpenseCreated={() => { loadAll(); if (tab === 'expenses') loadExpenses(); }} toast={toast} /> : null}
      </AppShell>
      {showEditGroup ? (
        <Modal title="Rename group" description="A cleaner modal for the same existing group update API." onClose={() => setShowEditGroup(false)} maxWidth="max-w-lg">
          {actionError ? <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{actionError}</div> : null}
          <form onSubmit={updateGroupName} className="space-y-5">
            <InputGroup label="Group name"><TextInput value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} required /></InputGroup>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="danger" onClick={deleteGroup} disabled={groupDeleting}>
                {groupDeleting ? 'Deleting...' : 'Delete group'}
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowEditGroup(false)}>Cancel</Button>
                <Button type="submit" disabled={groupDeleting}>Save</Button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}
      {showAddParticipant ? (
        <ParticipantModal
          title="Add participant"
          description="Invite another person into the split without changing your existing group rules."
          actionLabel="Add participant"
          values={newParticipant}
          setValues={setNewParticipant}
          submitting={participantSubmitting}
          error={actionError}
          onClose={() => { setShowAddParticipant(false); setActionError(''); }}
          onSubmit={addParticipant}
        />
      ) : null}
      {editingParticipant ? (
        <ParticipantModal
          title="Edit participant"
          description="Update display details while keeping the same participant record and logic."
          actionLabel="Save changes"
          participant={editingParticipant}
          values={editParticipantValues}
          setValues={setEditParticipantValues}
          submitting={participantSubmitting}
          error={actionError}
          onClose={() => { setEditingParticipant(null); setActionError(''); }}
          onSubmit={updateParticipant}
        />
      ) : null}
      {showExpenseModal && participants.length > 0 ? (
        <ExpenseModal
          groupId={id}
          participants={participants}
          expense={editingExpense}
          onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
          onSaved={() => { loadAll(); if (tab === 'expenses') loadExpenses(); }}
          toast={toast}
        />
      ) : null}
      {showExpenseModal && participants.length === 0 ? (
        <Modal title="Add participants first" description="This keeps the same original rule: an expense needs participants to split across." onClose={() => setShowExpenseModal(false)} maxWidth="max-w-md">
          <div className="space-y-5 text-center">
            <p className="text-sm text-slate-400">No participants are available for this group yet.</p>
            <Button onClick={() => { setShowExpenseModal(false); setTab('overview'); }}>Go to overview</Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
