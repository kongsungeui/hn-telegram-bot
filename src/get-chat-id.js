// 텔레그램 Chat ID 확인하는 스크립트
// 사용법: TELEGRAM_BOT_TOKEN=xxx node src/get-chat-id.js

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN 환경변수를 설정하세요");
  console.log("예: TELEGRAM_BOT_TOKEN=123456789:ABCdef... node src/get-chat-id.js");
  process.exit(1);
}

async function getChatId() {
  console.log("봇에게 온 메시지를 확인하는 중...");
  console.log("(먼저 텔레그램에서 봇에게 아무 메시지나 보내세요)\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = await response.json();

  if (!data.ok) {
    console.error("API 에러:", data.description);
    return;
  }

  if (data.result.length === 0) {
    console.log("아직 메시지가 없습니다. 봇에게 메시지를 보낸 후 다시 실행하세요.");
    return;
  }

  console.log("=== 받은 메시지 목록 ===\n");

  for (const update of data.result) {
    if (update.message) {
      const chat = update.message.chat;
      console.log(`Chat ID: ${chat.id}`);
      console.log(`Type: ${chat.type}`);
      if (chat.username) console.log(`Username: @${chat.username}`);
      if (chat.first_name) console.log(`Name: ${chat.first_name} ${chat.last_name || ""}`);
      console.log(`Message: "${update.message.text}"`);
      console.log("---");
    }
  }

  console.log("\n위의 Chat ID를 TELEGRAM_CHAT_ID 환경변수로 사용하세요.");
}

getChatId().catch(console.error);
