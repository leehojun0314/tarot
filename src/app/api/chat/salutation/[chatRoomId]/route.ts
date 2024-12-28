import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { configs } from '@/configs';
import { getCardDescriptions } from '@/utils';

const prisma = new PrismaClient();
const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export async function GET(
  request: NextRequest,
  { params }: { params: { chatRoomId: string; luck: string } },
) {
  const chatRoomId = parseInt(params.chatRoomId, 10);
  const luck = params.luck;
  // const { message } = await request.json();
  // console.log('message: ', message);
  try {
    // 유저 메시지 저장
    // await prisma.message.create({
    //   data: { chatRoomId, sender: 'user', message },
    // });
    console.log('flag 1');
    // 해당 채팅방의 카드 정보 가져오기
    const chatRoomCards = await prisma.chatRoom_Card.findMany({
      where: { chatRoomId },
      include: {
        card: true, // 카드 정보를 가져오기 위해 관계를 포함
      },
    });
    console.log('flag 2');
    // 카드 설명 생성
    const cardDescriptions = chatRoomCards.map(getCardDescriptions);
    console.log('flag 3');
    const userMessage = `I want to know about my ${luck} luck. Cards drawn:\n${cardDescriptions.join(
      '\n',
    )}\nAI response:`;

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
            console.log('content: ', content);
            accumulator += content;
            controller.enqueue(encoder.encode(content));
          }
          console.log('accumulator: ', accumulator);
          // AI 응답을 데이터베이스에 저장
          await prisma.message.create({
            data: { chatRoomId, sender: 'ai', message: accumulator },
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
