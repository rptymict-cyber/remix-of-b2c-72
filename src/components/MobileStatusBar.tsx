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
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" className="text-foreground">
          <path d="M7.5 10.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" fill="currentColor" transform="translate(0,-1.5)" />
          <path d="M4.5 9c.8-.9 1.8-1.4 3-1.4s2.2.5 3 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M2 6.2c1.5-1.6 3.3-2.5 5.5-2.5S12.5 4.6 14 6.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M0 3.2C2 1.2 4.5 0 7.5 0S13 1.2 15 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
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
