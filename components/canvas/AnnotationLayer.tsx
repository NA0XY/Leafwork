"use client";

type Annotation = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

export const AnnotationLayer = ({
  annotations,
  className
}: {
  annotations: Annotation[];
  className?: string;
}) => (
  <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`.trim()}>
    {annotations.map((annotation) => (
      <div
        key={annotation.id}
        style={{
          position: "absolute",
          left: annotation.x,
          top: annotation.y,
          width: annotation.width,
          height: annotation.height,
          backgroundColor: annotation.color ?? "rgba(239,68,68,0.4)",
          border: "2px solid #1a1a1a"
        }}
      />
    ))}
  </div>
);
