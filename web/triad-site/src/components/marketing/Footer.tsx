const webAppUrl = process.env.NEXT_PUBLIC_TRIAD_WEB_APP_URL || "#";
const businessUrl = process.env.NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL || "#business";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triad.app";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="site-shell flex flex-col gap-6 text-sm text-white/56 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="display-font text-2xl font-black text-white">Triad</p>
          <p className="mt-2">Public marketing website for Triad.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#safety">
            Safety
          </a>
          <a className="transition hover:text-white" href={webAppUrl}>
            Web App
          </a>
          <a className="transition hover:text-white" href={businessUrl}>
            Business Portal
          </a>
          <a className="transition hover:text-white" href={`mailto:${contactEmail}`}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
