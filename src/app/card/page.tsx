'use client';
import React, { DialogHTMLAttributes } from 'react';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';

import { TCard } from '@/types';
// import { submitCards } from '../actions';
// import axios from 'axios';
// import { submitCards } from '../actions';
import { submitCards } from '../actions';
import { useSearchParams } from 'next/navigation';
export default function App() {
  // const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [cards, setCards] = useState<Array<TCard>>([]);
  const [selectedCards, setSelectedCards] = useState<TCard[]>([]);
  const [reloadKey, setReloadKey] = useState(Date.now());
  const searchParams = useSearchParams();
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
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
      (document.getElementById('alertModal') as HTMLDialogElement).showModal();
    }
  }, [imagesLoaded]);
  useEffect(() => {
    if (selectedCards.length === 5) {
      setLoadingSubmit;
      setTimeout(() => {
        handleSubmit();
      }, 1000);
    }
  }, [selectedCards]);
  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  // const handleReload = () => {
  //   initializeCards();
  // };

  const handleSubmit = async () => {
    setLoadingSubmit(true);
    if (loading) {
      return;
    }
    if (selectedCards.length < 5) {
      return;
    }
    try {
      console.log('handle submit called');
      console.log('selected cards: ', selectedCards);
      console.log('submit cards function:', submitCards);
      const luck = searchParams.get('luck');
      console.log('luck: ', luck);
      const room = await submitCards(selectedCards, 1); //TODO: need to be fixed
      if (room && room.id) {
        window.location.href = `/chat?id=${room.id}&luck=${luck}&salutation=true`;
      } else {
        window.alert('Error occured');
      }
      // axios
      //   .post('/api/submit', {
      //     selectedCards,
      //     userId: 1,
      //   })
      //   .then((res) => {
      //     console.log('submit  res:', res);
      //   })
      //   .catch((err) => {
      //     console.log('err: ', err);
      //   });
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
    }
  };

  const handleCardSelect = (index: number) => {
    if (
      selectedCards.length >= 5 ||
      selectedCards.some((card) => card.index === index)
    ) {
      return; // Prevent selecting more than 5 cards or re-selecting
    }

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
          {/* <button
            className='btn btn-primary  w-[100%] h-[100%]'
            onClick={handleSubmit}
          >
            Submit
          </button> */}
        </ul>
        {loadingSubmit && (
          <div className='w-[100vw] h-[100vh] absolute bg-black bg-opacity-80 flex justify-center items-center'>
            <div className='flex flex-col justify-center items-center text-2xl text-white'>
              <span>Loading...</span>
              <span className='loading loading-ring loading-lg'></span>
            </div>
          </div>
        )}
        <dialog id='alertModal' className='modal'>
          <div className='modal-box'>
            <h3 className='font-bold text-xl'>타로카드에 오신걸 환영합니다.</h3>
            <p className='p-4 text-center text-2xl'>카드 5개를 골라주세요!</p>
            <div className='modal-action'>
              <form method='dialog'>
                {/* if there is a button in form, it will close the modal */}
                <button
                  className={`btn btn-primary ${loading ? 'disabled' : ''}`}
                >
                  확인
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
