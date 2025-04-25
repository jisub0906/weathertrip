// pages/api/admin/dashboard.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 없습니다.' });
  }

  try {
    const usersCol = await getCollection('users');
    const inquiriesCol = await getCollection('inquiries');

    const allUsers = await usersCol.find({}).toArray();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = allUsers.filter(user => new Date(user.createdAt) >= today).length;
    const deletedToday = 0; // 추후 삭제 여부 플래그가 있다면 계산 가능

    const unansweredInquiries = await inquiriesCol.countDocuments({ answer: { $exists: false } });
    const recentInquiries = await inquiriesCol
      .find({}, { projection: { title: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return res.status(200).json({
      totalUsers: allUsers.length,
      newUsersToday,
      deletedToday,
      pendingAnswers: unansweredInquiries,
      recentInquiries,
    });
  } catch (error) {
    console.error('대시보드 데이터 불러오기 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
}