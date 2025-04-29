import { createContext, ReactNode } from 'react';

/**
 * 헤더 높이 값을 전역적으로 관리하기 위한 Context
 * - 기본값: 108 (px)
 * - 레이아웃 컴포넌트 등에서 헤더 높이 정보를 하위 트리로 전달할 때 사용
 */
export const HeaderHeightContext = createContext<number>(108);

/**
 * 헤더 높이 Context의 Provider
 * - value로 헤더 높이(px)를 전달
 * - 예시: <HeaderHeightProvider value={120}>{children}</HeaderHeightProvider>
 */
export const HeaderHeightProvider = HeaderHeightContext.Provider; 