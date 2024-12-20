import image from '@/assets/images/back.png';
export default function Card({
  index,
  isOpposite,
  onLoad,
  onSelect,
  isFlipped,
}: {
  index: number;
  isOpposite: boolean;
  onLoad: () => void;
  onSelect: () => void;
  isFlipped: boolean;
}) {
  // const [isFlipped, setFlipped] = useState(false);

  // const handleCardClick = () => {
  //   setFlipped(!isFlipped);
  //   onSelect();
  // };

  return (
    <li className='card' onClick={onSelect}>
      <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div
          className='card-front'
          style={{
            backgroundImage: `url(${image.src})`,
          }}
        ></div>
        <div className={`card-back ${isOpposite ? 'opposite' : ''}`}>
          <img
            src={`https://dtizen.net/taro/png/${
              index < 10 ? '0' + index : index
            }.png`}
            alt='tarot'
            onLoad={onLoad}
          />
        </div>
      </div>
    </li>
  );
}
