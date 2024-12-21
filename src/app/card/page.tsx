'use client';
// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import React from 'react';
import { useEffect, useState } from 'react';
// import '../../App.css';
import Card from '@/components/Card';
import { redirect } from 'next/navigation';

type TCard = {
  index: number;
  isOpposite: boolean;
  isFlipped: boolean;
};
export default function App() {
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [cards, setCards] = useState<Array<TCard>>([]);
  const [selectedCards, setSelectedCards] = useState<TCard[]>([]);
  const [reloadKey, setReloadKey] = useState(Date.now());
  const initializeCards = () => {
    const shuffledCards = Array(78)
      .fill(null)
      .map((_, index) => ({
        index: index + 1,
        isOpposite: Math.random() > 0.5,
        isFlipped: false,
      }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setSelectedCards([]);
    setImagesLoaded(0);
    setLoading(true);
    setReloadKey(Date.now());
  };

  useEffect(() => {
    initializeCards();
  }, []);
  useEffect(() => {
    if (imagesLoaded === 78) {
      setLoading(false);
    }
  }, [imagesLoaded]);

  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  // const handleReload = () => {
  //   initializeCards();
  // };

  const handleSubmit = async () => {
    const data = selectedCards; // 선택된 카드를 보내는 데이터로 사용

    try {
      // API로 JSON 데이터 전송
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCards: data }),
      });

      if (!response.ok) {
        throw new Error('API 요청이 실패했습니다.');
      }

      // 응답 결과 받기
      const result = await response.json();

      // 응답에 따라 리다이렉트 또는 결과 페이지로 데이터 전달
      if (result.success) {
        // 리다이렉트 예시
        redirect('/result'); // `router.push` 대신 `redirect` 사용
      } else {
        // 쿼리 파라미터로 데이터 전달
        redirect(
          `/result?resultData=${encodeURIComponent(JSON.stringify(result))}`,
        );
      }
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
    }
  };

  const handleCardSelect = (index: number) => {
    setSelectedCards((prev: TCard[]) => {
      if (prev.find((val) => val.index === index)) {
        const result = prev.filter((i) => i.index !== index);
        console.log('result: ', result);
        return result;
      } else {
        const result = cards.find((card) => card.index === index);
        if (result) {
          return [...prev, result];
        } else {
          return prev;
        }
      }
    });
    setCards((prev) => {
      const result = prev.map((card) =>
        card.index === index ? { ...card, isFlipped: !card.isFlipped } : card,
      );
      return result;
    });
  };

  return (
    <>
      {loading && (
        <div className='flex flex-col mx-auto text-center h-[100vh] justify-center'>
          <span className='loading loading-spinner loading-xs self-center'></span>
          <span>Loading... {Math.round((imagesLoaded / 78) * 100)}%</span>
        </div>
      )}
      <div
        style={{
          display: !loading ? 'grid' : 'none',
        }}
      >
        <ul className='card-container'>
          {cards.map(({ index, isOpposite, isFlipped }, cardIndex) => (
            <Card
              key={`${cardIndex}-${reloadKey}`}
              index={index}
              isOpposite={isOpposite}
              onLoad={handleImageLoad}
              // onSelect={() => handleCardSelect(index)}
              onSelect={() => handleCardSelect(index)}
              isFlipped={isFlipped}
            />
          ))}
          <button
            className='btn btn-primary bg-red-50 w-[100%] h-[100%]'
            onClick={handleSubmit}
          >
            Submit
          </button>
        </ul>
        <div className='text-center'>
          {/* <button className='btn btn-primary mr-2' onClick={handleReload}>
            Reload
          </button> */}
          {/* <h1 className='text-center'>Pick up your cards</h1> */}
        </div>
      </div>
    </>
  );
}
