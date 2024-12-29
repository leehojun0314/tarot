import { NextRequest, NextResponse } from 'next/server';
// import prisma from '../../../../libs/db';
import { getCardDescriptions } from '@/utils';
import OpenAI from 'openai';
import { configs } from '@/configs';
import { Card } from '@prisma/client';
import { TLuck } from '@/types';

export const runtime = 'edge';
export async function POST(
  req: NextRequest,
  { params }: { params: { chatRoomId: string; luck: TLuck } },
) {
  const chatRoomId = params.chatRoomId;
  const luck = params.luck;
  console.log('chat called. ');
  console.log('chat room id: ', params.chatRoomId);
  const { message } = await req.json();

  console.log('message: ', message);
  if (!chatRoomId || !message) {
    return new Response('Bad request', { status: 400 });
  }
  try {
    // await prisma.message.create({
    //   data: {
    //     chatRoomId: parseInt(chatRoomId),
    //     sender: 'user',
    //     message,
    //   },
    // });
    await fetch(`${req.nextUrl.clone().origin}/api/model/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatRoomId,
        sender: 'user',
        message,
      }),
    }).catch((err) => {
      console.error('insert message error: ', err);
      throw new Error('Internal server error');
    });

    const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

    // const chatRoomCards = await prisma.chatRoom_Card.findMany({
    //   where: { chatRoomId: parseInt(chatRoomId) },
    //   include: {
    //     card: true,
    //   },
    // });
    const chatRoomCardsRes = await fetch(
      `${req.nextUrl.clone().origin}/api/model/chatRoomCards/${chatRoomId}`,
    );
    const chatRoomCards: Array<{ card: Card; isOpposite: boolean }> =
      await chatRoomCardsRes.json();
    const cardDescriptions = chatRoomCards.map((el) => {
      return getCardDescriptions({
        card: el.card,
        isOpposite: el.isOpposite,
        lucks: ['general', luck],
      });
    });
    console.log('card descriptions: ', cardDescriptions);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: configs.systemMessage },
      {
        role: 'developer',
        content: `The drawn cards from user: ${cardDescriptions.join('\n\n')}`,
      },
      { role: 'user', content: message },
    ];
    const stream = await client.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: messages,
      stream: true,
    });
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
          console.log('accumulator: ', accumulator);
          controller.close();
          // await prisma.message.create({
          //   data: {
          //     chatRoomId: parseInt(chatRoomId),
          //     sender: 'ai',
          //     message: accumulator,
          //   },
          // });
        } catch (err) {
          console.log('error: ', err);
        }
      },
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.log('chat error: ', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      },
    );
  }
}
