'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleNaverLogin = () => {
        signIn('naver', { callbackUrl: '/dashboard' });
    };

    return (
        <main className="min-h-screen bg-hero">
            <div className="min-h-screen overlay-dark flex flex-col">
                {/* Header */}
                <header className="p-6">
                    <a href="/" className="flex items-center gap-3 w-fit">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <span className="text-xl font-semibold">Blog2Clips</span>
                    </a>
                </header>

                {/* Login Form */}
                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-md fade-in">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-3 text-glow">로그인</h1>
                            <p className="text-gray-400">서비스를 이용하려면 로그인이 필요합니다</p>
                        </div>

                        <div className="glass-card">
                            {/* 네이버 로그인 버튼 */}
                            <button
                                onClick={handleNaverLogin}
                                className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 mb-6 transition-all hover:opacity-90"
                                style={{ backgroundColor: '#03C75A' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" fill="white" />
                                </svg>
                                네이버로 로그인
                            </button>

                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-transparent text-gray-500">또는</span>
                                </div>
                            </div>

                            {/* 이메일 로그인 폼 */}
                            <form onSubmit={handleEmailLogin}>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">이메일</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="input-glass"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">비밀번호</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input-glass"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-gradient py-4 text-lg mt-2"
                                        disabled={loading}
                                    >
                                        <span>{loading ? '로그인 중...' : '이메일로 로그인'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Demo Account Info */}
                        <div className="mt-6 glass-card text-center text-sm">
                            <p className="text-gray-400 mb-2">테스트 계정</p>
                            <p className="text-cyan-400">demo@blog2clips.com</p>
                            <p className="text-purple-400">demo1234</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
