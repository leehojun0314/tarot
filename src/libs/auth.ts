import prisma from './db';

export default async function auth(userId: number) {
  // const { userId } = await req.json();
  const result = await prisma.user.findFirst({
    where: { id: userId },
  });
  console.log('auth result: ', result);

  return result;
}
