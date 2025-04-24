import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 현재 경로에 따라 활성 링크 확인
  const isActive = (path) => {
    return router.pathname === path;
  };

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="Weather Trip Logo"
            width={160}
            height={53}
            priority
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '160px',
              maxHeight: '53px'
            }}
          />
        </Link>

        <div className={styles.navLinks}>
          <Link href="/map" className={`${styles.navItem} ${isActive('/map') ? styles.active : ''}`}>
            지도
          </Link>
          <Link href="/recommend" className={`${styles.navItem} ${isActive('/recommend') ? styles.active : ''}`}>
            맞춤추천
          </Link>
          <Link href="/community" className={`${styles.navItem} ${isActive('/community') ? styles.active : ''}`}>
            커뮤니티
          </Link>
        </div>

        <div className={styles.authButtons}>
          {session ? (
            <>
              <div className={styles.dropdown} ref={dropdownRef}>
                <button
                  className={`${styles.navItem} ${styles.dropdownTrigger}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {session.user.nickname} ({session.user.name}) 님&nbsp;
                  <span className={styles.hamburgerIcon}>☰</span>
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link href="/users/mypage" className={styles.dropdownItem}>회원정보</Link>
                    <Link href="/inquiries" className={styles.dropdownItem}>고객센터</Link>
                    <Link href="/users/mypage" className={styles.dropdownItem}>FAQ</Link>

                  </div>
                )}
              </div>

              <button onClick={() => signOut()} className={styles.loginButton}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/users/login" className={styles.loginButton}>
                로그인
              </Link>
              <Link href="/users/register" className={styles.registerButton}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}