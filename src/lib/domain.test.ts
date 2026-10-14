import { describe, expect, it } from "vitest";
import { defaultSessionStart } from "./time";
import { completedStats, initialAttendance, pushNewSessionBody, PUSH_NEW_TITLE, PUSH_CHANGE_BODY } from "./domain";

describe("default session start", () => {
  it("is Vietnam time + 1 hour rounded up to 5 minutes", () => {
    // 10:12 UTC = 17:12 VN -> 18:12 -> 18:15
    expect(defaultSessionStart(new Date("2026-10-14T10:12:00Z"))).toEqual({ date: "2026-10-14", time: "18:15" });
  });
  it("rolls over midnight in Vietnam time", () => {
    // 16:30 UTC = 23:30 VN -> 00:30 next day
    expect(defaultSessionStart(new Date("2026-10-14T16:30:00Z"))).toEqual({ date: "2026-10-15", time: "00:30" });
  });
});

describe("attendance", () => {
  it("creator confirmed, other pending", () => {
    expect(initialAttendance("thuan")).toEqual({ thong_status: "pending", thuan_status: "confirmed" });
  });
});

describe("stats", () => {
  it("counts only completed, non-deleted sessions", () => {
    const now = new Date("2026-10-14T05:00:00Z");
    const s = [
      { session_date: "2026-10-13", status: "completed", deleted_at: null },
      { session_date: "2026-10-13", status: "completed", deleted_at: "2026-10-13T10:00:00Z" },
      { session_date: "2026-10-12", status: "cancelled", deleted_at: null },
      { session_date: "2026-10-15", status: "scheduled", deleted_at: null },
      { session_date: "2026-10-02", status: "completed", deleted_at: null },
    ];
    expect(completedStats(s, now)).toEqual({ total: 2, week: 1, month: 2 });
  });
});

describe("push content", () => {
  it("is generic and matches the template", () => {
    const body = pushNewSessionBody("2026-10-15", "18:30:00", "CLB Gym Long Phú");
    expect(body).toBe(
      "Có buổi tập gym vào lúc 18:30, ngày 15/10/2026 tại CLB Gym Long Phú. Hãy mở ứng dụng để xem lịch và xác nhận tham gia.",
    );
    for (const t of [body, PUSH_NEW_TITLE, PUSH_CHANGE_BODY]) {
      expect(t).not.toMatch(/Thông|Thuận/);
    }
  });
});
