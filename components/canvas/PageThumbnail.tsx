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
    <Image
      src={thumbnailUrl}
      alt={`Page ${pageNumber} thumbnail`}
      width={150}
      height={210}
      className="mb-2 h-auto w-full"
      unoptimized
    />
    <p className="text-xs font-medium">Page {pageNumber}</p>
  </button>
);
