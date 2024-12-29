import { TLuck } from '@/types';
import { Card } from '@prisma/client';

export function getCardDescriptions({
  card,
  isOpposite,
  lucks,
}: {
  card: Card;
  isOpposite: boolean;
  lucks: TLuck[];
}) {
  return `Card ${card.id} (${card.name}): ${
    isOpposite ? 'Opposite' : 'Upright'
  }\n ""General meaning:** \n ${card.general}
  \n **Description:** \n ${lucks.map((luck) => card[luck] + '\n')}`;
}
