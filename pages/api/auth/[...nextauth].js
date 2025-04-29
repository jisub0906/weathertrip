import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 세션 만료 시간: 1시간(3600초)
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        const { db } = await connectToDatabase();
        
        // 1️⃣ 사용자 조회
        const user = await db.collection('users').findOne({ email: credentials.email });
        if (!user) {
          throw new Error('존재하지 않는 사용자입니다.');
        }

        // 2️⃣ 비밀번호 검증
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }

        // 3️⃣ 로그인 성공 시 마지막 로그인 시간 업데이트
        await db.collection('users').updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { lastLoginAt: new Date() } }
        );

        // 4️⃣ 사용자 정보 반환
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          role: user.role || 'user',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 로그인 시 토큰에 사용자 정보 추가
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.nickname = user.nickname;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // 세션 객체에 사용자 정보 추가
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.nickname = token.nickname;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login', // 로그인 페이지 커스터마이징
    error: '/login?error=CredentialsSignin', // 로그인 실패 시 이동 페이지
  },
};

export default NextAuth(authOptions);