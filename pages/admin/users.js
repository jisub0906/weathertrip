// pages/admin/users.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Pagination from '../../components/Page/Pagination';
import DeleteUserModal from '../../components/Admin/UserDeleteModal';
import UserEditModal from '../../components/Admin/UserEditModal';
import styles from '../../styles/AdminUsers.module.css';
import Header from '@/components/Layout/Header';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [regulars, setRegulars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      alert('관리자만 접근 가능합니다.');
      router.replace('/');
    }
  }, [session, status]);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (res.ok) {
      setAdmins(data.users.filter(u => u.role === 'admin'));
      setRegulars(data.users.filter(u => u.role !== 'admin'));
    }
  };

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  if (!session || session.user.role !== 'admin') return null;

  const totalPages = Math.ceil(regulars.length / itemsPerPage);
  const currentUsers = regulars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveUser = async (updatedData) => {
    try {
      const res = await fetch(`/api/admin/users/${updatedData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
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
      console.error('PATCH 요청 실패:', err);
      alert('서버 오류로 수정 실패');
    }
  };

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
      console.error(err);
      alert("서버 오류로 탈퇴에 실패했습니다.");
    }
  };

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
          <a href="/" className={styles.linkButton}>홈으로</a>
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
