import Image from "next/image";
import Link from "next/link";

export default function Header_menu() {
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
        <Link href="/resultados" className="relative py-1 text-read-gray hover:text-read-green transition-colors after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-read-green after:transition-all hover:after:w-full">
          Resultados
        </Link>
        <Link href="/login" className="rounded-full bg-read-green px-5 py-2 text-read-logo-dark font-semibold hover:bg-read-green-dark hover:text-white transition-colors">
          Login
        </Link>
      </nav>
    </header>
  );
}