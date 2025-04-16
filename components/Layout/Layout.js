import React from 'react';
import TopBanner from './TopBanner';
import Header from './Header';
import Footer from './Footer';
import styles from '../../styles/Layout.module.css';

export default function Layout({ children, hideFooter }) {
  return (
    <div className={styles.layout}>
      <TopBanner />
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
} 