import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  // 로그인된 사용자는 대시보드로 리다이렉트
  if (session?.user) {
    redirect('/dashboard');
  }

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
          <Link
            href="/login"
            className="glass-card py-2 px-6 text-sm hover:border-cyan-400/50 transition-colors"
          >
            로그인
          </Link>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl text-center fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-glow leading-tight">
              블로그를<br />클립으로
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-xl mx-auto">
              네이버 블로그 링크 하나로<br />50초 클립 영상을 자동 생성합니다
            </p>

            <Link
              href="/login"
              className="btn-gradient inline-block py-4 px-12 text-lg"
            >
              <span>🎬 시작하기</span>
            </Link>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              {[
                { icon: '⚡', title: 'AI 스크립트', desc: 'GPT가 블로그 내용을 분석하여 나레이션 스크립트를 자동 작성합니다' },
                { icon: '🎙️', title: '자연스러운 TTS', desc: 'ElevenLabs의 고품질 음성으로 자연스러운 나레이션을 생성합니다' },
                { icon: '✨', title: '자막 포함', desc: 'Gemini AI가 음성을 분석하여 정확한 SRT 자막을 생성합니다' }
              ].map((f, i) => (
                <div key={i} className="glass-card text-center p-6">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <div className="font-semibold text-lg mb-2">{f.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-600 text-sm">
          © 2026 Blog2Clips. AI로 블로그를 영상으로.
        </footer>
      </div>
    </main>
  );
}
