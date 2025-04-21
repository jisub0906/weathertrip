import { useEffect, useState } from 'react';
import styles from '../../styles/Inquiries.module.css';
import SearchBar from '../Search/SearchBar';

export default function InquiryForm() {
  const [targetType, setTargetType] = useState('general');
  const [attractions, setAttractions] = useState([]);
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [selectedAttractionName, setSelectedAttractionName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchAttractions = async () => {
      const res = await fetch('/api/attractions/all');
      const data = await res.json();
      setAttractions(data.attractions || []);
    };
    fetchAttractions();
  }, []);

  useEffect(() => {
    const filtered = attractions.filter((a) => {
      return !searchKeyword || a.name?.includes(searchKeyword);
    });
    setFilteredAttractions(filtered);
  }, [searchKeyword, attractions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      targetType,
      title,
      content,
      isSecret
    };

    if (targetType === 'tourist') {
      if (!selectedAttractionId || !selectedAttractionName) {
        alert('관광지를 선택해주세요');
        return;
      }
      body.attractionId = selectedAttractionId;
      body.attractionName = selectedAttractionName;
    }

    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await res.json();
    if (res.ok) {
      alert('문의가 등록되었습니다!');
      window.location.href = '/inquiries';
    } else {
      alert(result.message || '등록 실패');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formBox}>
      <h3 className={styles.formTitle}>문의 작성</h3>

      <div className={styles.inputGroup}>
        <label className={styles.label}>문의 유형</label>
        <div className={styles.radioGroup}>
          <label><input type="radio" value="general" checked={targetType === 'general'} onChange={() => setTargetType('general')} /> 일반 문의</label>
          <label><input type="radio" value="tourist" checked={targetType === 'tourist'} onChange={() => setTargetType('tourist')} /> 관광지 관련 문의</label>
        </div>
      </div>

      {targetType === 'tourist' && (
        <>
          <div className={styles.inputGroup}>
            <label className={styles.label}>관광지 검색</label>
            <SearchBar initialValue={searchKeyword} onSearch={(term) => setSearchKeyword(term)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>관광지 선택</label>
            <select
              className={styles.select}
              value={selectedAttractionId}
              onChange={(e) => {
                const selected = filteredAttractions.find(a => a._id === e.target.value);
                setSelectedAttractionId(e.target.value);
                setSelectedAttractionName(selected?.name || '');
              }}
            >
              <option value="">-- 관광지를 선택하세요 --</option>
              {filteredAttractions.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className={styles.inputGroup}>
        <label className={styles.label}>제목</label>
        <input
          type="text"
          className={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>내용</label>
        <textarea
          className={styles.textarea}
          placeholder="문의 내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.labelInline}>
          <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} /> 비밀글로 등록
        </label>
      </div>

      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.button}>등록</button>
      </div>
    </form>
  );
}