import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AsesorarSeg - Asesoramiento Corporativo en Seguridad",
  description:
    "Consultora de inteligencia operativa en seguridad corporativa. Auditorías, capacitación, gestión de riesgos y tecnología avanzada.",
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
