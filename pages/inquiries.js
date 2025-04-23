import { useEffect, useState } from 'react';
import InquiryForm from '../components/Inquiries/InquiryForm';
import InquiryList from '../components/Inquiries/InquiryList';
import styles from '../styles/Inquiries.module.css';
import Header from '../components/Layout/Header';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [attractions, setAttractions] = useState([]);

  // 문의 목록 불러오기
  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data?.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('문의 목록 불러오기 실패:', err);
    }
  };

  // 관광지 전체 목록 불러오기
  const fetchAttractions = async () => {
    try {
      const res = await fetch('/api/attractions/all');
      const data = await res.json();
      if (data?.attractions) {
        setAttractions(data.attractions);
      }
    } catch (err) {
      console.error('관광지 목록 불러오기 실패:', err);
    }
  };

  // 삭제 및 새로고침 핸들러
  const handleDelete = async (idOrCommand) => {
    if (idOrCommand === 'refresh') {
      fetchInquiries();
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/inquiries/${idOrCommand}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchInquiries();
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 관광지명 클릭 시 map으로 이동 + 자동 포커싱
  const handleAttractionClick = (id) => {
    const selected = attractions.find((a) => a._id?.toString?.() === id);
    if (selected) {
      localStorage.setItem('searchKeyword', selected.name);
      localStorage.setItem('selectedAttractionId', selected._id);
      window.location.href = '/map';
    } else {
      alert('선택된 관광지를 찾을 수 없습니다.');
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchAttractions();
  }, []);

  return (
    <>
      <Header />
      <div className={styles.inquiriesPage}>
        <h1 className={styles.pageTitle}>고객센터</h1>

        {/* 문의 등록 폼 */}
        <InquiryForm
          attractions={attractions}
          onSearch={() => { }}
          onSubmitted={fetchInquiries}
        />

        {/* 문의 리스트 */}
        <InquiryList
          inquiries={inquiries}
          onDelete={handleDelete}
          onAttractionClick={handleAttractionClick}
        />
      </div>
    </>
  );
}