import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

// GET: 현재 API 키 조회 (마스킹 처리)
export async function GET(request: NextRequest) {
    try {
        const email = request.headers.get('x-user-email');
        if (!email) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const doc = await db.collection('users').doc(email).get();
        const data = doc.data();

        if (!data?.openaiApiKey) {
            return NextResponse.json({ hasKey: false, maskedKey: null });
        }

        // 키 마스킹: sk-****...****abcd
        const key = data.openaiApiKey;
        const masked = key.length > 8
            ? `${key.slice(0, 5)}${'*'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`
            : '****';

        return NextResponse.json({ hasKey: true, maskedKey: masked });
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: '설정 조회 실패' }, { status: 500 });
    }
}

// POST: API 키 저장 또는 테스트
export async function POST(request: NextRequest) {
    try {
        const email = request.headers.get('x-user-email');
        if (!email) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { action, apiKey } = body;

        // API 키 유효성 테스트
        if (action === 'test') {
            if (!apiKey) {
                return NextResponse.json({ valid: false, error: 'API 키를 입력해주세요.' });
            }

            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });

                if (response.ok) {
                    return NextResponse.json({ valid: true, message: 'API 키가 유효합니다.' });
                } else {
                    const err = await response.json();
                    return NextResponse.json({
                        valid: false,
                        error: err.error?.message || '유효하지 않은 API 키입니다.',
                    });
                }
            } catch {
                return NextResponse.json({ valid: false, error: 'OpenAI 서버 연결 실패' });
            }
        }

        // API 키 저장
        if (action === 'save') {
            if (!apiKey) {
                return NextResponse.json({ error: 'API 키를 입력해주세요.' }, { status: 400 });
            }

            await db.collection('users').doc(email).set(
                { openaiApiKey: apiKey, updatedAt: new Date().toISOString() },
                { merge: true }
            );

            return NextResponse.json({ success: true, message: 'API 키가 저장되었습니다.' });
        }

        // API 키 삭제
        if (action === 'delete') {
            await db.collection('users').doc(email).set(
                { openaiApiKey: '', updatedAt: new Date().toISOString() },
                { merge: true }
            );

            return NextResponse.json({ success: true, message: 'API 키가 삭제되었습니다.' });
        }

        return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
    } catch (error) {
        console.error('Settings POST error:', error);
        return NextResponse.json({ error: '설정 저장 실패' }, { status: 500 });
    }
}
