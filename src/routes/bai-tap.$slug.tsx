import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Youtube } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_IMAGE, Empty, errMsg, LoadingBlock } from "@/components/gym/shared";
import { MEMBER_NAME, otherMember, WEIGHT_CONVENTION, type Member } from "@/lib/domain";
import { addWeightEntry, correctWeightEntry } from "@/lib/gym.functions";
import { useMember } from "@/lib/member-context";
import { exercisesQuery, weightsQuery, type WeightEntry } from "@/lib/queries";
import { fmtDate, vnDateStr } from "@/lib/time";

export const Route = createFileRoute("/bai-tap/$slug")({
  head: () => ({
    meta: [
      { title: "Chi tiết bài tập — Long Phú Gym Buddy" },
      { name: "description", content: "Kỹ thuật, nhịp thở, lỗi thường gặp và lịch sử mức tạ." },
      { property: "og:title", content: "Chi tiết bài tập — Long Phú Gym Buddy" },
      { property: "og:description", content: "Hướng dẫn kỹ thuật bài tập gym." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4"><h2 className="mb-2 text-lg font-bold uppercase text-primary">{title}</h2>{children}</section>;
}

function Detail() {
  const { slug } = Route.useParams();
  const me = useMember();
  const [view, setView] = useState<Member>(me);
  const ex = useQuery(exercisesQuery);
  const w = useQuery(weightsQuery);
  const e = ex.data?.find((x) => x.slug === slug);
  if (ex.isLoading) return <LoadingBlock />;
  if (!e) return <Empty title="Không tìm thấy bài tập." />;
  const entries = (w.data ?? []).filter((x) => x.exercise_id === e.id && x.member === view);
  const valid = entries.filter((x) => !x.superseded_by);
  const latest = valid[valid.length - 1];

  return (
    <div className="space-y-4">
      <Link to="/bai-tap" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Bài tập</Link>
      <img src={e.image_url ?? CATEGORY_IMAGE[e.category]} alt={e.name_en} width={1024} height={768} className="aspect-[16/7] w-full rounded-2xl object-cover" />
      <div>
        <div className="text-sm font-semibold text-primary">{e.category} · {e.difficulty}</div>
        <h1 className="text-4xl font-bold uppercase">{e.name_vi}</h1>
        <p className="text-muted-foreground">{e.name_en}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Cơ tham gia">
          <div className="flex flex-wrap gap-1.5">
            {e.primary_muscles.map((m) => <span key={m} className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Chính: {m}</span>)}
            {e.secondary_muscles.map((m) => <span key={m} className="rounded-full border px-2 py-0.5 text-xs">Phụ: {m}</span>)}
          </div>
        </Section>
        <Section title="Dụng cụ"><p>{e.equipment}</p><p className="mt-1 text-sm text-muted-foreground">{WEIGHT_CONVENTION[e.weight_type]}</p></Section>
        <Section title="Tư thế bắt đầu"><p>{e.starting_position}</p></Section>
        <Section title="Các bước thực hiện"><ol className="list-decimal space-y-1 pl-5">{e.steps.map((s) => <li key={s}>{s}</li>)}</ol></Section>
        <Section title="Nhịp thở"><p>{e.breathing}</p></Section>
        <Section title="Lỗi thường gặp"><ul className="list-disc space-y-1 pl-5">{e.mistakes.map((s) => <li key={s}>{s}</li>)}</ul></Section>
        <Section title="An toàn"><ul className="list-disc space-y-1 pl-5">{e.safety.map((s) => <li key={s}>{s}</li>)}</ul></Section>
        <Section title="Hiệp & lần lặp / Tăng tiến"><p>{e.sets_reps}</p><p className="mt-1 text-sm text-muted-foreground">{e.progression}</p></Section>
      </div>
      <Button asChild variant="secondary" className="gap-1">
        <a href={e.video_url} target="_blank" rel="noreferrer"><Youtube className="h-4 w-4" /> Tìm video hướng dẫn trên YouTube</a>
      </Button>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold uppercase">Mức tạ của {MEMBER_NAME[view]}</h2>
          <Button size="sm" variant="outline" onClick={() => setView(view === me ? otherMember(me) : me)}>
            {view === me ? `Xem tiến độ của ${MEMBER_NAME[otherMember(me)]}` : "Về dữ liệu của tôi"}
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Mức tạ gần nhất</div>
          <div className="font-display text-4xl font-bold text-primary">{latest ? `${latest.weight_kg} kg` : "Chưa cập nhật"}</div>
          {latest && <div className="text-xs text-muted-foreground">Ngày {fmtDate(latest.entry_date)}</div>}
        </div>
        {valid.length > 1 && (
          <div className="h-56 rounded-xl border bg-card p-2">
            <ResponsiveContainer>
              <LineChart data={valid.map((x) => ({ d: fmtDate(x.entry_date), kg: Number(x.weight_kg) }))}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="kg" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Line dataKey="kg" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {view === me && <WeightForm exerciseId={e.id} convention={WEIGHT_CONVENTION[e.weight_type]} assisted={e.weight_type === "assisted"} />}
        <History entries={entries} editable={view === me} />
      </section>
    </div>
  );
}

function WeightForm({ exerciseId, convention, assisted, correcting, onDone }: { exerciseId: string; convention: string; assisted: boolean; correcting?: WeightEntry; onDone?: () => void }) {
  const me = useMember();
  const qc = useQueryClient();
  const add = useServerFn(addWeightEntry);
  const fix = useServerFn(correctWeightEntry);
  const [f, setF] = useState({
    date: correcting?.entry_date ?? vnDateStr(),
    weight: correcting ? String(correcting.weight_kg) : "",
    bw: correcting?.bodyweight_kg ? String(correcting.bodyweight_kg) : "",
    sets: correcting?.sets ? String(correcting.sets) : "",
    reps: correcting?.reps ? String(correcting.reps) : "",
    rpe: correcting?.rpe ? String(correcting.rpe) : "",
    notes: correcting?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const n = (v: string) => (v ? Number(v) : null);
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const fields = { weight_kg: Number(f.weight), bodyweight_kg: n(f.bw), sets: n(f.sets), reps: n(f.reps), rpe: n(f.rpe), notes: f.notes || null };
      if (correcting) await fix({ data: { actor: me, id: correcting.id, ...fields } });
      else await add({ data: { actor: me, exercise_id: exerciseId, entry_date: f.date, ...fields } });
      await qc.invalidateQueries({ queryKey: ["weights"] });
      toast.success(correcting ? "Đã lưu bản sửa (bản cũ vẫn được giữ)." : "Đã lưu mức tạ mới.");
      setF({ ...f, weight: "", notes: "" });
      onDone?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
      <p className="col-span-full text-xs text-muted-foreground">{convention}</p>
      {!correcting && <div className="grid gap-1"><Label htmlFor="wd">Ngày</Label><Input id="wd" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>}
      <div className="grid gap-1"><Label htmlFor="wk">{assisted ? "Mức hỗ trợ (kg)" : "Mức tạ (kg)"}</Label><Input id="wk" type="number" step="0.5" min="0" required value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></div>
      {assisted && <div className="grid gap-1"><Label htmlFor="bw">Cân nặng cơ thể (kg)</Label><Input id="bw" type="number" step="0.1" value={f.bw} onChange={(e) => setF({ ...f, bw: e.target.value })} /></div>}
      <div className="grid gap-1"><Label htmlFor="ws">Hiệp</Label><Input id="ws" type="number" min="1" value={f.sets} onChange={(e) => setF({ ...f, sets: e.target.value })} /></div>
      <div className="grid gap-1"><Label htmlFor="wr">Lần</Label><Input id="wr" type="number" min="1" value={f.reps} onChange={(e) => setF({ ...f, reps: e.target.value })} /></div>
      <div className="grid gap-1"><Label htmlFor="rpe">Độ khó (1–10)</Label><Input id="rpe" type="number" min="1" max="10" value={f.rpe} onChange={(e) => setF({ ...f, rpe: e.target.value })} /></div>
      <div className="col-span-full grid gap-1"><Label htmlFor="wn">Ghi chú</Label><Input id="wn" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      <Button type="submit" disabled={saving} className="col-span-full">{saving ? "Đang lưu..." : correcting ? "Lưu bản sửa" : "Thêm mức tạ"}</Button>
    </form>
  );
}

function History({ entries, editable }: { entries: WeightEntry[]; editable: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  if (!entries.length) return <Empty title="Chưa có lịch sử mức tạ." />;
  return (
    <div className="divide-y rounded-xl border bg-card">
      {[...entries].reverse().map((x) => (
        <div key={x.id} className="p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={x.superseded_by ? "text-muted-foreground line-through" : ""}>
              {fmtDate(x.entry_date)} · <b>{x.weight_kg} kg</b>{x.sets ? ` × ${x.sets} hiệp` : ""}{x.reps ? ` × ${x.reps} lần` : ""}{x.rpe ? ` · RPE ${x.rpe}` : ""}
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {x.superseded_by && "Đã được sửa"}{x.corrects_id && "Bản sửa"}
              {editable && !x.superseded_by && <Button size="sm" variant="ghost" onClick={() => setEditing(editing === x.id ? null : x.id)}>Sửa</Button>}
            </span>
          </div>
          {x.notes && <div className="text-xs text-muted-foreground">{x.notes}</div>}
          {editing === x.id && <div className="mt-2"><WeightForm exerciseId={x.exercise_id} convention="Bản sửa sẽ được lưu thành bản ghi mới; bản cũ vẫn được giữ lại." assisted={!!x.bodyweight_kg} correcting={x} onDone={() => setEditing(null)} /></div>}
        </div>
      ))}
    </div>
  );
}
