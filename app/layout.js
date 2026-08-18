import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Teracom Solutions | AI, Security & Technical Solutions',
  description: 'Teracom Solutions combines electronic security expertise with AI, technical consulting, security system design, software innovation and the Teracom AI product family, including SecurityOS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Header />{children}<Footer /></body>
    </html>
  );
}
