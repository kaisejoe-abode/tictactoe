import { Cell as CellType } from '../types';

interface CellProps {
  value: CellType;
  onClick: () => void;
  disabled: boolean;
}

export const Cell = ({ value, onClick, disabled }: CellProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-24 h-24 sm:w-28 sm:h-28 
        flex items-center justify-center
        text-5xl sm:text-6xl font-bold
        border-2 border-gray-300
        transition-all duration-200
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:bg-blue-50 cursor-pointer'}
        ${value === 'X' ? 'text-blue-600' : value === 'O' ? 'text-red-600' : 'text-gray-400'}
      `}
    >
      {value}
    </button>
  );
};
