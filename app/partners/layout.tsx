import type { Metadata } from "next";
import ThemeProvider from "./_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Fisher & Paykel | Friends & Family Delivery Portal",
  description: "Delivery and installation partner portal.",
  robots: "noindex, nofollow",
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <style>{`
        [data-theme="light"] {
          --bg: #F5F5F2;
          --surface: #FFFFFF;
          --sidebar: #111111;
          --text: #111111;
          --text-2: #5A5A5A;
          --text-3: #7A7A7A;
          --border: #D9D9D9;
          --hairline: #EDEDED;
          --hover: #F5F5F2;
          --input-bg: #FFFFFF;
        }
        [data-theme="dark"] {
          --bg: #0A0A0A;
          --surface: #141414;
          --sidebar: #111111;
          --text: #FFFFFF;
          --text-2: #8A8A8A;
          --text-3: #5A5A5A;
          --border: #2A2A2A;
          --hairline: #1C1C1C;
          --hover: #1C1C1C;
          --input-bg: #1A1A1A;
        }
        [data-theme] {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: var(--bg);
          color: var(--text);
        }
        * { box-sizing: border-box; }
        @keyframes fp-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fp-bar-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes fp-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .fp-drawer {
          animation: fp-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fp-backdrop {
          animation: fp-fade-in 200ms ease;
        }
        .fp-bar {
          transform-origin: bottom;
          animation: fp-bar-grow 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        /* ── Mobile ── */
        @media (max-width: 768px) {
          .fp-sidebar { display: none !important; }
          .fp-bottom-nav { display: flex !important; }
          .fp-main-grid { grid-template-columns: 1fr !important; }

          /* Space below content for fixed bottom nav (64px + safe area) */
          .fp-main-content { padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)); }

          /* Reduce page padding */
          .fp-page-header { padding: 16px 16px 10px !important; }
          .fp-page-content { padding: 0 16px 32px !important; }

          /* Drawers become full-screen bottom sheets on mobile */
          .fp-drawer {
            width: 100vw !important;
            height: 100dvh !important;
            top: 0 !important;
            border-radius: 0 !important;
            animation: fp-slide-up 280ms cubic-bezier(0.16, 1, 0.3, 1) !important;
          }

          /* Drag handle on mobile drawers */
          .fp-drag-handle { display: block !important; }

          /* Floating action button */
          .fp-fab { display: flex !important; }

          /* Table/cards toggle */
          .fp-table-view { display: none !important; }
          .fp-cards-view { display: flex !important; flex-direction: column; gap: 10px; }

          /* Toolbar wraps */
          .fp-toolbar { flex-wrap: wrap !important; }

          /* Prevent iOS input zoom */
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="date"],
          input[type="number"],
          input[type="search"],
          select,
          textarea { font-size: 16px !important; }

          /* Larger touch targets */
          .fp-touch-target { min-height: 44px !important; }

          /* Form grids stack on mobile */
          .fp-form-grid-2,
          .fp-form-grid-3 { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .fp-bottom-nav { display: none !important; }
          .fp-table-view { display: block !important; }
          .fp-cards-view { display: none !important; }
          .fp-form-grid-2 { grid-template-columns: 1fr 1fr; }
          .fp-form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
      {children}
    </ThemeProvider>
  );
}
