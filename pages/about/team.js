import React from 'react';
import Head from 'next/head';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import styles from '../../styles/AboutTeam.module.css';
import Image from 'next/image';

const Team = () => {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <Head>
          <title>Weather Trip - 팀 소개</title>
          <meta name="description" content="Weather Trip 프로젝트 팀 소개" />
        </Head>

        <main className={styles.main}>
          <div className={styles.title}>
            <h1>Weather Trip 팀</h1>
            <p>날씨와 함께하는 여행 만든 팀을 소개합니다!</p>
          </div>

          <div className={styles.teamSection}>
            <div className={styles.sectionTitle}>
              <h2>팀원 소개</h2>
              <p>Weather Trip을 함께 만든 팀원들을 만나보세요.</p>
            </div>

            <div className={styles.teamMembers}>
              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image src="/김성현.png" alt="김성현 프로필 사진" width={120} height={120} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div className={styles.memberInfo}>
                  <h3>김성현</h3>
                  <p className={styles.memberRole}>팀장</p>
                  <p className={styles.memberBio}>
                    모든 부분을 함께 진행했습니다. 또한 전체적인 배너, 커뮤니티 페이지 번역기능과 맞춤추천 코멘트 등 다양한 api를 활용한 개발을
                    진행하였습니다. 
                  </p>
                  <div className={styles.memberSkills}>
                    <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>JavaScript</span>
                    <span className={styles.skillTag}>MongoDB</span>
                    <span className={styles.skillTag}>CSS</span>
                  </div>
                </div>
              </div>

              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image src="/이민호.png" alt="이민호 프로필 사진" width={120} height={120} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div className={styles.memberInfo}>
                  <h3>이민호</h3>
                  <p className={styles.memberRole}>팀원</p>
                  <p className={styles.memberBio}>
                  모든 부분을 함께 진행했습니다. 또한 회원 관리를 도맡아서 진행했습니다.
                    로그인, 회원가입, 문의사항 등 전반적인 CRUD등을 담당해서 데이터베이스와의
                    연동을 진행했습니다.
                  </p>
                  <div className={styles.memberSkills}>
                  <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>JavaScript</span>
                    <span className={styles.skillTag}>MongoDB</span>
                    <span className={styles.skillTag}>CSS</span>
                  </div>
                </div>
              </div>

              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image src="/이지섭.png" alt="이지섭 프로필 사진" width={120} height={120} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div className={styles.memberInfo}>
                  <h3>이지섭</h3>
                  <p className={styles.memberRole}>팀원</p>
                  <p className={styles.memberBio}>
                  모든 부분을 함께 진행했습니다. 또한 디자인과 개발의 조화를 추구하며 챗봇,
                    사용자 중심의 인터페이스를 구현하고 성능을 최적화하는데 주력했습니다.
                  </p>
                  <div className={styles.memberSkills}>
                  <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>JavaScript</span>
                    <span className={styles.skillTag}>MongoDB</span>
                    <span className={styles.skillTag}>CSS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.teamInfo}>
            <h2>팀 소개</h2>
            <div className={styles.teamDescription}>
              <p>
                Weather Trip은 날씨 정보를 활용한 관광지 맞춤 도우미 애플리케이션입니다.
                우리 팀은 사용자들이 날씨 정보를 기반으로 최적의 관광 계획을 세울 수 있도록
                돕는 서비스를 개발했습니다.
              </p>
              <p>
                취업을 바라보고 학원에와 개발에 첫발을 내디딘후 다같이 어려움을 뚫고 
                함께 공부를 하며 진행한 첫 프로젝트 입니다.
                사용자들에게 더 나은 관광 경험을 제공하기 위해 노력했습니다.
                모두가 새로운 기술에 대해 접하고 공부를하며 사용자 친화적인
                서비스를 만들어가고 있습니다.
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Team; 