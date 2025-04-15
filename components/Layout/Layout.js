import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBanner from './TopBanner';
import Header from './Header';
import Footer from './Footer';
import styles from '../../styles/Layout.module.css';

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 감지 효과
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <div className={styles.layout}>
      <TopBanner />
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
} 