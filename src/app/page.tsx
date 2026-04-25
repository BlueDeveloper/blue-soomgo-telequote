"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { fetchCarriers } from "@/lib/api";
import type { Carrier } from "@/types";
import styles from "./page.module.css";

const steps = [
  { num: "1", title: "통신사 선택", desc: "원하는 통신사를 선택하세요" },
  { num: "2", title: "신청서 양식 선택", desc: "가입/해지/번호이동 등 양식을 선택하세요" },
  { num: "3", title: "정보 입력", desc: "신청서에 필요한 정보를 간편하게 입력하세요" },
  { num: "4", title: "무료 출력", desc: "완성된 신청서를 바로 출력하세요" },
];

const features = [
  { icon: "✅", title: "모든 통신사 지원", desc: "SKT, KT, LG U+ 3대 통신사와 모든 알뜰폰 통신사 신청서를 지원합니다." },
  { icon: "🆓", title: "완전 무료", desc: "회원가입도, 이용료도 없습니다. 신청서 작성부터 출력까지 100% 무료." },
  { icon: "⚡", title: "1분 만에 완성", desc: "복잡한 양식 걱정 없이, 안내에 따라 입력하면 자동으로 신청서가 완성됩니다." },
  { icon: "🖨️", title: "즉시 출력 가능", desc: "작성 완료 후 PDF로 다운로드하거나 바로 프린터로 출력할 수 있습니다." },
  { icon: "📱", title: "모바일에서도 작성", desc: "PC는 물론 스마트폰, 태블릿에서도 편리하게 신청서를 작성할 수 있습니다." },
  { icon: "🔒", title: "개인정보 보호", desc: "입력된 정보는 서버에 저장되지 않습니다. 출력 후 즉시 삭제됩니다." },
];

const reviews = [
  { stars: 5, text: "대리점에서 매번 신청서 손으로 쓰느라 힘들었는데, 이제 미리 작성해서 출력해 가니까 정말 편해요. 글씨 못 알아보겠다는 말도 안 듣고요.", name: "김대리", meta: "휴대폰 대리점 운영 · 2주 전", avatar: "김" },
  { stars: 5, text: "알뜰폰 개통할 때 신청서 양식 찾느라 한참 걸렸는데, 여기서 통신사만 선택하면 바로 나와서 너무 좋아요. 부모님 폰도 여기서 했어요.", name: "박지현", meta: "번호이동 · 1주 전", avatar: "박" },
  { stars: 5, text: "법인폰 20대 개통할 때 신청서 하나하나 쓸 생각에 막막했는데, 정보 한 번 입력하면 다 채워져서 나와요. 시간 엄청 절약됐습니다.", name: "이과장", meta: "법인 · 3일 전", avatar: "이" },
];

