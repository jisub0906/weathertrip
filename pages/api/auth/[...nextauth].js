import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { connectToDatabase } from '../../../lib/db/mongodb';

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1시간(3600초) 동안만 세션 유지
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
        const user = await db.collection('users').findOne({ email: credentials.email });

        if (!user) {
          throw new Error('존재하지 않는 사용자입니다.');
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          nickname: user.nickname,         // ✅ 닉네임 포함
          role: user.role || 'user',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.nickname = user.nickname; // ✅ 닉네임 전달
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.nickname = token.nickname; // ✅ 세션에 닉네임 포함!
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login?error=CredentialsSignin',
  },
};

export default NextAuth(authOptions);