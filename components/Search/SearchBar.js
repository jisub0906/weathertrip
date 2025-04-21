import React, { useState, useEffect } from 'react';
import styles from '../../styles/SearchBar.module.css';

// 검색바 컴포넌트
// props: onSearch (검색 함수), initialValue (초기값)
function SearchBar({ onSearch, initialValue = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // 처음 로딩 시 initialValue 설정 (처음 1회만)
  useEffect(() => {
    setSearchTerm(initialValue); // 사용자가 입력한 검색어를 저장하는 state
  }, []); // 빈 배열을 넣어주면 컴포넌트가 처음 렌더링될 때만 실행됨

  // 검색 버튼 클릭 시 검색어를 콘솔에 출력하고 onSearch 함수 호출
  const handleSearch = () => {
    console.log('검색어:', searchTerm);
    if (typeof onSearch === 'function') { // onSearch가 함수인지 확인
      onSearch(searchTerm);  // 검색어를 인자로 전달하여 onSearch 함수 호출
    } else {
      console.warn('⚠️ 검색 함수(onSearch)가 전달되지 않았어요!');
    }
  };

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchInput}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      />
      <button
        className={styles.searchButton}
        onClick={handleSearch}
      >
        검색
      </button>
    </div>
  );
}

export default SearchBar;
