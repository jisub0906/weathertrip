import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '../../../lib/db/mongodb';
import bcrypt from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email: credentials.email });

        if (!user) throw new Error('이메일 또는 비밀번호가 틀렸습니다.');
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error('이메일 또는 비밀번호가 틀렸습니다.');

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || 'user' // ✅ 반드시 포함
        };
      }
    })
  ],
  pages: {
    signIn: '/users/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email; // ✅ email도 꼭 있어야 DB 조회 가능!
        token.role = user.role;  // ✅ 여기서 확실히 전달
      }

      // fallback 보장
      if (!token.role && token.email) {
        const { db } = await connectToDatabase();
        const foundUser = await db.collection('users').findOne({ email: token.email });
        token.role = foundUser?.role || 'user';
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
});