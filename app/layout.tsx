import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AsesorarSeg - Asesoramiento Corporativo en Seguridad",
  description:
    "Consultora de inteligencia operativa en seguridad corporativa. Auditorías, consultoría estratégica, capacitación profesional y más.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
