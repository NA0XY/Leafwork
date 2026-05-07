"use client";

import { PageThumbnail } from "@/components/canvas/PageThumbnail";

type PageGridProps = {
  thumbnails: string[];
  selectedPages: Set<number>;
  onToggle: (pageIndex: number) => void;
};

export const PageGrid = ({ thumbnails, selectedPages, onToggle }: PageGridProps) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {thumbnails.map((thumbnail, index) => (
      <PageThumbnail
        key={`thumb-${index + 1}`}
        thumbnailUrl={thumbnail}
        pageNumber={index + 1}
        selected={selectedPages.has(index)}
        onClick={() => onToggle(index)}
      />
    ))}
  </div>
);
