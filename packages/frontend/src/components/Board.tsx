import { Board as BoardType } from '../types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  onCellClick: (index: number) => void;
  disabled: boolean;
}

export const Board = ({ board, onCellClick, disabled }: BoardProps) => {
  return (
    <div className="inline-block bg-gray-300 p-1 rounded-lg shadow-lg">
      <div className="grid grid-cols-3 gap-1">
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onCellClick(index)}
            disabled={disabled || cell !== null}
          />
        ))}
      </div>
    </div>
  );
};
