'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const tiles: Array<{ id: string; name: string; desc: string; emoji: string }> =
  [
    { id: 'love', name: '연애', desc: '관계의 흐름, 상대마음', emoji: '❤️' },
    { id: 'wealth', name: '재물', desc: '수입·지출 밸런스', emoji: '💰' },
    { id: 'business', name: '사업', desc: '아이템, 파트너십', emoji: '🏢' },
    { id: 'job', name: '취업', desc: '채용 운, 준비 전략', emoji: '🧑‍💼' },
    { id: 'promotion', name: '승진', desc: '평가 포인트, 시기', emoji: '📈' },
    { id: 'path', name: '진로', desc: '적성, 장단기 방향', emoji: '🧭' },
    { id: 'trade', name: '매매', desc: '부동산/차량 거래 운', emoji: '🏠' },
    { id: 'move', name: '이동', desc: '이사·해외·출장 기운', emoji: '🚚' },
    { id: 'children', name: '자녀', desc: '양육, 관계, 아이상황', emoji: '👶' },
    { id: 'study', name: '학업', desc: '집중력, 성과 상승 팁', emoji: '📚' },
  ];

export default function LuckSelection() {
  const router = useRouter();
  const handleSelection = (luckId: string) =>
    router.push(`/card?luck=${luckId}`);

  return (
    <div className='min-h-screen px-4 py-6 bg-[#0c0f16] text-[#f2f5ff]'>
      <header className='sticky top-0 z-50 backdrop-blur bg-[rgba(13,16,25,.6)] border-b border-[rgba(255,255,255,.06)]'>
        <div className='flex items-center gap-3 p-4 max-w-screen-lg mx-auto'>
          <div className='font-extrabold tracking-tight text-base'>
            🃏 AI 타로점
          </div>
          <span className='ml-auto text-xs px-2 py-0.5 rounded-full border border-[rgba(167,139,250,.35)] text-[#a78bfa] bg-[rgba(167,139,250,.15)]'>
            회원님
          </span>
        </div>
      </header>

      <main className='max-w-screen-lg mx-auto'>
        <section className='mt-4 mb-2 p-4 rounded-[18px] border border-[rgba(255,255,255,.08)] bg-[linear-gradient(135deg,rgba(167,139,250,.12),rgba(245,158,11,.08))]'>
          <h1 className='m-0 mb-1 text-lg font-semibold'>
            관심 주제를 선택하세요
          </h1>
          <p className='m-0 text-sm text-[#a1acc5]'>
            연애 · 재물 · 사업 · 취업 · 승진 · 진로 · 매매 · 이동 · 자녀 · 학업
          </p>
        </section>

        <section className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
          {tiles.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelection(t.id)}
              className='text-left rounded-2xl border border-[rgba(255,255,255,.06)] bg-[#141927] p-4 shadow-[0_10px_22px_rgba(0,0,0,.28)] hover:-translate-y-0.5 hover:border-[rgba(167,139,250,.45)] transition'
            >
              <div className='flex items-center gap-2'>
                <span className='w-[38px] h-[38px] grid place-items-center rounded-xl bg-[rgba(255,255,255,.06)] text-lg'>
                  {t.emoji}
                </span>
                <div className='leading-tight'>
                  <div className='text-[15px] font-semibold'>{t.name}</div>
                  <div className='text-xs text-[#a1acc5] mt-1'>{t.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </section>
      </main>

      {/* Bottom-left Home button (benchmark-style tabbar simplified) */}
      <nav className='fixed left-0 bottom-0 z-[60] w-full bg-[linear-gradient(180deg,rgba(8,10,16,.05),rgba(8,10,16,.2))] border-t border-[rgba(255,255,255,.08)] backdrop-blur'>
        <div className='max-w-screen-lg mx-auto px-2 py-2'>
          <Link
            href='http://www.onnl.net/alarm_fortune/default.aspx'
            className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-[#f2f5ff]'
          >
            <span className='text-base'>🏠</span>
            <span>홈</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
