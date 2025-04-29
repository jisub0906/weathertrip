import clientPromise from '../../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

/**
 * 관리자 회원 개별 정보 수정/삭제 API 라우트 핸들러
 * - PATCH: 회원 정보 수정(중복 체크, 관리자 인증)
 * - DELETE: 회원 탈퇴(관리자 인증)
 * @param req - Next.js API 요청 객체
 * @param res - Next.js API 응답 객체
 * @returns JSON 응답(성공/실패 메시지)
 */
export default async function handler(req, res) {
  try {
    // DB 클라이언트 및 users 컬렉션 참조
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // 요청 메서드, 쿼리, 바디 등 구조 분해
    const {
      method,
      query: { id },
      body,
    } = req;

    // 관리자 세션 인증
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 없습니다.' });
    }

    switch (method) {
      case 'DELETE': {
        /**
         * 회원 탈퇴(삭제) 처리
         * - 관리자 본인 비밀번호 확인 후 대상 회원 삭제
         */
        try {
          const admin = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
          const isMatch = await bcrypt.compare(body.adminPassword, admin.password);
          if (!isMatch) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
          }

          const deletedResult = await usersCollection.deleteOne({ _id: new ObjectId(id) });
          if (deletedResult.deletedCount === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
          }

          return res.status(200).json({ message: '탈퇴 완료' });
        } catch (err) {
          // DB/서버 오류 처리
          return res.status(500).json({ message: '서버 오류' });
        }
      }

      case 'PATCH': {
        /**
         * 회원 정보 수정 처리
         * - 중복 필드 체크, 관리자 인증(필요시), 정보 업데이트
         */
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
        }

        try {
          const {
            name,
            email,
            phone,
            nickname,
            gender,
            birthdate,
            role,
            adminPassword,
          } = body;

          const targetId = new ObjectId(id);

          // 관리자 비밀번호 인증(필요시)
          if (adminPassword) {
            const admin = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
            const isMatch = await bcrypt.compare(adminPassword, admin.password);
            if (!isMatch) {
              return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
          }

          /**
           * 중복 필드 체크 함수
           * - 이메일, 전화번호, 닉네임 중복 방지
           */
          const checkDup = async (field, value, label) => {
            if (!value) return;
            const existing = await usersCollection.findOne({ [field]: value });
            if (existing && !existing._id.equals(targetId)) {
              throw new Error(`이미 사용중인 ${label}입니다.`);
            }
          };

          await checkDup('email', email, '이메일');
          await checkDup('phone', phone, '전화번호');
          await checkDup('nickname', nickname, '닉네임');

          // 회원 정보 업데이트
          const result = await usersCollection.updateOne(
            { _id: targetId },
            {
              $set: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(nickname && { nickname }),
                ...(gender !== undefined && { gender }),
                ...(birthdate && { birthdate }),
                ...(role && { role }),
              },
            }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
          }

          return res.status(200).json({ message: '수정 완료' });
        } catch (err) {
          // DB/서버 오류 및 중복 필드 에러 처리
          return res.status(400).json({ message: err.message || '수정 실패' });
        }
      }

      default:
        res.setHeader('Allow', ['DELETE', 'PATCH']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (err) {
    // 최상위 예외 처리
    return res.status(500).json({ message: '서버 내부 오류 발생' });
  }
}
