'use client';
import { configs } from '@/configs';
import { useRouter } from 'next/navigation';

export default function LuckSelection() {
  const router = useRouter();

  const handleSelection = (luckId: string) => {
    router.push(`/card?luck=${luckId}`);
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      <h1 className='text-2xl font-bold mb-6'>어떤 운을 보고 싶으신가요?</h1>
      <div className='grid grid-cols-2 gap-4 w-full max-w-sm'>
        {configs.luckOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelection(option.id)}
            className='bg-blue-500 text-white py-4 px-6 rounded-lg hover:bg-blue-600'
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}
