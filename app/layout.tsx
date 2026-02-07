import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AsesorarSeg - Asesoramiento Corporativo en Seguridad",
  description:
    "Consultora de inteligencia operativa diseñada para transformar la seguridad de las empresas en estructuras de alto rendimiento.",
  icons: {
    icon: "/images/favicon.png",
  },
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
