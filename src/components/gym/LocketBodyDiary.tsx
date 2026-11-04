import { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  Columns,
  Download,
  Image as ImageIcon,
  Scale,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addBodyDiaryPhoto,
  compressImageWithStats,
  deleteBodyDiaryPhoto,
  getBodyDiaryPhotos,
  type BodyDiaryPhoto,
  type CompressionInfo,
} from "@/lib/body-diary-db";
import { MEMBER_NAME } from "@/lib/domain";
import { fmtDate, vnDateStr } from "@/lib/time";

export function LocketBodyDiary({ member }: { member: "thong" | "thuan" }) {
  const [photos, setPhotos] = useState<BodyDiaryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // New photo modal state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionInfo | null>(null);
  const [dateInput, setDateInput] = useState(vnDateStr());
  const [timeInput, setTimeInput] = useState("08:00");
  const [noteInput, setNoteInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Lightbox / view modal state
  const [activePhoto, setActivePhoto] = useState<BodyDiaryPhoto | null>(null);

  // Compare mode state
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareId1, setCompareId1] = useState<string>("");
  const [compareId2, setCompareId2] = useState<string>("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const list = await getBodyDiaryPhotos(member);
      setPhotos(list);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được ảnh nhật ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [member]);

  const handleImageFile = async (file: File) => {
    try {
      toast.info("Đang nén và tối ưu hóa ảnh...");
      // Aggressive compression: max 960px, quality 0.78 (down to ~80-120KB)
      const res = await compressImageWithStats(file, 960, 0.78);
      setSelectedImage(res.dataUrl);
      setCompressionStats(res);

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTimeInput(`${hh}:${mm}`);
      setDateInput(vnDateStr());
      setOpenAddModal(true);

      toast.success(
        `Đã nén ảnh còn ${res.compressedSizeKB} KB (tiết kiệm ${res.savedPercent}% dung lượng)!`
      );
    } catch (err) {
      console.error(err);
      toast.error("Không thể xử lý hình ảnh này.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    setSaving(true);
    try {
      const kg = weightInput ? parseFloat(weightInput.replace(",", ".")) : undefined;
      await addBodyDiaryPhoto({
        member,
        date: dateInput,
        time: timeInput,
        photoDataUrl: selectedImage,
        note: noteInput || undefined,
        weightKg: kg && !isNaN(kg) ? kg : undefined,
      });

      await fetchPhotos();
      setOpenAddModal(false);
      setSelectedImage(null);
      setCompressionStats(null);
      setNoteInput("");
      setWeightInput("");
      toast.success("Đã lưu ảnh vóc dáng vào nhật ký Locket!");
    } catch (err) {
      console.error(err);
      toast.error("Lưu ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBodyDiaryPhoto(id);
      setActivePhoto(null);
      await fetchPhotos();
      toast.success("Đã xóa ảnh khỏi nhật ký.");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa ảnh.");
    }
  };

  const handleDownload = (photo: BodyDiaryPhoto) => {
    const link = document.createElement("a");
    link.href = photo.photoDataUrl;
    link.download = `body-diary-${member}-${photo.date}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã tải ảnh về máy.");
  };

  const today = vnDateStr();
  const todayPhoto = photos.find((p) => p.date === today);
  const latestPhoto = photos[0];
  const photo1 = photos.find((p) => p.id === compareId1) || photos[photos.length - 1];
  const photo2 = photos.find((p) => p.id === compareId2) || photos[0];

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs for 1-Tap Trigger */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* HERO SECTION: ULTRA-PROMINENT LOCKET CAMERA TRIGGER */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-background p-5 sm:p-6 shadow-2xl">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              LOCKET BODY DIARY · {MEMBER_NAME[member].toUpperCase()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-foreground">
              Selfie vóc dáng hôm nay
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Chụp ảnh body trước gương mỗi ngày như Locket. Ảnh sẽ được tự động nén siêu nhẹ
              giúp lưu trữ mượt mà không lo đầy bộ nhớ.
            </p>

            {todayPhoto && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Hôm nay bạn đã chụp 1 ảnh ({todayPhoto.time})
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              size="lg"
              className="group relative h-14 w-full sm:w-auto px-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
              onClick={() => cameraInputRef.current?.click()}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 group-hover:scale-110 transition-transform">
                <Camera className="h-5 w-5" />
              </span>
              <span>{todayPhoto ? "Chụp thêm góc mới" : "Chụp selfie ngay"}</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="h-14 w-full sm:w-auto px-5 rounded-2xl border border-border/60 hover:bg-muted font-medium text-sm gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span>Tải từ thư viện</span>
            </Button>
          </div>
        </div>

        {/* Compression guarantee badge */}
        <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Tự động nén & tối ưu hóa ảnh (&lt; 100 KB) khi lưu
          </span>
          {photos.length >= 2 && (
            <button
              type="button"
              className="font-semibold text-primary hover:underline flex items-center gap-1"
              onClick={() => {
                const oldest = photos[photos.length - 1];
                const newest = photos[0];
                if (oldest && newest) {
                  setCompareId1(oldest.id);
                  setCompareId2(newest.id);
                  setCompareOpen(true);
                }
              }}
            >
              <Columns className="h-3.5 w-3.5" />
              So sánh Trước & Sau ({photos.length} ảnh)
            </button>
          )}
        </div>
      </div>

      {/* LATEST FEATURED PHOTO WIDGET */}
      {latestPhoto ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Ảnh vóc dáng gần nhất
            </span>
            <span className="text-muted-foreground">
              {fmtDate(latestPhoto.date)} lúc {latestPhoto.time}
            </span>
          </div>

          <div
            className="group relative aspect-[4/5] sm:aspect-video w-full overflow-hidden rounded-2xl bg-black/60 cursor-pointer"
            onClick={() => setActivePhoto(latestPhoto)}
          >
            <img
              src={latestPhoto.photoDataUrl}
              alt="Selfie vóc dáng"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Locket Floating Pill Badges */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/95 px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                    📅 {fmtDate(latestPhoto.date)}
                  </span>
                  {latestPhoto.weightKg && (
                    <span className="rounded-full bg-black/70 backdrop-blur px-3 py-1 text-xs font-bold text-white border border-white/20">
                      ⚖️ {latestPhoto.weightKg} kg
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/80 font-medium">Bấm để xem chi tiết →</span>
              </div>
              {latestPhoto.note && (
                <p className="mt-2 text-sm text-white font-medium drop-shadow line-clamp-2">
                  “{latestPhoto.note}”
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* PHOTO TIMELINE / GRID */}
      {photos.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Nhật ký vóc dáng ({photos.length} tấm)
            </h3>
            <span className="text-xs text-muted-foreground">Mới nhất xếp trước</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted/30 cursor-pointer shadow-sm hover:border-primary/60 transition-all hover:shadow-md"
                onClick={() => setActivePhoto(p)}
              >
                <img
                  src={p.photoDataUrl}
                  alt={`Vóc dáng ngày ${p.date}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">
                    {fmtDate(p.date)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/80 mt-0.5">
                    <span>{p.time}</span>
                    {p.weightKg && <span className="text-primary font-semibold">{p.weightKg} kg</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ADD / CONFIRM PHOTO MODAL */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <form onSubmit={handleSavePhoto} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 uppercase">
                <Camera className="h-5 w-5 text-primary" />
                Lưu ảnh vóc dáng vào Locket
              </DialogTitle>
              <DialogDescription>
                Ảnh đã được tự động nén siêu nhẹ để tiết kiệm dung lượng thiết bị.
              </DialogDescription>
            </DialogHeader>

            {selectedImage && (
              <div className="relative aspect-[4/5] max-h-56 sm:max-h-72 w-full overflow-hidden rounded-2xl border border-primary/30 bg-black shadow-inner">
                <img
                  src={selectedImage}
                  alt="Xem trước ảnh selfie"
                  className="h-full w-full object-contain"
                />
                {compressionStats && (
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/75 backdrop-blur px-3 py-1.5 text-center text-xs text-white border border-white/10">
                    <span className="text-emerald-400 font-bold">
                      ⚡ Nén thành công: {compressionStats.compressedSizeKB} KB
                    </span>{" "}
                    <span className="text-white/70">
                      (giảm {compressionStats.savedPercent}%, gốc ~{compressionStats.originalSizeKB} KB)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="photo-date">Ngày chụp *</Label>
                <Input
                  id="photo-date"
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="photo-time">Giờ chụp *</Label>
                <Input
                  id="photo-time"
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="photo-weight">Cân nặng lúc chụp (kg)</Label>
                <Input
                  id="photo-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="30"
                  max="250"
                  placeholder="vd: 68.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="photo-note">Ghi chú vóc dáng</Label>
                <Input
                  id="photo-note"
                  placeholder="vd: Sau buổi Push pump căng..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddModal(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="font-bold gap-2">
                <Camera className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu vào Locket Body Diary"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX / FULL-SIZE PHOTO VIEWER */}
      {activePhoto && (
        <Dialog open={Boolean(activePhoto)} onOpenChange={(open) => !open && setActivePhoto(null)}>
          <DialogContent className="max-w-md sm:max-w-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base uppercase">
                <span>Ảnh vóc dáng — {fmtDate(activePhoto.date)}</span>
                <span className="text-xs font-normal text-muted-foreground">{activePhoto.time}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="relative aspect-[4/5] max-h-[65vh] w-full overflow-hidden rounded-2xl bg-black">
              <img
                src={activePhoto.photoDataUrl}
                alt="Body photo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="rounded-xl border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ngày ghi nhận:</span>
                <span className="font-semibold text-foreground">
                  {fmtDate(activePhoto.date)} lúc {activePhoto.time}
                </span>
              </div>
              {activePhoto.weightKg && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cân nặng:</span>
                  <span className="font-bold text-primary">{activePhoto.weightKg} kg</span>
                </div>
              )}
              {activePhoto.note && (
                <div className="pt-1 text-xs text-muted-foreground border-t border-border/40">
                  <span className="font-medium text-foreground">Ghi chú:</span> “{activePhoto.note}”
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDelete(activePhoto.id)}
              >
                <Trash2 className="h-4 w-4" />
                Xóa ảnh
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleDownload(activePhoto)}
                >
                  <Download className="h-4 w-4" />
                  Tải về
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActivePhoto(null)}
                >
                  Đóng
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* BEFORE / AFTER COMPARISON MODAL */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase">
              <Columns className="h-5 w-5 text-primary" />
              So sánh vóc dáng (Before & After)
            </DialogTitle>
            <DialogDescription>
              Chọn 2 mốc thời gian để xem sự biến đổi thể hình của {MEMBER_NAME[member]}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 text-xs mb-2">
            <div>
              <Label className="text-xs">Ảnh Trước (Before):</Label>
              <select
                className="w-full mt-1 rounded-md border bg-background p-2 text-sm"
                value={compareId1}
                onChange={(e) => setCompareId1(e.target.value)}
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fmtDate(p.date)} ({p.time}) {p.weightKg ? `- ${p.weightKg}kg` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Ảnh Sau (After):</Label>
              <select
                className="w-full mt-1 rounded-md border bg-background p-2 text-sm"
                value={compareId2}
                onChange={(e) => setCompareId2(e.target.value)}
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fmtDate(p.date)} ({p.time}) {p.weightKg ? `- ${p.weightKg}kg` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {photo1 && (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border bg-black">
                  <img
                    src={photo1.photoDataUrl}
                    alt="Before"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                    BEFORE
                  </span>
                </div>
                <div className="text-center text-xs">
                  <div className="font-bold">{fmtDate(photo1.date)}</div>
                  {photo1.weightKg && <div className="text-muted-foreground">{photo1.weightKg} kg</div>}
                </div>
              </div>
            )}

            {photo2 && (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/50 bg-black">
                  <img
                    src={photo2.photoDataUrl}
                    alt="After"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                    AFTER
                  </span>
                </div>
                <div className="text-center text-xs">
                  <div className="font-bold">{fmtDate(photo2.date)}</div>
                  {photo2.weightKg && <div className="text-primary font-semibold">{photo2.weightKg} kg</div>}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-3">
            <Button variant="secondary" onClick={() => setCompareOpen(false)}>
              Đóng so sánh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
