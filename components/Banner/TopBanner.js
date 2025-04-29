import styles from '../../styles/TopBanner.module.css';

/**
 * 페이지 상단에 고정되어 오늘의 추천 관광지 안내 메시지를 보여주는 배너 컴포넌트
 * @returns 상단 안내 배너 UI
 */
export default function TopBanner() {
  return (
    <div className={styles.topBanner}>
      <div className={styles.bannerContent}>
        {/* 경고/안내 아이콘 SVG */}
        <span className={styles.icon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        {/* 안내 메시지 텍스트 */}
        <p className={styles.text}>
          ICT 인재개발원 5조 프로젝트 오늘의 추천 관광지를 확인해보세요! 날씨에 맞는 여행지를 소개합니다 ☀️🌧️
        </p>
      </div>
    </div>
  );
}