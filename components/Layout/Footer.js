import Link from 'next/link';
import styles from '../../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>날씨별 관광지 추천</h3>
          <p>현재 날씨에 맞는 최적의 관광지를 추천해드립니다.</p>
        </div>
        
        <div className={styles.footerSection}>
          <h4>메뉴</h4>
          <ul>
            <li><Link href="/">홈</Link></li>
            <li><Link href="/map">지도</Link></li>
            <li><Link href="/recommend">맞춤 추천</Link></li>
            <li><Link href="/community">커뮤니티</Link></li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4>연락처</h4>
          <p>이메일: contact@weather-tourism.com</p>
          <p>전화: 02-1234-5678</p>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} 날씨별 관광지 추천. All rights reserved.</p>
      </div>
    </footer>
  );
}