import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const CONFIG = {
  TOP_N: 30,
  MIN_SCORE: 50,
  HN_API_BASE: "https://hacker-news.firebaseio.com/v0",
  TELEGRAM_API: "https://api.telegram.org/bot",
};

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// HN API에서 Top Stories 가져오기
async function fetchTopStories() {
  const response = await fetch(`${CONFIG.HN_API_BASE}/topstories.json`);
  const allIds = await response.json();
  return allIds.slice(0, CONFIG.TOP_N);
}

// 개별 스토리 정보 가져오기
async function fetchStory(id) {
  const response = await fetch(`${CONFIG.HN_API_BASE}/item/${id}.json`);
  return response.json();
}

// DynamoDB에서 이미 알림 보낸 ID 확인
async function isAlreadySent(storyId) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { storyId: storyId.toString() },
      })
    );
    return !!result.Item;
  } catch (error) {
    console.error("DynamoDB get error:", error);
    return false;
  }
}

// DynamoDB에 알림 보낸 ID 저장
async function markAsSent(storyId) {
  const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7일 후 자동 삭제
  await docClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        storyId: storyId.toString(),
        sentAt: new Date().toISOString(),
        ttl: ttl,
      },
    })
  );
}

// 텔레그램 메시지 전송
async function sendTelegramMessage(story) {
  const message = `🔥 *HN Top ${CONFIG.TOP_N}*

*${escapeMarkdown(story.title)}*

⬆️ ${story.score} points | 💬 ${story.descendants || 0} comments

🔗 [원문](${story.url || `https://news.ycombinator.com/item?id=${story.id}`})
💬 [댓글](https://news.ycombinator.com/item?id=${story.id})`;

  const url = `${CONFIG.TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

// 마크다운 특수문자 이스케이프
function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// Lambda 핸들러
export async function handler(event) {
  console.log("Starting HN check...");

  try {
    const topStoryIds = await fetchTopStories();
    console.log(`Fetched top ${topStoryIds.length} stories`);

    let sentCount = 0;

    for (const storyId of topStoryIds) {
      // 이미 알림 보낸 글인지 확인
      if (await isAlreadySent(storyId)) {
        continue;
      }

      // 스토리 정보 가져오기
      const story = await fetchStory(storyId);

      if (!story || story.type !== "story") {
        continue;
      }

      // 점수 기준 확인
      if (story.score < CONFIG.MIN_SCORE) {
        continue;
      }

      // 텔레그램 알림 전송
      console.log(`Sending alert for: ${story.title} (score: ${story.score})`);
      await sendTelegramMessage(story);
      await markAsSent(storyId);
      sentCount++;

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`Done. Sent ${sentCount} alerts.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Sent ${sentCount} alerts` }),
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
