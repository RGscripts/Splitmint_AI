import Head from 'next/head';
import { BrandMark, Card, Pill } from '../ui/primitives';
import { AnalyticsIcon, BrainIcon, GroupIcon } from '../ui/icons';

const HIGHLIGHTS = [
  { icon: GroupIcon, title: 'Group clarity', text: 'Track expenses across trips, homes, and shared lives without spreadsheet fatigue.' },
  { icon: AnalyticsIcon, title: 'Balance confidence', text: 'Understand who owes whom instantly, with clean summaries and settlement guidance.' },
  { icon: BrainIcon, title: 'MintSense AI', text: 'Turn natural language into structured expenses while keeping your backend logic untouched.' },
];

export function AuthShell({ title, description, children }) {
  return (
    <>
      <Head>
        <title>{title} | SplitMint AI</title>
      </Head>
      <div className="min-h-screen bg-app px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-border bg-white p-6 sm:p-8 lg:p-10">
            <div className="flex h-full flex-col">
              <BrandMark />
              <div className="mt-12 max-w-xl">
                <Pill icon={BrainIcon}>MintSense available</Pill>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Shared expenses in one clear workspace.</h1>
                <p className="mt-5 text-base leading-7 text-slate-600">{description}</p>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title}>
                      <div className="w-fit rounded-md border border-border bg-slate-50 p-3 text-slate-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">{item.text}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
