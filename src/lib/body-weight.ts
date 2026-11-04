export interface BodyWeightRecord {
  id: string;
  member: "thong" | "thuan";
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string | undefined;
  createdAt: string;
}

const STORAGE_PREFIX = "lpgb.bodyweight.";

function getStorageKey(member: "thong" | "thuan") {
  return `${STORAGE_PREFIX}${member}`;
}

const DEFAULT_SEEDS: Record<"thong" | "thuan", BodyWeightRecord[]> = {
  thong: [
    {
      id: "bw-thong-1",
      member: "thong",
      date: "2026-10-15",
      weightKg: 69.5,
      note: "Bắt đầu chu kỳ siết nhẹ",
      createdAt: "2026-10-15T07:00:00Z",
    },
    {
      id: "bw-thong-2",
      member: "thong",
      date: "2026-10-22",
      weightKg: 69.0,
      note: "Cân buổi sáng lúc đói",
      createdAt: "2026-10-22T07:00:00Z",
    },
    {
      id: "bw-thong-3",
      member: "thong",
      date: "2026-10-29",
      weightKg: 68.6,
      note: "Cân sau khi tập Push",
      createdAt: "2026-10-29T07:00:00Z",
    },
    {
      id: "bw-thong-4",
      member: "thong",
      date: "2026-11-04",
      weightKg: 68.2,
      note: "Cân buổi sáng lúc mới ngủ dậy",
      createdAt: "2026-11-04T06:30:00Z",
    },
  ],
  thuan: [
    {
      id: "bw-thuan-1",
      member: "thuan",
      date: "2026-10-15",
      weightKg: 72.0,
      note: "Bắt đầu theo dõi",
      createdAt: "2026-10-15T07:00:00Z",
    },
    {
      id: "bw-thuan-2",
      member: "thuan",
      date: "2026-10-25",
      weightKg: 71.5,
      note: "Sau buổi Legs",
      createdAt: "2026-10-25T07:00:00Z",
    },
    {
      id: "bw-thuan-3",
      member: "thuan",
      date: "2026-11-03",
      weightKg: 71.0,
      note: "Cân buổi sáng",
      createdAt: "2026-11-03T07:00:00Z",
    },
  ],
};

export function loadBodyWeights(member: "thong" | "thuan"): BodyWeightRecord[] {
  if (typeof window === "undefined") return DEFAULT_SEEDS[member];
  try {
    const raw = localStorage.getItem(getStorageKey(member));
    if (!raw) {
      // Seed default once so the chart looks good immediately
      localStorage.setItem(getStorageKey(member), JSON.stringify(DEFAULT_SEEDS[member]));
      return DEFAULT_SEEDS[member];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("Error loading body weights:", err);
    return [];
  }
}

export function saveBodyWeight(entry: {
  member: "thong" | "thuan";
  date: string;
  weightKg: number;
  note?: string;
}): BodyWeightRecord {
  const current = loadBodyWeights(entry.member);
  const newRecord: BodyWeightRecord = {
    id: `bw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    member: entry.member,
    date: entry.date,
    weightKg: Math.round(entry.weightKg * 10) / 10,
    note: entry.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  // Replace if same date exists or push new
  const existingIdx = current.findIndex((item) => item.date === entry.date);
  let updated: BodyWeightRecord[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newRecord;
  } else {
    updated = [...current, newRecord];
  }
  updated.sort((a, b) => a.date.localeCompare(b.date));

  if (typeof window !== "undefined") {
    localStorage.setItem(getStorageKey(entry.member), JSON.stringify(updated));
  }
  return newRecord;
}

export function deleteBodyWeight(id: string, member: "thong" | "thuan"): BodyWeightRecord[] {
  const current = loadBodyWeights(member);
  const updated = current.filter((item) => item.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(getStorageKey(member), JSON.stringify(updated));
  }
  return updated;
}
