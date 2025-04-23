import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import styles from '../../styles/AboutProject.module.css';

const Project = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '프로젝트 개요' },
    { id: 'features', title: '주요 기능' },
    { id: 'process', title: '개발 과정' },
    { id: 'tech', title: '기술 스택' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }));

      const currentSection = sectionElements.find(section => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <Head>
          <title>Weather Trip - 프로젝트 소개</title>
          <meta name="description" content="Weather Trip 프로젝트 소개" />
        </Head>

        <div className={styles.layout}>
          <nav className={styles.sidebar}>
            <div className={styles.sidebarContent}>
              <h2>프로젝트 문서</h2>
              <ul className={styles.nav}>
                {sections.map(section => (
                  <li 
                    key={section.id}
                    className={activeSection === section.id ? styles.active : ''}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.title}
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <main className={styles.main}>
            <div className={styles.title}>
              <h1>Weather Trip 프로젝트</h1>
              <p>날씨와 함께하는 여행을 만들어가는 프로젝트입니다</p>
            </div>

            <div className={styles.content}>
              <section id="overview" className={styles.section}>
                <h2>프로젝트 개요</h2>
                <p>
                  Weather Trip은 날씨 정보를 활용한 여행 계획 도우미 애플리케이션입니다.
                  사용자들은 날씨 정보를 기반으로 최적의 여행 계획을 세울 수 있으며,
                  다양한 여행지의 날씨 정보를 실시간으로 확인할 수 있습니다.
                </p>
              </section>

              <section id="features" className={styles.section}>
                <h2>주요 기능</h2>
                <ul className={styles.featureList}>
                  <li>
                    <h3>실시간 날씨 정보</h3>
                    <p>전국 주요 관광지의 실시간 날씨 정보를 제공합니다</p>
                  </li>
                  <li>
                    <h3>맞춤형 여행 추천</h3>
                    <p>날씨와 사용자 선호도를 기반으로 최적의 여행지를 추천합니다</p>
                  </li>
                  <li>
                    <h3>여행 계획 관리</h3>
                    <p>날씨를 고려한 여행 일정을 쉽게 관리할 수 있습니다</p>
                  </li>
                </ul>
              </section>

              <section id="process" className={styles.section}>
                <h2>개발 과정</h2>
                <ol className={styles.processList}>
                  <li>
                    <h3>기획 및 설계</h3>
                    <p>사용자 요구사항 분석 및 시스템 설계</p>
                  </li>
                  <li>
                    <h3>프로토타입 개발</h3>
                    <p>핵심 기능 구현 및 사용자 피드백 수집</p>
                  </li>
                  <li>
                    <h3>본 개발</h3>
                    <p>전체 기능 구현 및 테스트</p>
                  </li>
                  <li>
                    <h3>배포 및 운영</h3>
                    <p>서비스 배포 및 지속적인 개선</p>
                  </li>
                </ol>
              </section>

              <section id="tech" className={styles.section}>
                <h2>기술 스택</h2>
                <div className={styles.techStack}>
                  <div className={styles.techCategory}>
                    <h3>프론트엔드</h3>
                    <ul className={styles.techList}>
                      <li>React</li>
                      <li>Next.js</li>
                      <li>TypeScript</li>
                      <li>CSS Modules</li>
                    </ul>
                  </div>

                  <div className={styles.techCategory}>
                    <h3>백엔드</h3>
                    <ul className={styles.techList}>
                      <li>Node.js</li>
                      <li>Express</li>
                      <li>MongoDB</li>
                      <li>REST API</li>
                    </ul>
                  </div>

                  <div className={styles.techCategory}>
                    <h3>기타</h3>
                    <ul className={styles.techList}>
                      <li>Git</li>
                      <li>GitHub</li>
                      <li>AWS</li>
                      <li>Docker</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Project; 