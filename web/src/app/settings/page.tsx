'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [apiKey, setApiKey] = useState('');
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 기존 키 조회
    useEffect(() => {
        if (!session?.user?.email) return;

        fetch('/api/settings', {
            headers: { 'x-user-email': session.user.email },
        })
            .then((res) => res.json())
            .then((data) => {
                setHasKey(data.hasKey);
                setMaskedKey(data.maskedKey);
            })
            .catch(() => { });
    }, [session?.user?.email]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleTest = async () => {
        if (!apiKey.trim()) {
            showMessage('error', 'API 키를 입력해주세요.');
            return;
        }
        setTesting(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': session?.user?.email || '',
                },
                body: JSON.stringify({ action: 'test', apiKey: apiKey.trim() }),
            });
            const data = await res.json();
            showMessage(data.valid ? 'success' : 'error', data.valid ? '✅ API 키가 유효합니다!' : `❌ ${data.error}`);
        } catch {
            showMessage('error', '서버 연결에 실패했습니다.');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            showMessage('error', 'API 키를 입력해주세요.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': session?.user?.email || '',
                },
                body: JSON.stringify({ action: 'save', apiKey: apiKey.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                showMessage('success', '✅ API 키가 저장되었습니다!');
                setApiKey('');
                setHasKey(true);
                // 마스킹된 키 업데이트
                const k = apiKey.trim();
                setMaskedKey(`${k.slice(0, 5)}${'*'.repeat(Math.min(k.length - 8, 20))}${k.slice(-4)}`);
            } else {
                showMessage('error', data.error || '저장에 실패했습니다.');
            }
        } catch {
            showMessage('error', '서버 연결에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('API 키를 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': session?.user?.email || '',
                },
                body: JSON.stringify({ action: 'delete' }),
            });
            setHasKey(false);
            setMaskedKey(null);
            showMessage('success', 'API 키가 삭제되었습니다.');
        } catch {
            showMessage('error', '삭제에 실패했습니다.');
        }
    };

    return (
        <main className="min-h-screen bg-hero">
            <div className="min-h-screen overlay-dark flex flex-col">
                {/* Header */}
                <header className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">B</span>
                            </div>
                            <span className="text-xl font-semibold">Blog2Clips</span>
                        </Link>
                    </div>
                    <Link
                        href="/dashboard"
                        className="glass-card py-2 px-4 text-sm hover:border-cyan-400/50 transition-colors"
                    >
                        ← 대시보드
                    </Link>
                </header>

                {/* Content */}
                <div className="flex-1 px-6 py-8">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-3xl font-bold mb-2">⚙️ 설정</h1>
                        <p className="text-gray-400 mb-8">영상 생성에 필요한 API 키를 관리합니다.</p>

                        {/* OpenAI API Key */}
                        <div className="glass-card mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <span className="text-xl">🔑</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">OpenAI API Key</h2>
                                    <p className="text-sm text-gray-500">블로그 분석 및 나레이션 생성에 사용됩니다</p>
                                </div>
                            </div>

                            {/* 현재 상태 */}
                            {hasKey && maskedKey && (
                                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-sm">✅ 등록됨</span>
                                        <code className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{maskedKey}</code>
                                    </div>
                                    <button
                                        onClick={handleDelete}
                                        className="text-red-400 text-xs hover:text-red-300 transition cursor-pointer"
                                    >
                                        삭제
                                    </button>
                                </div>
                            )}

                            {/* 입력 폼 */}
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={hasKey ? '새 키로 업데이트...' : 'sk-...'}
                                    className="input-glass w-full"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleTest}
                                        disabled={testing || !apiKey.trim()}
                                        className="flex-1 py-3 px-4 border border-cyan-400/30 rounded-xl text-cyan-400 hover:bg-cyan-400/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {testing ? '테스트 중...' : '🧪 테스트'}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !apiKey.trim()}
                                        className="flex-1 btn-gradient"
                                    >
                                        <span>{saving ? '저장 중...' : '💾 저장'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* 메시지 */}
                            {message && (
                                <div
                                    className={`mt-4 p-3 rounded-xl text-sm ${message.type === 'success'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}
                        </div>

                        {/* OpenAI API 키 안내 */}
                        <div className="glass-card">
                            <h3 className="text-sm font-semibold text-gray-300 mb-3">💡 OpenAI API 키 발급 방법</h3>
                            <ol className="text-sm text-gray-500 space-y-2">
                                <li>1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">platform.openai.com/api-keys</a> 접속</li>
                                <li>2. &quot;Create new secret key&quot; 클릭</li>
                                <li>3. 생성된 키를 복사하여 위에 입력</li>
                            </ol>
                            <p className="text-xs text-gray-600 mt-3">
                                ⚠️ API 키는 암호화되어 서버에 저장되며, 타인에게 공유되지 않습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-6 text-center text-gray-600 text-sm">
                    © 2026 Blog2Clips. AI로 블로그를 숏폼으로.
                </footer>
            </div>
        </main>
    );
}
