import Link from "next/link";
import Header from "@/components/Header";
import styles from "./page.module.css";

const services = [
  {
    icon: "🔧",
    iconStyle: "serviceIconGreen",
    title: "설비/배관",
    desc: "보일러, 수도, 배관 수리 및 설치",
    price: "평균 15~30만원",
  },
  {
    icon: "⚡",
    iconStyle: "serviceIconBlue",
    title: "전기/조명",
    desc: "전기 공사, 조명 설치, 콘센트 작업",
    price: "평균 8~20만원",
  },
  {
    icon: "🏠",
    iconStyle: "serviceIconOrange",
    title: "인테리어",
    desc: "도배, 장판, 타일, 부분 리모델링",
    price: "평균 50~200만원",
  },
  {
    icon: "❄️",
    iconStyle: "serviceIconPurple",
    title: "에어컨/냉난방",
    desc: "에어컨 설치, 이전, 청소, 수리",
    price: "평균 5~15만원",
  },
  {
    icon: "🚚",
    iconStyle: "serviceIconBlue",
    title: "이사/운송",
    desc: "가정 이사, 사무실 이전, 용달",
    price: "평균 30~100만원",
  },
  {
    icon: "🧹",
    iconStyle: "serviceIconGreen",
    title: "청소",
    desc: "입주 청소, 사무실 청소, 정기 청소",
    price: "평균 10~30만원",
  },
  {
    icon: "🔑",
    iconStyle: "serviceIconOrange",
    title: "잠금/보안",
    desc: "도어락 설치, 열쇠 교체, CCTV",
    price: "평균 5~15만원",
  },
  {
    icon: "🎨",
    iconStyle: "serviceIconPurple",
    title: "페인트/도장",
    desc: "실내외 페인트, 방수, 코팅 작업",
    price: "평균 20~80만원",
  },
];

const steps = [
  { num: "1", title: "서비스 선택", desc: "필요한 서비스 분야를 선택하세요" },
  { num: "2", title: "간편 요청서 작성", desc: "바로폼 방식의 간편 폼으로 요청 내용을 입력하세요" },
  { num: "3", title: "전화 견적 수신", desc: "검증된 전문가로부터 전화로 상세 견적을 받으세요" },
  { num: "4", title: "비교 후 선택", desc: "받은 견적을 비교하고 최적의 전문가를 선택하세요" },
];

const reviews = [
  {
    stars: 5,
    text: "전화로 바로 견적을 받으니까 채팅보다 훨씬 정확하고 빨라요. 보일러 교체 견적 3곳에서 받았는데 가격 차이가 꽤 나서 비교하기 좋았습니다.",
    name: "김지수",
    meta: "설비/배관 · 2주 전",
    avatar: "지",
  },
  {
    stars: 5,
    text: "요청서 작성이 정말 간단해요. 클릭 몇 번이면 끝나고, 10분도 안 돼서 전문가분이 전화 주셨어요. 이사 견적 받기 너무 편해요.",
    name: "박민호",
    meta: "이사/운송 · 1주 전",
    avatar: "민",
  },
  {
    stars: 5,
    text: "인테리어 업체 찾기가 항상 고민이었는데, 전화 견적으로 직접 상담받으니 신뢰가 가요. 가격도 투명하게 알려주셔서 좋았습니다.",
    name: "이수진",
    meta: "인테리어 · 3일 전",
    avatar: "수",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              전문가 3,200+ 명 활동 중
            </div>
            <h1 className={styles.heroTitle}>
              전화 한 통으로 받는
              <br />
              <span className={styles.heroHighlight}>빠르고 정확한 견적</span>
            </h1>
            <p className={styles.heroDesc}>
              복잡한 채팅은 그만. 간편하게 요청서를 작성하면
              <br />
              검증된 전문가가 직접 전화로 상세 견적을 알려드립니다.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/quote" className={styles.btnPrimary}>
                무료 견적받기 →
              </Link>
              <Link href="#how-it-works" className={styles.btnSecondary}>
                이용방법 보기
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneCardHeader}>
                <div className={styles.phoneCardAvatar}>👨‍🔧</div>
                <div className={styles.phoneCardInfo}>
                  <h4>김철수 전문가</h4>
                  <p>설비/배관 · 경력 12년</p>
                </div>
              </div>
              <div className={styles.phoneCardBody}>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>서비스</span>
                  <span className={styles.quoteValue}>보일러 교체</span>
                </div>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>예상 소요</span>
                  <span className={styles.quoteValue}>3~4시간</span>
                </div>
                <div className={styles.quoteRow}>
                  <span className={styles.quoteLabel}>견적 금액</span>
                  <span className={`${styles.quoteValue} ${styles.quotePrice}`}>
                    250,000원
                  </span>
                </div>
              </div>
              <div className={styles.phoneCardFooter}>
                📞 전화 상담 완료
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>3,200+</div>
            <div className={styles.statLabel}>등록 전문가</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>15,000+</div>
            <div className={styles.statLabel}>누적 견적 건수</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>4.8</div>
            <div className={styles.statLabel}>평균 만족도</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>3분</div>
            <div className={styles.statLabel}>평균 응답 시간</div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className={styles.services}>
        <div className={styles.servicesInner}>
          <span className={styles.sectionTag}>서비스</span>
          <h2 className={styles.sectionTitle}>어떤 견적이 필요하세요?</h2>
          <p className={styles.sectionDesc}>
            다양한 분야의 전문가가 전화로 정확한 견적을 알려드립니다.
          </p>
          <div className={styles.serviceGrid}>
            {services.map((s) => (
              <Link
                key={s.title}
                href={`/quote?service=${encodeURIComponent(s.title)}`}
                className={styles.serviceCard}
              >
                <div className={`${styles.serviceIcon} ${styles[s.iconStyle]}`}>
                  {s.icon}
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className={styles.servicePrice}>{s.price}</div>
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
            복잡한 절차 없이 4단계로 전문가 견적을 받아보세요.
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

      {/* Reviews */}
      <section id="reviews" className={styles.reviews}>
        <div className={styles.reviewsInner}>
          <span className={styles.sectionTag}>고객 후기</span>
          <h2 className={styles.sectionTitle}>실제 이용 후기</h2>
          <p className={styles.sectionDesc}>
            텔레견적을 이용한 고객들의 생생한 후기입니다.
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
          <h2>지금 바로 무료 견적을 받아보세요</h2>
          <p>
            요청서 작성 1분, 전문가 전화 견적 무료. 부담 없이 시작하세요.
          </p>
          <Link href="/quote" className={styles.ctaBannerBtn}>
            무료 견적받기 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>T</span>
              텔레견적
            </div>
            <p className={styles.footerDesc}>
              전화 한 통으로 받는 빠르고 정확한 견적 서비스.
              검증된 전문가와 직접 소통하세요.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>서비스</h4>
              <ul>
                <li><a href="#services">견적 요청</a></li>
                <li><a href="#how-it-works">이용방법</a></li>
                <li><a href="#reviews">고객 후기</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>고객지원</h4>
              <ul>
                <li><a href="#">자주 묻는 질문</a></li>
                <li><a href="#">1:1 문의</a></li>
                <li><a href="#">전문가 등록</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>회사</h4>
              <ul>
                <li><a href="#">이용약관</a></li>
                <li><a href="#">개인정보처리방침</a></li>
                <li><a href="#">회사 소개</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 텔레견적. All rights reserved.
        </div>
      </footer>
    </>
  );
}
