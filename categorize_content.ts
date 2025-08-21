import { PrismaClient, Card as PrismaCard } from '@prisma/client';
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
// 전체 카테고리 정의 (index.html 기준 + 기존 필드)
const ALL_CATEGORIES = [
  'general',
  'love',
  'career',
  'finance',
  'advice',
  'wealth',
  'business',
  'job',
  'promotion',
  'path',
  'trade',
  'move',
  'children',
  'study',
] as const;

type Category = (typeof ALL_CATEGORIES)[number];
type ClassifiedPartial = Record<Category, string | undefined>;

// OpenAI를 이용한 설명 분류 함수
async function classifyContentBatch(
  content: string,
  categories: Category[],
): Promise<Partial<ClassifiedPartial> | null> {
  const categoriesList = categories
    .map((c) => `- "${c}": ${labelFor(c)}`)
    .join('\n');
  const keysList = categories.map((c) => `"${c}"`).join(', ');
  const prompt = `아래는 타로 카드의 전체 설명입니다. 지정된 카테고리만 요약해 주세요. 각 카테고리별로 2~5문장으로 간결하게, 핵심만 정확히. 반드시 JSON만 출력하세요(설명, 마크다운, 주석 금지).

설명:
${content}

반드시 아래 키만 포함한 JSON을 출력하세요:
{
${categoriesList}
}

출력 예시(키만 정확히 사용): { ${keysList} }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    const raw = response.choices[0].message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) return null;
    const out: Partial<ClassifiedPartial> = {};
    for (const c of categories) {
      const v = parsed[c];
      if (typeof v === 'string') out[c] = v;
    }
    return out;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return null;
  }
}

function labelFor(c: Category): string {
  switch (c) {
    case 'general':
      return '카드의 일반적/기본 의미 요약';
    case 'love':
      return '연애/관계 흐름과 상대 마음';
    case 'career':
      return '직장/업무 전반의 흐름';
    case 'finance':
      return '금전/재정 상태 전반(레거시)';
    case 'advice':
      return '카드가 주는 핵심 조언';
    case 'wealth':
      return '재물: 수입/지출 밸런스 및 재운';
    case 'business':
      return '사업: 아이템/파트너십/운영 포인트';
    case 'job':
      return '취업: 채용 운/준비 전략';
    case 'promotion':
      return '승진: 평가 포인트/시기';
    case 'path':
      return '진로: 적성, 장/단기 방향';
    case 'trade':
      return '매매: 부동산/차량 거래 운';
    case 'move':
      return '이동: 이사/해외/출장 기운';
    case 'children':
      return '자녀: 양육/관계/상황';
    case 'study':
      return '학업: 집중력/성과 상승 팁';
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const tryParse = (t: string): Record<string, unknown> | null => {
    const parsed = JSON.parse(t) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  };
  try {
    const p = tryParse(text);
    if (p) return p;
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return tryParse(match[0]);
  } catch {
    return null;
  }
}

function estimateTokens(s: string): number {
  // 대략적 추정: 1토큰 ≈ 3.5자
  return Math.ceil((s?.length || 0) / 3.5);
}

function splitIntoBatches<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// 카드 데이터를 업데이트하는 함수
async function updateCardFields(
  cardId: number,
  content: Partial<ClassifiedPartial>,
) {
  try {
    const updateData: { [K in Category]?: string } = {};
    for (const key of Object.keys(content) as Category[]) {
      const val = content[key];
      if (typeof val === 'string' && val.trim()) updateData[key] = val.trim();
    }
    if (Object.keys(updateData).length === 0) return;
    const data =
      updateData as unknown as import('@prisma/client').Prisma.CardUpdateInput;
    await prisma.card.update({ where: { id: cardId }, data });
    console.log(
      `Card ${cardId} updated: ${Object.keys(updateData).join(', ')}`,
    );
  } catch (error) {
    console.error(`Failed to update Card ID ${cardId}:`, error);
  }
}

// 메인 함수: 모든 카드 처리
async function migrateContent() {
  const cards = await prisma.card.findMany();
  console.log(`Total cards: ${cards.length}`);

  // 카드 단위 직렬 처리(안전), 카드 내 카테고리 배치는 토큰량에 맞춰 분할
  for (const card of cards) {
    console.log(`\n--- Processing Card ID: ${card.id} ---`);
    const missing = getMissingCategories(card);
    if (missing.length === 0) {
      console.log('Skip: no missing categories');
      continue;
    }

    // 토큰 추정에 따른 배치 크기 동적 계산
    const contentTokens = estimateTokens(card.content || '');
    const targetMaxTokens = 6000; // 보수적 여유
    const budget = Math.max(1000, targetMaxTokens - contentTokens);
    // 카테고리 1개당 250토큰 가정 → 배치 크기 산정
    const perCat = 250;
    const batchSize = Math.max(1, Math.min(5, Math.floor(budget / perCat)));
    const batches = splitIntoBatches(missing, batchSize);
    console.log(
      `Missing categories: ${missing.join(
        ', ',
      )} | tokens≈${contentTokens} | batchSize=${batchSize} | batches=${
        batches.length
      }`,
    );

    for (const cats of batches) {
      // 재시도 로직(최대 3회)
      const maxRetries = 3;
      let attempt = 0;
      let result: Partial<ClassifiedPartial> | null = null;
      while (attempt < maxRetries) {
        attempt++;
        result = await classifyContentBatch(card.content, cats as Category[]);
        if (result) break;
        const waitMs = 800 * attempt;
        console.warn(`Retrying (attempt ${attempt}) in ${waitMs}ms...`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
      if (!result) {
        console.warn(`Skip batch for card ${card.id}: ${cats.join(', ')}`);
        continue;
      }
      await updateCardFields(card.id, result);
      // Rate-limit 완화 대기
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log('\nAll cards have been processed.');
}

function getMissingCategories(card: PrismaCard): Category[] {
  const missing: Category[] = [];
  for (const c of ALL_CATEGORIES) {
    const v = card[c as keyof PrismaCard] as unknown;
    if (typeof v !== 'string' || v.trim() === '') missing.push(c);
  }
  return missing;
}

// 실행
migrateContent()
  .catch((e) => {
    console.error('Migration Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
