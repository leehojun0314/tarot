import { Suspense } from 'react';
import CardSelect from './cardSelect';

export default function page() {
  return (
    <Suspense>
      <CardSelect />
    </Suspense>
  );
}
