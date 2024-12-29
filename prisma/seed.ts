import cards from '@/static/cards';
import prisma from '../src/libs/db';

async function main() {
  await prisma.$executeRaw`SET IDENTITY_INSERT [dbo].[Card] ON`;

  for (const card of cards) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: { name: card.content },
      create: { name: card.content, content: '' },
    });
  }

  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'testname',
      createdAt: new Date(),
    },
  });

  await prisma.$executeRaw`SET IDENTITY_INSERT [dbo].[Card] OFF`;
  console.log('seeded user: ', user);
  console.log('Seeding complete');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
