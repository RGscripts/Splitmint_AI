import {
  AnalyticsIcon,
  ArrowLeftIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DashboardIcon,
  FilterIcon,
  GroupIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from './icons';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0)).replace(/\s?₹/, '₹ ');
}

export function formatCompactCurrency(value) {
  return formatCurrency(value);
}

export const CATEGORY_META = {
  Food: { emoji: 'F', tone: 'border-orange-200 bg-orange-50 text-orange-700' },
  Travel: { emoji: 'T', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  Rent: { emoji: 'R', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  Entertainment: { emoji: 'E', tone: 'border-pink-200 bg-pink-50 text-pink-700' },
  Utilities: { emoji: 'U', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  Health: { emoji: 'H', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  Misc: { emoji: 'M', tone: 'border-slate-200 bg-slate-50 text-slate-700' },
};

export const APP_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { key: 'groups', label: 'Groups', icon: GroupIcon },
  { key: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
  { key: 'mintsense', label: 'MintSense', icon: BrainIcon },
];

export function BrandMark({ small = false }) {
  return (
    <div className={cn('flex items-center gap-3', small && 'gap-2')}>
      <div className={cn('grid place-items-center rounded-lg border border-border bg-primary text-sm font-semibold text-white', small ? 'h-9 w-9' : 'h-10 w-10')}>
        SM
      </div>
      <div>
        <p className={cn('font-semibold tracking-tight text-slate-900', small ? 'text-base' : 'text-lg')}>SplitMint AI</p>
        <p className="text-xs text-slate-500">Expense splitting for small groups</p>
      </div>

    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', className = '', icon: Icon, iconRight: RightIcon, ...props }) {
  const styles = {
    primary: 'border border-primary bg-primary text-white',
    secondary: 'border border-border bg-white text-slate-700',
    ghost: 'border border-transparent bg-transparent text-slate-600',
    danger: 'border border-red-200 bg-white text-danger',
  };
  const sizes = {
    sm: 'h-9 rounded-md px-3 text-xs',
    md: 'h-10 rounded-md px-4 text-sm',
    lg: 'h-11 rounded-md px-4 text-sm',
  };

  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 font-medium disabled:cursor-not-allowed disabled:opacity-60', styles[variant], sizes[size], className)}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
      {RightIcon ? <RightIcon className="h-4 w-4" /> : null}
    </button>
  );
}

export function Card({ className = '', children }) {
  return <div className={cn('rounded-lg border border-border bg-white p-5 shadow-card', className)}>{children}</div>;
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, subtext, tone = 'default' }) {
  const toneMap = {
    default: 'text-slate-900',
    success: 'text-success',
    danger: 'text-danger',
    accent: 'text-primary',
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className={cn('mt-3 text-2xl font-semibold', toneMap[tone])}>{value}</p>
          {subtext ? <p className="mt-2 text-xs text-slate-500">{subtext}</p> : null}
        </div>
        {Icon ? <div className="rounded-md border border-border bg-slate-50 p-2 text-slate-600"><Icon className="h-4 w-4" /></div> : null}
      </div>
    </Card>
  );
}

export function ProgressBar({ value, tone = 'violet' }) {
  const widths = Math.max(0, Math.min(100, Number(value || 0)));
  const tones = {
    violet: 'bg-primary',
    emerald: 'bg-success',
    rose: 'bg-danger',
  };
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className={cn('h-2 rounded-full', tones[tone])} style={{ width: `${widths}%` }} />
    </div>
  );
}

export function Badge({ children, className = '' }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md border border-border bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600', className)}>{children}</span>;
}

export function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Misc;
  return <Badge className={cn(meta.tone)}>{meta.emoji} {category}</Badge>;
}

export function Avatar({ name, color, avatar, size = 40 }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || 'Avatar'}
        className="inline-flex shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ width: size, height: size, backgroundColor: color || '#2563EB' }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
}

export function EmptyState({ icon: Icon = SparklesIcon, title, description, action }) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-slate-50 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function LoadingScreen({ label = 'Loading workspace' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app">
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function Modal({ title, description, children, onClose, maxWidth = 'max-w-xl' }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/20 px-4 py-8">
      <div className={cn('relative w-full rounded-lg border border-border bg-white p-6 shadow-card', maxWidth)}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-md border border-border bg-white p-2 text-slate-500" aria-label="Close">
          <XIcon className="h-4 w-4" />
        </button>
        <div className="mb-5 pr-10">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function InputGroup({ label, hint, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> : null}
        {children}
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className = '', icon, ...props }) {
  return <input className={cn('h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary', icon && 'pl-10', className)} {...props} />;
}

export function SelectInput({ className = '', ...props }) {
  return <select className={cn('h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary', className)} {...props} />;
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={cn('w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary', className)} {...props} />;
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-slate-50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn('rounded-md px-3 py-2 text-sm font-medium', value === option.value ? 'bg-white text-primary border border-border' : 'text-slate-600')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={cn('rounded-md bg-slate-100', className)} />;
}

export function SearchField(props) {
  return <TextInput icon placeholder="Search" {...props} />;
}

export function TabButton({ active, icon: Icon, children, ...props }) {
  return (
    <button className={cn('inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium', active ? 'border-primary text-primary' : 'border-transparent text-slate-600')} {...props}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function SidebarNav({ activeKey, onSelect, items = APP_NAV }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium', activeKey === item.key ? 'bg-slate-100 text-primary' : 'text-slate-600')}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            <ChevronRightIcon className={cn('ml-auto h-4 w-4', activeKey === item.key ? 'opacity-100' : 'opacity-0')} />
          </button>
        );
      })}
    </div>
  );
}

export function Pill({ icon: Icon, children, className = '' }) {
  return <span className={cn('inline-flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600', className)}>{Icon ? <Icon className="h-3.5 w-3.5" /> : null}{children}</span>;
}

export const primitiveIcons = {
  AnalyticsIcon,
  ArrowLeftIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircleIcon,
  DashboardIcon,
  FilterIcon,
  GroupIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
};
