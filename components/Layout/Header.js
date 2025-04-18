import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from '../../styles/Header.module.css';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className={styles.header}>
      {/* 상단 바: 로고 + 상태내역역 */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="logo" 
              width={330} 
              height={60} 
              priority
              quality={100}
              style={{
                objectFit: 'contain',
                width: 'auto',
                height: 'auto'
              }}
            />
          </Link>
        </div>
        <div className={styles.auth}>
          {status === 'authenticated' ? (
            <>
              <span className={styles.userName}>{session.user.name}님</span>
              <button onClick={() => signOut()} className={styles.logoutButton}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/users/login">로그인</Link>
              <Link href="/users/register">회원가입</Link>
            </>
          )}
        </div>
      </div>
      {/* 내비게이션 바 */}
      <nav className={styles.navBar}>
        <ul className={styles.navList}>
          <li className={styles.navItem}><Link href="/">홈</Link></li>
          <li className={styles.navItem}><Link href="/recommend">맞춤 추천</Link></li>
          <li className={styles.navItem}><Link href="/map">지도</Link></li>
        </ul>
      </nav>
    </header>
  );
}