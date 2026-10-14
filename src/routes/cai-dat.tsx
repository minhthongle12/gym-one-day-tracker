import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/gym/shared";
import { DEFAULT_LOCATION, MEMBER_NAME, MEMBERS } from "@/lib/domain";
import { savePushSubscription, sendTestPush } from "@/lib/gym.functions";
import { useMemberState } from "@/lib/member-context";

export const Route = createFileRoute("/cai-dat")({
  head: () => ({
    meta: [
      { title: "Cài đặt — Long Phú Gym Buddy" },
      { name: "description", content: "Đổi người dùng, bật thông báo và cài đặt ứng dụng." },
      { property: "og:title", content: "Cài đặt — Long Phú Gym Buddy" },
      { property: "og:description", content: "Cài đặt ứng dụng." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const VAPID_PUBLIC = "BM5LG8xjaQ0CjGunS6StJFl3UtTipMRUXkqySsPO2DRa8MEWTo8jG4P8Cx0Di2CyzrEOse9TVfFin1Ojl3s-1qg";
function b64ToBytes(s: string) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

function SettingsPage() {
  const { member, setMember } = useMemberState();
  const save = useServerFn(savePushSubscription);
  const test = useServerFn(sendTestPush);
  const [status, setStatus] = useState("Đang kiểm tra...");
  const [loc, setLoc] = useState(DEFAULT_LOCATION);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoc(localStorage.getItem("lpgb.location") || DEFAULT_LOCATION);
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("Trình duyệt này không hỗ trợ thông báo đẩy. Trên iPhone, hãy thêm ứng dụng vào Màn hình chính (iOS 16.4+).");
    } else if (window.self !== window.top) {
      setStatus("Đang xem trong khung xem trước — hãy mở ứng dụng đã xuất bản trong tab riêng để bật thông báo.");
    } else if (Notification.permission === "denied") {
      setStatus("Bạn đã chặn thông báo. Hãy cho phép lại trong cài đặt trình duyệt.");
    } else {
      navigator.serviceWorker.getRegistration("/").then(async (r) => {
        const sub = await r?.pushManager.getSubscription();
        setStatus(sub ? "Đã bật thông báo trên thiết bị này." : "Chưa bật thông báo trên thiết bị này.");
      });
    }
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Bạn chưa cấp quyền thông báo.");
      const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) }));
      const j = sub.toJSON();
      await save({ data: { endpoint: j.endpoint!, p256dh: j.keys!.p256dh, auth: j.keys!.auth } });
      setStatus("Đã bật thông báo trên thiết bị này.");
      toast.success("Đã bật thông báo.");
    } catch (e) {
      setStatus("Đăng ký thông báo thất bại.");
      toast.error(e instanceof Error ? e.message : "Không bật được thông báo.");
    } finally {
      setBusy(false);
    }
  };

  const runTest = async () => {
    setBusy(true);
    try {
      const r = await test();
      if (r.total === 0) toast.error("Chưa có thiết bị nào đăng ký nhận thông báo.");
      else toast.success(`Đã gửi thành công ${r.sent}/${r.total} thiết bị${r.failed ? `, lỗi ${r.failed}` : ""}${r.expired ? `, hết hạn ${r.expired}` : ""}.`);
    } catch {
      toast.error("Gửi thử thất bại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Cài đặt" />
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-bold uppercase">Người đang dùng</h2>
        <div className="mt-2 flex gap-2">
          {MEMBERS.map((m) => <Button key={m} variant={member === m ? "default" : "secondary"} onClick={() => { setMember(m); toast.success(`Đã chuyển sang ${MEMBER_NAME[m]}.`); }}>{MEMBER_NAME[m]}</Button>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Chỉ là lựa chọn hiển thị trên trình duyệt này, không phải đăng nhập hay xác thực danh tính.</p>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-bold uppercase">Phòng tập mặc định</h2>
        <div className="mt-2 flex gap-2">
          <Input value={loc} onChange={(e) => setLoc(e.target.value)} />
          <Button variant="secondary" onClick={() => { localStorage.setItem("lpgb.location", loc || DEFAULT_LOCATION); toast.success("Đã lưu."); }}>Lưu</Button>
        </div>
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-bold uppercase">Thông báo đẩy</h2>
        <p className="mt-1 text-sm">{status}</p>
        <p className="mt-1 text-xs text-muted-foreground">Bạn cần cho phép trình duyệt hiển thị thông báo. Không phải trình duyệt nào cũng nhận được thông báo trong mọi trường hợp; thông báo trong ứng dụng luôn được lưu dự phòng.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={enable} disabled={busy}>Bật thông báo</Button>
          <Button variant="secondary" onClick={runTest} disabled={busy}>Gửi thông báo thử</Button>
        </div>
      </section>
      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="text-lg font-bold uppercase">Cài đặt ứng dụng</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Android/Chrome: menu ⋮ → “Thêm vào màn hình chính” / “Cài đặt ứng dụng”.</li>
          <li>iPhone/Safari: nút Chia sẻ → “Thêm vào MH chính”, sau đó mở từ biểu tượng để bật thông báo.</li>
          <li>Nếu dữ liệu không tải được: kiểm tra mạng rồi tải lại trang.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Phiên bản 1.0.0 · Giờ hiển thị: Việt Nam (UTC+7)</p>
      </section>
    </div>
  );
}
