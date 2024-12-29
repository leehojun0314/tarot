import { Card } from '@prisma/client';

export function getCardDescriptions({
  card,
  isOpposite,
  luck,
}: {
  card: Card;
  isOpposite: boolean;
  luck: 'finance' | 'career' | 'love' | 'advice' | 'general';
}) {
  return `Card ${card.id} (${card.name}): ${
    isOpposite ? 'Opposite' : 'Upright'
  }\n ""General meaning:** \n ${card.general}
  \n **Description:** \n ${card[luck]}`;
}
