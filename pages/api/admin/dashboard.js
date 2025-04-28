import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../lib/db/mongodb';

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

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // 이번주 시작

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 회원가입 통계
    const newUsersToday = await usersCol.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await usersCol.countDocuments({ createdAt: { $gte: startOfWeek } });
    const newUsersThisMonth = await usersCol.countDocuments({ createdAt: { $gte: startOfMonth } });
    const newUsersThisYear = await usersCol.countDocuments({ createdAt: { $gte: startOfYear } });

    // 접속자 통계
    const activeToday = await usersCol.countDocuments({ lastLoginAt: { $gte: today } });
    const activeThisWeek = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfWeek } });
    const activeThisMonth = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfMonth } });
    const activeThisYear = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfYear } });

    // 최근 대기 문의
    const unansweredInquiries = await inquiriesCol.countDocuments({ status: 'pending' });
    const recentInquiries = await inquiriesCol.find(
      { status: 'pending' },
      { projection: { _id: 1, title: 1, content: 1, nickname: 1, email: 1, createdAt: 1 } }
    )
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    return res.status(200).json({
      totalUsers: allUsers.length,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersThisYear,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      activeThisYear,
      pendingAnswers: unansweredInquiries,
      recentInquiries,
    });
  } catch (error) {
    console.error('대시보드 데이터 불러오기 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
}