import { connectToDatabase } from '../../../lib/db/mongodb';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const { name, email, nickname, phone, birthdate, gender, password } = req.body;

    try {
        const { db } = await connectToDatabase();

        // ✅ 닉네임 중복 체크
        if (nickname) {
            const duplicate = await db.collection('users').findOne({
                nickname,
                _id: { $ne: new ObjectId(token.id) }, // 본인 제외
            });

            if (duplicate) {
                return res.status(400).json({ message: '이미 사용중인 닉네임입니다.' });
            }
        }

        const updateFields = {
            nickname,
            birthdate,
            gender,
        };

        if (password && password.trim() !== '') {
            const hashed = await bcrypt.hash(password, 10);
            updateFields.password = hashed;
        } else {
            // ✅ 기존 비밀번호 유지
            const existing = await db.collection('users').findOne({ _id: new ObjectId(token.id) });
            if (existing && existing.password) {
                updateFields.password = existing.password;
            }
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(token.id) },
            { $set: updateFields }
        );

        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(token.id) });

        const { password: pw, ...safeUser } = updatedUser;
        return res.status(200).json(safeUser);
    } catch (err) {
        console.error('회원정보 수정 오류:', err);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
}