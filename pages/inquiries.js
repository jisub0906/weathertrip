import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import InquiryForm from '../components/Inquiries/InquiryForm';
import InquiryList from '../components/Inquiries/InquiryList';
import InquiryAdminFilter from '../components/Inquiries/InquiryAdminFilter';
import styles from '../styles/Inquiries.module.css';
import Header from '../components/Layout/Header';

/**
 * 문의 페이지 컴포넌트
 * - 사용자/관리자 문의 등록, 목록 조회, 필터, 삭제 등 문의 관련 기능 제공
 * @returns JSX.Element - 문의 페이지 UI
 */
export default function InquiriesPage() {
  // inquiries: 문의 목록 상태
  const [inquiries, setInquiries] = useState([]);
  // attractions: 전체 관광지 목록 상태
  const [attractions, setAttractions] = useState([]);
  // searchKeyword: 관광지 검색 키워드
  const [searchKeyword, setSearchKeyword] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const { email, filter } = router.query;

  /**
   * 내 문의 목록 조회(일반 사용자)
   */
  const fetchMyInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data?.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      // 내 문의 목록 불러오기 실패 시 무시(별도 처리 불필요)
    }
  };

  /**
   * 관리자 문의 목록 조회(필터 적용 가능)
   * @param filters - 필터 객체(문의 유형, 상태 등)
   */
  const fetchAdminInquiries = async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/inquiries/admin?${query}`);
      const data = await res.json();
      if (data?.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      // 관리자 문의 목록 불러오기 실패 시 무시(별도 처리 불필요)
    }
  };

  /**
   * 전체 관광지 목록 조회
   */
  const fetchAttractions = async () => {
    try {
      const res = await fetch('/api/attractions/all');
      const data = await res.json();
      if (data?.attractions) {
        setAttractions(data.attractions);
      }
    } catch (err) {
      // 관광지 목록 불러오기 실패 시 무시(별도 처리 불필요)
    }
  };

  /**
   * 문의 삭제/새로고침 핸들러
   * @param idOrCommand - 문의 ID 또는 'refresh' 명령
   */
  const handleDelete = async (idOrCommand) => {
    if (idOrCommand === 'refresh') {
      if (session?.user?.role === 'admin') {
        fetchAdminInquiries();
      } else {
        fetchMyInquiries();
      }
      return;
    }
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/inquiries/${idOrCommand}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        if (session?.user?.role === 'admin') {
          fetchAdminInquiries();
        } else {
          fetchMyInquiries();
        }
      } else {
        alert('삭제 실패');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 관광지 카드 클릭 시 상세 페이지로 이동
   * @param id - 관광지 ObjectId
   */
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

  /**
   * 관광지 검색 키워드 변경 핸들러
   * @param keyword - 검색어
   */
  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
  };

  /**
   * 관리자 필터 변경 핸들러
   * @param filters - 필터 객체
   */
  const handleAdminFilter = (filters) => {
    fetchAdminInquiries(filters);
  };

  // 관광지 목록 최초 로드
  useEffect(() => {
    fetchAttractions();
  }, []);

  // 사용자/관리자별 문의 목록 로드
  useEffect(() => {
    if (!router.isReady || !session) return;
    if (session.user?.role === 'admin') {
      if (filter === 'unanswered') {
        fetchAdminInquiries({ status: 'pending' });
      } else {
        fetchAdminInquiries();
      }
    } else {
      fetchMyInquiries();
    }
  }, [router.isReady, session, filter]);

  // #list 해시 이동 시 문의 리스트로 스크롤
  useEffect(() => {
    if (router.asPath.includes('#list') && inquiries.length > 0) {
      const listElement = document.getElementById('inquiry-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [router.asPath, inquiries]);

  // 관광지명 검색 필터링
  const filteredAttractions = attractions.filter((a) =>
    a.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className={styles.inquiriesPage}>
        <h1 className={styles.pageTitle}>문의하기</h1>
        {session?.user?.role === 'admin' ? (
          <InquiryAdminFilter
            onFilter={handleAdminFilter}
            attractions={filteredAttractions}
            onSearch={handleSearch}
          />
        ) : (
          <InquiryForm
            attractions={attractions}
            onSearch={handleSearch}
            onSubmitted={fetchMyInquiries}
          />
        )}
        <h1 className={styles.pageTitle}>
          {session?.user?.role === 'admin' ? '전체 문의 리스트' : '내 문의 리스트'}
        </h1>
        <div id="inquiry-list">
          <InquiryList
            inquiries={inquiries}
            onDelete={handleDelete}
            onAttractionClick={handleAttractionClick}
            onFilter={handleAdminFilter}
          />
        </div>
      </div>
    </>
  );
}