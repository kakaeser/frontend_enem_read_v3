import Link from "next/link";
import Header_menu from "../components/header_landing";
import { LandingCarousel } from "../components/landing-carousel";

// URL externa do formulário de inscrição (Cloudflare Pages > Settings >
// Environment variables). Rebuild é necessário após trocar (NEXT_PUBLIC_*
// é embutido no build). Vazio = botão "em breve" desabilitado.
const INSCRICAO_URL = process.env.NEXT_PUBLIC_INSCRICAO_URL ?? "";

const STEPS = [
  {
    title: "Faça a prova",
    text: "Um simulado nos moldes do ENEM sobre um livro da Bíblia definido a cada edição.",
  },
  {
    title: "Aguarde a correção",
    text: "Nossa equipe corrige as questões e a redação de cada participante.",
  },
  {
    title: "Confira o ranking",
    text: "O resultado é divulgado aqui no site 2 dias após o encerramento da prova.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-read-darkest font-sans text-read-white">
      <Header_menu />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12 md:py-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            ENEM da Read
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-read-gray md:text-lg">
            O ENEM da Read é uma programação da Rede de Adolescentes da
            Oitava Igreja Presbiteriana de Belo Horizonte: uma prova nos
            moldes do ENEM sobre um livro da Bíblia definido a cada edição.
            Os participantes com as melhores notas ganham bolsas e descontos
            para o próximo acampamento da rede.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {INSCRICAO_URL ? (
              <Link
                href={INSCRICAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-read-green px-8 py-3 font-semibold text-read-logo-dark transition-colors hover:bg-read-green-dark hover:text-white"
              >
                Inscrever-se
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-full bg-read-ink px-8 py-3 font-semibold text-read-gray">
                Inscrições em breve
              </span>
            )}
            <Link
              href="/resultados"
              className="rounded-full border border-read-ink px-8 py-3 font-semibold text-read-white transition-colors hover:border-read-green hover:text-read-green"
            >
              Ver resultados
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Últimas edições</h2>
          <LandingCarousel />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Como funciona</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex flex-col gap-2 rounded-xl border border-read-ink bg-read-ink-dark p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-read-green text-sm font-bold text-read-logo-dark">
                  {i + 1}
                </span>
                <span className="font-semibold">{s.title}</span>
                <span className="text-sm text-read-gray">{s.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="border-t border-read-ink px-6 py-6 text-center text-sm text-read-gray">
        Rede de Adolescentes — Oitava Igreja Presbiteriana de Belo Horizonte
        {" • "}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}
