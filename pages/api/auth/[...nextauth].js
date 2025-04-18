import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { db } = await connectToDatabase();
          
          const user = await db.collection('users').findOne({ 
            email: credentials.email 
          });

          if (!user) {
            throw new Error('이메일 또는 비밀번호가 틀렸습니다.');
          }

          if (user.password !== credentials.password) {
            throw new Error('이메일 또는 비밀번호가 틀렸습니다.');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.profileImage
          };
        } catch (error) {
          throw new Error(error.message);
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/users/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 