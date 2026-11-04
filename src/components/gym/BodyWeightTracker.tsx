import { useState, useEffect } from "react";
import { Plus, Scale, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty } from "@/components/gym/shared";
import {
  deleteBodyWeight,
  loadBodyWeights,
  saveBodyWeight,
  type BodyWeightRecord,
} from "@/lib/body-weight";
import { MEMBER_NAME } from "@/lib/domain";
import { fmtDate, vnDateStr } from "@/lib/time";

const tip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
};

export function BodyWeightTracker({ member }: { member: "thong" | "thuan" }) {
  const [records, setRecords] = useState<BodyWeightRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [dateInput, setDateInput] = useState(vnDateStr());
  const [noteInput, setNoteInput] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    setRecords(loadBodyWeights(member));
  }, [member]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(weightInput.replace(",", "."));
    if (isNaN(kg) || kg < 30 || kg > 250) {
      toast.error("Vui lòng nhập cân nặng hợp lệ (30 - 250 kg).");
      return;
    }
    if (!dateInput) {
      toast.error("Vui lòng chọn ngày cân.");
      return;
    }

    const saved = saveBodyWeight({
      member,
      date: dateInput,
      weightKg: kg,
      note: noteInput,
    });

    const updated = loadBodyWeights(member);
    setRecords(updated);
    setOpen(false);
    setWeightInput("");
    setNoteInput("");
    toast.success(`Đã lưu cân nặng ${saved.weightKg} kg ngày ${fmtDate(saved.date)}.`);
  };

  const handleDelete = (id: string, date: string) => {
    const updated = deleteBodyWeight(id, member);
    setRecords(updated);
    toast.success(`Đã xóa bản ghi ngày ${fmtDate(date)}.`);
  };

  const latest = records.length > 0 ? records[records.length - 1] : null;
  const previous = records.length > 1 ? records[records.length - 2] : null;
  const diff = latest && previous ? Math.round((latest.weightKg - previous.weightKg) * 10) / 10 : null;

  // Chart data
  const chartData = records.map((r) => ({
    d: fmtDate(r.date),
    kg: r.weightKg,
    note: r.note,
  }));

  const minWeight = records.length > 0 ? Math.floor(Math.min(...records.map((r) => r.weightKg)) - 1) : 50;
  const maxWeight = records.length > 0 ? Math.ceil(Math.max(...records.map((r) => r.weightKg)) + 1) : 80;

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold uppercase">Cân nặng cơ thể</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Theo dõi sự thay đổi vóc dáng của {MEMBER_NAME[member]}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" />
              Ghi cân nặng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <form onSubmit={handleSave} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 uppercase">
                  <Scale className="h-5 w-5 text-primary" />
                  Ghi nhận cân nặng mới
                </DialogTitle>
                <DialogDescription>
                  Ghi lại cân nặng hôm nay của {MEMBER_NAME[member]} để theo dõi tiến độ.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="weight-input">Cân nặng (kg) *</Label>
                  <div className="relative">
                    <Input
                      id="weight-input"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="30"
                      max="250"
                      placeholder="vd: 68.5"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      required
                      className="pr-10 text-lg font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-sm font-semibold text-muted-foreground pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date-input">Ngày cân *</Label>
                  <Input
                    id="date-input"
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note-input">Ghi chú (tùy chọn)</Label>
                  <Input
                    id="note-input"
                    placeholder="vd: Sáng đói, sau khi tập,..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu cân nặng</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-muted/40 p-3.5">
          <div className="text-xs text-muted-foreground">Cân nặng gần nhất</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-3xl font-extrabold text-primary">
              {latest ? latest.weightKg : "--"}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">kg</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {latest ? fmtDate(latest.date) : "Chưa có dữ liệu"}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-3.5">
          <div className="text-xs text-muted-foreground">So với lần trước</div>
          <div className="mt-1 flex items-baseline gap-1">
            {diff !== null ? (
              <>
                <span
                  className={`font-display text-3xl font-extrabold flex items-center ${
                    diff < 0 ? "text-emerald-400" : diff > 0 ? "text-amber-400" : "text-muted-foreground"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">kg</span>
              </>
            ) : (
              <span className="font-display text-3xl font-extrabold text-muted-foreground">--</span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
            {diff !== null && (
              <>
                {diff < 0 ? (
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                ) : diff > 0 ? (
                  <TrendingUp className="h-3 w-3 text-amber-400" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{diff < 0 ? "Giảm" : diff > 0 ? "Tăng" : "Không đổi"}</span>
              </>
            )}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border bg-muted/40 p-3.5">
          <div className="text-xs text-muted-foreground">Số lần ghi nhận</div>
          <div className="mt-1 font-display text-3xl font-extrabold text-foreground">
            {records.length}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">lần ghi nhật ký</div>
        </div>
      </div>

      {/* Weight Trend Chart */}
      {records.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Biểu đồ biến động cân nặng</span>
            <span>Đơn vị: kg</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis
                  domain={[minWeight, maxWeight]}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={tip}
                  formatter={(val: unknown) => [`${val} kg`, "Cân nặng"]}
                  labelFormatter={(lbl) => `Ngày ${lbl}`}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <Empty title="Chưa có lịch sử cân nặng">Bấm “Ghi cân nặng” để bắt đầu theo dõi.</Empty>
      )}

      {/* History table list */}
      {records.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lịch sử ghi nhận gần đây
            </span>
            {records.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? "Thu gọn" : `Xem tất cả (${records.length})`}
              </Button>
            )}
          </div>

          <div className="divide-y divide-border/40 rounded-xl border bg-muted/20">
            {(showAllHistory ? [...records].reverse() : [...records].reverse().slice(0, 3)).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{item.weightKg} kg</span>
                    <span className="text-xs text-muted-foreground">· {fmtDate(item.date)}</span>
                  </div>
                  {item.note && <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Xóa bản ghi"
                  onClick={() => handleDelete(item.id, item.date)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

