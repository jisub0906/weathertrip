import "@/styles/globals.css";
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import ChatBot from '../components/Chat/ChatBot';
import useLocation from '../hooks/useLocation'; // 기존 useLocation 훅 재사용
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  // useLocation 훅을 사용하여 사용자 위치 가져오기
  const { location, error, loading } = useLocation();
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [currentPathname, setCurrentPathname] = useState('');

  // 페이지 경로 변경 감지하여 관련 관광지 정보 가져오기
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

  // 관광지 상세 정보 가져오기
  const fetchAttractionDetails = async (attractionId) => {
    try {
      const response = await fetch(`/api/attractions/${attractionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedAttraction(data);
      }
    } catch (error) {
      console.error('관광지 정보를 가져오는 중 오류 발생:', error);
    }
  };

  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY}&libraries=services&autoload=false`}
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