import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';
import SearchBar from '../Search/SearchBar';

/**
 * 문의 목록을 필터링하는 관리자 전용 필터 컴포넌트
 * @param onFilter - 필터 적용 시 호출되는 콜백 (필터 객체 전달)
 * @param attractions - 관광지 목록 배열 (드롭다운용)
 * @param onSearch - 관광지명 검색 콜백
 * @returns 문의 필터 UI
 */
const InquiryAdminFilter = ({ onFilter, attractions = [], onSearch }) => {
  // 문의 유형 상태
  const [type, setType] = useState('');
  // 선택된 관광지 ID 상태
  const [locationId, setLocationId] = useState('');
  // 답변 상태
  const [status, setStatus] = useState('');
  // 이메일 검색어 상태
  const [email, setEmail] = useState('');

  /**
   * 현재 선택된 필터 조건을 부모로 전달
   */
  const handleFilter = () => {
    const filters = {};
    if (type) filters.type = type;
    if (locationId) filters.locationId = locationId;
    if (status) filters.status = status;
    if (email.trim()) filters.email = email.trim();
    onFilter(filters);
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.pageTitle}>🔍 문의 필터 (관리자 전용)</h2>

      {/* 문의 유형 선택 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>문의 유형</label>
        <select
          className={styles.selectFull}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setLocationId('');
            onSearch('');
          }}
        >
          <option value="">전체</option>
          <option value="general">일반 문의</option>
          <option value="tourist">관광지 문의</option>
        </select>
      </div>

      {/* 관광지명 검색 + 관광지 드롭다운 */}
      <div className={styles.searchRow}>
        <SearchBar
          onSearch={onSearch}
          initialValue={''}
          disabled={type !== 'tourist'}
        />
        <select
          className={`${styles.selectFull} ${styles.placeSelect}`}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={type !== 'tourist'}
        >
          <option value="">전체</option>
          {attractions.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* 답변 여부 선택 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>답변 여부</label>
        <select
          className={styles.selectFull}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">전체</option>
          <option value="pending">답변 대기</option>
          <option value="answered">답변 완료</option>
        </select>
      </div>

      {/* 필터 적용 버튼 */}
      <div className={styles.buttonRow}>
        <button className={styles.blueButton} onClick={handleFilter}>
          필터 적용
        </button>
      </div>
    </div>
  );
};

export default InquiryAdminFilter;