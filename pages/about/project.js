import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import styles from '../../styles/AboutProject.module.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const Project = () => {
  const [activeSection, setActiveSection] = useState('overview');

  // 그룹핑된 섹션 구조 및 아이콘
  const groupedSections = [
    {
      group: '프로젝트 개요',
      icon: '📄',
      items: [
        { id: 'overview', title: '프로젝트 개요' },
        { id: 'purpose', title: '서비스 목적' },
        { id: 'target', title: '주요 타겟 사용자' },
        { id: 'effect', title: '기대 효과' },
      ]
    },
    {
      group: '주요 기능',
      icon: '✨',
      items: [
        { id: 'features', title: '주요 기능' },
        { id: 'weather', title: '실시간 날씨 정보' },
        { id: 'recommend', title: '맞춤형 여행 추천' },
        { id: 'plan', title: '여행 계획 관리' },
      ]
    },
    {
      group: '개발 과정',
      icon: '🛠️',
      items: [
        { id: 'process', title: '개발 과정' },
        { id: 'plan-design', title: '기획 및 설계' },
        { id: 'prototype', title: '프로토타입 개발' },
        { id: 'development', title: '본 개발' },
        { id: 'deploy', title: '배포 및 운영' },
      ]
    },
    {
      group: '기술 스택',
      icon: '🧩',
      items: [
        { id: 'tech', title: '기술 스택' },
        { id: 'frontend', title: '프론트엔드' },
        { id: 'backend', title: '백엔드' },
        { id: 'devops', title: '기타/DevOps' },
      ]
    },
  ];

  // 검색 input 상태
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef();

  // 마운트 시 검색어 강제 초기화
  useEffect(() => { setSearchTerm(''); }, []);

  // 검색 필터링된 섹션 id 목록
  const filteredSectionIds =
    searchTerm.trim() === ''
      ? groupedSections.flatMap(group => group.items.map(item => item.id))
      : groupedSections.flatMap(group =>
          group.items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(item => item.id)
        );

  // 맨 위로 스크롤 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // fade-in 애니메이션 적용을 위한 ref
  const sectionRefs = useRef({});
  useEffect(() => {
    const handleScroll = () => {
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top < window.innerHeight - 80) {
            ref.classList.add('fadeInSection');
          }
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = groupedSections.flatMap(group =>
        group.items.map(item => ({
          id: item.id,
          element: document.getElementById(item.id)
        }))
      );

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
              {/* 검색 input */}
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="문서 내 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="문서 내 검색"
              />
              {/* 공유/프린트 버튼 */}
              <div className={styles.sidebarActions}>
                <button className={styles.actionBtn} title="URL 복사" onClick={() => {navigator.clipboard.writeText(window.location.href)}}>🔗</button>
                <button className={styles.actionBtn} title="프린트" onClick={() => window.print()}>🖨️</button>
              </div>
              {/* 그룹핑된 네비게이션 */}
              <div className={styles.groupedNav}>
                {groupedSections.map(group => (
                  <div key={group.group} className={styles.navGroup}>
                    <div className={styles.groupTitle}><span className={styles.groupIcon}>{group.icon}</span>{group.group}</div>
                    <ul className={styles.nav}>
                      {group.items.map(item => {
                        // 검색어 있을 때만 필터링
                        if (searchTerm.trim() !== '' && !filteredSectionIds.includes(item.id)) return null;
                        const isActive = activeSection === item.id;
                        const isMain = item.id === group.items[0].id; // 각 그룹의 첫 항목을 대분류로 간주
                        return (
                          <li
                            key={item.id}
                            className={
                              `${isActive ? styles.active : ''} ` +
                              (isMain ? styles.mainNav : styles.subNav)
                            }
                            onClick={() => scrollToSection(item.id)}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') scrollToSection(item.id); }}
                            aria-current={isActive ? 'true' : undefined}
                          >
                            {item.title}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          <main className={styles.main}>
            <div className={styles.title}>
              <h1>Weather Trip 프로젝트</h1>
              <p>날씨와 함께하는 여행을 만들어가는 프로젝트입니다</p>
            </div>

            <div className={styles.content}>
              {groupedSections.flatMap(group =>
                group.items.map(item => (
                  <section
                    key={item.id}
                    id={item.id}
                    className={`${styles.section} fadeInSection`}
                    ref={el => (sectionRefs.current[item.id] = el)}
                  >
                    {/* 맨 위로 버튼 */}
                    <button
                      className={styles.toTopBtn}
                      onClick={scrollToTop}
                      aria-label="맨 위로 이동"
                      tabIndex={0}
                    >↑ 맨 위로</button>
                    {/* 기존 섹션 내용 렌더링 */}
                    {(() => {
                      switch (item.id) {
                        case 'overview':
                          return (<>
                            <h2>프로젝트 개요</h2>
                            <p>
                              <b>Weather Trip</b>은 사용자의 위치와 실시간 날씨 데이터를 바탕으로, 여행지 추천과 일정 관리를 한 번에 제공하는 통합 여행 플랫폼입니다.<br/>
                              여행 준비의 번거로움을 줄이고, 날씨 변수로 인한 불편을 최소화하여, 누구나 쉽고 즐겁게 여행을 계획할 수 있도록 돕는 것이 목표입니다.<br/>
                            </p>
                          </>);
                        case 'purpose':
                          return (<>
                            <h3>서비스 목적</h3>
                            <p>
                              <b>여행 준비의 자동화</b>: 사용자가 직접 정보를 찾지 않아도, 위치와 날씨에 맞는 여행지와 일정을 자동으로 추천합니다.<br/>
                              <b>날씨 기반 맞춤 추천</b>: 실시간 기상 데이터를 활용해, 비가 오면 실내, 맑으면 야외 등 상황에 맞는 여행지를 안내합니다.<br/>
                              <b>여행 경험의 질 향상</b>: 여행지 정보, 일정, 날씨, 이동거리 등 다양한 요소를 한 화면에서 확인할 수 있어, 여행의 만족도를 높입니다.<br/>
                            </p>
                          </>);
                        case 'target':
                          return (<>
                            <h3>주요 타겟 사용자</h3>
                            <ul>
                              <li>여행 초보자부터 여행 마니아까지, 누구나 쉽게 사용할 수 있도록 설계</li><br/>
                              <li>가족, 친구, 연인 등 다양한 동행 유형을 고려한 맞춤 추천</li><br/>
                              <li>날씨 변화에 민감한 야외 활동(캠핑, 등산, 드라이브 등) 선호자</li><br/>
                              <li>여행지 정보와 일정 관리를 한 번에 하고 싶은 사용자</li><br/>
                            </ul>
                          </>);
                        case 'effect':
                          return (<>
                            <h3>기대 효과</h3>
                            <ul>
                              <li>여행 준비 시간 단축: 정보 탐색, 일정 조율, 날씨 확인 등 번거로운 과정을 자동화</li><br/>
                              <li>여행 중 돌발상황 최소화: 실시간 날씨 반영으로 일정 변경/취소 등 불편 감소</li><br/>
                              <li>새로운 여행지 발굴: 인기/비인기 여행지 모두 추천, 지역 경제 활성화 기여</li><br/>
                              <li>여행 후 만족도 향상: 일정 관리, 후기 작성 등 여행의 전 과정을 지원</li><br/>
                            </ul>
                          </>);
                        case 'features':
                          return (<>
                            <h2>주요 기능</h2>
                            <ul>
                              <li>실시간 날씨 정보 제공 (기상청 API 연동, 10분 단위 갱신)</li><br/>
                              <li>맞춤형 여행지 추천 (위치, 날씨, 선호 테마, 동행 유형 등 반영)</li><br/>
                              <li>여행 일정/계획 관리 (캘린더, 리스트, 지도 뷰 지원)</li><br/>
                              <li>파이썬 크롤러로 여행지/관광지 데이터 자동 수집</li><br/>
                              <li>구글 서치 API로 여행지 이미지를 검색, imgbb 이미지 호스팅 후 링크를 몽고디비에 저장</li><br/>
                            </ul>
                          </>);
                        case 'weather':
                          return (<>
                            <h3>실시간 날씨 정보</h3>
                            <p>
                              전국 1,000여 개 주요 관광지의 실시간 날씨(온도, 습도, 풍속, 하늘상태 등) 제공<br/>
                              기상청 API와 자체 캐싱 시스템으로 빠르고 정확한 정보 제공<br/>
                              여행지별 날씨 변화 추이(예: 3시간 후, 내일 등)도 함께 안내<br/>
                            </p>
                          </>);
                        case 'recommend':
                          return (<>
                            <h3>맞춤형 여행 추천</h3>
                            <p>
                              위치, 날씨, 선호 테마(자연, 문화, 체험 등), 동행 유형(가족, 친구 등) 기반 추천<br/>
                              추천 알고리즘: 날씨 조건, 거리, 인기, 계절, 사용자 이력 등 다중 요소 반영<br/>
                              추천 결과는 카드형 UI로 제공, 클릭 시 상세 정보 및 지도 연동<br/>
                            </p>
                          </>);
                        case 'plan':
                          return (<>
                            <h3>여행 계획 관리</h3>
                            <p>
                              추천받은 여행지를 일정에 추가, 드래그&드롭으로 순서 변경 가능<br/>
                              일정별 예상 날씨, 이동 거리, 소요 시간 등 상세 정보 제공<br/>
                              여행 일정은 캘린더, 리스트, 지도 등 다양한 뷰로 확인 가능<br/>
                            </p>
                          </>);
                        case 'process':
                          return (<>
                            <h2>개발 과정</h2>
                            <ul>
                              <li>기획 및 설계: 사용자 페르소나, 요구사항 분석, 시스템 구조 설계</li><br/>
                              <li>프로토타입 개발: 핵심 기능(MVP) 우선 구현, 사용자 피드백 반영</li><br/>
                              <li>본 개발: 프론트엔드/백엔드 분업, 주요 이슈(위치 권한, API 속도 등) 해결</li><br/>
                              <li>배포 및 운영: 클라우드 서버 활용, 실시간 모니터링 및 피드백 반영</li><br/>
                            </ul>
                          </>);
                        case 'plan-design':
                          return (<>
                            <h3>기획 및 설계</h3>
                            <ul>
                              <li>사용자 페르소나 및 시나리오 기반 요구사항 도출</li><br/>
                              <li>프론트엔드/백엔드 분리, RESTful API 설계, MongoDB 스키마 설계</li><br/>
                              <li>반응형 UI/UX, 접근성(웹 표준) 고려</li><br/>
                            </ul>
                          </>);
                        case 'prototype':
                          return (<>
                            <h3>프로토타입 개발</h3>
                            <ul>
                              <li>위치 기반 날씨, 추천 알고리즘, 일정 관리 등 MVP 우선 구현</li><br/>
                              <li>실제 사용자 피드백(설문, 인터뷰) 반영하여 UI/UX, 추천 로직 개선</li><br/>
                            </ul>
                          </>);
                        case 'development':
                          return (<>
                            <h3>본 개발</h3>
                            <ul>
                              <li>프론트엔드(Next.js, React, CSS Modules)와 백엔드(Node.js, MongoDB) 분업 개발</li><br/>
                              <li>파이썬 크롤러, 구글 서치 API, imgbb 이미지 호스팅 등 외부 데이터/이미지 자동화 파이프라인 구축</li><br/>
                              <li>주요 이슈(위치 권한, API 속도, 추천 정확도 등) 발생 시 팀 내 협업으로 해결</li><br/>
                            </ul>
                          </>);
                        case 'deploy':
                          return (<>
                            <h3>배포 및 운영</h3>
                            <ul>
                              <li>클라우드 서버(Vercel 등) 활용한 무중단 배포</li><br/>
                              <li>운영 중 사용자 피드백을 반영하여 기능 개선 및 버그 수정 지속</li><br/>
                            </ul>
                          </>);
                        case 'tech':
                          return (<>
                            <h2>기술 스택</h2>
                            <ul>
                              <li>프론트엔드: React (컴포넌트 기반 UI 설계 및 상태 관리), Next.js (SSR, API 라우팅, SEO 최적화), CSS Modules (컴포넌트별 스타일 분리)</li><br/>
                              <li>백엔드: Node.js (API 서버 구현, 비동기 데이터 처리), MongoDB (여행지/이미지 데이터 저장 및 조회)</li><br/>
                              <li>데이터/이미지: 파이썬 크롤러 (여행지/관광지/이미지 데이터 자동 수집), 구글 서치 API (여행지 이미지 검색), imgbb (이미지 호스팅 및 URL 관리)</li><br/>
                              <li>DevOps: GitHub (버전 관리 및 협업), Notion (문서화 및 일정 관리)</li><br/>
                            </ul>
                            <br/>
                            <div style={{marginTop: '1.5em'}}>
                              <h4>주요 기술 코드 예시</h4>
                              <b>React - 여행지 카드 컴포넌트</b><br/>
                              <SyntaxHighlighter language="javascript" style={vscDarkPlus}>{`function PlaceCard({ place }) {\n  return (\n    <div className=\"card\">\n      <img src={place.imageUrl} alt={place.name} />\n      <h3>{place.name}</h3>\n      <p>{place.weather}</p>\n    </div>\n  );\n}`}</SyntaxHighlighter><br/>
                              <b>Next.js - 날씨 데이터 서버사이드 fetch</b><br/>
                              <SyntaxHighlighter language="javascript" style={vscDarkPlus}>{`export async function getServerSideProps() {\n  const res = await fetch('https://api.weather.com/v1/location');\n  const data = await res.json();\n  return { props: { weather: data } };\n}`}</SyntaxHighlighter><br/>
                              <b>MongoDB - 여행지 데이터 저장 쿼리</b><br/>
                              <SyntaxHighlighter language="javascript" style={vscDarkPlus}>{`db.places.insertOne({\n  name: \"경복궁\",\n  imageUrl: \"https://i.ibb.co/xxx/kyungbok.jpg\",\n  weather: \"맑음\",\n  location: \"서울 종로구\"\n})`}</SyntaxHighlighter><br/>
                              <b>파이썬 크롤러 - 여행지 이미지 링크 크롤링</b><br/>
                              <SyntaxHighlighter language="python" style={vscDarkPlus}>{`import requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://search.google.com/travel/places'\nres = requests.get(url)\nsoup = BeautifulSoup(res.text, 'html.parser')\nimg = soup.find('img')\nprint(img['src'])`}</SyntaxHighlighter><br/>
                            </div>
                          </>);
                        case 'frontend':
                          return (<>
                            <h3>프론트엔드</h3>
                            <ul className={styles.techList}>
                              <li>
                                <b>React</b> - 여행지 카드, 추천 리스트, 일정 관리 등 다양한 UI 컴포넌트 설계 및 상태 관리에 활용<br/>
                                Context API, useState, useEffect 등 React 훅을 적극적으로 사용하여 사용자 인터랙션과 데이터 흐름을 효율적으로 관리함
                              </li><br/>
                              <li>
                                <b>Next.js</b> - 서버사이드 렌더링(SSR)로 초기 로딩 속도 및 SEO 최적화, 동적 라우팅 및 API 연동 구현<br/>
                                getServerSideProps를 활용해 여행지별 상세 페이지를 SSR로 제공하고, API 라우트로 외부 데이터(날씨, 여행지 등) 연동<br/>
                              </li><br/>
                              <li>
                                <b>CSS Modules</b> - 각 컴포넌트별 스타일 분리, 클래스 중복 방지 및 유지보수성 향상<br/>
                                반응형 디자인, 다크모드 등 다양한 UI 요구사항을 컴포넌트 단위로 효율적으로 구현함
                              </li><br/>
                            </ul>
                          </>);
                        case 'backend':
                          return (<>
                            <h3>백엔드</h3>
                            <ul className={styles.techList}>
                              <li>
                                <b>Node.js</b> - 비동기 처리, 빠른 서버 환경<br/>
                                Express 기반 RESTful API 서버 구현, 여행지/날씨/일정 데이터의 실시간 제공 및 외부 API 연동 처리
                              </li><br/>
                              <li>
                                <b>MongoDB</b> - NoSQL, 유연한 데이터 모델링, 빠른 쿼리<br/>
                                여행지, 사용자, 이미지 등 다양한 데이터를 스키마 유연하게 저장하고, 복합 인덱스를 활용해 빠른 검색 및 추천 기능 구현
                              </li><br/>
                              <li>
                                <b>이미지 링크 저장</b> - imgbb에 업로드된 이미지 URL을 MongoDB에 저장하여, 여행지별 대표 이미지를 효율적으로 관리<br/>
                                파이썬 크롤러와 연동하여 수집한 이미지를 imgbb에 업로드하고, 해당 URL을 MongoDB에 저장해 프론트엔드에서 빠르게 이미지 로딩
                              </li><br/>
                            </ul>
                          </>);
                        case 'devops':
                          return (<>
                            <h3>기타/DevOps</h3>
                            <ul className={styles.techList}>
                              <li>
                                <b>Git, GitHub</b> - 버전 관리, 협업<br/>
                                GitHub Flow 전략을 적용해 브랜치별 개발, 코드 리뷰, 이슈 관리, PR 기반 협업을 진행함
                              </li><br/>
                              <li>
                                <b>Notion</b> - 문서화, 실시간 협업 및 커뮤니케이션<br/>
                                기획, 일정, 회의록, API 명세 등 프로젝트 전반의 문서화 및 팀원 간 실시간 정보 공유에 활용
                              </li><br/>
                              <li>
                                <b>Vercel</b> - 프론트엔드(Next.js) 코드 변경 시 자동 배포 및 CI/CD 파이프라인 운영<br/>
                                GitHub와 연동하여 main 브랜치에 코드가 머지될 때마다 Vercel에서 자동으로 빌드 및 배포, Preview URL을 통한 사전 검수 및 무중단 배포 실현
                              </li><br/>
                            </ul>
                          </>);
                        default:
                          return null;
                      }
                    })()}
                  </section>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Project; 