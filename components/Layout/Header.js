import Link from 'next/link';
import styles from '../../styles/Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <h1>날씨별 관광지 추천</h1>
          </Link>
          
          <nav className={styles.nav}>
            <ul>
              <li>
                <Link href="/">홈</Link>
              </li>
              <li>
                <Link href="/recommend">맞춤 추천</Link>
              </li>
              <li>
                <Link href="/map">지도</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
} 