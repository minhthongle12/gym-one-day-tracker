import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceBadge, Empty, errMsg, ErrorBox, LoadingBlock, StatusBadge } from "@/components/gym/shared";
import { MEMBER_NAME, MEMBERS, type Attendance, type SessionStatus } from "@/lib/domain";
import { addWorkoutLog, cancelSession, completeSession, deleteSession, respondAttendance } from "@/lib/gym.functions";
import { useMember } from "@/lib/member-context";
import { exercisesQuery, sessionLogsQuery, sessionQuery } from "@/lib/queries";
import { fmtDate, fmtTime, weekdayVN } from "@/lib/time";

export const Route = createFileRoute("/lich-tap/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết buổi tập — Long Phú Gym Buddy" },
      { name: "description", content: "Thời gian, địa điểm, trạng thái tham gia và nhật ký buổi tập." },
      { property: "og:title", content: "Chi tiết buổi tập — Long Phú Gym Buddy" },
      { property: "og:description", content: "Xem và xác nhận tham gia buổi tập gym." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = Route.useParams();
  const member = useMember();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery(sessionQuery(id));
  const respond = useServerFn(respondAttendance);
  const complete = useServerFn(completeSession);
  const cancel = useServerFn(cancelSession);
  const del = useServerFn(deleteSession);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries();
      toast.success(ok);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) return <LoadingBlock />;
  if (q.error) return <ErrorBox error={q.error} />;
  const s = q.data;
  if (!s)
    return (
      <Empty title="Buổi tập không tồn tại hoặc đã bị xóa.">
        <Link to="/lich-tap" className="text-primary underline">Về lịch tập</Link>
      </Empty>
    );
  const mine = s[`${member}_status`] as Attendance;
  const isCreator = s.created_by === member;

  return (
    <div className="space-y-6">
      <Link to="/lich-tap" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Lịch tập</Link>
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-display text-5xl font-extrabold">{fmtTime(s.start_time)}</div>
            <div className="text-muted-foreground">{weekdayVN(s.session_date)}, {fmtDate(s.session_date)}</div>
          </div>
          <StatusBadge status={s.status as SessionStatus} />
        </div>
        <div className="mt-3 flex items-center gap-1"><MapPin className="h-4 w-4" /> {s.location}</div>
        {s.notes && <p className="mt-2 text-sm text-muted-foreground">Ghi chú: {s.notes}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Tạo bởi {MEMBER_NAME[s.created_by as "thong"]}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {MEMBERS.map((m) => (
            <div key={m} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="font-medium">{MEMBER_NAME[m]}</span>
              <AttendanceBadge status={s[`${m}_status`] as Attendance} />
            </div>
          ))}
        </div>
      </div>

      {s.status === "scheduled" && (
        <div className="flex flex-wrap gap-2">
          {mine !== "confirmed" && (
            <Button disabled={busy} onClick={() => run(() => respond({ data: { actor: member, id, response: "confirmed" } }), "Đã xác nhận tham gia.")}>
              Xác nhận tham gia
            </Button>
          )}
          {mine !== "declined" && (
            <Button variant="outline" disabled={busy} onClick={() => run(() => respond({ data: { actor: member, id, response: "declined" } }), "Đã báo không tham gia.")}>
              Không tham gia
            </Button>
          )}
          <Button variant="secondary" disabled={busy} onClick={() => run(() => complete({ data: { actor: member, id } }), "Đã đánh dấu hoàn thành.")}>
            Đánh dấu hoàn thành
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => run(() => cancel({ data: { actor: member, id } }), "Đã hủy buổi tập.")}>
            Hủy buổi tập
          </Button>
        </div>
      )}

      {isCreator && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-1" disabled={busy}><Trash2 className="h-4 w-4" /> Xóa buổi tập</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa buổi tập?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa buổi tập này? Buổi tập sẽ không còn xuất hiện trong lịch và thống kê thông thường.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Quay lại</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  try {
                    await del({ data: { actor: member, id } });
                    await qc.invalidateQueries();
                    toast.success("Đã xóa buổi tập.");
                    navigate({ to: "/lich-tap" });
                  } catch (e) {
                    toast.error(errMsg(e));
                  }
                }}
              >
                Xác nhận xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {s.status === "completed" ? <TrainingLog sessionId={id} /> : (
        <p className="text-sm text-muted-foreground">Nhật ký tập luyện có thể ghi sau khi buổi tập được đánh dấu hoàn thành.</p>
      )}
    </div>
  );
}

function TrainingLog({ sessionId }: { sessionId: string }) {
  const member = useMember();
  const qc = useQueryClient();
  const ex = useQuery(exercisesQuery);
  const logs = useQuery(sessionLogsQuery(sessionId));
  const add = useServerFn(addWorkoutLog);
  const [f, setF] = useState({ exercise_id: "", weight: "", sets: "3", reps: "10", notes: "" });
  const [saving, setSaving] = useState(false);
  const byId = new Map((ex.data ?? []).map((e) => [e.id, e]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.exercise_id) return toast.error("Hãy chọn bài tập.");
    setSaving(true);
    try {
      await add({
        data: { actor: member, session_id: sessionId, exercise_id: f.exercise_id, weight_kg: Number(f.weight), sets: Number(f.sets), reps: Number(f.reps), notes: f.notes || null },
      });
      await qc.invalidateQueries();
      toast.success("Đã lưu vào nhật ký.");
      setF({ ...f, weight: "", notes: "" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold uppercase">Nhật ký tập luyện</h2>
      <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-6">
        <div className="grid gap-1.5 sm:col-span-6">
          <Label>Bài tập ({MEMBER_NAME[member]})</Label>
          <Select value={f.exercise_id} onValueChange={(v) => setF({ ...f, exercise_id: v })}>
            <SelectTrigger><SelectValue placeholder="Chọn bài tập" /></SelectTrigger>
            <SelectContent>
              {(ex.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>[{e.category}] {e.name_vi}</SelectItem>)}
            </SelectContent>
          </Select>
          {f.exercise_id && <p className="text-xs text-muted-foreground">{byId.get(f.exercise_id) && weightHint(byId.get(f.exercise_id)!.weight_type)}</p>}
        </div>
        <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="w">Mức tạ (kg)</Label><Input id="w" type="number" step="0.5" min="0" required value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></div>
        <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="s">Số hiệp</Label><Input id="s" type="number" min="1" required value={f.sets} onChange={(e) => setF({ ...f, sets: e.target.value })} /></div>
        <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="r">Số lần</Label><Input id="r" type="number" min="1" required value={f.reps} onChange={(e) => setF({ ...f, reps: e.target.value })} /></div>
        <div className="grid gap-1.5 sm:col-span-6"><Label htmlFor="no">Ghi chú</Label><Input id="no" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <Button type="submit" disabled={saving} className="sm:col-span-6">{saving ? "Đang lưu..." : "Lưu vào nhật ký"}</Button>
      </form>
      {logs.data?.length ? (
        <div className="divide-y rounded-xl border bg-card">
          {logs.data.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <span><b>{MEMBER_NAME[l.member as "thong"]}</b> · {byId.get(l.exercise_id)?.name_vi}</span>
              <span>{l.weight_kg} kg × {l.sets} hiệp × {l.reps} lần</span>
            </div>
          ))}
        </div>
      ) : <Empty title="Chưa có bài tập nào được ghi cho buổi này." />}
    </section>
  );
}

import { WEIGHT_CONVENTION } from "@/lib/domain";
function weightHint(t: string) {
  return WEIGHT_CONVENTION[t];
}
