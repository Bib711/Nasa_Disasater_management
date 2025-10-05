import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getDb } from "@/lib/mongoose"
import { User } from "@/models/user"
import bcrypt from "bcryptjs"

// Factor configuration into a reusable, typed options object
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await getDb()
        const user = await User.findOne({ email: credentials.email })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        if (credentials.role && credentials.role !== user.role) return null
        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).phone = token.phone
      }
      return session
    },
  },
  pages: {},
  secret: process.env.NEXTAUTH_SECRET,
}

// Initialize NextAuth from exported options
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
