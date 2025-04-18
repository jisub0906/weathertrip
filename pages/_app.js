import "@/styles/globals.css";
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive" // beforeInteractive 대신 afterInteractive 사용
      />
      <Component {...pageProps} />
    </SessionProvider>
  );
}