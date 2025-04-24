import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Pagination from '../../components/Page/Pagination';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [regulars, setRegulars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      alert('관리자만 접근 가능합니다.');
      router.replace('/');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.users.filter(u => u.role === 'admin'));
        setRegulars(data.users.filter(u => u.role !== 'admin'));
      }
    };
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

  const renderTable = (users, title) => (
    <div style={{ marginTop: '40px' }}>
      <h2>{title}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>이름</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>닉네임</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>이메일</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>전화번호</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>성별</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>생일</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>가입일</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>수정/삭제</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.name}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.nickname}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.email}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.phone}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.gender}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.birthdate || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <button style={{ marginRight: '6px' }}>수정</button>
                <button>탈퇴</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '40px' }}>
      <h1>👥 회원관리 페이지</h1>
      {renderTable(currentUsers, '일반 회원')}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      {admins.length > 0 && renderTable(admins, '관리자 계정')}
    </div>
  );
}
