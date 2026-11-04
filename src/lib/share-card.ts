import type { Session } from "./queries";
import { ATTENDANCE_LABEL, MEMBER_NAME, type Attendance } from "./domain";
import { fmtDate, fmtTime, weekdayVN } from "./time";

/**
 * Draws a high-quality ticket/schedule card on Canvas and returns a Blob (PNG)
 */
export async function generateSessionCardBlob(session: Session): Promise<Blob> {
  const width = 840;
  const height = 520;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is not available");

  // 1. Background gradient (dark athletic theme)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#131a15");
  bgGrad.addColorStop(0.5, "#17231a");
  bgGrad.addColorStop(1, "#0d130e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative athletic grid lines / accent glow
  const glowGrad = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 400);
  glowGrad.addColorStop(0, "rgba(163, 230, 53, 0.15)");
  glowGrad.addColorStop(1, "rgba(163, 230, 53, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer border with subtle glow
  ctx.strokeStyle = "rgba(163, 230, 53, 0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // 2. Header
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Gym Tag
  ctx.font = "bold 15px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "#a3e635";
  ctx.letterSpacing = "2px";
  ctx.fillText("CLB GYM LONG PHÚ", width / 2, 48);
  ctx.letterSpacing = "0px";

  // Subtitle
  ctx.font = "bold 13px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("LỊCH HẸN TẬP GYM", width / 2, 70);

  // Divider
  ctx.strokeStyle = "rgba(163, 230, 53, 0.3)";
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, 96);
  ctx.lineTo(width / 2 + 120, 96);
  ctx.stroke();

  // 3. Main Time & Date
  const timeStr = fmtTime(session.start_time);
  const dateStr = `${weekdayVN(session.session_date)}, ${fmtDate(session.session_date)}`;

  // Big time
  ctx.font = "bold 76px 'Barlow Condensed', Impact, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(timeStr, width / 2, 115);

  // Date
  ctx.font = "600 22px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "#a3e635";
  ctx.fillText(dateStr, width / 2, 205);

  // Location badge
  const locationText = `📍 ${session.location || "CLB Gym Long Phú"}`;
  ctx.font = "16px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(locationText, width / 2, 245);

  // 4. Participants Box
  const boxY = 295;
  const boxW = 540;
  const boxH = 95;
  const boxX = (width - boxW) / 2;

  // Box background
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  // Draw attendees
  const members = [
    { name: MEMBER_NAME.thong, status: session.thong_status as Attendance, x: boxX + 135 },
    { name: MEMBER_NAME.thuan, status: session.thuan_status as Attendance, x: boxX + 405 },
  ];

  members.forEach((m) => {
    ctx.font = "bold 17px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(m.name, m.x, boxY + 22);

    const statusText = ATTENDANCE_LABEL[m.status] || "Chưa xác nhận";
    const isOk = m.status === "confirmed";
    const isNo = m.status === "declined";

    ctx.font = "14px 'Be Vietnam Pro', system-ui, sans-serif";
    ctx.fillStyle = isOk ? "#4ade80" : isNo ? "#f87171" : "#facc15";
    ctx.fillText(`${isOk ? "✓ " : isNo ? "✗ " : "⏳ "}${statusText}`, m.x, boxY + 52);
  });

  // Vertical line between members in box
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(width / 2, boxY + 15);
  ctx.lineTo(width / 2, boxY + boxH - 15);
  ctx.stroke();

  // 5. Notes if present, otherwise friendly motivation
  const noteText = session.notes
    ? `Ghi chú: "${session.notes}"`
    : "Đi tập đúng giờ để cùng nhau chinh phục mục tiêu! 💪🔥";
  ctx.font = "italic 15px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fillText(noteText, width / 2, 415);

  // 6. Footer signature
  ctx.font = "12px 'Be Vietnam Pro', system-ui, sans-serif";
  ctx.fillStyle = "rgba(163, 230, 53, 0.6)";
  ctx.fillText("Long Phú Gym Buddy • Hẹn bạn tại phòng tập", width / 2, 465);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image blob"));
    }, "image/png");
  });
}

/**
 * Text message format ready to be sent to friends via Zalo / Messenger
 */
export function formatSessionShareText(session: Session): string {
  const time = fmtTime(session.start_time);
  const date = `${weekdayVN(session.session_date)}, ${fmtDate(session.session_date)}`;
  const thongStatus = ATTENDANCE_LABEL[session.thong_status as Attendance];
  const thuanStatus = ATTENDANCE_LABEL[session.thuan_status as Attendance];

  return [
    `🏋️ LỊCH TẬP GYM - CLB LONG PHÚ`,
    `⏰ Giờ tập: ${time}`,
    `📅 Ngày: ${date}`,
    `📍 Địa điểm: ${session.location || "CLB Gym Long Phú"}`,
    `👥 Trạng thái:`,
    `- Thông: ${thongStatus}`,
    `- Thuận: ${thuanStatus}`,
    session.notes ? `📝 Ghi chú: ${session.notes}` : null,
    `🔥 Đi tập đúng giờ nhé bro!`,
  ]
    .filter(Boolean)
    .join("\n");
}