export default function Home() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carriersLoading, setCarriersLoading] = useState(true);

  useEffect(() => {
    fetchCarriers()
      .then(setCarriers)
      .catch(() => {})
      .finally(() => setCarriersLoading(false));
  }, []);

  return (
    <>
      <Header />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              모든 통신사 양식 지원
            </div>
            <h1 className={styles.heroTitle}>
              모든 통신사 신청서
              <br />
              <span className={styles.heroHighlight}>무료 작성 & 출력</span>
            </h1>
            <p className={styles.heroDesc}>
              SKT, KT, LG U+부터 알뜰폰까지.
              <br />
              가입·해지·번호이동 신청서를 간편하게 작성하고 바로 출력하세요.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/form" className={styles.btnPrimary}>
                신청서 작성하기 →
              </Link>
              <Link href="#how-it-works" className={styles.btnSecondary}>
                이용방법 보기
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneCardHeader}>
                <div className={styles.phoneCardAvatar}>📋</div>
                <div className={styles.phoneCardInfo}>
                  <h4>가입 신청서</h4>
                  <p>SKT · 번호이동</p>
                </div>
              </div>
              <div className={styles.phoneCardBody}>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>신청 유형</span>
                  <span className={styles.quoteValue}>번호이동</span>
                </div>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>요금제</span>
                  <span className={styles.quoteValue}>5G 다이렉트 59</span>
                </div>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>단말기</span>
                  <span className={styles.quoteValue}>갤럭시 S25</span>
                </div>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>비용</span>
                  <span className={`${styles.quoteValue} ${styles.quotePrice}`}>
                    무료
                  </span>
                </div>
              </div>
              <div className={styles.phoneCardFooter}>
                🖨️ 출력 준비 완료
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{carriers.length || "14"}+</div>
            <div className={styles.statLabel}>지원 통신사</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>50,000+</div>
            <div className={styles.statLabel}>누적 출력 건수</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>무료 서비스</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>1분</div>
            <div className={styles.statLabel}>평균 작성 시간</div>
          </div>
        </div>
      </section>

      {/* Carriers */}
      <section id="carriers" className={styles.services}>
        <div className={styles.servicesInner}>
          <span className={styles.sectionTag}>통신사</span>
          <h2 className={styles.sectionTitle}>어떤 통신사 신청서가 필요하세요?</h2>
          <p className={styles.sectionDesc}>
            3대 통신사는 물론, 알뜰폰·선불폰·법인까지 모두 지원합니다.
          </p>
          <div className={styles.serviceGrid}>
            {carriersLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.serviceCard} style={{ opacity: 0.4, minHeight: 140 }} />
                ))
              : carriers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/form?carrier=${encodeURIComponent(c.id)}`}
                    className={styles.serviceCard}
                  >
                    <div className={`${styles.serviceIcon} ${styles[c.icon_style] || styles.serviceIconBlue}`}>
                      {c.icon}
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    <div className={styles.servicePrice}>{c.forms}</div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.howItWorksInner}>
          <span className={styles.sectionTag}>이용방법</span>
          <h2 className={styles.sectionTitle}>이렇게 간단합니다</h2>
          <p className={styles.sectionDesc} style={{ margin: "0 auto 0" }}>
            복잡한 양식 걱정 없이 4단계로 신청서를 완성하세요.
          </p>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepNumber}>{step.num}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.reviews}>
        <div className={styles.reviewsInner}>
          <span className={styles.sectionTag}>특징</span>
          <h2 className={styles.sectionTitle}>왜 HL Mobile인가요?</h2>
          <p className={styles.sectionDesc}>
            신청서 작성이 이렇게 쉬울 수 있습니다.
          </p>
          <div className={styles.reviewGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.reviewCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.reviewText}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.reviews} style={{ background: "var(--surface-1)" }}>
        <div className={styles.reviewsInner}>
          <span className={styles.sectionTag}>이용 후기</span>
          <h2 className={styles.sectionTitle}>실제 이용 후기</h2>
          <p className={styles.sectionDesc}>
            HL Mobile을 이용한 분들의 생생한 후기입니다.
          </p>
          <div className={styles.reviewGrid}>
            {reviews.map((r) => (
              <div key={r.name} className={styles.reviewCard}>
                <div className={styles.reviewStars}>
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className={styles.reviewText}>&ldquo;{r.text}&rdquo;</p>
                <div className={styles.reviewAuthor}>
                  <div className={styles.reviewAvatar}>{r.avatar}</div>
                  <div>
                    <div className={styles.reviewName}>{r.name}</div>
                    <div className={styles.reviewMeta}>{r.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2>지금 바로 신청서를 작성해보세요</h2>
          <p>회원가입 없이, 완전 무료로 모든 통신사 신청서를 작성하고 출력하세요.</p>
          <Link href="/form" className={styles.ctaBannerBtn}>
            신청서 작성하기 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>H</span>
              hlmobile
            </div>
            <p className={styles.footerDesc}>
              모든 통신사 신청서를 무료로 작성하고 출력하세요.
              가입, 해지, 번호이동 양식을 한 곳에서.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>서비스</h4>
              <ul>
                <li><a href="#carriers">통신사 목록</a></li>
                <li><a href="#how-it-works">이용방법</a></li>
                <li><a href="#features">특징</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>고객지원</h4>
              <ul>
                <li><a href="#">자주 묻는 질문</a></li>
                <li><a href="#">1:1 문의</a></li>
                <li><a href="#">양식 요청</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>안내</h4>
              <ul>
                <li><a href="#">이용약관</a></li>
                <li><a href="#">개인정보처리방침</a></li>
                <li><a href="#">서비스 소개</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 hlmobile. All rights reserved.
          <Link href="/admin" style={{ marginLeft: 16, color: "var(--text-3)", fontSize: 12 }}>관리자</Link>
        </div>
      </footer>
    </>
  );
}
