import { getCollection } from '../../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

/**
 * 관리자 회원 목록 조회 API 라우트 핸들러
 * - GET: 전체 회원 목록(비밀번호 제외) 반환, 최신 가입순 정렬
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(회원 배열)
 */
export default async function handler(req, res) {
  // GET 메서드만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  // 관리자 세션 인증
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
  }

  try {
    // users 컬렉션에서 전체 회원 목록 조회(비밀번호 제외, 최신순 정렬)
    const usersCollection = await getCollection('users');
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ users });
  } catch (error) {
    // DB/서버 오류 처리
    console.error('유저 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}