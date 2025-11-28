// 로컬에서 테스트할 때 사용
// 사용법: TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy node src/local.js

import { handler } from "./index.js";

// 로컬 테스트용 환경변수 체크
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN 환경변수를 설정하세요");
  console.log("예: TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_CHAT_ID=123 node src/local.js");
  process.exit(1);
}

if (!process.env.TELEGRAM_CHAT_ID) {
  console.error("Error: TELEGRAM_CHAT_ID 환경변수를 설정하세요");
  process.exit(1);
}

// DynamoDB 대신 메모리 사용하도록 모킹
const seenIds = new Set();

// 실행
console.log("로컬 테스트 시작...");
console.log(`TOP_N: 30, MIN_SCORE: 50`);

handler({})
  .then((result) => {
    console.log("결과:", result);
  })
  .catch((error) => {
    console.error("에러:", error);
  });
