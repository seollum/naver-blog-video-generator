import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { processBlogToVideo } from '@/lib/pipeline';

export async function POST(request: NextRequest) {
    try {
        // 1. 클라이언트가 보낸 블로그 주소 받기
        const body = await request.json();
        const { blogUrl, url, userId, userEmail } = body;

        // blogUrl 또는 url 둘 다 지원 (호환성)
        const targetUrl = blogUrl || url;

        if (!targetUrl || !targetUrl.includes('blog.naver.com')) {
            return NextResponse.json(
                { error: '유효한 네이버 블로그 URL이 필요합니다.' },
                { status: 400 }
            );
        }

        // 2. 이메일 확인 (API 키 조회에 필요)
        if (!userEmail) {
            return NextResponse.json(
                { error: '로그인 정보가 필요합니다.' },
                { status: 401 }
            );
        }

        // 3. OpenAI API 키 확인
        const userDoc = await db.collection('users').doc(userEmail).get();
        const userData = userDoc.data();
        if (!userData?.openaiApiKey) {
            return NextResponse.json(
                { error: 'OpenAI API 키가 설정되지 않았습니다. 설정 페이지에서 등록해주세요.' },
                { status: 400 }
            );
        }

        // 4. 작업 ID 생성 (Firestore에서 자동 생성)
        const jobRef = db.collection('jobs').doc();
        const jobId = jobRef.id;

        // 5. Firestore에 "대기 중" 상태로 기록
        await jobRef.set({
            userId: userId || 'anonymous',
            userEmail: userEmail || '',
            blogUrl: targetUrl,
            originalUrl: targetUrl,
            status: 'pending',
            progress: 0,
            progressMessage: '작업 요청 중...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // 6. 파이프라인 비동기 실행 (응답을 기다리지 않음)
        processBlogToVideo(jobId, targetUrl, userEmail).catch(err => {
            console.error('Pipeline error:', err);
        });

        // 7. 클라이언트에게 작업 ID 반환
        return NextResponse.json({
            success: true,
            jobId: jobId,
            message: '영상 생성이 시작되었습니다.',
        });
    } catch (error) {
        console.error('Generate API error:', error);
        return NextResponse.json(
            { error: '영상 생성 요청 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
