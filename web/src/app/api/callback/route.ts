import { NextRequest, NextResponse } from 'next/server';

// n8n에서 호출하는 콜백 API
// 영상 생성이 완료되거나 진행률이 업데이트되면 n8n이 이 API를 호출함
// 이 API는 클라이언트에게 Firestore를 통해 업데이트를 전달함
// Firebase Admin 없이 작동하도록 간소화됨

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { job_id, status, video_url, error_message, progress, progress_message } = body;

        if (!job_id) {
            return NextResponse.json({ error: 'job_id가 필요합니다.' }, { status: 400 });
        }

        // Firebase REST API를 사용하여 Firestore 업데이트
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!projectId) {
            return NextResponse.json({ error: 'Firebase 프로젝트 ID가 설정되지 않았습니다.' }, { status: 500 });
        }

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jobs/${job_id}?updateMask.fieldPaths=status&updateMask.fieldPaths=progress&updateMask.fieldPaths=progressMessage&updateMask.fieldPaths=videoUrl&updateMask.fieldPaths=errorMessage&updateMask.fieldPaths=updatedAt`;

        const updateFields: Record<string, unknown> = {
            updatedAt: { timestampValue: new Date().toISOString() },
        };

        if (status) updateFields.status = { stringValue: status };
        if (typeof progress === 'number') updateFields.progress = { integerValue: progress.toString() };
        if (progress_message) updateFields.progressMessage = { stringValue: progress_message };
        if (video_url) updateFields.videoUrl = { stringValue: video_url };
        if (error_message) updateFields.errorMessage = { stringValue: error_message };

        const response = await fetch(firestoreUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: updateFields }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Firestore update error:', errorData);
            return NextResponse.json({ error: 'Firestore 업데이트 실패' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: '상태가 업데이트되었습니다.',
        });
    } catch (error) {
        console.error('Callback API error:', error);
        return NextResponse.json(
            { error: '상태 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
