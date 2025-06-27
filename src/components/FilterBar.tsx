import React from 'react';

interface Props {
  direction: string;
  status: string;
  setDirection: (d: string) => void;
  setStatus: (s: string) => void;
}

const directions = ['all', 'frontend', 'backend', 'QA', 'mobile', 'product', 'data', 'manager'];
const statuses = ['all', 'past', 'upcoming'];

export const FilterBar: React.FC<Props> = ({ direction, status, setDirection, setStatus }) => {
  return (
    <div className="flex gap-2 p-2 overflow-x-auto">
      <select value={direction} onChange={(e) => setDirection(e.target.value)} className="p-2 rounded">
        {directions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 rounded">
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
};
