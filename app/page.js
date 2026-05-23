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
];

const EXTERNAL_TOOLS = [
  {
    title: 'PDF & IMAGE TOOL',
    url: 'https://pdfimgtools.vercel.app/',
  },
  {
    title: 'REMIT BD',
    url: 'https://remitbd.vercel.app/',
  },
  {
    title: 'Mess Meal Manager system',
    url: 'https://smm24.vercel.app/',
  },
  {
    title: 'WORK TRACKING MANAGMENT SYSTEM',
    url: 'https://worktms.vercel.app',
  },
  {
    title: 'UAE VAT & TAX SUITE SYSTEM',
    url: 'https://www.uaevat.live',
  },
  {
    title: 'PERSONAL FINANCE MANAGER',
    url: 'https://finpulse24.vercel.app/',
  },
  {
    title: 'TYPING & TRVALE MANAGMENT ERP SYSTEM',
    url: 'https://ecashbiz.com/landing',
  },
];

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
        <div className="home-external-grid">
          {EXTERNAL_TOOLS.map((tool) => (
            <article key={tool.url} className="home-external-card">
              <h3>{tool.title}</h3>
              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn alt home-external-btn">
                Go to Tool
              </a>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>
          Developed By{' '}
          <a href="https://ainulislam.info" target="_blank" rel="noopener noreferrer">
            Ainul islam (ainulislam.info)
          </a>{' '}
          Powered By{' '}
          <a href="https://aimzit.xyz" target="_blank" rel="noopener noreferrer">
            Aimz it (aimzit.xyz)
          </a>
        </p>
      </footer>
    </main>
  );
}
