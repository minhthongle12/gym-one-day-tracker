import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Camera, Dumbbell, LineChart as ChartIcon, Scale } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, PageHeader, SessionCard } from "@/components/gym/shared";
import { BodyWeightTracker } from "@/components/gym/BodyWeightTracker";
import { LocketBodyDiary } from "@/components/gym/LocketBodyDiary";
import { completedStats, isCountable, MEMBER_NAME } from "@/lib/domain";
import { useMember } from "@/lib/member-context";
import { activeLogsQuery, exercisesQuery, sessionsQuery, weightsQuery } from "@/lib/queries";
import { fmtDate, vnDateStr } from "@/lib/time";

export const Route = createFileRoute("/tien-do")({
  head: () => ({
    meta: [
      { title: "Tiến độ — Long Phú Gym Buddy" },
      { name: "description", content: "Locket selfie vóc dáng, theo dõi cân nặng và thống kê bài tập." },
      { property: "og:title", content: "Tiến độ — Long Phú Gym Buddy" },
      { property: "og:description", content: "Nhật ký vóc dáng và thống kê tập luyện." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px" };

function Progress() {
  const me = useMember();
  const sessions = useQuery(sessionsQuery);
  const ex = useQuery(exercisesQuery);
  const w = useQuery(weightsQuery);
  const logs = useQuery(activeLogsQuery);
  const [exId, setExId] = useState("");
  const valid = (sessions.data ?? []).filter(isCountable);
  const stats = completedStats(sessions.data ?? []);
  const dates = new Set(valid.map((s) => s.session_date));

  // Month calendar for current VN month
  const today = vnDateStr();
  const [y = 1970, m = 1] = today.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;

  const ppl = ["PUSH", "PULL", "LEGS"].map((c) => ({
    c,
    n: (logs.data ?? []).filter((l) => (l.exercises as { category: string }).category === c && l.member === me).length,
  }));
  const series = (w.data ?? [])
    .filter((x) => x.member === me && x.exercise_id === exId && !x.superseded_by)
    .map((x) => ({ d: fmtDate(x.entry_date), kg: Number(x.weight_kg) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiến độ"
        sub={`Hồ sơ thể hình & luyện tập của ${MEMBER_NAME[me]}`}
      />

      <Tabs defaultValue="body" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/60 p-1">
          <TabsTrigger value="body" className="gap-2 font-semibold">
            <Camera className="h-4 w-4 text-primary" />
            <span>Body & Cân nặng (Locket)</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-2 font-semibold">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span>Buổi tập & Mức tạ PPL</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Body Diary & Weight Tracker */}
        <TabsContent value="body" className="space-y-6 focus-visible:outline-none">
          {/* Locket Selfie Body Diary */}
          <LocketBodyDiary member={me} />

          {/* User Body Weight Tracker & History */}
          <BodyWeightTracker member={me} />
        </TabsContent>

        {/* Tab 2: Workout Stats, Calendar, PPL Distribution & Exercise Weight */}
        <TabsContent value="workout" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Tuần này", stats.week],
              ["Tháng này", stats.month],
              ["Tổng", stats.total],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border bg-card p-4">
                <div className="font-display text-4xl font-bold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground">{l} · buổi hoàn thành</div>
              </div>
            ))}
          </div>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-xl font-bold uppercase">Lịch tháng {m}/{y}</h2>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div key={d} className="text-muted-foreground font-medium">{d}</div>
              ))}
              {Array.from({ length: lead }).map((_, i) => (
                <div key={`l${i}`} />
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const iso = `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const done = dates.has(iso);
                return (
                  <div
                    key={iso}
                    className={`rounded-md py-2 ${
                      done
                        ? "bg-primary font-bold text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    } ${iso === today ? "ring-2 ring-ring font-bold" : ""}`}
                    aria-label={done ? `${fmtDate(iso)} đã tập` : fmtDate(iso)}
                  >
                    {i + 1}
                    {done && " ✓"}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-1 text-xl font-bold uppercase">Phân bố PPL</h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Dựa trên nhật ký đã ghi trong các buổi hoàn thành — có thể chưa đầy đủ nếu chưa ghi nhật ký.
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ppl}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="c" stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="n" name="Số lượt" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-xl font-bold uppercase">Biểu đồ mức tạ bài tập</h2>
            <Select value={exId} onValueChange={setExId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn bài tập để xem mức tạ" />
              </SelectTrigger>
              <SelectContent>
                {(ex.data ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    [{e.category}] {e.name_vi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {exId && (
              series.length ? (
                <div className="mt-3 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                      <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis unit="kg" stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip contentStyle={tip} />
                      <Line dataKey="kg" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3">
                  <Empty title="Chưa cập nhật mức tạ cho bài này." />
                </div>
              )
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold uppercase">Buổi tập gần đây</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {valid.slice(0, 6).map((s) => (
                <SessionCard key={s.id} s={s} />
              ))}
            </div>
            {!valid.length && <Empty title="Chưa có buổi tập hoàn thành." />}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
