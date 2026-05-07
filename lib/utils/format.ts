const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const safeDecimals = Math.max(0, Math.min(3, decimals));
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** order;
  const formatted = order === 0 ? Math.round(value).toString() : value.toFixed(safeDecimals);

  return `${formatted} ${BYTE_UNITS[order]}`;
};

export const formatDurationMs = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
};

export const timeAgo = (dateInput: Date | string | number): string => {
  const time = new Date(dateInput).getTime();
  if (!Number.isFinite(time)) {
    return "just now";
  }

  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 30) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (hours < 48) {
    return "yesterday";
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export const formatPageCount = (count: number): string => `${count} page${count === 1 ? "" : "s"}`;

export const truncateFilename = (name: string, maxLength = 30): string => {
  if (name.length <= maxLength) {
    return name;
  }

  const lastDot = name.lastIndexOf(".");
  const hasExtension = lastDot > 0 && lastDot < name.length - 1;

  if (!hasExtension) {
    return `${name.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  const extension = name.slice(lastDot);
  const base = name.slice(0, lastDot);
  const availableBaseLength = Math.max(1, maxLength - extension.length - 3);

  if (availableBaseLength <= 3) {
    return `${name.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  return `${base.slice(0, availableBaseLength)}...${extension}`;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
