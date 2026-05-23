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
    desc: 'Passport/EID print layouts and lamination-ready photo PDF generators.',
  },
];

export default function Home() {
  return (
    <main className="container">
      <header className="hero" style={{ marginBottom: 20 }}>
        <h1>PDF & Image Toolkit Pro</h1>
        <p>Choose your workspace and continue with dedicated tool pages.</p>
      </header>

      <section>
        <h2 className="section-title">Start Here</h2>
        <div className="tools-grid">
          {HOME_CATEGORIES.map((item) => (
            <Link key={item.href} href={item.href} className="tool-card" style={{ textDecoration: 'none' }}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
