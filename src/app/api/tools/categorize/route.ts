import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import prisma from '@/libs/db';
import { Card as PrismaCard, Prisma } from '@prisma/client';

export const runtime = 'nodejs';

// Categories aligned with index.html and schema
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

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isEmptyish(text: unknown): boolean {
  if (typeof text !== 'string') return true;
  const t = text.trim();
  if (!t) return true;
  const patterns = [
    /해당\s*내용\s*이\s*없습니다/i,
    /제공되지\s*않았\s*습니다/i,
    /없음$/i,
    /^없음/i,
    /해당\s*카테고리\s*에\s*대한\s*정보가\s*없습니다/i,
    /정보가\s*없/i,
    /구체적인\s*해석을\s*제공하지\s*않/i,
    /언급되[지]?\s*않/i,
    /불명확|모호/i,
    /해석[이가]?\s*어렵/i,
    /확인되[지]?\s*않/i,
    /알\s*수\s*없/i,
    /명확하지\s*않/i,
    /not\s*provided/i,
    /no\s*specific\s*interpretation/i,
    /not\s*specifically\s*covered/i,
    /no\s*content/i,
  ];
  return patterns.some((re) => re.test(t));
}

function isWeak(text: unknown, minChars: number): boolean {
  if (isEmptyish(text)) return true;
  if (typeof text !== 'string') return true;
  return text.trim().length < Math.max(0, minChars);
}

// removed duplicate isEmptyish (defined above)

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

function estimateTokens(s: string): number {
  return Math.ceil((s?.length || 0) / 3.5);
}

function splitIntoBatches<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function extractJson(
  text: string,
  categories: Category[],
): Record<string, string> | null {
  const parse = (t: string) => {
    const p = JSON.parse(t) as unknown;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const obj = p as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const k of categories) {
        const v = obj[k];
        if (typeof v === 'string') out[k] = v;
      }
      return out;
    }
    return null;
  };
  try {
    return parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return parse(m[0]);
    } catch {
      return null;
    }
  }
}

async function classifyContentBatch(
  content: string,
  categories: Category[],
  opts?: { allowInference?: boolean; minChars?: number },
): Promise<Partial<ClassifiedPartial> | null> {
  const categoriesList = categories
    .map((c) => `- "${c}": ${labelFor(c)}`)
    .join('\n');
  const keysList = categories.map((c) => `"${c}"`).join(', ');
  const inferenceRule = opts?.allowInference
    ? '\n설명에 해당 항목이 부족하거나 누락되어도, 일반적인 타로 지식을 바탕으로 신뢰 가능한 해석을 작성하세요. "없음", "제공되지 않았습니다", "정보가 없다", "구체적인 해석을 제공하지 않는다", "not provided" 등 부정/회피성 문구는 절대 출력하지 마세요.'
    : '';
  const minLenRule = opts?.minChars
    ? `\n각 항목은 최소 ${opts.minChars}자 이상으로, 구체적이고 실용적인 내용을 담아 작성하세요.`
    : '';
  const prompt = `아래는 타로 카드의 전체 설명입니다. 지정된 카테고리만 요약해 주세요. 각 카테고리별로 2~5문장으로 간결하게, 핵심만 정확히. 반드시 JSON만 출력하세요(설명, 마크다운, 주석 금지).${inferenceRule}${minLenRule}\n\n설명:\n${content}\n\n반드시 아래 키만 포함한 JSON을 출력하세요:\n{\n${categoriesList}\n}\n\n출력 예시(키만 정확히 사용): { ${keysList} }`;

  const res = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  const raw = res.choices[0].message?.content || '';
  const json = extractJson(raw, categories);
  if (!json) return null;
  const filtered: Partial<ClassifiedPartial> = {};
  for (const k of categories) {
    const v = json[k];
    if (typeof v === 'string' && !isWeak(v, opts?.minChars ?? 0))
      filtered[k] = v;
  }
  return filtered;
}

function getMissingCategories(card: PrismaCard, minChars = 0): Category[] {
  const missing: Category[] = [];
  for (const c of ALL_CATEGORIES) {
    const v = card[c as keyof PrismaCard] as unknown;
    if (isWeak(v, minChars)) missing.push(c);
  }
  return missing;
}

async function updateCardFields(
  cardId: number,
  content: Partial<ClassifiedPartial>,
) {
  const updateData: { [K in Category]?: string } = {};
  for (const key of Object.keys(content) as Category[]) {
    const val = content[key];
    if (typeof val === 'string' && val.trim()) updateData[key] = val.trim();
  }
  if (Object.keys(updateData).length === 0) return;
  const data = updateData as unknown as Prisma.CardUpdateInput;
  await prisma.card.update({ where: { id: cardId }, data });
}

