/**
 * Blog-to-Shortform Video Pipeline
 * 
 * 블로그 URL → 크롤링 → AI 분석 → 씬 생성 → Remotion 렌더링
 * n8n 없이 Next.js API Route에서 직접 처리
 */

import { db } from '@/lib/firebaseAdmin';

// ===== 타입 정의 =====

export interface BlogContent {
    title: string;
    content: string;
    images: { url: string; context: string }[];
}

export interface VideoScene {
    sceneIndex: number;
    narration: string;
    imageUrl: string;
    audioUrl: string;
    duration: number;
    imagePrompt?: string;
}

export interface PipelineResult {
    success: boolean;
    videoUrl?: string;
    error?: string;
}

// ===== 진행률 업데이트 =====

export async function updateProgress(
    jobId: string,
    progress: number,
    message: string,
    extra?: Record<string, unknown>
) {
    try {
        await db.collection('jobs').doc(jobId).update({
            progress,
            progressMessage: message,
            status: progress >= 100 ? 'completed' : 'processing',
            updatedAt: new Date().toISOString(),
            ...extra,
        });
    } catch (err) {
        console.error(`Progress update failed (${jobId}):`, err);
    }
}

// ===== 1. 블로그 크롤링 =====

export async function crawlBlog(blogUrl: string): Promise<string> {
    // PC URL → 모바일 URL 변환 (모바일이 파싱 쉬움)
    let mobileUrl = blogUrl;
    if (!blogUrl.includes('m.blog.naver.com')) {
        mobileUrl = blogUrl.replace('blog.naver.com', 'm.blog.naver.com');
    }

    const response = await fetch(mobileUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ko-KR,ko;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`블로그 크롤링 실패: ${response.status}`);
    }

    return await response.text();
}

// ===== 2. AI: 텍스트 + 이미지 추출 =====

export async function extractContent(html: string, apiKey: string): Promise<BlogContent> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `당신은 네이버 블로그 HTML을 분석하여 포스팅 제목, 본문 텍스트, 이미지 URL을 정확히 추출하는 전문가입니다.
반드시 JSON 형식으로만 응답하세요.`,
                },
                {
                    role: 'user',
                    content: `다음 네이버 블로그 모바일 HTML에서 정보를 추출해주세요:

${html.substring(0, 30000)}

다음 JSON 형식으로만 응답:
{
  "title": "포스팅 제목",
  "content": "본문 전체 텍스트",
  "images": [
    { "url": "이미지 URL", "context": "이미지 설명" }
  ]
}

[이미지 URL 추출 규칙]
- <img> 태그의 src 속성 우선
- 확장자가 .jpg, .jpeg, .png, .webp인 URL만 추출
- .gif 제외
- 썸네일이 아닌 원본 크기 이미지 선호
- URL의 ?type=w800 파라미터는 제거하여 원본 사용
- context는 이미지 주변 텍스트 기반으로 설명`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI 추출 실패: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // 이미지 URL 정리: 원본 URL로 변환
    if (content.images) {
        content.images = content.images.map((img: { url: string; context: string }) => ({
            ...img,
            url: img.url
                .replace('mblogthumb-phinf.pstatic.net', 'blogfiles.pstatic.net')
                .replace(/\?type=.*$/, ''),
        }));
    }

    return content;
}

// ===== 3. AI: 나레이션 + 씬 구성 생성 =====

