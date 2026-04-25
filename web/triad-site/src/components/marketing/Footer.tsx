const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#business";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

export function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/40 py-10 backdrop-blur-xl">
      <div className="site-shell flex flex-col gap-6 text-sm text-[var(--color-muted-ink)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="display-font text-2xl font-black tracking-[-0.04em] brand-gradient-text">Triad</p>
          <p className="mt-2">Public marketing website for Triad.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <a className="transition hover:text-[var(--color-ink)]" href="#features">
            Features
          </a>
          <a className="transition hover:text-[var(--color-ink)]" href="#safety">
            Safety
          </a>
          <a className="transition hover:text-[var(--color-ink)]" href={webAppUrl}>
            Web App
          </a>
          <a className="transition hover:text-[var(--color-ink)]" href={businessUrl}>
            Business Portal
          </a>
          <a className="transition hover:text-[var(--color-ink)]" href={`mailto:${contactEmail}`}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
