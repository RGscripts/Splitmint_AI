import { useRouter } from 'next/router';
import { BrandMark, Button, Card, SidebarNav } from '../ui/primitives';
import { LogoutIcon } from '../ui/icons';

export function AppShell({
  activeNav,
  onNavChange,
  user,
  title,
  subtitle,
  actions,
  children,
  aside,
  onLogout,
}) {
  const router = useRouter();
  const hasAside = Boolean(aside);

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-6 lg:grid-cols-[225px_minmax(0,1fr)] lg:px-6">
        <aside className="hidden self-start rounded-lg border border-border bg-white p-4 lg:flex lg:flex-col">
          <div className="border-b border-border pb-4">
            <BrandMark small />
          </div>
          <div className="mt-6">
            <SidebarNav activeKey={activeNav} onSelect={onNavChange} />
          </div>
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-md border border-border bg-slate-50 text-slate-700"
              onClick={onLogout}
              icon={LogoutIcon}
            >
              Logout
            </Button>
          </div>
          {/* <Card className="mt-6 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Workspace</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{user?.name || user?.email || 'SplitMint user'}</p>
            <p className="mt-1 text-xs text-slate-500">Expense tracking and balances for your active groups.</p>
          </Card> */}
        </aside>

        <div className="min-w-0">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-left"
            >
              <BrandMark small />
            </button>
            <Button variant="ghost" size="sm" onClick={onLogout} icon={LogoutIcon} />
          </div>

          {(title || subtitle || actions) ? (
            <header className="mt-4 rounded-lg border border-border bg-white px-5 py-4 lg:mt-0 xl:mx-auto xl:w-full xl:max-w-[1180px]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">SplitMint AI</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                  {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </header>
          ) : null}

          <main className={`grid gap-6 lg:mt-0 xl:mx-auto xl:w-full ${hasAside ? 'xl:max-w-[1180px] xl:grid-cols-[minmax(0,1fr)_320px]' : 'xl:max-w-[980px]'}`}>
            <div className="min-w-0 space-y-6">{children}</div>
            {hasAside ? <div className="space-y-6">{aside}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
