import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Third Wheel Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5f7fb] text-[#172033] font-sans antialiased">
        <div
          className="min-h-screen grid"
          style={{ gridTemplateColumns: '260px minmax(0, 1fr)' }}
        >
          <Sidebar />
          <div className="grid" style={{ gridTemplateRows: 'auto 1fr' }}>
            <Header />
            <main className="px-8 pb-8 pt-3" aria-live="polite">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
