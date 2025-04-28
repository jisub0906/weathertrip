# Weather Trip 프로젝트 문서

## 프로젝트 개요
Weather Trip은 날씨 정보를 활용한 여행 계획 도우미 애플리케이션입니다. 사용자는 실시간 날씨와 위치 정보를 기반으로 최적의 여행지를 추천받고, 다양한 관광지 정보를 확인할 수 있습니다.

## 주요 기능
- **실시간 날씨 정보**: 전국 주요 관광지의 실시간 날씨 제공
- **맞춤형 여행지 추천**: 날씨와 사용자 선호도 기반 추천
- **지도 기반 관광지 탐색**: 카카오맵 연동, 내 위치 주변 관광지 표시
- **여행지 상세 정보 및 후기**: 관광지별 상세 정보, 후기, 리뷰 제공
- **커뮤니티/문의**: 사용자 커뮤니티, 문의 및 관리 기능
- **AI/번역/퀴즈**: AI 추천, DeepL 번역, 관광지 퀴즈 등 부가 기능

## 폴더 구조 및 역할
```
├── components/   # UI 컴포넌트(배너, 지도, 카드, 챗봇 등)
├── hooks/        # 커스텀 React 훅 (ex. useLocation)
├── lib/          # DB, 미들웨어 등 서버/공통 라이브러리
├── models/       # 데이터 모델 (ex. User)
├── pages/        # Next.js 라우트(메인, 지도, 추천, 커뮤니티, API 등)
├── public/       # 정적 파일(이미지, 아이콘 등)
├── styles/       # CSS, 스타일 모듈
├── utils/        # 유틸리티 함수(날씨, 거리 계산 등)
```

## 주요 페이지
- `/` : 메인(배너, 지도, 인기 관광지 등)
- `/map` : 카카오맵 기반 관광지 탐색, 내 위치/검색/마커
- `/recommend` : 날씨 기반 맞춤 추천
- `/community` : 후기, 번역, 퀴즈 등 커뮤니티
- `/inquiries` : 문의/관리자 문의 관리
- `/about/project` : 프로젝트 소개
- `/about/team` : 팀 소개

## 주요 API 예시
- `/api/attractions/attractions` : 관광지 위치 기반 검색 (GET, 쿼리: 위도/경도/반경/날씨조건)
- `/api/weather/weather` : 위치 기반 날씨 정보
- `/api/translate/translate` : DeepL 번역
- `/api/ai/recommend` : AI 추천
- `/api/inquiries` : 문의 CRUD

## 데이터 모델 예시 (User)
- name, email, password, nickname, phone, role 등
- 비밀번호/이메일/전화번호 유효성 및 중복 체크

## 커스텀 훅 예시
- `useLocation`: 브라우저/ IP 기반 위치 정보, 카카오맵 역지오코딩 지원

## 유틸리티 예시
- `utils/weather.js`: 날씨 코드 해석, 추천 타입 분류
- `utils/distance.js`: 두 지점 거리 계산

## 기술 스택
- **프론트엔드**: React, Next.js, CSS Modules
- **백엔드**: Node.js, MongoDB, REST API
- **기타**: Git, GitHub, 카카오맵, DeepL

## 팀 소개
- **김성현(팀장)**: 전체 개발, 배너/커뮤니티/번역/추천 등
- **이민호**: 회원관리, 로그인/회원가입/문의/DB 연동
- **이지섭**: 디자인, 챗봇, UI/UX, 성능 최적화, 통합

---

> 본 프로젝트는 ICT 인재개발원 5조가 함께 기획, 설계, 개발, 배포까지 전 과정을 협업하여 완성한 첫 팀 프로젝트입니다. 사용자에게 더 나은 여행 경험을 제공하기 위해 최신 기술과 다양한 API를 적극 활용하였습니다.