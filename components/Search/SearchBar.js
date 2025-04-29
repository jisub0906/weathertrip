import React, { useState, useEffect } from 'react';
import styles from '../../styles/SearchBar.module.css';

/**
 * 검색바 컴포넌트
 * @param onSearch - 검색 실행 함수 (검색어를 인자로 받음)
 * @param initialValue - 입력창 초기값 (선택)
 * @param disabled - 입력/버튼 비활성화 여부 (선택)
 * @returns 검색 입력창 및 버튼 UI
 */
function SearchBar({ onSearch, initialValue = '', disabled = false }) {
  // 사용자가 입력한 검색어를 저장하는 상태
  const [searchTerm, setSearchTerm] = useState(initialValue);

  /**
   * [목적] 컴포넌트 마운트 시 초기값을 입력창에 반영
   * [의도] 외부에서 초기 검색어를 지정할 수 있도록 함
   */
  useEffect(() => {
    setSearchTerm(initialValue);
  }, []);

  /**
   * [목적] 검색 버튼 클릭 또는 Enter 입력 시 검색 실행
   * [의도] 검색어를 상위 컴포넌트로 전달
   */
  const handleSearch = () => {
    if (typeof onSearch === 'function') {
      onSearch(searchTerm);
    }
  };

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchInput}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          // Enter 키 입력 시 검색 실행
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
          }
        }}
      />
      <button
        className={styles.searchButton}
        onClick={handleSearch}
        disabled={disabled}
      >
        검색
      </button>
    </div>
  );
}

export default SearchBar;
