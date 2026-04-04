function createIcon(path, viewBox = '0 0 24 24') {
  return function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };
}

export const SparklesIcon = createIcon(
  <>
    <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
    <path d="M5 16l.9 2.1L8 19l-2.1.9L5 22l-.9-2.1L2 19l2.1-.9L5 16Z" />
    <path d="M19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
  </>
);

export const DashboardIcon = createIcon(
  <>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="5" rx="2" />
    <rect x="13" y="10" width="8" height="11" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </>
);

export const GroupIcon = createIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);

export const AnalyticsIcon = createIcon(
  <>
    <path d="M4 19h16" />
    <path d="M7 16V8" />
    <path d="M12 16V5" />
    <path d="M17 16v-3" />
  </>
);

export const ArrowLeftIcon = createIcon(<path d="m12 19-7-7 7-7M19 12H5" />);
export const PlusIcon = createIcon(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const LogoutIcon = createIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>);
export const PencilIcon = createIcon(<><path d="M12 20h9" /><path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" /></>);
export const TrashIcon = createIcon(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /></>);
export const SearchIcon = createIcon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);
export const CalendarIcon = createIcon(<><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></>);
export const CurrencyIcon = createIcon(<><path d="M6 3h12" /><path d="M6 8h12" /><path d="m8 21 8-8-8-8" /></>);
export const ReceiptIcon = createIcon(<><path d="M8 3h8l4 4v14l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>);
export const UsersIcon = createIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const BoltIcon = createIcon(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />);
export const CheckCircleIcon = createIcon(<><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>);
export const AlertIcon = createIcon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>);
export const XIcon = createIcon(<path d="m18 6-12 12M6 6l12 12" />);
export const ChevronRightIcon = createIcon(<path d="m9 18 6-6-6-6" />);
export const FilterIcon = createIcon(<><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></>);
export const BrainIcon = createIcon(<><path d="M9.5 3A3.5 3.5 0 0 0 6 6.5v.3A3.2 3.2 0 0 0 4 9.8c0 1.3.8 2.5 2 3 .1 2.3 1.9 4.2 4.3 4.2H11" /><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5v.3A3.2 3.2 0 0 1 20 9.8c0 1.3-.8 2.5-2 3-.1 2.3-1.9 4.2-4.3 4.2H13" /><path d="M12 7v10" /><path d="M9 10h3" /><path d="M12 14h3" /></>);
export const PieChartIcon = createIcon(<><path d="M21 12A9 9 0 1 1 12 3" /><path d="M12 3v9h9" /></>);
export const HomeIcon = createIcon(<><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></>);
