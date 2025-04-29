import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/Header.module.css';
import { HeaderHeightProvider } from '../../src/contexts/HeaderHeightContext';

/**
 * 사이트 상단 네비게이션 및 사용자 메뉴를 제공하는 헤더 컴포넌트
 * @param children - 헤더 아래에 렌더링될 자식 요소
 * @returns 헤더 및 네비게이션 UI
 */
export default function Header({ children }) {
  // 로그인 세션 정보
  const { data: session } = useSession();
  // 라우터 인스턴스
  const router = useRouter();
  // 스크롤 여부(헤더 스타일 변경)
  const [scrolled, setScrolled] = useState(false);
  // 드롭다운 메뉴 열림 여부
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 드롭다운 메뉴 ref
  const dropdownRef = useRef(null);
  // 헤더 영역 ref
  const headerRef = useRef(null);
  // 헤더 높이 상태(모바일 등 레이아웃 보정용)
  const [headerHeight, setHeaderHeight] = useState(56);

  // 드롭다운 외부 클릭 시 닫기
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

  /**
   * 현재 경로가 활성화된 네비게이션인지 판별
   */
  const isActive = (path) => {
    return router.pathname === path;
  };

  // 스크롤 시 헤더 스타일 변경
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

  // 헤더 높이 측정 및 상태 반영
  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <HeaderHeightProvider value={headerHeight}>
      <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <nav className={styles.nav}>
          {/* 로고 및 홈 링크 */}
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

          {/* 주요 네비게이션 링크 */}
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

          {/* 로그인/회원/드롭다운 메뉴 */}
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
                      {session.user.role === 'admin' ? (
                        <>
                          <Link href="/admin/dashboard" className={styles.dropdownItem}>대시보드</Link>
                          <Link href="/admin/users" className={styles.dropdownItem}>회원관리</Link>
                          <Link href="/inquiries" className={styles.dropdownItem}>고객센터(관리자)</Link>
                        </>
                      ) : (
                        <>
                          <Link href="/users/mypage" className={styles.dropdownItem}>회원정보</Link>
                          <Link href="/inquiries" className={styles.dropdownItem}>고객센터</Link>
                        </>
                      )}
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
      {children}
    </HeaderHeightProvider>
  );
}