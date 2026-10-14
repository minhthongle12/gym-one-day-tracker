import { fmtDate, fmtTime, vnMonthStart, vnWeekStart } from "./time";

export type Member = "thong" | "thuan";
export const MEMBERS: Member[] = ["thong", "thuan"];
export const MEMBER_NAME: Record<Member, string> = { thong: "Thông", thuan: "Thuận" };
export const otherMember = (m: Member): Member => (m === "thong" ? "thuan" : "thong");
export const DEFAULT_LOCATION = "CLB Gym Long Phú";

export type Attendance = "pending" | "confirmed" | "declined";
export type SessionStatus = "scheduled" | "completed" | "cancelled";

export const ATTENDANCE_LABEL: Record<Attendance, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  declined: "Không tham gia",
};
export const STATUS_LABEL: Record<SessionStatus | "deleted", string> = {
  scheduled: "Sắp diễn ra",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
  deleted: "Đã xóa",
};

export interface SessionLike {
  session_date: string;
  status: string;
  deleted_at: string | null;
}

/** Ordinary statistics count only completed, non-deleted sessions. */
export function isCountable(s: SessionLike) {
  return s.status === "completed" && !s.deleted_at;
}

export function completedStats(sessions: SessionLike[], now = new Date()) {
  const valid = sessions.filter(isCountable);
  const week = vnWeekStart(now);
  const month = vnMonthStart(now);
  return {
    total: valid.length,
    week: valid.filter((s) => s.session_date >= week).length,
    month: valid.filter((s) => s.session_date >= month).length,
  };
}

/** Initial attendance: the creator is confirmed, the other person pending. */
export function initialAttendance(creator: Member) {
  return {
    thong_status: (creator === "thong" ? "confirmed" : "pending") as Attendance,
    thuan_status: (creator === "thuan" ? "confirmed" : "pending") as Attendance,
  };
}

// Generic push content — never mentions Thông or Thuận.
export const PUSH_NEW_TITLE = "Long Phú Gym Buddy — Có lịch tập mới!";
export function pushNewSessionBody(date: string, time: string, location: string) {
  return `Có buổi tập gym vào lúc ${fmtTime(time)}, ngày ${fmtDate(date)} tại ${location}. Hãy mở ứng dụng để xem lịch và xác nhận tham gia.`;
}
export const PUSH_CHANGE_TITLE = "Long Phú Gym Buddy — Thay đổi lịch tập";
export const PUSH_CHANGE_BODY = "Có thay đổi về lịch tập. Hãy mở Long Phú Gym Buddy để xem chi tiết.";

export const WEIGHT_CONVENTION: Record<string, string> = {
  barbell: "Tạ đòn: ghi tổng khối lượng, bao gồm cả thanh đòn.",
  dumbbell: "Tạ đơn: ghi khối lượng của MỘT quả tạ.",
  machine: "Máy: ghi mức tạ hiển thị trên máy.",
  cable: "Cáp: ghi mức tạ hiển thị trên chồng tạ.",
  assisted: "Có hỗ trợ: ghi mức hỗ trợ trên máy (số càng nhỏ càng khó). Cân nặng cơ thể ghi riêng.",
};

export const CATEGORY_LABEL: Record<string, string> = { PUSH: "PUSH · Đẩy", PULL: "PULL · Kéo", LEGS: "LEGS · Chân" };
