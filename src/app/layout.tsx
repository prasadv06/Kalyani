import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalyani — Real-Time Wedding Operations Control Plane",
  description:
    "Kalyani real-time wedding operations SLA control plane with Sarvam AI voice dispatch, Flagsmith policy flags, and NudgeBee self-healing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#09090B] text-[#F4F3EF] selection:bg-teal-400/25 selection:text-teal-200">
        {children}
      </body>
    </html>
  );
}
