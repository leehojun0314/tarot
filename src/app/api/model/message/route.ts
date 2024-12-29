import { NextResponse } from 'next/server';
import prisma from '@/libs/db';

export async function POST(req: Request) {
  try {
    // Request body를 JSON으로 파싱
    const body = await req.json();
    const { chatRoomId, sender, message } = body;

    // 필수 파라미터 확인
    if (!chatRoomId || !sender || !message) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 },
      );
    }

    // 데이터베이스에 메시지 생성
    const result = await prisma.message.create({
      data: {
        chatRoomId: parseInt(chatRoomId),
        sender,
        message,
      },
    });

    // 성공 응답 반환
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