export async function generateScenes(
    blogContent: BlogContent,
    apiKey: string
): Promise<VideoScene[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `당신은 한국 시장에 특화된 최고의 숏폼 영상 콘텐츠 기획자입니다.
블로그 포스팅을 분석하여 6~8개의 씬으로 구성된 숏폼 영상 계획을 만듭니다.

[규칙]
1. 모든 출력은 한국어
2. 나레이션은 구어체 (친구가 이야기하는 톤)
3. 전체 나레이션 300자 이내
4. 숫자는 한글 발음으로 변환 (예: "15세" → "십오 세")
5. 각 씬에 가장 적합한 이미지를 매칭
6. 첫 씬은 후킹용 (흥미 유발), 마지막 씬은 브랜드/마무리
7. 이미지가 부족하면 같은 이미지를 재사용 가능`,
                },
                {
                    role: 'user',
                    content: `다음 블로그 데이터로 숏폼 영상 씬을 생성해주세요.

[제목] ${blogContent.title}
[본문] ${blogContent.content.substring(0, 3000)}
[이미지 목록] ${JSON.stringify(blogContent.images)}

다음 JSON 형식으로 응답:
{
  "title": "영상 제목",
  "scenes": [
    {
      "sceneIndex": 1,
      "narration": "씬 나레이션 텍스트",
      "imageIndex": 0,
      "duration": 4
    }
  ]
}

- sceneIndex: 1부터 시작
- imageIndex: images 배열에서 이 씬에 사용할 이미지의 인덱스
- duration: 씬 길이 (초), 전체 합계 25~35초
- 반드시 이미지의 context를 참고하여 나레이션과 어울리는 이미지를 매칭하세요`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI 씬 생성 실패: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // 씬에 이미지 URL 매핑
    const scenes: VideoScene[] = result.scenes.map(
        (scene: { sceneIndex: number; narration: string; imageIndex: number; duration: number }) => {
            const imageIdx = Math.min(scene.imageIndex, blogContent.images.length - 1);
            const image = blogContent.images[Math.max(0, imageIdx)];

            return {
                sceneIndex: scene.sceneIndex,
                narration: scene.narration,
                imageUrl: image?.url || '',
                audioUrl: '', // TTS 미사용 — 텍스트 자막으로 대체
                duration: scene.duration || 4,
            };
        }
    );

    return scenes;
}

// ===== 4. 전체 파이프라인 실행 =====

export async function processBlogToVideo(
    jobId: string,
    blogUrl: string,
    userEmail: string
): Promise<PipelineResult> {
    try {
        // 사용자의 OpenAI API 키 가져오기
        const userDoc = await db.collection('users').doc(userEmail).get();
        const userData = userDoc.data();
        const apiKey = userData?.openaiApiKey;

        if (!apiKey) {
            await updateProgress(jobId, 0, '❌ OpenAI API 키가 설정되지 않았습니다.', {
                status: 'error',
                error: 'OpenAI API 키가 필요합니다. 설정 페이지에서 등록해주세요.',
            });
            return { success: false, error: 'API 키 없음' };
        }

        // Step 1: 블로그 크롤링 (10%)
        await updateProgress(jobId, 5, '🔍 블로그 크롤링 중...');
        const html = await crawlBlog(blogUrl);
        await updateProgress(jobId, 10, '✅ 블로그 크롤링 완료');

        // Step 2: AI 텍스트/이미지 추출 (30%)
        await updateProgress(jobId, 15, '🤖 블로그 내용 분석 중...');
        const blogContent = await extractContent(html, apiKey);
        await updateProgress(jobId, 30, `✅ 분석 완료 — "${blogContent.title}" (이미지 ${blogContent.images.length}개)`);

        // Step 3: AI 씬 생성 (50%)
        await updateProgress(jobId, 35, '🎬 영상 씬 구성 중...');
        const scenes = await generateScenes(blogContent, apiKey);
        await updateProgress(jobId, 50, `✅ ${scenes.length}개 씬 생성 완료`);

        // Step 4: Remotion 렌더링 (50% → 100%)
        await updateProgress(jobId, 55, '🎥 영상 렌더링 시작...');

        // Remotion Lambda 또는 로컬 렌더링
        const videoProps = {
            title: blogContent.title,
            scenes,
            blogUrl,
        };

        // Lambda 렌더링 시도
        try {
            const { triggerLambdaRender } = await import('@/lib/remotion/lambda');
            const { renderId, bucketName } = await triggerLambdaRender(videoProps, jobId);

            await updateProgress(jobId, 60, '☁️ Lambda 렌더링 진행 중...', {
                renderId,
                bucketName,
            });

            // Lambda는 webhook으로 완료를 알려주므로 여기서 반환
            return { success: true };
        } catch (lambdaErr) {
            console.warn('Lambda 렌더링 실패, 로컬 모드 확인:', lambdaErr);

            // Lambda 미설정 시 → 씬 데이터만 저장하고 완료 처리
            await updateProgress(jobId, 100, '✅ 씬 생성 완료 (렌더링은 별도 진행)', {
                status: 'completed',
                scenes: JSON.stringify(videoProps),
                videoProps,
            });

            return { success: true };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error(`Pipeline error (${jobId}):`, error);

        await updateProgress(jobId, 0, `❌ 오류: ${errorMessage}`, {
            status: 'error',
            error: errorMessage,
        });

        return { success: false, error: errorMessage };
    }
}
