import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const runtime = "nodejs"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), "public/logo.png"))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0c0c",
          padding: 48,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            maxWidth: "70%",
            maxHeight: "55%",
            objectFit: "contain",
          }}
        />
        <p
          style={{
            marginTop: 32,
            fontSize: 48,
            fontWeight: 700,
            color: "#05dd86",
            letterSpacing: "-0.02em",
          }}
        >
          ENEM da Read
        </p>
      </div>
    ),
    { ...size }
  )
}
