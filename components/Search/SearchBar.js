import React, { useState } from 'react';
import styles from '../../styles/SearchBar.module.css';

function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        console.log('검색어:', searchTerm) // 지도 이동 및 마커 찾기 추가 예정
        if (typeof onSearch === 'function') {
            onSearch(searchTerm);
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
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                }}
            />
            <button
                className={styles.searchButton}
                onClick={() => handleSearch()}
            >
                검색
            </button>
        </div>
    );
}

export default SearchBar;