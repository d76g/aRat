
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { PrismaAdapter } from '@next-auth/prisma-adapter'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Check user status - prevent login for pending and suspended users
        if (user.status === 'PENDING') {
          throw new Error('Your account is pending approval. Please check your email for next steps.')
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Your account has been suspended. Please contact support.')
        }

        if (user.status === 'REJECTED') {
          throw new Error('Your application was not approved. Please contact support for more information.')
        }

        // Only allow approved users to login
        if (user.status !== 'APPROVED') {
          throw new Error('Your account is not approved for access.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
          username: user.username,
          status: user.status,
          isAdmin: user.isAdmin
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.status = (user as any).status
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.status = token.status as string
        session.user.isAdmin = token.isAdmin as boolean
        
        // Only check user status occasionally to avoid database calls on every session
        // This is a simplified approach - in production you might want to cache this
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { status: true, isAdmin: true }
          })
          
          if (currentUser) {
            // If user was suspended, invalidate session
            if (currentUser.status === 'SUSPENDED') {
              throw new Error('Account suspended')
            }
            
            // Update session with current status
            session.user.status = currentUser.status
            session.user.isAdmin = currentUser.isAdmin
          }
        } catch (error) {
          console.error('Session validation error:', error)
          // Don't fail the entire session for database errors
        }
      }
      return session
    }
  }
}
