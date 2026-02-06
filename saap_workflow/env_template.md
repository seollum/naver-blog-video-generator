# SAAP 워크플로우 환경 설정 가이드

## 1. 필수 환경 변수 (n8n Variables)

n8n Settings → Variables에서 설정:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `MAKE_WEBHOOK_URL` | Make.com 영상 렌더링 웹훅 | `https://hook.make.com/xxx` |
| `GOOGLE_DRIVE_FOLDER_ID` | 업로드 대상 폴더 ID | `1ABC123xyz456` |

---

## 2. 자격 증명 (Credentials)

### fal.ai API (TTS용)
- **유형**: HTTP Header Auth
- **이름**: `fal.ai API`
- **설정**: Name=`Authorization`, Value=`Key YOUR_FAL_KEY`

### kie.ai API (이미지용)
- **유형**: Bearer Auth
- **이름**: `kie.ai 2` (기존 설정 재사용)
- **설정**: Token=`YOUR_KIE_API_KEY`

### OpenAI API
- **유형**: OpenAI API
- **이름**: `OpenAI Account`

### Google Drive OAuth2
- **유형**: OAuth2
- **이름**: `Google Drive Account`

---

## 3. API 엔드포인트

| 서비스 | URL | 용도 |
|--------|-----|------|
| fal.ai TTS | `queue.fal.run/fal-ai/elevenlabs/tts/eleven-v3` | 음성 |
| kie.ai Image | `api.kie.ai/api/v1/jobs/createTask` | 이미지 |

---

## 4. 워크플로우 정보

- **ID**: `5hkNTIYjD4q7kNsM`
- **Webhook**: `/webhook/senior-audiobook`
