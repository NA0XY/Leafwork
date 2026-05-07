"use client";

import { useCallback, useMemo, useState } from "react";

const PDF_MIME = "application/pdf";

export type UseDropZoneOptions = {
  maxFiles?: number;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
};

export const useDropZone = ({ maxFiles = 20, onFiles, onError }: UseDropZoneOptions) => {
  const [isDragging, setIsDragging] = useState(false);

  const validateFiles = useCallback(
    (fileList: FileList | null): File[] => {
      if (!fileList) {
        return [];
      }

      const files = Array.from(fileList);

      if (files.length > maxFiles) {
        onError?.(`You can drop up to ${maxFiles} files at once.`);
        return [];
      }

      const invalid = files.find((file) => file.type !== PDF_MIME);
      if (invalid) {
        onError?.(`File ${invalid.name} is not a PDF.`);
        return [];
      }

      return files;
    },
    [maxFiles, onError]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const files = validateFiles(event.dataTransfer.files);
      if (files.length) {
        onFiles(files);
      }
    },
    [onFiles, validateFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = validateFiles(event.target.files);
      if (files.length) {
        onFiles(files);
      }
      event.currentTarget.value = "";
    },
    [onFiles, validateFiles]
  );

  return useMemo(
    () => ({
      isDragging,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      handleInputFiles
    }),
    [handleDragLeave, handleDragOver, handleDrop, handleInputFiles, isDragging]
  );
};
