# HN Telegram Bot

Hacker News Top 30 글 중 50점 이상인 글을 1시간마다 텔레그램으로 알려주는 봇입니다.

## 설정 방법

### 1. 텔레그램 봇 생성
1. [@BotFather](https://t.me/BotFather)에서 `/newbot` 명령으로 봇 생성
2. 봇 토큰 저장 (예: `123456789:ABCdefGHI...`)
3. 생성된 봇에게 아무 메시지나 전송

### 2. Chat ID 확인
```bash
TELEGRAM_BOT_TOKEN=your_token node src/get-chat-id.js
```

### 3. GitHub Secrets 설정
Repository Settings → Secrets and variables → Actions에서 추가:
- `AWS_ACCESS_KEY_ID`: AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 키
- `TELEGRAM_BOT_TOKEN`: 텔레그램 봇 토큰
- `TELEGRAM_CHAT_ID`: 텔레그램 채팅 ID

### 4. 배포
`main` 브랜치에 push하면 자동 배포됩니다.

## 로컬 테스트

```bash
npm install

# Chat ID 확인
TELEGRAM_BOT_TOKEN=xxx node src/get-chat-id.js

# 실행 테스트 (DynamoDB 없이는 동작 안 함, AWS 배포 후 테스트 권장)
```

## 설정 변경

`src/index.js`의 `CONFIG` 객체에서 변경:
```javascript
const CONFIG = {
  TOP_N: 30,        // 상위 몇 개까지 확인
  MIN_SCORE: 50,    // 최소 점수
  // ...
};
```

## 구조

```
├── .devcontainer/       # GitHub Codespaces 설정
├── .github/workflows/   # GitHub Actions 배포
├── src/
│   ├── index.js         # Lambda 핸들러
│   ├── local.js         # 로컬 테스트
│   └── get-chat-id.js   # Chat ID 확인
├── template.yaml        # AWS SAM 템플릿
└── package.json
```

## AWS 리소스

- **Lambda**: 1시간마다 실행
- **DynamoDB**: 알림 보낸 글 ID 저장 (7일 후 자동 삭제)
- **EventBridge**: 스케줄 트리거

## 비용

프리티어 범위 내에서 거의 무료로 운영 가능합니다.
