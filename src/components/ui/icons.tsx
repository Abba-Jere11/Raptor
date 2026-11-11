type P = { className?: string };

export const HeartIcon = ({ className, filled }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 20 20" className={className ?? "h-5 w-5"} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M10 17s-6.5-3.9-6.5-8.6A3.6 3.6 0 0110 6a3.6 3.6 0 016.5 2.4C16.5 13.1 10 17 10 17z" strokeLinejoin="round" />
  </svg>
);

export const WhatsAppIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" />
  </svg>
);

export const MenuIcon = ({ className }: P) => (
  <svg viewBox="0 0 20 20" className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
    <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DownloadIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LockIcon = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
  </svg>
);
