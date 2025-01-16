import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// Prisma Client 초기화
const prisma = new PrismaClient();

// OpenAI API 초기화
// const openai = new OpenAIApi(
//   new Configuration({
//     apiKey: process.env.OPENAI_API_KEY, // OpenAI API 키
//   })
// );
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// 분류 결과 타입 정의
interface ClassifiedContent {
  general: string;
  love: string;
  career: string;
  finance: string;
  advice: string;
}

// OpenAI를 이용한 설명 분류 함수
async function classifyContentWithOpenAI(
  content: string,
): Promise<ClassifiedContent | null> {
  const prompt = `
    아래는 타로 카드의 설명입니다. 내용을 연애운, 직업운, 금전운, 조언, 일반 내용(기본 의미)으로 나눠주세요. 
    각 항목은 적당히 간단하고 정확하게, 누락되는 내용없이 요약해주세요.

    설명:
    ${content}

    출력 형식:
    {
      "general": "기본적인 카드 의미",
      "love": "연애운",
      "career": "직업운",
      "finance": "금전운",
      "advice": "조언"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    // OpenAI 응답을 JSON으로 파싱
    const result: ClassifiedContent = JSON.parse(
      response.choices[0].message?.content || '{}',
    );
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return null;
  }
}

// 카드 데이터를 업데이트하는 함수
async function updateCardWithClassifiedContent(
  cardId: number,
  content: ClassifiedContent,
) {
  try {
    await prisma.card.update({
      where: { id: cardId },
      data: {
        general: content.general,
        love: content.love,
        career: content.career,
        finance: content.finance,
        advice: content.advice,
      },
    });
    console.log(`Card ID ${cardId} updated successfully.`);
  } catch (error) {
    console.error(`Failed to update Card ID ${cardId}:`, error);
  }
}

// 메인 함수: 모든 카드 처리
async function migrateContent() {
  const cards = await prisma.card.findMany(); // 모든 카드 가져오기

  for (const card of cards) {
    console.log(`Processing Card ID: ${card.id}...`);

    const { content } = card;

    // OpenAI API로 설명 분류
    const classifiedContent = await classifyContentWithOpenAI(content);

    if (classifiedContent) {
      // 분류된 데이터를 DB에 저장
      await updateCardWithClassifiedContent(card.id, classifiedContent);
    } else {
      console.warn(`Failed to classify content for Card ID: ${card.id}`);
    }
  }

  console.log('All cards have been processed.');
}

// 실행
migrateContent()
  .catch((e) => {
    console.error('Migration Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
