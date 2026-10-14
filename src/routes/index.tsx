import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, Dumbbell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceBadge, Empty, ErrorBox, LoadingBlock, PageHeader, SessionCard } from "@/components/gym/shared";
import { NewSessionButton } from "@/components/gym/NewSessionDialog";
import { completedStats, MEMBER_NAME, type Attendance } from "@/lib/domain";
import { useMember } from "@/lib/member-context";
import { notificationsQuery, sessionsQuery } from "@/lib/queries";
import { fmtDate, fmtDateTimeVN, fmtTime, todayLabelVN, vnDateStr } from "@/lib/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tổng quan — Long Phú Gym Buddy" },
      { name: "description", content: "Lịch tập, tiến độ và bài tập Push/Pull/Legs cho Thông và Thuận tại CLB Gym Long Phú." },
      { property: "og:title", content: "Long Phú Gym Buddy" },
      { property: "og:description", content: "Quản lý lịch tập gym và theo dõi tiến độ Push/Pull/Legs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const member = useMember();
  const sessions = useQuery(sessionsQuery);
  const notes = useQuery(notificationsQuery);
  const today = vnDateStr();
  const upcoming = (sessions.data ?? [])
    .filter((s) => s.status === "scheduled" && s.session_date >= today)
    .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));
  const next = upcoming[0];
  const stats = completedStats(sessions.data ?? []);
  const recent = (sessions.data ?? []).filter((s) => s.status === "completed").slice(0, 3);
  const unread = (notes.data ?? []).filter((n) => !n.read_at);

  return (
    <div className="space-y-6">
      <PageHeader title={`Chào ${MEMBER_NAME[member]}!`} sub={todayLabelVN()} action={<NewSessionButton />} />

      {sessions.isLoading ? (
        <LoadingBlock />
      ) : sessions.error ? (
        <ErrorBox error={sessions.error} />
      ) : next ? (
        <Link to="/lich-tap/$id" params={{ id: next.id }} className="block rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Buổi tập tiếp theo</p>
          <div className="mt-2 font-display text-5xl font-extrabold">{fmtTime(next.start_time)}</div>
          <div className="text-muted-foreground">{fmtDate(next.session_date)}</div>
          <div className="mt-2 flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" /> {next.location}</div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            Bạn: <AttendanceBadge status={next[`${member}_status`] as Attendance} />
          </div>
        </Link>
      ) : (
        <Empty title="Chưa có buổi tập sắp tới">Bấm “Tạo buổi tập” để lên lịch.</Empty>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Tuần này", stats.week],
          ["Tháng này", stats.month],
          ["Tổng cộng", stats.total],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-4">
            <div className="font-display text-4xl font-bold text-primary">{v}</div>
            <div className="text-xs text-muted-foreground">{l} · buổi hoàn thành</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary"><Link to="/lich-tap"><CalendarDays className="mr-1 h-4 w-4" />Lịch tập</Link></Button>
        <Button asChild variant="secondary"><Link to="/bai-tap"><Dumbbell className="mr-1 h-4 w-4" />Giáo án PPL</Link></Button>
        <Button asChild variant="secondary"><Link to="/bai-tap">Cập nhật mức tạ</Link></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold uppercase">Sắp diễn ra</h2>
          <div className="space-y-3">
            {upcoming.slice(1, 4).map((s) => <SessionCard key={s.id} s={s} />)}
            {upcoming.length <= 1 && <Empty title="Không có buổi nào khác" />}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold uppercase">Gần đây</h2>
          <div className="space-y-3">
            {recent.map((s) => <SessionCard key={s.id} s={s} />)}
            {recent.length === 0 && <Empty title="Chưa có buổi tập hoàn thành" />}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase"><Bell className="h-5 w-5" /> Chưa đọc ({unread.length})</h2>
        <div className="space-y-2">
          {unread.slice(0, 3).map((n) => (
            <Link key={n.id} to="/thong-bao" className="block rounded-lg border bg-card p-3 text-sm">
              <div className="font-medium">{n.title}</div>
              <div className="text-muted-foreground">{n.message}</div>
              <div className="mt-1 text-xs text-muted-foreground">{fmtDateTimeVN(n.created_at)}</div>
            </Link>
          ))}
          {unread.length === 0 && <p className="text-sm text-muted-foreground">Không có thông báo mới.</p>}
        </div>
      </section>
    </div>
  );
}
