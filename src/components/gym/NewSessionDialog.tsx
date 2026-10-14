import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { createSession } from "@/lib/gym.functions";
import { useMember } from "@/lib/member-context";
import { defaultSessionStart } from "@/lib/time";
import { errMsg } from "./shared";

function getDefaultLocation() {
  return (typeof window !== "undefined" && localStorage.getItem("lpgb.location")) || DEFAULT_LOCATION;
}

export function NewSessionButton({ label = "Tạo buổi tập" }: { label?: string }) {
  const member = useMember();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const create = useServerFn(createSession);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", location: DEFAULT_LOCATION, notes: "" });

  // Recompute the default every time the form opens (VN now + 1h, rounded to 5 min).
  const openForm = () => {
    const d = defaultSessionStart(new Date());
    setForm({ date: d.date, time: d.time, location: getDefaultLocation(), notes: "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await create({ data: { actor: member, ...form, notes: form.notes || undefined } });
      await qc.invalidateQueries();
      setOpen(false);
      toast.success(
        r.push.sent > 0
          ? `Đã tạo buổi tập. Đã gửi thông báo đẩy tới ${r.push.sent}/${r.push.total} thiết bị.`
          : "Đã tạo buổi tập. Thông báo đã được lưu trong ứng dụng.",
      );
      navigate({ to: "/lich-tap/$id", params: { id: r.id } });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button onClick={openForm} className="gap-1">
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">Buổi tập mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="d">Ngày</Label>
                <Input id="d" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t">Giờ bắt đầu</Label>
                <Input id="t" type="time" step={300} required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="l">Địa điểm</Label>
              <Input id="l" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="n">Ghi chú (không bắt buộc)</Label>
              <Textarea id="n" maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Giờ Việt Nam. Bạn sẽ được tự động xác nhận tham gia.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu buổi tập"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
