'use server';
import { TCard } from '@/types';
import prisma from '../../prisma/db';
export async function submitCards(cards: TCard[], userId: number) {
  try {
    console.log(`submit cards called. cards: ${cards}`);
    if (!!!userId) {
      console.error('Invalid credential');
      return false;
    }
    if (await prisma.chatRoom.findUnique({ where: { userId: userId } })) {
      await prisma.chatRoom_Card.deleteMany({
        where: { chatRoom: { userId } },
      });
    }
    const room = await prisma.chatRoom.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    console.log('room: ', room);
    const createmanyResult = await prisma.chatRoom_Card.createMany({
      data: cards.map((card) => ({
        chatRoomId: room.id,
        cardId: card.index,
        isOpposite: card.isOpposite,
      })),
    });
    console.log('create many result: ', createmanyResult);
    // return room;
    return room;
  } catch (error: any) {
    console.log('submit cards internal error', error);
    // redirect('/error', RedirectType.replace);
    throw new Error('Internal server error');
  }
}

export async function getMessages({
  userId,
  chatRoomId,
}: {
  userId?: number;
  chatRoomId?: number;
}) {
  try {
    const chatRoom = await prisma.chatRoom.findFirst({
      where: { OR: [{ userId }, { id: chatRoomId }] },
    });
    const messages = await prisma.message.findMany({
      where: { chatRoomId: chatRoom?.id },
    });

    return messages;
  } catch (error) {
    console.error('get messages error: ', error);
    throw new Error('Get messages error');
  }
}
export async function checkChatRoom(chatRoomId: number): Promise<boolean> {
  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
  });
  console.log('room: ', room);
  return !!room;
}