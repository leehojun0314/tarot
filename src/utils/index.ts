export function getCardDescriptions({
  card,
  isOpposite,
}: {
  card: {
    id: number;
    name: string;
    content: string;
  };
  isOpposite: boolean;
}) {
  return `Card ${card.id} (${card.name}): ${
    isOpposite ? 'Opposite' : 'Upright'
  }\n  **Description:** \n ${card.content}`;
}
