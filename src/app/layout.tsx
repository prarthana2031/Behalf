import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Behalf — agents that date for you", description: "Each person gets an agent. The agents date each other from public LinkedIn + Instagram, then rank who fits." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <nav>
            <Link href="/" className="logo"><span className="brand-name">Behalf<i>.</i></span><span className="nav-note">A match study</span></Link>
            <Link className="l" href="/">Read a person</Link>
            <Link className="l" href="/people">People</Link>
            <Link className="l" href="/dates">Dates</Link>
            <Link className="l nav-cta" href="/rankings">Rankings</Link>
            <ThemeToggle />
          </nav>
          {children}
          <footer><span>Behalf · A study in compatibility</span><span>Two public sources per person · LinkedIn + Instagram</span></footer>
        </div>
      </body>
    </html>
  );
}
