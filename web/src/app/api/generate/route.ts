import { NextRequest, NextResponse } from 'next/server';

// n8n Webhook URL
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/blog-to-clips';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, userId, userEmail } = body;

        if (!url || !url.includes('blog.naver.com')) {
            return NextResponse.json(
                { error: '유효한 네이버 블로그 URL이 필요합니다.' },
                { status: 400 }
            );
        }

        // Job ID 생성
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Calling n8n webhook:', N8N_WEBHOOK_URL);
        console.log('Payload:', { job_id: jobId, blog_url: url });

        // n8n Webhook 호출 (실제 호출 + 에러 처리)
        try {
            const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: jobId,
                    blog_url: url,
                    user_id: userId || 'anonymous',
                    user_email: userEmail || '',
                    callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/callback`,
                }),
            });

            console.log('n8n response status:', webhookResponse.status);

            if (!webhookResponse.ok) {
                console.error('n8n webhook failed:', await webhookResponse.text());
            }
        } catch (webhookError) {
            // n8n 연결 실패해도 Job은 생성 (나중에 재시도 가능)
            console.error('n8n webhook connection error:', webhookError);
        }

        // 클라이언트에서 Firestore에 저장하도록 jobId 반환
        return NextResponse.json({
            success: true,
            jobId: jobId,
            message: '클립 생성이 시작되었습니다. 약 30분 정도 소요됩니다.',
        });
    } catch (error) {
        console.error('Generate API error:', error);
        return NextResponse.json(
            { error: '클립 생성 요청 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
