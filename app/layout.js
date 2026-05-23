import './globals.css';

export const metadata = {
  title: 'PDF & Image Toolkit',
  description: 'Modern PDF and image utilities with EID lamination workflow.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
