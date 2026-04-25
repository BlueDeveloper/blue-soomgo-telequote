import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>H</span>
          hl<span className={styles.logoAccent}>mobile</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/#carriers" className={styles.navLink}>통신사</Link>
          <Link href="/notices" className={styles.navLink}>공지사항</Link>
          <Link href="/inquiry" className={styles.navLink}>문의</Link>
          <Link href="/form" className={styles.ctaButton}>신청서 작성하기</Link>
        </nav>
      </div>
    </header>
  );
}
