import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://telequote.pages.dev";
const SITE_NAME = "텔레견적";
const SITE_DESCRIPTION =
  "텔레견적 — 전화 한 통으로 받는 빠르고 정확한 견적 서비스. 설비, 전기, 인테리어, 이사, 청소 등 검증된 전문가가 직접 전화로 상세 견적을 알려드립니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 전화 한 통으로 받는 빠른 견적`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "텔레견적",
    "전화견적",
    "견적서",
    "견적비교",
    "설비수리",
    "전기공사",
    "인테리어",
    "이사견적",
    "청소견적",
    "에어컨설치",
    "생활서비스",
    "전문가매칭",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 전화 한 통으로 받는 빠른 견적`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "텔레견적 — 전화 한 통으로 받는 빠른 견적",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 전화 한 통으로 받는 빠른 견적`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.svg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.svg`,
    image: `${SITE_URL}/og-image.svg`,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
    serviceType: "전화 견적 매칭 서비스",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "견적 서비스",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "설비/배관 견적" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "전기/조명 견적" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "인테리어 견적" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "에어컨/냉난방 견적" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "이사/운송 견적" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "청소 견적" } },
      ],
    },
  };

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
