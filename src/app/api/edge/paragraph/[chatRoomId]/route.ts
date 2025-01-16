import { CloseVectorSaveableVectorStore } from 'closevector-node';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export async function POST(
  req: NextRequest,
  { params }: { params: { chatRoomId: string } },
) {}
