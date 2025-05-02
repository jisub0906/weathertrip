import React from "react";
import Head from "next/head";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import styles from "../../styles/AboutTeam.module.css";
import Image from "next/image";

/**
 * Weather Trip 팀 소개 페이지 컴포넌트
 * - 팀원별 역할, 기술 스택, 프로젝트 소개 등 팀의 주요 정보를 시각적으로 제공
 * - 각 팀원별 카드, 팀 설명, 프로젝트 제작 이야기 등으로 구성
 * @returns 팀 소개 페이지(React 컴포넌트)
 */
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
            <p>날씨와 여행을 연결하다!!</p>
            <p>
              현재 날씨와 위치를 기반으로 가장 가까운 최적의 여행지를 추천하는
              서비스를 만들었습니다.
            </p>
          </div>

          {/* 팀원 소개 영역: 각 팀원별 역할, 기술스택, 자기소개 등 카드 형태로 시각화 */}
          <div className={styles.teamSection}>
            <div className={styles.sectionTitle}>
              <h2>팀원 소개</h2>
              <p>Weather Trip을 함께 만든 팀원들을 만나보세요.</p>
            </div>

            <div className={styles.teamMembers}>
              {/* 김성현 팀장 카드 */}
              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image
                    src="/김성현.png"
                    alt="김성현 프로필 사진"
                    width={120}
                    height={120}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div className={styles.memberInfo}>
                  <h3>김성현</h3>
                  <p className={styles.memberRole}>팀장</p>
                  <p className={styles.memberBio}>
                    프로젝트의 기획과 전체 설계를 리드하며, AI 추천 및 번역
                    기능을 구축했습니다. 배너 영역을 구현 하였으며, 기능 디자인
                    및 API 통합 로직을 설계하였습니다. 컴포넌트 구조 최적화와
                    UI/UX 품질 향상에 집중했으며, 오류 대응 및 기능 안정성
                    확보에도 기여했습니다.
                  </p>
                  <div className={styles.memberSkills}>
                    <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>Node.js</span>
                    <span className={styles.skillTag}>MongoDB</span>
                    <span className={styles.skillTag}>TailwindCSS</span>
                    <span className={styles.skillTag}>Framer Motion</span>
                    <span className={styles.skillTag}>Axios</span>
                    <span className={styles.skillTag}>ESLint</span>
                  </div>
                </div>
              </div>

              {/* 이민호 팀원 카드 */}
              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image
                    src="/이민호.png"
                    alt="이민호 프로필 사진"
                    width={120}
                    height={120}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div className={styles.memberInfo}>
                  <h3>이민호</h3>
                  <p className={styles.memberRole}>팀원</p>
                  <p className={styles.memberBio}>
                    MongoDB 기반으로 DB 아키텍처를 설계하고 구축했습니다.
                    Next-Auth를 활용해 회원관련 인증 시스템을 구현했으며,
                    문의사항 CRUD 기능을 개발하여 데이터 흐름을 최적화했습니다.
                    또한 사용자 보안을 강화하고, 브랜드 아이덴티티 강화를 위해
                    로고 디자인까지 주도적으로 진행했습니다.
                  </p>
                  <div className={styles.memberSkills}>
                    <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>MongoDB</span>
                    <span className={styles.skillTag}>Next-Auth</span>
                    <span className={styles.skillTag}>bcryptjs</span>
                    <span className={styles.skillTag}>Axios</span>
                    <span className={styles.skillTag}>TailwindCSS</span>
                  </div>
                </div>
              </div>

              {/* 이지섭 팀원 카드 */}
              <div className={styles.memberCard}>
                <div className={styles.memberImage}>
                  <Image
                    src="/이지섭.png"
                    alt="이지섭 프로필 사진"
                    width={120}
                    height={120}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div className={styles.memberInfo}>
                  <h3>이지섭</h3>
                  <p className={styles.memberRole}>팀원</p>
                  <p className={styles.memberBio}>
                  프로젝트 컨셉과 디자인을 통합 기획하고 초기 구조를 설계했으며, CSV 기반 지도 구축과 UI/UX 최적화, 챗봇 인터랙션 구현 및 디자인 일관성에 기여했습니다. 또한 Google의 search API와 Image BB 기능을 연동하여 DB에 자동 이미지 저장 기능을 구현했습니다.
                  </p>
                  <div className={styles.memberSkills}>
                    <span className={styles.skillTag}>React</span>
                    <span className={styles.skillTag}>Next.js</span>
                    <span className={styles.skillTag}>TailwindCSS</span>
                    <span className={styles.skillTag}>PostCSS</span>
                    <span className={styles.skillTag}>HeroIcons</span>
                    <span className={styles.skillTag}>React-Icons</span>
                    <span className={styles.skillTag}>Framer Motion</span>
                    <span className={styles.skillTag}>xml2js</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 팀/프로젝트 설명 영역: 서비스 목적, 개발 동기, 팀의 성장 이야기 등 소개 */}
          <div className={styles.teamInfo}>
            <h2>Weather-Trip 소개</h2>
            <div className={styles.teamDescription}>
              <p>
                Weather Trip은 날씨 정보를 활용하여 사용자의 현재 위치를
                기반으로 최적의 관광지를 추천하는 맞춤형 여행 도우미
                애플리케이션입니다. 우리 팀은 사용자가 실시간 날씨 정보에 따라
                가장 알맞은 여행 계획을 세울 수 있도록 지원하고, 주변 관광지를
                쉽고 빠르게 탐색할 수 있는 기능을 중심으로 서비스를
                개발했습니다. 또한 다양한 관광지에 대한 정보를 확인하고, 리뷰를
                통해 다른 사용자들과 소통할 수 있는 커뮤니티 기능도 함께
                마련하여, 여행 경험을 풍성하게 만들고자 노력했습니다.
              </p>
              <h2>프로젝트 제작 이야기</h2>
              <p>
                이 프로젝트는 개발에 첫발을 내디딘 우리 팀이 학원에서 함께 땀
                흘리며 완성해낸 첫 번째 결과물이자, 수많은 고민과 시행착오,
                그리고 끊임없는 학습의 과정을 통해 만들어낸 소중한 성과입니다.
                모두가 생소한 기술들을 하나하나 익혀가며, 보다 사용자 친화적인
                서비스를 구축하기 위해 매 순간 치열하게 고민하고 협력해왔습니다.
                Weather Trip은 단순한 프로젝트를 넘어, 사용자에게 더 나은 여행
                경험을 제공하고자 하는 진심과, 팀원 간의 성장과 열정이 담긴
                결과물입니다. 앞으로도 우리는 이 경험을 바탕으로 더욱 완성도
                높은 서비스를 만들어갈 것입니다.
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
