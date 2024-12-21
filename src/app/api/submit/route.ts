import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { selectedCards } = await req.json(); // 요청 본문에서 selectedCards 받기

    // 받은 데이터 확인
    console.log('Received cards:', selectedCards);

    // 예시로 데이터 처리 작업 (여기서 추가적인 작업을 할 수 있습니다)
    const result = {
      success: true, // 성공 여부
      message: '카드가 정상적으로 처리되었습니다.',
      data: selectedCards, // 받은 데이터 그대로 응답
    };

    // 처리된 결과를 JSON으로 응답
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, message: '처리 중 오류 발생' },
      { status: 500 },
    );
  }
}
