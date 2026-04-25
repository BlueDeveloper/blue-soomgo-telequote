import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "신청서 작성",
  description:
    "hlmobile — 모든 통신사 가입신청서를 무료로 작성하고 출력하세요. SKT, KT, LG U+, 알뜰폰 신규가입·번호이동·기기변경·해지 양식 지원.",
  openGraph: {
    title: "신청서 작성 | hlmobile",
    description:
      "모든 통신사 가입신청서를 무료로 작성하고 바로 출력하세요.",
  },
};

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
