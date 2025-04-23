import Link from 'next/link';
import styles from '../../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>WeatherTrip</h3>
          <p>날씨와 함께하는 여행의 시작</p>
        </div>
        
        <div className={styles.footerSection}>
          <h4>소개</h4>
          <ul>
            <li><Link href="/about/team">WeatherTrip 팀원 소개</Link></li>
            <li><Link href="/about/project">WeatherTrip 소개</Link></li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4>문의하기(계정)</h4>
          <p>contact@weathertrip.com</p>
          <p>02-1234-5678</p>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} WeatherTrip. All rights reserved.</p>
      </div>
    </footer>
  );
}