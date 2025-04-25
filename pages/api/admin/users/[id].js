import clientPromise from '../../../../lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const {
      method,
      query: { id },
      body,
    } = req;

    const session = await getServerSession(req, res, authOptions);
    console.log('[세션 정보]', session);
    console.log('[💡 사용 중인 DB]', db.databaseName);

    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 없습니다.' });
    }

    switch (method) {
      case 'DELETE': {
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
          console.error('🔥 DELETE error:', err);
          return res.status(500).json({ message: '서버 오류' });
        }
      }

      case 'PATCH': {
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

          if (adminPassword) {
            const admin = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
            const isMatch = await bcrypt.compare(adminPassword, admin.password);
            if (!isMatch) {
              return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
          }

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

          console.log('🔍 targetId:', targetId);
          const user = await usersCollection.findOne({ _id: targetId });
          console.log('🔍 조회된 사용자:', user);

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

          console.log('🛠 update 결과:', result);

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
          }

          return res.status(200).json({ message: '수정 완료' });
        } catch (err) {
          console.error('🔥 PATCH error:', err);
          return res.status(400).json({ message: err.message || '수정 실패' });
        }
      }

      default:
        res.setHeader('Allow', ['DELETE', 'PATCH']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (err) {
    console.error('🔥 Top-level handler error:', err);
    return res.status(500).json({ message: '서버 내부 오류 발생' });
  }
}
