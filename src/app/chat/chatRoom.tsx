'use client';
import { useSearchParams } from 'next/navigation';
import React, {
  useEffect,
  useState,
  Suspense,
  useCallback,
  useRef,
} from 'react';
import { checkChatRoom, getChatRoomCards, getMessages } from '../actions';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ChatRoom_Card } from '@prisma/client';
import Card from '@/components/Card';
import cards from '@/static/cards';
import { transform } from 'next/dist/build/swc';

type Message = {
  id: number;
  sender: string;
  message: string;
  timestamp: Date;
};

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const searchParams = useSearchParams();
  const chatRoomId = searchParams.get('id');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedCards, setSelectedCards] = useState<ChatRoom_Card[]>([]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleReader = useCallback(
    async (
      response: Response,
      setState: React.Dispatch<React.SetStateAction<string>>,
    ) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader found');
      }
      const decoder = new TextDecoder();
      let partialMessage = '';

      // Stream AI response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        console.log('chunk: ', chunk);
        partialMessage += chunk;
        setState(partialMessage);
      }
    },
    [],
  );
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Fetch existing messages when the component mounts
    console.log('chat room id: ', chatRoomId);
    if (chatRoomId === null) {
      return;
    }
    checkChatRoom(parseInt(chatRoomId))
      .then((bool: boolean) => {
        console.log('check chat room : ', bool);
        if (bool) {
          return getMessages({ userId: 0, chatRoomId: Number(chatRoomId) });
        } else {
          throw new Error('');
        }
      })
      .then(async (res) => {
        console.log('messages res: ', res);
        setMessages(res);
        // if (res.length) {
        //   return false;
        // } else {
        //   return true;
        // }
        const salutation = window.localStorage.getItem('salutation');
        console.log('salutation: ', salutation);
        if (salutation === 'true') {
          window.localStorage.setItem('salutation', 'false');
          return true;
        }
        if (salutation === 'false') {
          return false;
        }
        return false;
      })
      .then((bool) => {
        console.log('bool: ', bool);
        if (bool) {
          return fetch(
            `/api/edge/salutation/${chatRoomId}?luck=${searchParams.get(
              'luck',
            )}&`,
          );
        } else {
          return;
        }
      })
      .then((res) => {
        if (res) {
          handleReader(res, setStreamingMessage);
        }
      })
      .catch((err) => {
        console.log('use effect error', err);
      });
    if (chatRoomId) {
      getChatRoomCards(parseInt(chatRoomId))
        .then((cards) => {
          setSelectedCards(cards);
        })
        .catch((err) => {
          console.log('error on fetching chat room cards', err);
        });
    }
  }, [chatRoomId, handleReader, searchParams]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      message: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStreamingMessage('');
    setUserInput('');

    try {
      const response = await fetch(`/api/edge/chat/${chatRoomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder();
      let partialMessage = '';

      // Stream AI response
      while (true) {
        const { done, value } = await reader.read();
        console.log('done: ', done);
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('chunk: ', chunk);
        partialMessage += chunk;
        setStreamingMessage(partialMessage);
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        message: partialMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error during message send or streaming:', error);
    } finally {
      setLoading(false);
      setStreamingMessage('');
    }
  };
  console.log('Cards: ', selectedCards);
  return (
    <Suspense>
      <div className='min-h-screen flex flex-col relative'>
        <ul className='absolute flex flex-row p-4 gap-2 bg-slate-500 bg-opacity-80'>
          {selectedCards.map((card) => {
            const index = card.cardId;
            return (
              <img
                key={index}
                src={`https://dtizen.net/taro/png/${
                  index < 10 ? '0' + index : index
                }.png`}
                alt='tarot'
                width={80}
                style={{
                  transform: card.isOpposite ? 'rotateX(180deg)' : '',
                }}
              />
            );
          })}
        </ul>
        <div className='overflow-y-auto p-4 h-[calc(100vh-130px)]'>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 ${
                msg.sender === 'ai' ? 'text-left' : 'text-right'
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  msg.sender === 'ai'
                    ? 'bg-gray-200 text-black'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
              <div className='text-xs text-gray-500'>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {streamingMessage && (
            <div className='mb-4 text-left'>
              <div className='inline-block px-4 py-2 rounded-lg bg-gray-200 text-black'>
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
              </div>
            </div>
          )}
          {loading && !streamingMessage && (
            <div className='text-gray-500 text-sm'>AI is typing...</div>
          )}
          <div ref={messagesEndRef} /> {/* 스크롤 위치를 잡기 위한 더미 div */}
        </div>
        <div className='p-4 border-t border-gray-300 flex items-center space-x-2'>
          <Link href='/' className='btn'>
            Back
          </Link>
          <input
            type='text'
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleSend();
            }}
            placeholder='Type a message...'
            className='flex-1 p-2 border rounded-lg h-12'
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className='btn bg-blue-500 text-white disabled:opacity-50'
          >
            Send
          </button>
        </div>
      </div>
    </Suspense>
  );
}
