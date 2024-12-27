import { Suspense } from 'react';
import ChatRoom from './chatRoom';

export default function page() {
  return (
    <Suspense>
      <ChatRoom />
    </Suspense>
  );
}
