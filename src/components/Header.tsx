import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>T</span>
          텔레<span className={styles.logoAccent}>견적</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="#services" className={styles.navLink}>서비스</Link>
          <Link href="#how-it-works" className={styles.navLink}>이용방법</Link>
          <Link href="#reviews" className={styles.navLink}>후기</Link>
          <Link href="/quote" className={styles.ctaButton}>무료 견적받기</Link>
        </nav>
      </div>
    </header>
  );
}
