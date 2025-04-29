import "@/styles/globals.css";
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import ChatBot from '../components/Chat/ChatBot';
import useLocation from '../hooks/useLocation'; // 기존 useLocation 훅 재사용
import Head from 'next/head';

/**
 * App 컴포넌트(Next.js 커스텀 _app)
 * - 전역 스타일, 세션, 공통 레이아웃, 사용자 위치 및 관광지 정보 관리
 * @param Component - 렌더링할 페이지 컴포넌트
 * @param pageProps - 각 페이지의 props
 * @returns JSX.Element - 전체 앱 UI
 */
export default function App({ Component, pageProps }) {
  // useLocation 훅을 사용하여 사용자 위치 가져오기
  const { location, error, loading } = useLocation();
  // selectedAttraction: 현재 선택된 관광지 정보 상태
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  // currentPathname: 현재 페이지 경로 상태
  const [currentPathname, setCurrentPathname] = useState('');

  /**
   * 페이지 경로 변경 및 로컬스토리지/URL에서 관광지 ID 추출하여 상세 정보 조회
   * - /map에서 선택된 관광지 또는 /attractions/[id] 경로에서 ID 추출
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      setCurrentPathname(pathname);
      
      // '/map' 페이지에서 선택된 관광지가 있는 경우
      const savedAttractionId = localStorage.getItem('selectedAttractionId');
      if (savedAttractionId) {
        fetchAttractionDetails(savedAttractionId);
      } else {
        // URL이 '/attractions/[id]' 형태인 경우 관광지 ID 추출
        const attractionMatch = pathname.match(/\/attractions\/([^\/]+)/);
        if (attractionMatch && attractionMatch[1]) {
          const attractionId = attractionMatch[1];
          fetchAttractionDetails(attractionId);
        } else {
          setSelectedAttraction(null);
        }
      }
    }
  }, []);

  /**
   * 관광지 상세 정보 가져오기
   * @param attractionId - 관광지 ObjectId
   */
  const fetchAttractionDetails = async (attractionId) => {
    try {
      const response = await fetch(`/api/attractions/attractions?id=${attractionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedAttraction(data);
      }
    } catch (error) {
      // 관광지 정보 조회 실패 시 무시(별도 처리 불필요)
    }
  };

  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.KAKAO_MAP_JAVASCRIPT_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
      <ChatBot 
        selectedAttraction={selectedAttraction} 
        userLocation={location}
      />
    </SessionProvider>
  );
}