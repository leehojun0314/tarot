import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/libs/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatRoomId: string } },
) {
  try {
    console.log('chat room cards model called');
    const chatRoomCards = await prisma.chatRoom_Card.findMany({
      where: { chatRoomId: parseInt(params.chatRoomId) },
      include: {
        card: true, // 카드 정보를 가져오기 위해 관계를 포함
      },
    });
    console.log('chat room cards result: ', chatRoomCards);
    return new Response(JSON.stringify(chatRoomCards), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('model chat room cards error: ', error);
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
