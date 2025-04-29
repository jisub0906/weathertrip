import { Html, Head, Main, NextScript } from "next/document";
import Script from 'next/script';

/**
 * 커스텀 Document 컴포넌트(Next.js _document)
 * - HTML, Head, Body, 글로벌 폰트/파비콘/외부 스크립트 등 전체 문서 구조 정의
 * @returns JSX.Element - 전체 HTML 문서 구조
 */
export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 파비콘 및 폰트 프리로드/적용 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        {/* 메인 앱 콘텐츠 렌더링 */}
        <Main />
        {/* Next.js 스크립트 및 외부 Kakao 지도 SDK */}
        <NextScript />
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.KAKAO_MAP_JAVASCRIPT_KEY}&libraries=services&autoload=false`}
        />
      </body>
    </Html>
  );
}