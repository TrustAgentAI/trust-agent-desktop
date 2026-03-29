import { useEffect, useRef, useState } from "react";
import {
  getLocale,
  setLocaleManual,
  onLocaleChange,
  getWasAutoDetected,
  LOCALE_META,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";

export function LanguageSwitcher() {
  const [locale, setCurrentLocale] = useState<SupportedLocale>(getLocale());
  const [open, setOpen] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAutoDetected(getWasAutoDetected());
    const unsub = onLocaleChange((l) => {
      setCurrentLocale(l);
      setAutoDetected(getWasAutoDetected());
    });
    return unsub;
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("keydown", handleKey);
      };
    }
  }, [open]);

  const meta = LOCALE_META[locale];

  const handleSelect = async (l: SupportedLocale) => {
    setOpen(false);
    await setLocaleManual(l);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white/80"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span>{meta.nativeName}</span>
        {autoDetected && (
          <span className="text-[9px] opacity-40 ml-0.5">(auto)</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute bottom-full left-0 z-50 mb-1.5 max-h-64 w-52 overflow-y-auto rounded-lg border border-white/10 bg-[#0d1117] p-1 shadow-xl"
          style={{ direction: "ltr" }}
        >
          {SUPPORTED_LOCALES.map((l) => {
            const m = LOCALE_META[l];
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(l)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                  active
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <span className="text-sm">{m.flag}</span>
                <span className="flex-1">{m.nativeName}</span>
                <span className="text-[10px] opacity-40">{l.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
