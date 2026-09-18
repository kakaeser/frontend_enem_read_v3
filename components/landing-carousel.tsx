"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

const PHOTOS = [
  { src: "/edicao1.jpeg", alt: "Edição anterior do ENEM da Read 1" },
  { src: "/edicao2.jpeg", alt: "Edição anterior do ENEM da Read 2" },
  { src: "/edicao3.jpeg", alt: "Edição anterior do ENEM da Read 3" },
  { src: "/edicao4.jpeg", alt: "Edição anterior do ENEM da Read 4" },
]

export function LandingCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % PHOTOS.length),
      5000
    )
    return () => clearInterval(t)
  }, [])

  function go(n: number) {
    setIndex(((n % PHOTOS.length) + PHOTOS.length) % PHOTOS.length)
  }

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-read-ink">
        {PHOTOS.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt={p.alt}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority={i === 0}
            className={cn(
              "object-cover transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Próxima foto"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ir para foto ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-read-green" : "w-2 bg-read-ink hover:bg-read-gray"
            )}
          />
        ))}
      </div>
    </div>
  )
}
