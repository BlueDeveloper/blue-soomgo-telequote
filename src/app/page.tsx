"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { fetchCarrierTree } from "@/lib/api";
import type { Carrier } from "@/types";
import styles from "./page.module.css";

export default function Home() {
  const [tree, setTree] = useState<Carrier[]>([]);
  const [carriersLoading, setCarriersLoading] = useState(true);

  useEffect(() => {
    fetchCarrierTree()
      .then(setTree)
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

      {/* Carriers */}
      <section id="carriers" className={styles.services}>
        <div className={styles.servicesInner}>
          <span className={styles.sectionTag}>통신사</span>
          <h2 className={styles.sectionTitle}>어떤 통신사 신청서가 필요하세요?</h2>
          <p className={styles.sectionDesc}>
            3대 통신사는 물론, 알뜰폰·선불폰·법인까지 모두 지원합니다.
          </p>
          {carriersLoading ? (
            <div className={styles.serviceGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.serviceCard} style={{ opacity: 0.4, minHeight: 140 }} />
              ))}
            </div>
          ) : (
            tree.map((mno) => (
              <div key={mno.id} style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-0)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  {mno.icon.startsWith("http") || mno.icon.startsWith("/") ? (
                    <img src={mno.icon} alt={mno.title} style={{ width: 24, height: 24, objectFit: "contain" }} />
                  ) : <span>{mno.icon}</span>}
                  {mno.title}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)" }}>({mno.children?.length || 0})</span>
                </h3>
                <div className={styles.serviceGrid}>
                  {(mno.children || []).map((c) => (
                    <Link key={c.id} href={`/form?carrier=${encodeURIComponent(c.id)}`} className={styles.serviceCard}>
                      <div className={`${styles.serviceIcon} ${styles[c.icon_style] || styles.serviceIconBlue}`}>
                        {c.icon.startsWith("http") || c.icon.startsWith("/") ? (
                          <img src={c.icon} alt={c.title} style={{ width: 28, height: 28, objectFit: "contain" }} />
                        ) : c.icon}
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.description}</p>
                      <div className={styles.servicePrice}>{c.forms}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
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
                <li><a href="/form">신청서 작성</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>고객지원</h4>
              <ul>
                <li><Link href="/notices">공지사항</Link></li>
                <li><Link href="/inquiry">문의하기</Link></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>안내</h4>
              <ul>
                <li><a href="#">이용약관</a></li>
                <li><a href="#">개인정보처리방침</a></li>
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
