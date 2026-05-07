"use client";

type DragHandleProps = {
  x: number;
  y: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export const DragHandle = ({ x, y, onPointerDown }: DragHandleProps) => (
  <div
    role="slider"
    tabIndex={0}
    onPointerDown={onPointerDown}
    style={{ left: x, top: y }}
    className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-brutal border-2 border-ink bg-accent"
    aria-label="Drag handle"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={0}
  />
);
