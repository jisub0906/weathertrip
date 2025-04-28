import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import InquiryForm from '../components/Inquiries/InquiryForm';
import InquiryList from '../components/Inquiries/InquiryList';
import InquiryAdminFilter from '../components/Inquiries/InquiryAdminFilter';
import styles from '../styles/Inquiries.module.css';
import Header from '../components/Layout/Header';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const { email, filter } = router.query;

  const fetchMyInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data?.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('내 문의 목록 불러오기 실패:', err);
    }
  };

  const fetchAdminInquiries = async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/inquiries/admin?${query}`);
      const data = await res.json();
      if (data?.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('관리자 문의 목록 불러오기 실패:', err);
    }
  };

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
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

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

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
  };

  const handleAdminFilter = (filters) => {
    fetchAdminInquiries(filters);
  };

  useEffect(() => {
    fetchAttractions();
  }, []);

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

  useEffect(() => {
    if (router.asPath.includes('#list') && inquiries.length > 0) {
      const listElement = document.getElementById('inquiry-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [router.asPath, inquiries]);

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