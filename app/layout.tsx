import type { Metadata } from "next";
import Link from "next/link";
import { APP_VERSION_LABEL } from "@/lib/app-version";
import "./globals.css";

export const metadata: Metadata = {
  title: "Миколкина гра",
  description: "Онлайн-версія карткової гри для друзів.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <div className="min-h-screen">
          {children}
          <footer className="px-4 pb-6 pt-2 text-center text-xs text-stone-400 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3">
              <span>Миколкина гра · {APP_VERSION_LABEL}</span>
              <Link
                href="/changelog"
                className="text-stone-500 transition-colors hover:text-stone-300"
              >
                changelog
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
