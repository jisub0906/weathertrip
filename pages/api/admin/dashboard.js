import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getCollection } from '../../../lib/db/mongodb';

/**
 * 관리자 대시보드 데이터 제공 API 라우트 핸들러
 * - 회원 통계, 접속자 통계, 최근 문의 등 관리자용 주요 지표 반환
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(통계 및 최근 문의 데이터)
 */
export default async function handler(req, res) {
  // 관리자 세션 인증
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 없습니다.' });
  }

  try {
    // users, inquiries 컬렉션 참조
    const usersCol = await getCollection('users');
    const inquiriesCol = await getCollection('inquiries');

    // 전체 회원 목록 조회(통계용)
    const allUsers = await usersCol.find({}).toArray();
    // 오늘 날짜 0시 기준 객체
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이번주/월/년 시작일 계산
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // 이번주 시작(일요일)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 회원가입 통계(기간별 신규 가입자 수)
    const newUsersToday = await usersCol.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await usersCol.countDocuments({ createdAt: { $gte: startOfWeek } });
    const newUsersThisMonth = await usersCol.countDocuments({ createdAt: { $gte: startOfMonth } });
    const newUsersThisYear = await usersCol.countDocuments({ createdAt: { $gte: startOfYear } });

    // 접속자 통계(기간별 마지막 접속자 수)
    const activeToday = await usersCol.countDocuments({ lastLoginAt: { $gte: today } });
    const activeThisWeek = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfWeek } });
    const activeThisMonth = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfMonth } });
    const activeThisYear = await usersCol.countDocuments({ lastLoginAt: { $gte: startOfYear } });

    // 최근 대기 문의(답변 대기 상태, 최신순 3건)
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
    // DB/서버 오류 처리
    console.error('대시보드 데이터 불러오기 오류:', error);
    return res.status(500).json({ message: '서버 오류' });
  }
}