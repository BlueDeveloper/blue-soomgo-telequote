import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 견적 요청",
  description:
    "텔레견적 — 간편한 요청서 작성으로 검증된 전문가에게 전화 견적을 받아보세요. 설비, 전기, 인테리어, 이사, 청소 등 다양한 서비스.",
  openGraph: {
    title: "무료 견적 요청 | 텔레견적",
    description:
      "간편한 요청서 작성으로 검증된 전문가에게 전화 견적을 받아보세요.",
  },
};

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
