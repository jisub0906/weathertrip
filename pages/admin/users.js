// pages/admin/users.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Pagination from '../../components/Page/Pagination';
import DeleteUserModal from '../../components/Admin/UserDeleteModal';
import UserEditModal from '../../components/Admin/UserEditModal';
import styles from '../../styles/AdminUsers.module.css';
import Header from '@/components/Layout/Header';
import Link from 'next/link';

/**
 * 관리자 회원관리 페이지 컴포넌트
 * - 일반 회원/관리자 계정 목록, 수정/탈퇴, 페이징 등 회원 관리 기능 제공
 * - 모달을 통한 회원 정보 수정 및 탈퇴 처리
 * @returns 회원관리 페이지(React 컴포넌트)
 */
export default function AdminUsersPage() {
  // 세션 정보 및 인증 상태
  const { data: session, status } = useSession();
  const router = useRouter();
  // 관리자 계정 목록
  const [admins, setAdmins] = useState([]);
  // 일반 회원 목록
  const [regulars, setRegulars] = useState([]);
  // 현재 페이지 번호(페이징)
  const [currentPage, setCurrentPage] = useState(1);
  // 한 페이지당 회원 수
  const itemsPerPage = 20;
  // 탈퇴 모달 표시 여부
  const [showModal, setShowModal] = useState(false);
  // 수정 모달 표시 여부
  const [showEditModal, setShowEditModal] = useState(false);
  // 선택된 회원 정보(수정/탈퇴용)
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    /**
     * 인증/권한 체크: 관리자가 아니면 접근 차단 및 홈으로 이동
     */
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      alert('관리자만 접근 가능합니다.');
      router.replace('/');
    }
  }, [session, status]);

  /**
   * 전체 회원 목록을 서버에서 fetch하여 관리자/일반 회원으로 분리 저장
   */
  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (res.ok) {
      setAdmins(data.users.filter(u => u.role === 'admin'));
      setRegulars(data.users.filter(u => u.role !== 'admin'));
    }
  };

  useEffect(() => {
    // 세션이 관리자일 때만 회원 목록 fetch
    if (session?.user.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  // 인증/권한 미달 시 렌더링 차단
  if (!session || session.user.role !== 'admin') return null;

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(regulars.length / itemsPerPage);
  // 현재 페이지에 표시할 회원 목록 슬라이싱
  const currentUsers = regulars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /**
   * 회원 정보 수정 저장 핸들러
   * @param updatedData - 수정된 회원 정보 객체
   * @returns void
   */
  const handleSaveUser = async (updatedData) => {
    try {
      const res = await fetch(`/api/admin/users/${updatedData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        // 서버 응답 에러 처리
        const errorText = await res.text();
        console.error('[서버 응답 에러 내용]', errorText);
        alert("수정 실패: 서버 응답 에러");
        return;
      }

      alert("회원 정보가 수정되었습니다.");
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      // 네트워크/서버 오류 처리
      console.error('PATCH 요청 실패:', err);
      alert('서버 오류로 수정 실패');
    }
  };

  /**
   * 회원 탈퇴(삭제) 확정 핸들러
   * @param adminPassword - 관리자 비밀번호(본인 인증)
   * @returns void
   */
  const handleConfirmDelete = async (adminPassword) => {
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("회원이 탈퇴되었습니다.");
        setShowModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        alert(data.message || "탈퇴 실패");
      }
    } catch (err) {
      // 네트워크/서버 오류 처리
      console.error(err);
      alert("서버 오류로 탈퇴에 실패했습니다.");
    }
  };

  /**
   * 회원 목록 테이블 렌더링 함수
   * @param users - 회원 배열
   * @param title - 테이블 제목
   * @returns JSX
   */
  const renderTable = (users, title) => (
    <div style={{ marginTop: '40px' }}>
      <h2>{title}</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>닉네임</th>
            <th>이메일</th>
            <th>전화번호</th>
            <th>성별</th>
            <th>생년월일</th>
            <th>가입일</th>
            <th>최근 접속일</th>
            <th>수정/탈퇴</th>
          </tr>
        </thead>
        <tbody>
          {/* 회원별 정보 행 렌더링 */}
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.nickname}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.gender}</td>
              <td>{user.birthdate || '-'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : '-'}
              </td>
              <td>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditModal(true);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className={styles.grayButton}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                  >
                    탈퇴
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <h1 className={styles.title}>👥 회원관리 페이지</h1>

        {renderTable(currentUsers, '일반 회원')}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {admins.length > 0 && renderTable(admins, '관리자 계정')}

        {/* ✅ 최하단 중앙 홈 버튼 위치 */}
        <div className={styles.quickLinks}>
          <Link href="/" className={styles.linkButton}>홈으로</Link>
        </div>

        {showEditModal && selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={handleSaveUser}
          />
        )}

        {showModal && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            onClose={() => {
              setShowModal(false);
              setSelectedUser(null);
            }}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </>
  );
}
