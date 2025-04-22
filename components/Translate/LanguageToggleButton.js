import { useState } from 'react';
import styles from '../../styles/LanguageToggleButton.module.css';
import { FaGlobe } from 'react-icons/fa'; // npm install react-icons 필요

const LANGUAGES = [
  { code: 'KO', label: '한국어' },
  { code: 'EN', label: 'English' },
  { code: 'JA', label: '日本語' },
  { code: 'ZH', label: '中文' },
  // 필요시 추가: { code: 'ZH-TW', label: '中文（繁體）' },
];

export default function LanguageToggleButton({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.dropdownContainer}>
      <button className={styles.globeButton} onClick={() => setOpen(!open)}>
        <FaGlobe size={20} />
      </button>

      {open && (
        <ul className={styles.dropdownMenu}>
          {LANGUAGES.map(lang => (
            <li
              key={lang.code}
              onClick={() => {
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