export async function POST(req: NextRequest) {
  try {
    // Admin guard
    const adminKey = req.headers.get('x-admin-key');
    if (process.env.ADMIN_SECRET && adminKey !== process.env.ADMIN_SECRET) {
      console.warn('[categorize] unauthorized request blocked');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    console.log('[categorize] request received', {
      hasBody: !!body,
      bodyKeys: Object.keys(body || {}),
    });
    const {
      cardIds,
      categories,
      limitCards,
      dryRun,
      batchSize: batchSizeOverride,
      allowInference,
      recoveryRounds,
      recoveryBatchSize,
    }: {
      cardIds?: number[];
      categories?: Category[];
      limitCards?: number;
      dryRun?: boolean;
      batchSize?: number;
      allowInference?: boolean;
      recoveryRounds?: number;
      recoveryBatchSize?: number;
    } = body || {};

    const targetCategories: Category[] =
      categories && categories.length
        ? (categories.filter((c: Category) =>
            ALL_CATEGORIES.includes(c),
          ) as Category[])
        : (ALL_CATEGORIES as unknown as Category[]);
    console.log('[categorize] target categories:', targetCategories.join(', '));

    const whereClause =
      cardIds && cardIds.length ? { id: { in: cardIds } } : {};
    const cards = await prisma.card.findMany({ where: whereClause });
    const slice =
      typeof limitCards === 'number' ? cards.slice(0, limitCards) : cards;
    console.log('[categorize] cards fetched:', {
      total: cards.length,
      limited: slice.length,
      filterByIds: Array.isArray(cardIds) ? cardIds.length : 0,
      dryRun: !!dryRun,
      batchSizeOverride: batchSizeOverride ?? null,
    });

    const processed: Array<{ id: number; updated: Category[] }> = [];
    for (const card of slice) {
      console.log(`[_card:${card.id}] start`);
      const missing = getMissingCategories(
        card,
        (body?.minChars as number) ?? 0,
      ).filter((c) => targetCategories.includes(c));
      if (missing.length === 0) {
        console.log(`[_card:${card.id}] no missing categories, skip`);
        processed.push({ id: card.id, updated: [] });
        continue;
      }

      const contentTokens = estimateTokens(card.content || '');
      const targetMaxTokens = 6000;
      const budget = Math.max(1000, targetMaxTokens - contentTokens);
      const perCat = 250;
      const defaultBatch = Math.max(
        1,
        Math.min(5, Math.floor(budget / perCat)),
      );
      const batchSize = Math.max(
        1,
        Math.min(8, batchSizeOverride || defaultBatch),
      );
      const batches = splitIntoBatches(missing, batchSize);
      console.log(`[_card:${card.id}] missing=${missing.join(', ')}`);
      console.log(
        `[_card:${card.id}] tokens≈${contentTokens} budget≈${budget} batchSize=${batchSize} batches=${batches.length}`,
      );

      const updatedNow: Category[] = [];
      let batchIndex = 0;
      for (const cats of batches) {
        batchIndex++;
        // retries
        let attempt = 0;
        let result: Partial<ClassifiedPartial> | null = null;
        while (attempt < 3) {
          attempt++;
          console.log(
            `[_card:${card.id}] batch ${batchIndex}/${
              batches.length
            } cats=[${cats.join(', ')}] attempt=${attempt}`,
          );
          result = await classifyContentBatch(card.content, cats, {
            allowInference: allowInference ?? true,
            minChars: (body?.minChars as number) ?? 0,
          });
          if (result) break;
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
        if (!result) {
          console.warn(
            `[_card:${card.id}] batch ${batchIndex} failed after ${attempt} attempts`,
          );
          continue;
        }
        if (!dryRun) await updateCardFields(card.id, result);
        console.log(
          `[_card:${card.id}] batch ${batchIndex} updated fields: ${Object.keys(
            result,
          ).join(', ')}`,
        );
        updatedNow.push(...cats);
        await new Promise((r) => setTimeout(r, 200));
      }
      // Recovery rounds: re-check missing and try again with smaller batches
      let remaining = getMissingCategories(
        card,
        (body?.minChars as number) ?? 0,
      ).filter((c) => targetCategories.includes(c));
      const rounds = Math.max(0, Math.min(5, recoveryRounds ?? 1));
      const recBatchSize = Math.max(1, Math.min(3, recoveryBatchSize ?? 1));
      for (let round = 1; round <= rounds && remaining.length > 0; round++) {
        const recBatches = splitIntoBatches(remaining, recBatchSize);
        console.log(
          `[_card:${
            card.id
          }] recovery round ${round}/${rounds} remaining=[${remaining.join(
            ', ',
          )}] recBatchSize=${recBatchSize} batches=${recBatches.length}`,
        );
        let recIndex = 0;
        for (const cats of recBatches) {
          recIndex++;
          let attempt = 0;
          let result: Partial<ClassifiedPartial> | null = null;
          while (attempt < 3) {
            attempt++;
            console.log(
              `[_card:${card.id}] recovery batch ${recIndex}/${
                recBatches.length
              } cats=[${cats.join(', ')}] attempt=${attempt}`,
            );
            result = await classifyContentBatch(card.content, cats, {
              allowInference: allowInference ?? true,
              minChars: (body?.minChars as number) ?? 0,
            });
            if (result) break;
            await new Promise((r) => setTimeout(r, 700 * attempt));
          }
          if (!result) {
            console.warn(
              `[_card:${card.id}] recovery batch ${recIndex} failed after ${attempt} attempts`,
            );
            continue;
          }
          if (!dryRun) await updateCardFields(card.id, result);
          console.log(
            `[_card:${
              card.id
            }] recovery batch ${recIndex} updated fields: ${Object.keys(
              result,
            ).join(', ')}`,
          );
          updatedNow.push(...cats);
          await new Promise((r) => setTimeout(r, 250));
        }
        // recompute remaining after round
        const after = await prisma.card.findUnique({ where: { id: card.id } });
        remaining = after
          ? getMissingCategories(after, (body?.minChars as number) ?? 0).filter(
              (c) => targetCategories.includes(c),
            )
          : remaining;
      }

      processed.push({ id: card.id, updated: updatedNow });
      console.log(`[_card:${card.id}] done. updated=${updatedNow.join(', ')}`);
    }

    console.log('[categorize] completed', { processed: processed.length });
    return NextResponse.json({ count: processed.length, processed });
  } catch (err) {
    console.error('categorize endpoint error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
