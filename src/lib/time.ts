// Vietnam time helpers. Asia/Ho_Chi_Minh is a fixed UTC+7 offset (no DST).
const VN_OFFSET_MIN = 7 * 60;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Returns VN wall-clock parts for an instant. */
export function vnParts(d: Date) {
  const v = new Date(d.getTime() + VN_OFFSET_MIN * 60_000);
  return {
    y: v.getUTCFullYear(),
    m: v.getUTCMonth() + 1,
    d: v.getUTCDate(),
    h: v.getUTCHours(),
    min: v.getUTCMinutes(),
    dow: v.getUTCDay(),
  };
}

export function vnDateStr(d: Date = new Date()) {
  const p = vnParts(d);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Default start for a new session: VN now + 1 hour, rounded up to the next 5 minutes. */
export function defaultSessionStart(now: Date = new Date()) {
  const ms = now.getTime() + 60 * 60_000;
  const step = 5 * 60_000;
  const rounded = new Date(Math.ceil(ms / step) * step);
  const p = vnParts(rounded);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.min)}` };
}

/** "2026-10-15" -> "15/10/2026" */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** "18:30:00" -> "18:30" */
export function fmtTime(t: string) {
  return t.slice(0, 5);
}

export function fmtDateTimeVN(ts: string) {
  const p = vnParts(new Date(ts));
  return `${pad(p.h)}:${pad(p.min)} ${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
export function weekdayVN(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function todayLabelVN(now = new Date()) {
  const s = vnDateStr(now);
  return `${weekdayVN(s)}, ${fmtDate(s)}`;
}

/** Monday of the VN week containing `now`, as yyyy-MM-dd. */
export function vnWeekStart(now = new Date()) {
  const p = vnParts(now);
  const diff = (p.dow + 6) % 7;
  const base = new Date(Date.UTC(p.y, p.m - 1, p.d - diff));
  return base.toISOString().slice(0, 10);
}

export function vnMonthStart(now = new Date()) {
  const p = vnParts(now);
  return `${p.y}-${pad(p.m)}-01`;
}
