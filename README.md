# 후쿠오카같이오까 - Frontend

Vite + React PWA · Supabase · Vercel 배포

## 📁 디렉토리 구조

```
fukuoka-app/
├── index.html
├── package.json
├── vite.config.js          # PWA 설정 (SW + manifest)
├── vercel.json             # SPA 라우팅 + 캐시 헤더
├── .env.example            # 환경변수 템플릿
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx             # 라우터
    ├── components/
    │   ├── Layout.jsx      # 공통 레이아웃 + TabBar
    │   └── TabBar.jsx      # 하단 4탭 (스팟/채팅/교통/MY)
    ├── pages/
    │   ├── Spots.jsx       # 스팟 목록 + 카테고리/지역 필터
    │   ├── Chat.jsx        # 지역별 실시간 채팅
    │   ├── Transport.jsx   # 교통 팁
    │   ├── My.jsx          # 프로필/방문횟수/메뉴
    │   └── AuthCallback.jsx # 카카오 OAuth 콜백
    ├── lib/
    │   ├── supabase.js     # Supabase 클라이언트
    │   └── AuthContext.jsx # 인증 컨텍스트
    ├── hooks/
    │   └── useAuth.js      # 인증 + 프로필 훅
    └── styles/
        └── index.css       # 글로벌 스타일 (모바일 우선)
```

## 🚀 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 열어서 SUPABASE URL/KEY 입력

# 3. 개발 서버
npm run dev
# http://localhost:5173
```

## ☁️ Vercel 배포

### 방법 1: GitHub 연동 (권장)
1. GitHub에 푸시
2. Vercel → New Project → GitHub 레포 import
3. **Framework Preset**: `Vite` 자동 감지
4. **Environment Variables** 입력:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### 방법 2: CLI
```bash
npm i -g vercel
vercel
# 환경변수는 Dashboard에서 설정 후 vercel --prod
```

## 🔑 카카오 OAuth 연동 (Step 3에서 상세)

지금은 코드만 준비됨. 실제 동작하려면:

1. **카카오 개발자센터** → 앱 생성
2. **Web 플랫폼** 등록: `https://your-app.vercel.app`
3. **Redirect URI**: `https://<your-supabase>.supabase.co/auth/v1/callback`
4. **Supabase Dashboard** → Authentication → Providers → Kakao
   - Client ID / Secret 입력
5. **Supabase Auth** → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

## 📱 PWA 설치 테스트

배포 후:
- **iOS Safari**: 공유 → 홈 화면에 추가
- **Android Chrome**: 메뉴 → 앱 설치
- **Desktop Chrome**: 주소창 우측 설치 아이콘

## 🎨 PWA 아이콘 만들기 (배포 전)

`public/favicon.svg`를 기반으로 PNG 생성 필요:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `apple-touch-icon.png` (180x180)

→ https://realfavicongenerator.net/ 또는 Figma에서 export

## ✅ Step 2 완료 체크리스트

- [x] Vite + React 프로젝트 구조
- [x] PWA (manifest + Service Worker + 오프라인 캐싱)
- [x] React Router (4탭 + AuthCallback)
- [x] Supabase 클라이언트 + 인증 컨텍스트
- [x] 4개 페이지 기본 UI (Supabase 연결됨)
- [x] 모바일 우선 CSS (480px max-width)
- [x] Vercel 배포 설정 (vercel.json)

## 📌 다음 단계

👉 **Step 3: 카카오 OAuth 연동**
   - 카카오 개발자센터 앱 등록
   - Supabase Dashboard 설정
   - 로그인 플로우 실기기 테스트

👉 **Step 4: 샘플 데이터 입력 + Vercel 배포**
   - 스팟 10~20개 시드 데이터
   - PWA 아이콘 생성
   - 첫 배포
