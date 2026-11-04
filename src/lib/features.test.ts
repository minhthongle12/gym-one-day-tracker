import { describe, expect, it, beforeEach } from "vitest";
import { formatSessionShareText } from "./share-card";
import { loadBodyWeights, saveBodyWeight, deleteBodyWeight } from "./body-weight";
import type { Session } from "./queries";

describe("share workout schedule text", () => {
  it("formats session details into a friendly Zalo message", () => {
    const mockSession = {
      id: "session-1",
      session_date: "2026-11-05",
      start_time: "17:30:00",
      location: "CLB Gym Long Phú",
      created_by: "thong",
      thong_status: "confirmed",
      thuan_status: "pending",
      status: "scheduled",
      notes: "Tập ngực và tay sau",
      created_at: "2026-11-04T12:00:00Z",
      completed_at: null,
      cancelled_at: null,
      cancelled_by: null,
      deleted_at: null,
      deleted_by: null,
    } as Session;

    const text = formatSessionShareText(mockSession);
    expect(text).toContain("LỊCH TẬP GYM - CLB LONG PHÚ");
    expect(text).toContain("17:30");
    expect(text).toContain("05/11/2026");
    expect(text).toContain("CLB Gym Long Phú");
    expect(text).toContain("Thông: Đã xác nhận");
    expect(text).toContain("Thuận: Chờ xác nhận");
    expect(text).toContain("Tập ngực và tay sau");
    expect(text).toContain("Đi tập đúng giờ nhé");
  });
});

class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = mockStorage;
(globalThis as unknown as { window: { localStorage: LocalStorageMock } }).window = {
  localStorage: mockStorage,
};

describe("body weight tracker", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("loads initial seed data when empty", () => {
    const weights = loadBodyWeights("thong");
    expect(weights.length).toBeGreaterThan(0);
    expect(weights[0]?.member).toBe("thong");
  });

  it("saves a new weight entry and keeps it sorted by date", () => {
    saveBodyWeight({
      member: "thong",
      date: "2026-11-05",
      weightKg: 68.1,
      note: "Cân buổi sáng",
    });

    const weights = loadBodyWeights("thong");
    const found = weights.find((w) => w.date === "2026-11-05");
    expect(found).toBeDefined();
    expect(found?.weightKg).toBe(68.1);
    expect(found?.note).toBe("Cân buổi sáng");
  });

  it("deletes a weight entry by id", () => {
    const saved = saveBodyWeight({
      member: "thong",
      date: "2026-11-06",
      weightKg: 68.0,
    });

    let weights = loadBodyWeights("thong");
    expect(weights.some((w) => w.id === saved.id)).toBe(true);

    deleteBodyWeight(saved.id, "thong");
    weights = loadBodyWeights("thong");
    expect(weights.some((w) => w.id === saved.id)).toBe(false);
  });
});
