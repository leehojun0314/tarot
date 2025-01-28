// import {OpenAI} from "@langchain/openai"
// import {} from "@langchain/community/package.json"
import { CloseVectorNode } from '@langchain/community/vectorstores/closevector/node';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Paragraph } from '@prisma/client';
import { Document } from '@langchain/core/documents';
import { configs } from '@/configs';
export async function getRelatedParagraphs(
  message: string,
  paragraphs: Paragraph[],
) {
  const docs = paragraphs.map((para) => {
    return new Document({
      pageContent: para.content,
      metadata: {
        name: para.name,
      },
    });
  });
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const vectorStore = await CloseVectorNode.fromDocuments(docs, embeddings);
  const messageVector = await embeddings.embedQuery(message);
  const vectorStoreResult = await vectorStore.similaritySearchVectorWithScore(
    messageVector,
    10,
  );

  //score가 낮은게 높은 관련성이 있는걸로 바뀜
  const filteredStoreResult = vectorStoreResult.filter(
    (storeResult) => storeResult[1] < configs.closeVectorSimilarityScore,
  );
  let relatedParagraphs = filteredStoreResult.map((storeResult) => {
    return storeResult[0];
  });
  //관련성이 너무 없다면 위의 두개를 가져온다.
  if (relatedParagraphs.length === 0) {
    relatedParagraphs = vectorStoreResult.map((storeResult) => {
      return storeResult[0];
    });
    relatedParagraphs.splice(2);
  }
  const selectedParagraphs: Document[] = [];
  let totalLength = 0;
  const maxLength = configs.relatedParagraphLength;
  for (const paragraph of relatedParagraphs) {
    if (totalLength + paragraph.pageContent.length <= maxLength) {
      selectedParagraphs.push(paragraph);
      totalLength += paragraph.pageContent.length;
    } else {
      // 남은 길이를 계산하고, 해당 길이만큼 잘라낸 paragraph_content를 저장합니다.
      const remainingLength = maxLength - totalLength;
      const truncatedContent = paragraph.pageContent.substring(
        0,
        remainingLength,
      );
      selectedParagraphs.push({
        ...paragraph,
        pageContent: truncatedContent,
      });
      totalLength += truncatedContent.length;
      break;
    }
  }
  const relatedContent = selectedParagraphs
    .map((p) => p.pageContent)
    .join('\n');
  return relatedContent;
}
