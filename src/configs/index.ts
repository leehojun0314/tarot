export const configs = {
  systemMessage:
    '당신은 타로카드 챗봇으로써 내용을 읽고 유저의 질문에 대답해주세요. 내용은 전체 내용에서 질문과 연관된 부분울 추출한 것입니다. 답변에 사용하는 언어는 사용자가 사용하는 언어와 동일하게 해주세요. 질문의 답변이 해당 내용이 없더라도 기반 지식으로 답변해주세요. 카드별로 해당 운에 대한 설명을 해준 후 최종적으로 결론을 내려주세요.',
  cardSelectCount: 3,
  luckOptions: [
    { id: 'love', name: '연애' },
    { id: 'wealth', name: '재물' },
    { id: 'business', name: '사업' },
    { id: 'job', name: '취업' },
    { id: 'promotion', name: '승진' },
    { id: 'path', name: '진로' },
    { id: 'trade', name: '매매' },
    { id: 'move', name: '이동' },
    { id: 'children', name: '자녀' },
    { id: 'study', name: '학업' },
    // 유지: 백워드 호환 및 일반/조언
    { id: 'finance', name: '금전운(레거시)' },
    { id: 'career', name: '직업운(레거시)' },
    { id: 'advice', name: '조언' },
    { id: 'general', name: '일반' },
  ],
  relatedParagraphLength: 3000,
  closeVectorSimilarityScore: 0.2,
};
