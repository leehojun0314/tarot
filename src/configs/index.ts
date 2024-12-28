export const configs = {
  systemMessage:
    '당신은 타로카드 챗봇으로써 내용을 읽고 유저의 질문에 대답해주세요. 내용은 전체 내용에서 질문과 연관된 부분울 추출한 것입니다. 답변에 사용하는 언어는 사용자가 사용하는 언어와 동일하게 해주세요. 질문의 답변이 해당 내용이 없더라도 기반 지식으로 답변해주세요. 카드별로 해당 운에 대한 설명을 해준 후 최종적으로 결론을 내려주세요.',
  cardSelectCount: 3,
  luckOptions: [
    { id: 'wealth', name: '재물운' },
    { id: 'love', name: '연애운' },
    { id: 'health', name: '건강운' },
    { id: 'career', name: '직업운' },
  ],
};
