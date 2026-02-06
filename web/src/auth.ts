import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithCustomToken } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";

// 네이버 OAuth Provider (커스텀)
const NaverProvider = {
    id: "naver",
    name: "Naver",
    type: "oauth" as const,
    authorization: {
        url: "https://nid.naver.com/oauth2.0/authorize",
        params: {
            response_type: "code",
            client_id: process.env.NAVER_CLIENT_ID,
            redirect_uri: process.env.NAVER_REDIRECT_URI,
            state: "random_state",
        },
    },
    token: {
        url: "https://nid.naver.com/oauth2.0/token",
        async request({ params }: { params: { code: string } }) {
            const response = await fetch("https://nid.naver.com/oauth2.0/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: process.env.NAVER_CLIENT_ID!,
                    client_secret: process.env.NAVER_CLIENT_SECRET!,
                    code: params.code,
                    state: "random_state",
                }),
            });
            return { tokens: await response.json() };
        },
    },
    userinfo: {
        url: "https://openapi.naver.com/v1/nid/me",
        async request({ tokens }: { tokens: { access_token: string } }) {
            const response = await fetch("https://openapi.naver.com/v1/nid/me", {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            const data = await response.json();
            return data.response;
        },
    },
    profile(profile: { id: string; email: string; name: string; profile_image: string }) {
        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            image: profile.profile_image,
        };
    },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        NaverProvider,
        // 데모용 이메일 로그인 (개발 중 테스트용)
        CredentialsProvider({
            name: "이메일",
            credentials: {
                email: { label: "이메일", type: "email" },
                password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
                // 데모 계정
                if (
                    credentials?.email === "demo@blog2clips.com" &&
                    credentials?.password === "demo1234"
                ) {
                    return {
                        id: "demo-user",
                        name: "Demo User",
                        email: credentials.email as string,
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.provider = account?.provider;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === "/dashboard";
            const isOnLogin = nextUrl.pathname === "/login";

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false;
            } else if (isOnLogin) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
            }
            return true;
        },
    },
});
