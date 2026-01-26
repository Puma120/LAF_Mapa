type Props = { 
  bearing: number;
  onReset: () => void;
};

export default function Compass({ bearing, onReset }: Props) {
  if (bearing === 0) {
    return null;
  }
  return (
    <button
      onClick={onReset}
      className="top-10 mb-2 static w-14 h-14 flex items-center justify-center rounded-full cursor-pointer bg-white"
    >
      <div 
        className="relative w-12 h-12 flex items-center justify-center"
        style={{
          transform: `rotate(${-bearing}deg)`,
          transition: 'transform 200ms ease',
        }}
      >
        <svg
          width="15"
          height="18"
          viewBox="0 0 18 22"
          className="block"
        >
          <polygon
            points="9,2 16,20 9,16 2,20"
            fill="#e11"
            stroke="#b00"
            strokeWidth="1"
          />
        </svg>
        <span className="absolute -top-1 text-xs text-gray-700">
          N
        </span>
      </div>
    </button>
  );
}
