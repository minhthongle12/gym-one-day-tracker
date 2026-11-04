import { useState, type ReactNode } from "react";
import { Copy, Download, Image as ImageIcon, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Session } from "@/lib/queries";
import { formatSessionShareText, generateSessionCardBlob } from "@/lib/share-card";

export function ShareSessionDialog({
  session,
  trigger,
}: {
  session: Session;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  const prepareImage = async () => {
    if (imgUrl && blob) return { imgUrl, blob };
    setLoading(true);
    try {
      const b = await generateSessionCardBlob(session);
      const url = URL.createObjectURL(b);
      setBlob(b);
      setImgUrl(url);
      return { imgUrl: url, blob: b };
    } catch (err) {
      console.error(err);
      toast.error("Không tạo được ảnh lịch tập.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      await prepareImage();
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    prepareImage();
  };

  const handleNativeShare = async () => {
    try {
      const prep = await prepareImage();
      if (!prep?.blob) return;

      const file = new File([prep.blob], `lich-tap-${session.session_date}.png`, {
        type: "image/png",
      });

      const text = formatSessionShareText(session);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Lịch tập Gym CLB Long Phú",
          text,
          files: [file],
        });
        toast.success("Đã mở chia sẻ!");
        return;
      }

      // Fallback: If file share is not supported but text share is
      if (navigator.share) {
        await navigator.share({
          title: "Lịch tập Gym CLB Long Phú",
          text,
        });
        toast.success("Đã gửi thông tin lịch tập!");
        return;
      }

      // If no Web Share API, download image and copy text
      handleDownload();
      await handleCopyText();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled share dialog
        return;
      }
      console.error(err);
      toast.error("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Đã chuyển sang tải ảnh.");
      handleDownload();
    }
  };

  const handleDownload = async () => {
    const prep = await prepareImage();
    if (!prep?.imgUrl) return;

    const link = document.createElement("a");
    link.href = prep.imgUrl;
    link.download = `lich-tap-gym-${session.session_date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã tải ảnh lịch tập về máy! Bạn có thể gửi ảnh qua Zalo.");
  };

  const handleCopyImage = async () => {
    const prep = await prepareImage();
    if (!prep?.blob) return;

    try {
      if (navigator.clipboard && "ClipboardItem" in window) {
        const item = new ClipboardItem({ "image/png": prep.blob });
        await navigator.clipboard.write([item]);
        toast.success("Đã sao chép ảnh vào bộ nhớ tạm! Bạn có thể dán (Ctrl+V) vào Zalo ngay.");
      } else {
        toast.info("Trình duyệt không hỗ trợ sao chép ảnh trực tiếp. Vui lòng tải ảnh về.");
        handleDownload();
      }
    } catch (err) {
      console.error(err);
      toast.info("Không sao chép được ảnh. Vui lòng bấm Tải ảnh về để gửi qua Zalo.");
      handleDownload();
    }
  };

  const handleCopyText = async () => {
    const text = formatSessionShareText(session);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép thông tin lịch tập dạng văn bản!");
    } catch {
      toast.error("Không sao chép được văn bản.");
    }
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={handleTriggerClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTriggerClick(e as unknown as React.MouseEvent);
          }
        }}
        className="inline-flex cursor-pointer items-center justify-center"
      >
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 pointer-events-none">
            <Share2 className="h-4 w-4" />
            <span>Chia sẻ Zalo</span>
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold uppercase">
              <Share2 className="h-5 w-5 text-primary" />
              Chia sẻ lịch tập qua Zalo
            </DialogTitle>
            <DialogDescription>
              Gửi hình ảnh lịch tập đẹp mắt này cho bạn bè hoặc nhóm Zalo để hẹn giờ đi tập.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-primary/30 bg-card/60 p-1 text-center shadow-md">
              {loading ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Đang tạo ảnh lịch tập...
                </div>
              ) : imgUrl ? (
                <img
                  src={imgUrl}
                  alt="Phiếu lịch tập Gym"
                  className="w-full rounded-lg object-contain shadow-sm"
                />
              ) : (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Chưa thể tải ảnh.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                className="w-full sm:col-span-2 gap-2 bg-[#0068ff] text-white hover:bg-[#0052cc] font-semibold"
                onClick={handleNativeShare}
                disabled={loading}
              >
                <Send className="h-4 w-4" />
                Gửi qua Zalo / Chia sẻ
              </Button>

              <Button
                variant="secondary"
                className="gap-2"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Tải ảnh về máy
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleCopyImage}
                disabled={loading}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Sao chép ảnh</span>
                <span className="hidden sm:inline text-xs opacity-70">(Ctrl+V)</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:col-span-2 gap-2 text-xs text-muted-foreground"
                onClick={handleCopyText}
              >
                <Copy className="h-3.5 w-3.5" />
                Sao chép nội dung văn bản
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
