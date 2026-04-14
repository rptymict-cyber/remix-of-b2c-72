const MobileStatusBar = () => {
  return (
    <div className="flex items-center justify-between px-6 py-1.5 bg-white">
      <span className="text-xs font-semibold text-foreground tracking-tight">9:41</span>
      <div className="flex items-center gap-1">
        {/* Cellular signal */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="text-foreground">
          <rect x="0" y="9" width="3" height="3" rx="0.5" fill="currentColor" />
          <rect x="4" y="6" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="8" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
          <rect x="12" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
        </svg>
        {/* WiFi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-foreground">
          <path d="M0.68 3.02C2.46 1.14 4.84 0 7.5 0c2.66 0 5.04 1.14 6.82 3.02" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M2.84 5.34C4.04 4.06 5.68 3.3 7.5 3.3c1.82 0 3.46.76 4.66 2.04" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M5.0 7.66c.66-.72 1.5-1.16 2.5-1.16s1.84.44 2.5 1.16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="7.5" cy="9.75" r="1.25" fill="currentColor" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" className="text-foreground">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
          <rect x="2" y="2" width="18" height="8" rx="1" fill="currentColor" />
          <path d="M23 4v4a1.5 1.5 0 000-4z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

export default MobileStatusBar;
