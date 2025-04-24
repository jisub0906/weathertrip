import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';
import SearchBar from '../Search/SearchBar';

const InquiryAdminFilter = ({ onFilter, attractions = [], onSearch }) => {
  const [type, setType] = useState('');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState(''); // ✅ 이메일 검색 추가

  const handleFilter = () => {
    const filters = {};
    if (type) filters.type = type;
    if (locationId) filters.locationId = locationId;
    if (status) filters.status = status;
    if (email.trim()) filters.email = email.trim(); // ✅ 필터에 추가
    onFilter(filters);
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.pageTitle}>🔍 문의 필터 (관리자 전용)</h2>

      {/* 문의 유형 */}
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

      {/* 관광지 검색 + 드롭다운 */}
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

      {/* 답변 여부 */}
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

      <div className={styles.buttonRow}>
        <button className={styles.blueButton} onClick={handleFilter}>
          필터 적용
        </button>
      </div>
    </div>
  );
};

export default InquiryAdminFilter;