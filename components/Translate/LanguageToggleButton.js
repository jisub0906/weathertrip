import { useState } from 'react';
import styles from '../../styles/LanguageToggleButton.module.css';
import { FaGlobe } from 'react-icons/fa'; // npm install react-icons 필요

/**
 * 지원 언어 목록 상수
 * code: 언어 코드, label: 표시명
 */
const LANGUAGES = [
  { code: 'KO', label: '한국어' },
  { code: 'EN', label: 'English' },
  { code: 'JA', label: '日本語' },
  { code: 'ZH', label: '中文' },
  // 필요시 추가: { code: 'ZH-TW', label: '中文（繁體）' },
];

/**
 * 언어 선택 드롭다운 버튼 컴포넌트
 * @param onSelect - 언어 선택 시 호출되는 콜백 (언어 코드 인자)
 * @returns 언어 선택 UI
 */
export default function LanguageToggleButton({ onSelect }) {
  // 드롭다운 열림/닫힘 상태
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.dropdownContainer}>
      {/* 지구본 아이콘 버튼 클릭 시 드롭다운 토글 */}
      <button className={styles.globeButton} onClick={() => setOpen(!open)}>
        <FaGlobe size={20} />
      </button>

      {/* 드롭다운 메뉴 - 언어 목록 렌더링 */}
      {open && (
        <ul className={styles.dropdownMenu}>
          {LANGUAGES.map(lang => (
            <li
              key={lang.code}
              onClick={() => {
                // 언어 선택 시 콜백 호출 및 드롭다운 닫기
                onSelect(lang.code);
                setOpen(false);
              }}
              className={styles.langItem}
            >
              {lang.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
