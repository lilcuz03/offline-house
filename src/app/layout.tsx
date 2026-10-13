import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { SITE } from "@/lib/categories";
import "./globals.css";
import Footer from "@/components/Footer";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const DESCRIPTION =
  "Only the top-selling products: chargers, cables, power banks, phone cases and more, plus home, living, beauty and everyday essentials. Free delivery on orders over R600.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Offline House | Top-selling tech, home and everyday essentials",
    template: "%s | Offline House",
  },
  description: DESCRIPTION,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_ZA",
    title: "Offline House | Disconnect to reconnect",
    description: DESCRIPTION,
    images: [
      {
        url: "/brand/logo-full.jpg",
        width: 1280,
        height: 853,
        alt: "Offline House logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offline House | Disconnect to reconnect",
    description: DESCRIPTION,
    images: ["/brand/logo-full.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f8f7f2",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      slogan: SITE.tagline,
      url: SITE.url,
      logo: `${SITE.url}/brand/logo-full.jpg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: { "@id": `${SITE.url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${jost.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}
