import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

// Bebas Neue — display font for strong headings. Only one weight exists.
const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

// DM Sans — body / UI font.
const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.getlanded.ca"),
  title: {
    default: "Landed | 90-Day Career Recovery Plan",
    template: "%s | Landed",
  },
  description:
    "A focused 90-day recovery plan for Canadians navigating a layoff, contract ending, or career disruption.",
  applicationName: "Landed",
  openGraph: {
    title: "Landed | 90-Day Career Recovery Plan",
    description:
      "Get a focused plan, Canadian resources, and clear weekly priorities after a layoff or contract ending.",
    url: "/",
    siteName: "Landed",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landed | 90-Day Career Recovery Plan",
    description:
      "A focused 90-day plan for Canadians navigating a layoff, contract ending, or career disruption.",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
