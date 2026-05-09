"use client";

export type LocalUsageStats = {
  day: string;
  toolsUsedToday: number;
  filesProcessed: number;
  bytesSaved: number;
};

export type ActivityItem = {
  tool: string;
  timestamp: string;
  fileName?: string;
};

const USAGE_KEY = "leafwork:usage-stats";
const ACTIVITY_KEY = "leafwork:recent-activity";
const ACTIVITY_EVENT = "leafwork:activity-updated";

const emptyUsage = (day: string): LocalUsageStats => ({
  day,
  toolsUsedToday: 0,
  filesProcessed: 0,
  bytesSaved: 0
});

const getDayKey = (): string => new Date().toLocaleDateString("en-CA");

export const readUsageStats = (): LocalUsageStats => {
  if (typeof window === "undefined") {
    return emptyUsage(getDayKey());
  }

  const today = getDayKey();
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) {
      return emptyUsage(today);
    }

    const parsed = JSON.parse(raw) as Partial<LocalUsageStats>;
    if (parsed.day && parsed.day !== today) {
      return emptyUsage(today);
    }

    return {
      day: today,
      toolsUsedToday: parsed.toolsUsedToday ?? 0,
      filesProcessed: parsed.filesProcessed ?? 0,
      bytesSaved: parsed.bytesSaved ?? 0
    };
  } catch {
    return emptyUsage(today);
  }
};

export const readRecentActivity = (): ActivityItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

type TrackActivityInput = {
  tool: string;
  fileName?: string;
  filesProcessed?: number;
  inputBytes?: number;
  outputBytes?: number;
};

export const trackToolActivity = (input: TrackActivityInput): void => {
  if (typeof window === "undefined") {
    return;
  }

  const now = new Date().toISOString();
  const filesProcessed = Math.max(1, input.filesProcessed ?? 1);
  const bytesSaved = Math.max(0, (input.inputBytes ?? 0) - (input.outputBytes ?? 0));

  const usage = readUsageStats();
  const nextUsage: LocalUsageStats = {
    day: usage.day,
    toolsUsedToday: usage.toolsUsedToday + 1,
    filesProcessed: usage.filesProcessed + filesProcessed,
    bytesSaved: usage.bytesSaved + bytesSaved
  };

  const nextActivity: ActivityItem[] = [
    {
      tool: input.tool,
      timestamp: now,
      fileName: input.fileName
    },
    ...readRecentActivity()
  ].slice(0, 50);

  localStorage.setItem(USAGE_KEY, JSON.stringify(nextUsage));
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(nextActivity));
  window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT));
};

export const usageStatsStorageKey = USAGE_KEY;
export const recentActivityStorageKey = ACTIVITY_KEY;
export const activityUpdatedEvent = ACTIVITY_EVENT;
