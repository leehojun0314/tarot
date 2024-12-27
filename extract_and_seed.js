const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

async function updateDatabase() {
  const folderPath = path.join(__dirname, '../taro'); // PDF 파일들이 위치한 폴더
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith('.pdf'));

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    // 파일 이름에서 앞의 '0' 제거 (예: '01.pdf' → '1')
    const fileId = parseInt(file.replace('.pdf', ''), 10);

    if (isNaN(fileId)) {
      console.warn(`Skipping invalid file name: ${file}`);
      continue;
    }

    const content = await extractTextFromPdf(filePath);

    console.log(`Processing ${file} with id ${fileId}...`);

    // 데이터베이스에서 해당 id의 카드 업데이트
    const updatedCard = await prisma.card.update({
      where: { id: fileId },
      data: { content: content.trim() },
    });

    console.log(`Updated card with id ${updatedCard.id}: content updated.`);
  }

  console.log('All files have been processed.');
}

updateDatabase()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
