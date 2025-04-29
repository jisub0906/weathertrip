import { useState } from 'react';
import styles from '../../styles/Inquiries.module.css';
import SearchBar from '../Search/SearchBar';
import { useRouter } from 'next/router';

/**
 * 문의 등록 폼 컴포넌트
 * @param attractions - 관광지 목록 배열 (관광지 문의 시 사용)
 * @param onSearch - 관광지명 검색 콜백
 * @param onSubmitted - 문의 등록 완료 후 콜백
 * @returns 문의 등록 폼 UI
 */
const InquiryForm = ({ attractions = [], onSearch, onSubmitted }) => {
  // 문의 유형 상태
  const [type, setType] = useState('일반 문의');
  // 관광지명 검색어 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  // 선택된 관광지 ID/이름 상태
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [selectedAttractionName, setSelectedAttractionName] = useState('');
  // 제목/내용 입력 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 관광지 문의 여부
  const isTourist = type === '관광지 문의';
  // 라우터 인스턴스
  const router = useRouter();

  /**
   * 관광지명 검색 시 상태 및 부모 콜백 동기화
   */
  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    setSelectedAttractionId('');
    setSelectedAttractionName('');
    if (typeof onSearch === 'function') {
      onSearch(keyword);
    }
  };

  // 검색어에 따라 관광지 필터링
  const filteredAttractions = attractions.filter((a) =>
    a.name.includes(searchKeyword)
  );

  /**
   * 폼 제출 시 문의 등록 API 호출 및 결과 처리
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      targetType: isTourist ? 'tourist' : 'general',
      title,
      content,
      attractionId: isTourist ? selectedAttractionId : null,
      attractionName: isTourist ? selectedAttractionName : null,
    };

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        alert('문의가 등록되었습니다.');
        if (typeof onSubmitted === 'function') {
          onSubmitted();
        }
        // 폼 초기화
        setTitle('');
        setContent('');
        setSearchKeyword('');
        setSelectedAttractionId('');
        setSelectedAttractionName('');
      } else {
        alert(result.message || '등록에 실패했습니다.');
      }
    } catch (error) {
      // 등록 중 오류 발생 시 사용자에게 알림
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* 문의 유형 선택 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>문의 유형</label>
        <select
          className={styles.selectFull}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setSearchKeyword('');
            setSelectedAttractionId('');
            setSelectedAttractionName('');
          }}
        >
          <option value="일반 문의">일반 문의</option>
          <option value="관광지 문의">관광지 문의</option>
        </select>
      </div>

      {/* 관광지 검색 + 선택 or 일반문의 카테고리 선택 */}
      <div className={styles.searchRow}>
        <SearchBar
          onSearch={handleSearch}
          initialValue={searchKeyword}
          disabled={!isTourist}
        />

        <select
          className={styles.placeSelect}
          value={selectedAttractionId}
          onChange={(e) => {
            if (isTourist) {
              const selected = filteredAttractions.find(a => a._id === e.target.value);
              setSelectedAttractionId(e.target.value);
              setSelectedAttractionName(selected?.name || '');
            } else {
              setSelectedAttractionId(e.target.value);
              setSelectedAttractionName(e.target.options[e.target.selectedIndex].text);
            }
          }}
        >
          <option value="">-- 선택하세요 --</option>
          {isTourist
            ? filteredAttractions.map((a) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))
            : [
              { value: 'account', label: '계정 관련 문의' },
              { value: 'policy', label: '이용 정책 문의' },
              { value: 'bug', label: '버그 제보' },
              { value: 'suggestion', label: '오류&개선 요청사항' },
              { value: 'etc', label: '기타' },
            ].map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
          }
        </select>
      </div>

      {/* 제목 입력 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>제목</label>
        <input
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="문의 제목을 입력하세요"
          required
        />
      </div>

      {/* 내용 입력 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>내용</label>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문의 내용을 입력하세요"
          required
        />
      </div>

      {/* 버튼 영역 */}
      <div className={styles.buttonRow}>
        <button type="submit" className={styles.blueButton}>
          등록
        </button>
        <button
          type="button"
          className={styles.grayButton}
          onClick={() => router.push('/')}
        >
          홈으로
        </button>
      </div>
    </form>
  );
};

export default InquiryForm;