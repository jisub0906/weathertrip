import styles from '../../styles/TopBanner.module.css';
import { useRouter } from "next/router";

export default function TopBanner() {
  const router = useRouter();
  const isHome = router.pathname === "/"; // 현재 경로가 홈인지 확인

  if (!isHome) return null; // 홈 에서만 보이게

  return (
    <div className={styles.banner}>
      <p>
        📣 ICT 인재개발원 5조 프로젝트 오늘의 추천 관광지를 확인해보세요! 날씨에 맞는 여행지를 소개합니다 ☀️
      </p>
    </div>
  );
}
