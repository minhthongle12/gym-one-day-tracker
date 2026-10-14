import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Clock, MapPin, XCircle, Ban, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import pushImg from "@/assets/push.jpg";
import pullImg from "@/assets/pull.jpg";
import legsImg from "@/assets/legs.jpg";
import { ATTENDANCE_LABEL, MEMBER_NAME, STATUS_LABEL, type Attendance, type SessionStatus } from "@/lib/domain";
import type { Session } from "@/lib/queries";
import { fmtDate, fmtTime, weekdayVN } from "@/lib/time";
import { cn } from "@/lib/utils";

export const CATEGORY_IMAGE: Record<string, string> = { PUSH: pushImg, PULL: pullImg, LEGS: legsImg };

const ATT_ICON: Record<Attendance, LucideIcon> = { pending: Clock, confirmed: CheckCircle2, declined: XCircle };
const ATT_CLS: Record<Attendance, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  confirmed: "border-success/40 bg-success/10 text-success",
  declined: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function AttendanceBadge({ status }: { status: Attendance }) {
  const Icon = ATT_ICON[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", ATT_CLS[status])}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {ATTENDANCE_LABEL[status]}
    </span>
  );
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  const cls =
    status === "completed"
      ? "bg-primary text-primary-foreground"
      : status === "cancelled"
        ? "bg-destructive/20 text-destructive"
        : "bg-secondary text-secondary-foreground";
  const Icon = status === "completed" ? CheckCircle2 : status === "cancelled" ? Ban : CalendarClock;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SessionCard({ s }: { s: Session }) {
  return (
    <Link
      to="/lich-tap/$id"
      params={{ id: s.id }}
      className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-2xl font-bold leading-none">{fmtTime(s.start_time)}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {weekdayVN(s.session_date)}, {fmtDate(s.session_date)}
          </div>
        </div>
        <StatusBadge status={s.status as SessionStatus} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" aria-hidden /> {s.location}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1">
          {MEMBER_NAME.thong}: <AttendanceBadge status={s.thong_status as Attendance} />
        </span>
        <span className="flex items-center gap-1">
          {MEMBER_NAME.thuan}: <AttendanceBadge status={s.thuan_status as Attendance} />
        </span>
      </div>
    </Link>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold uppercase md:text-4xl">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại."}
    </div>
  );
}

export function LoadingBlock() {
  return <div className="h-24 animate-pulse rounded-xl bg-muted" aria-label="Đang tải" />;
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
}
