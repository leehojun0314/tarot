import { Card } from '@prisma/client';

export function getCardDescriptions({
  card,
  isOpposite,
}: {
  card: Card;
  isOpposite: boolean;
}) {
  return `Card ${card.id} (${card.name}): ${
    isOpposite ? 'Opposite' : 'Upright'
  }\n  **Description:** \n ${card.content}`;
}
