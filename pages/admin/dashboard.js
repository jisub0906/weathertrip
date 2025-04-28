import Header from '@/components/Layout/Header';
import styles from '../../styles/AdminDashboard.module.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    newUsersThisYear: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0,
    activeThisYear: 0,
    pendingAnswers: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [popularSpots, setPopularSpots] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) {
          console.error('대시보드 응답 실패:', await res.text());
          return;
        }
        const data = await res.json();

        setStats({
          totalUsers: data.totalUsers,
          newUsersToday: data.newUsersToday,
          newUsersThisWeek: data.newUsersThisWeek,
          newUsersThisMonth: data.newUsersThisMonth,
          newUsersThisYear: data.newUsersThisYear,
          activeToday: data.activeToday,
          activeThisWeek: data.activeThisWeek,
          activeThisMonth: data.activeThisMonth,
          activeThisYear: data.activeThisYear,
          pendingAnswers: data.pendingAnswers,
        });

        setRecentInquiries(data.recentInquiries); // ✅ 🔥 이걸 추가해야 카드들이 정상 출력돼!

        const popularRes = await fetch('/api/attractions/popular?limit=3');
        if (!popularRes.ok) {
          console.error('인기 관광지 응답 실패:', await popularRes.text());
          return;
        }
        const popularData = await popularRes.json();
        setPopularSpots(popularData.data?.attractions || []);
      } catch (err) {
        console.error('대시보드 데이터 fetch 오류:', err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <Header />
      <div className={styles.dashboardContainer}>
        <h1 className={styles.title}>📊 관리자 대시보드</h1>

        <section className={styles.statsSection}>
          <div className={styles.card}>
            <h3>전체 회원수</h3>
            <p>{stats.totalUsers}명</p>
          </div>

          <div className={styles.card}>
            <h3>오늘 가입자</h3><p>{stats.newUsersToday}명</p>
            <p className={styles.usersDate}>이번주 가입자 {stats.newUsersThisWeek}명</p>
            <p className={styles.usersDate}>이번달 가입자 {stats.newUsersThisMonth}명</p>
            <p className={styles.usersDate}>이번년 가입자 {stats.newUsersThisYear}명</p>
          </div>

          <div className={styles.card}>
            <h3>오늘 접속자</h3><p>{stats.activeToday}명</p>
            <p className={styles.usersDate}>이번주 접속자 {stats.activeThisWeek}명</p>
            <p className={styles.usersDate}>이번달 접속자 {stats.activeThisMonth}명</p>
            <p className={styles.usersDate}>이번년 접속자 {stats.activeThisYear}명</p>
          </div>
        </section >

        <section className={styles.section}>
          <h2>📥 최근 대기 문의</h2>

          <div className={styles.inquiryCards}>
            {recentInquiries.length > 0 ? (
              recentInquiries.map((item, idx) => (
                <Link
                  key={idx}
                  href={{ pathname: '/inquiries', query: { email: item.email }, hash: 'list' }}
                  className={styles.inquiryCard}
                >
                  <h3 className={styles.inquiryTitle}>{item.title}</h3>
                  <p className={styles.inquiryNickname}>by {item.nickname || '알 수 없음'}</p>
                  <p className={styles.inquiryDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <p className={styles.inquiryContent}>
                    {item.content?.slice(0, 50) || '내용 없음'}...
                  </p>
                </Link>
              ))
            ) : (
              <p>문의가 없습니다.</p>
            )}
          </div>

          <p>
            <Link href="/inquiries?filter=unanswered#list" className={styles.subLink}>
              🔔 총 답변 대기 {stats.pendingAnswers}건 확인하러 가기
            </Link>
          </p>
        </section>

        <section className={styles.section}>
          <h2>🔥 인기 관광지 TOP 3</h2>
          <div className={styles.popularCards}>
            {popularSpots.map((spot) => (
              <Link
                key={spot._id}
                href={`/map?highlight=${spot._id}`}
                className={styles.popularCard}
                onClick={() => {
                  localStorage.setItem('searchKeyword', spot.name);
                  localStorage.setItem('selectedAttractionId', spot._id);
                }}
              >
                <div className={styles.imageContainer}>
                  {spot.images?.[0] ? (
                    <img
                      src={spot.images[0]}
                      alt={spot.name}
                      className={styles.attractionImage}
                    />
                  ) : (
                    <div className={styles.noImage}>이미지 없음</div>
                  )}
                </div>
                <div className={styles.likeCount}>❤️ {spot.likeCount ?? 0}</div>
                <h3 className={styles.locationName}>{spot.name}</h3>
                <p className={styles.locationAddress}>{spot.address}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className={styles.quickLinks}>
          <Link href="/admin/users" className={styles.linkButton}>회원관리</Link>
          <Link href="/inquiries" className={styles.linkButton}>문의관리</Link>
          <Link href="/" className={styles.linkButton}>홈으로</Link>
        </div>
      </div >
    </>
  );
}