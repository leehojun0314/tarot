import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { configs } from '@/configs';
import { getCardDescriptions } from '@/utils';
import { Card } from '@prisma/client';
import { TLuck } from '@/types';

// const prisma = new PrismaClient();
const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});
export const runtime = 'edge';
export async function GET(
  request: NextRequest,
  { params }: { params: { chatRoomId: string } },
) {
  const chatRoomId = parseInt(params.chatRoomId, 10);
  const luck = request.nextUrl.searchParams.get('luck');
  console.log('next url: ', request.nextUrl.clone().origin);
  // return;
  console.log('chat room id: ', chatRoomId);
  console.log('luck: ', luck);
  const validLucks: TLuck[] = [
    'finance',
    'career',
    'love',
    'advice',
    'general',
  ];

  // Check if the `luck` is in the valid values
  if (luck && validLucks.includes(luck as TLuck)) {
    console.log('Valid luck:', luck);
    // Do something with valid luck
  } else {
    console.log('Invalid luck value');
    // Handle invalid luck
    return new Response('Bad request', {
      status: 400,
      statusText: 'Bad Request',
    });
  }
  try {
    console.log('flag 1');
    // 해당 채팅방의 카드 정보 가져오기
    // const chatRoomCards = await prisma.chatRoom_Card.findMany({
    //   where: { chatRoomId },
    //   include: {
    //     card: true, // 카드 정보를 가져오기 위해 관계를 포함
    //   },
    // });

    const chatRoomCardsRes = await fetch(
      `${request.nextUrl.clone().origin}/api/model/chatRoomCards/${chatRoomId}`,
    );
    const chatRoomCards: Array<{ card: Card; isOpposite: boolean }> =
      await chatRoomCardsRes.json();
    console.log('chat room cards: ', chatRoomCards);
    const cardDescriptions = chatRoomCards.map((el) => {
      return getCardDescriptions({
        card: el.card,
        isOpposite: el.isOpposite,
        lucks: [luck as TLuck],
      });
    });
    const userMessage = `I want to know about my ${luck} luck. Cards drawn:\n${cardDescriptions.join(
      '\n',
    )}\nAI response:`;
    console.log('card descriptions: ', cardDescriptions);
    // OpenAI ChatGPT 요청 (스트리밍 방식)
    const stream = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: configs.systemMessage },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    });
    console.log('flag 4');

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let accumulator = '';
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            accumulator += content;
            controller.enqueue(encoder.encode(content));
          }
          // AI 응답을 데이터베이스에 저장
          // await prisma.message.create({
          //   data: { chatRoomId, sender: 'ai', message: accumulator },
          // });
          await fetch(`${request.nextUrl.clone().origin}/api/model/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatRoomId,
              sender: 'ai',
              message: accumulator, // message는 body에 포함
            }),
          });
        } catch (error) {
          console.error('Error during stream:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // 스트리밍 응답 반환
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error occurred in chat room:', error);
    return NextResponse.json(
      { error: 'Failed to handle message' },
      { status: 500 },
    );
  }
}
