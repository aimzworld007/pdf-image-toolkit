import Link from 'next/link';

const HOME_CATEGORIES = [
  {
    href: '/image-tools',
    title: 'Image Tools',
    desc: 'Enhance, resize, crop, convert and optimize images with visual previews.',
  },
  {
    href: '/pdf-tools',
    title: 'PDF Tools',
    desc: 'Use PDF Workbench, page editing, compression, and PDF conversion workflows.',
  },
  {
    href: '/lamination-tools',
    title: 'Lamination Tools',
    desc: 'Passport/EID lamination layouts and card preparation workflows.',
  },
  {
    href: '/photo-print-tools',
    title: 'Photo Print Tools',
    desc: 'Auto-grid photo print sheets for direct printer output.',
  },
  {
    href: '/demo-ticket-generator',
    title: 'Demo Ticket Generator',
    desc: 'Create, preview, print, and export professional itinerary-style demo tickets.',
  },
];

const EXTERNAL_TOOLS = [
  {
    icon: '💰',
    title: 'REMIT BD',
    url: 'https://remitbd.vercel.app/',
    desc: 'Fast remittance workflow and transaction support tools.',
  },
  {
    icon: '🍽️',
    title: 'Mess Meal Manager system',
    url: 'https://smm24.vercel.app/',
    desc: 'Meal planning, cost tracking, and member-wise management.',
  },
  {
    icon: '⚙️',
    title: 'WORK TRACKING MANAGMENT SYSTEM',
    url: 'https://worktms.vercel.app',
    desc: 'Task assignment, activity logs, and progress monitoring.',
  },
  {
    title: 'UAE VAT & TAX SUITE SYSTEM',
    icon: '🔗',
    url: 'https://www.uaevat.live',
    desc: 'VAT calculators, tax helpers, and compliance utilities.',
  },
  {
    icon: '🔗',
    title: 'PERSONAL FINANCE MANAGER',
    url: 'https://finpulse24.vercel.app/',
    desc: 'Budgeting, expense insights, and savings overview.',
  },
  {
    icon: '🔗',
    title: 'TYPING & TRVALE MANAGMENT ERP SYSTEM',
    url: 'https://ecashbiz.com/landing',
    desc: 'ERP toolkit for typing centers and travel operations.',
  },
  {
    icon: '📄',
    title: 'AI CV MAKER',
    url: 'https://buildcv.online',
    desc: 'Create, save, edit, and share your CV online.',
  },
];

const MARQUEE_TOOLS = [...EXTERNAL_TOOLS, ...EXTERNAL_TOOLS];

export default function Home() {
  return (
    <main className="container">
      <header className="hero home-hero" style={{ marginBottom: 20 }}>
        <div>
          <h1>PDF & Image Toolkit Pro</h1>
          <p>Choose your workspace and continue with dedicated tool pages.</p>
          <div className="home-pills">
            <span className="kpi">Client-side processing</span>
            <span className="kpi">No login required</span>
            <span className="kpi">Print-ready workflows</span>
          </div>
        </div>
      </header>

      <section className="home-section">
        <h2 className="section-title">Start Here</h2>
        <div className="tools-grid home-category-grid">
          {HOME_CATEGORIES.map((item) => (
            <Link key={item.href} href={item.href} className="tool-card home-category-card" style={{ textDecoration: 'none' }}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <span className="home-card-cta">Open Workspace</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Other Tools</h2>
        <div className="home-marquee-wrap">
          <div className="home-marquee-track">
            {MARQUEE_TOOLS.map((tool, index) => (
              <article
                key={`${tool.url}-${index}`}
                className="home-marquee-card"
                aria-hidden={index >= EXTERNAL_TOOLS.length}
              >
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="home-external-link-title">
                  <span className="home-tool-icon">{tool.icon}</span>
                  <span>{tool.title}</span>
                  <span className="home-open-pill">Open</span>
                </a>
                <p>{tool.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>
          Developed By{' '}
          <a href="https://ainulislam.info" target="_blank" rel="noopener noreferrer">
            Ainul islam
          </a>{' '}
          Powered By{' '}
          <a href="https://aimzit.xyz" target="_blank" rel="noopener noreferrer">
            Aimz it
          </a>
        </p>
      </footer>
    </main>
  );
}
