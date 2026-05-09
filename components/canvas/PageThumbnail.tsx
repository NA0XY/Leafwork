"use client";

import Image from "next/image";

type PageThumbnailProps = {
  thumbnailUrl: string;
  pageNumber: number;
  selected?: boolean;
  onClick?: () => void;
};

export const PageThumbnail = ({ thumbnailUrl, pageNumber, selected = false, onClick }: PageThumbnailProps) => (
  <button
    type="button"
    className={`brutalist-card w-full p-2 text-left ${selected ? "bg-green-100" : "bg-surface"}`}
    onClick={onClick}
  >
    <div className="relative mb-2 w-full" style={{ paddingBottom: "141.42%" }}>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={`Page ${pageNumber} thumbnail`}
          fill
          className="absolute inset-0 h-full w-full object-contain"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 animate-pulse rounded-brutal bg-green-100" />
      )}
    </div>
    <p className="text-xs font-medium">Page {pageNumber}</p>
  </button>
);
