'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

type JobStatus = 'pending' | 'processing' | 'complete' | 'error';

interface Job {
    id: string;
    blogUrl: string;
    status: JobStatus;
    progress: number;
    progressMessage: string;
    videoUrl: string | null;
    errorMessage?: string;
    createdAt: Date;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

    // Firestore에서 사용자의 Job 목록 실시간 구독
    useEffect(() => {
        if (!session?.user?.email) return;

        const q = query(
            collection(db, 'jobs'),
            where('userEmail', '==', session.user.email),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobList: Job[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                jobList.push({
                    id: doc.id,
                    blogUrl: data.blogUrl,
                    status: data.status,
                    progress: data.progress || 0,
                    progressMessage: data.progressMessage || '',
                    videoUrl: data.videoUrl,
                    errorMessage: data.errorMessage,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            });
            setJobs(jobList);

            // 진행 중인 Job이 있으면 자동으로 표시
            const processingJob = jobList.find(j => j.status === 'pending' || j.status === 'processing');
            if (processingJob) {
                setActiveJob(processingJob);
            } else {
                setActiveJob(null);
            }
        }, (err) => {
            console.error('Firestore error:', err);
        });

        return () => unsubscribe();
    }, [session?.user?.email]);

    // OpenAI API 키 확인
    useEffect(() => {
        if (!session?.user?.email) return;
        fetch('/api/settings', {
            headers: { 'x-user-email': session.user.email },
        })
            .then(res => res.json())
            .then(data => setHasApiKey(data.hasKey))
            .catch(() => setHasApiKey(false));
    }, [session?.user?.email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.includes('blog.naver.com')) {
            setError('네이버 블로그 URL을 입력해주세요.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            // API 호출하여 jobId 받기 (서버에서 Firestore 저장 처리)
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogUrl: url,
                    url,
                    userId: session?.user?.id,
                    userEmail: session?.user?.email,
                }),
            });

            const result = await response.json();

            if (result.success && result.jobId) {
                // 서버에서 이미 Firestore에 저장했으므로 URL만 초기화
                setUrl('');
            } else {
                setError(result.error || '요청 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('서버 연결에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: JobStatus) => {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            processing: 'bg-cyan-500/20 text-cyan-400',
            complete: 'bg-green-500/20 text-green-400',
            error: 'bg-red-500/20 text-red-400',
        };
        const labels = {
            pending: '대기 중',
            processing: '처리 중',
            complete: '완료',
            error: '오류',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <main className="min-h-screen bg-hero">
            <div className="min-h-screen overlay-dark flex flex-col">
                {/* Header */}
                <header className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <span className="text-xl font-semibold">Blog2Clips</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">{session?.user?.email}</span>
                        <Link
                            href="/settings"
                            className="glass-card py-2 px-4 text-sm hover:border-cyan-400/50 transition-colors"
                        >
                            ⚙️ 설정
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="glass-card py-2 px-4 text-sm hover:border-red-400/50 transition-colors cursor-pointer"
                        >
                            로그아웃
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 px-6 py-8">
                    <div className="max-w-4xl mx-auto">

                        {/* API Key Missing Banner */}
                        {hasApiKey === false && (
                            <Link href="/settings" className="block mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl hover:bg-amber-500/15 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🔑</span>
                                    <div>
                                        <p className="text-amber-400 font-semibold text-sm">OpenAI API 키를 등록해주세요</p>
                                        <p className="text-amber-400/60 text-xs">영상 생성에 필요한 AI 키를 설정 페이지에서 등록할 수 있습니다 →</p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* New Job Form */}
                        <div className="glass-card mb-8">
                            <h2 className="text-2xl font-bold mb-4">🎬 새 클립 만들기</h2>
                            <form onSubmit={handleSubmit} className="flex gap-4">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://blog.naver.com/..."
                                    className="input-glass flex-1"
                                    required
                                    disabled={submitting}
                                />
                                <button
                                    type="submit"
                                    className="btn-gradient px-8"
                                    disabled={submitting}
                                >
                                    <span>{submitting ? '요청 중...' : '생성'}</span>
                                </button>
                            </form>
                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                            <p className="text-gray-500 text-sm mt-2">
                                ⏱️ 클립 생성에는 약 30분이 소요됩니다. 페이지를 닫아도 처리가 계속됩니다.
                            </p>
                        </div>

                        {/* Active Processing Job */}
                        {activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing') && (
                            <div className="glass-card mb-8 bg-processing bg-cover bg-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                                <div className="relative z-10 py-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                                        <div>
                                            <h3 className="text-xl font-semibold">클립 생성 중...</h3>
                                            <p className="text-gray-400 text-sm">{activeJob.progressMessage || '처리 중입니다'}</p>
                                        </div>
                                    </div>

                                    <div className="progress-bar mb-2">
                                        <div className="progress-fill" style={{ width: `${activeJob.progress}%` }} />
                                    </div>
                                    <p className="text-cyan-400 text-sm">{activeJob.progress}% 완료</p>
                                </div>
                            </div>
                        )}

                        {/* Job History */}
                        <div className="glass-card">
                            <h3 className="text-xl font-semibold mb-4">📋 생성 기록</h3>

                            {jobs.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">아직 생성된 클립이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {jobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-400 truncate">{job.blogUrl}</p>
                                                <p className="text-xs text-gray-600 mt-1">{formatTime(job.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {getStatusBadge(job.status)}
                                                {job.status === 'complete' && (
                                                    <a
                                                        href={`/preview?jobId=${job.id}`}
                                                        className="py-2 px-4 text-sm border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                                                    >
                                                        미리보기
                                                    </a>
                                                )}
                                                {job.status === 'complete' && job.videoUrl && (
                                                    <a
                                                        href={job.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-gradient py-2 px-4 text-sm"
                                                    >
                                                        다운로드
                                                    </a>
                                                )}
                                                {job.status === 'error' && (
                                                    <span className="text-red-400 text-xs">{job.errorMessage}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
