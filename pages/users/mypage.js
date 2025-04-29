import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Mypage.module.css';
import { signOut } from 'next-auth/react';
import Header from '../../components/Layout/Header';

/**
 * 마이페이지(회원정보 조회/수정/탈퇴) 컴포넌트
 * - 로그인한 사용자의 정보를 조회, 비밀번호 변경, 회원 탈퇴 기능 제공
 * @returns JSX.Element - 마이페이지 UI
 */
export default function MyPage() {
  // user: 현재 로그인한 사용자 정보
  const [user, setUser] = useState(null);
  // editData: 회원정보 수정 입력값 상태
  const [editData, setEditData] = useState({ password: '', confirmPassword: '' });
  // isEditing: 정보 수정 모드 여부
  const [isEditing, setIsEditing] = useState(false);
  // loading: 사용자 정보 로딩 상태
  const [loading, setLoading] = useState(true);
  // isDeleting: 회원 탈퇴 폼 표시 여부
  const [isDeleting, setIsDeleting] = useState(false);
  // withdrawData: 회원 탈퇴 입력값 상태
  const [withdrawData, setWithdrawData] = useState({ email: '', password: '' });
  // withdrawRef: 탈퇴 폼 스크롤 이동용 ref
  const withdrawRef = useRef(null);
  const router = useRouter();

  /**
   * 사용자 정보 조회(마운트 시 1회)
   * - 인증 실패 시 로그인 페이지로 이동
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/mypage');
        const data = await res.json();
        setUser(data);
        setEditData({ ...data, password: '', confirmPassword: '' });
      } catch (err) {
        router.push('/users/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  /**
   * 회원 탈퇴 폼이 열릴 때 자동 스크롤 이동
   */
  useEffect(() => {
    if (isDeleting && withdrawRef.current) {
      setTimeout(() => {
        withdrawRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isDeleting]);

  /**
   * 회원정보 입력값 변경 핸들러
   * @param e - input change 이벤트 객체
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 회원정보 저장(비밀번호 변경)
   * - 비밀번호/확인 불일치 시 경고
   * - 성공 시 사용자 정보 갱신 및 알림
   */
  const handleSave = async () => {
    if (editData.password !== editData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const res = await fetch('/api/users/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.message || '수정 중 오류가 발생했습니다.');
        return;
      }

      setUser(result);
      setIsEditing(false);
      alert('수정이 완료되었습니다.');
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  /**
   * 회원 탈퇴 요청 핸들러
   * - 이메일/비밀번호 입력값으로 탈퇴 요청
   * - 성공 시 로그아웃 및 홈으로 이동
   */
  const handleWithdraw = async () => {
    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawData),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.message || '탈퇴에 실패했습니다.');
        return;
      }

      alert('회원 탈퇴가 완료되었습니다.');
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  if (loading) return <p>불러오는 중...</p>;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.mypageBox}>
          <h1 className={styles.title}>회원정보</h1>
          <form onSubmit={(e) => e.preventDefault()}>
            {/* 이름 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">이름</label>
              <input type="text" id="name" name="name" className={styles.input} value={editData.name || ''} disabled />
            </div>

            {/* 이메일 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">이메일</label>
              <input type="email" id="email" name="email" className={styles.input} value={editData.email || ''} disabled />
            </div>

            {/* 비밀번호 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                value={editData.password}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {/* 비밀번호 확인 */}
            {isEditing && (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="confirmPassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={styles.input}
                  value={editData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* 닉네임 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                className={styles.input}
                value={editData.nickname || ''}
                onChange={handleChange}
                disabled
              />
            </div>

            {/* 성별 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>성별</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="gender" value="남성" checked={editData.gender === '남성'} onChange={handleChange} disabled />
                  남성
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="gender" value="여성" checked={editData.gender === '여성'} onChange={handleChange} disabled />
                  여성
                </label>
              </div>
            </div>

            {/* 생년월일 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="birthdate">생년월일</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                className={styles.input}
                value={editData.birthdate || ''}
                onChange={handleChange}
                disabled
              />
            </div>

            {/* 전화번호 */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phone">전화번호</label>
              <input type="text" id="phone" name="phone" className={styles.input} value={editData.phone || ''} disabled />
            </div>

            {/* 버튼 그룹 */}
            <div className={styles.buttonGroup}>
              {isEditing ? (
                <>
                  <button type="button" className={styles.editBtn} onClick={handleSave}>저장</button>
                  <button type="button" className={styles.deleteBtn} onClick={() => setIsEditing(false)}>취소</button>
                </>
              ) : (
                <>
                  <button type="button" className={styles.editBtn} onClick={() => setIsEditing(true)}>정보 수정</button>
                  <button type="button" className={styles.deleteBtn} onClick={() => setIsDeleting(true)}>회원 탈퇴</button>
                </>
              )}
            </div>

            {/* 탈퇴 확인 폼 */}
            {isDeleting && (
              <div className={styles.withdrawBox} ref={withdrawRef}>
                <h3 className={styles.withdrawTitle}>정말 탈퇴하시겠습니까?</h3>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="deleteEmail">이메일</label>
                  <input
                    type="email"
                    id="deleteEmail"
                    className={styles.input}
                    value={withdrawData.email}
                    onChange={(e) => setWithdrawData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="deletePassword">비밀번호</label>
                  <input
                    type="password"
                    id="deletePassword"
                    className={styles.input}
                    value={withdrawData.password}
                    onChange={(e) => setWithdrawData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className={styles.buttonGroup}>
                  <button type="button" className={styles.deleteBtn} onClick={handleWithdraw}>탈퇴</button>
                  <button type="button" className={styles.editBtn} onClick={() => setIsDeleting(false)}>취소</button>
                </div>
              </div>
            )}
          </form>
          <Link href="/" className={styles.link}>홈으로</Link>
        </div>
      </div>
    </>
  );
}