import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "The Board",
  description: "Multiplayer football tile game",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
