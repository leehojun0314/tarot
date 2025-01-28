import { TLuck } from '@/types';
import { CloseVectorSaveableVectorStore } from 'closevector-node';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { chatRoomId: string; luck: TLuck } },
) {
  const chatRoomId = params.chatRoomId;
  const luck = params.luck;

  const { message } = await req.json();
}
