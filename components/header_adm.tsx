"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header_menu() {
  const router = useRouter();

  async function handleLogout() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030";
    const refresh = localStorage.getItem("refresh_token");
    try {
      if (refresh) {
        await fetch(`${base}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
      }
    } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.replace("/login");
  }
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-read-logo-dark border-b border-read-dark/20 shadow-sm w-full">
      <Link href="/" className="transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-90">
        <Image
          className="h-10 w-auto object-contain drop-shadow-sm"
          src="/logo.png"
          alt="ENEM da READ"
          width={173}
          height={90}
          priority
        />
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium text-read-white">
        <button onClick={handleLogout} className="rounded-full bg-read-green px-5 py-2 text-read-logo-dark font-semibold hover:bg-read-green-dark hover:text-white transition-colors">
          Sair
        </button>
      </nav>
    </header>
  );
}