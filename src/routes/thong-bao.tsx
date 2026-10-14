import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, errMsg, ErrorBox, LoadingBlock, PageHeader } from "@/components/gym/shared";
import { markNotificationsRead } from "@/lib/gym.functions";
import { notificationsQuery } from "@/lib/queries";
import { fmtDateTimeVN } from "@/lib/time";

export const Route = createFileRoute("/thong-bao")({
  head: () => ({
    meta: [
      { title: "Thông báo — Long Phú Gym Buddy" },
      { name: "description", content: "Trung tâm thông báo lịch tập." },
      { property: "og:title", content: "Thông báo — Long Phú Gym Buddy" },
      { property: "og:description", content: "Thông báo lịch tập gym." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const q = useQuery(notificationsQuery);
  const qc = useQueryClient();
  const mark = useServerFn(markNotificationsRead);
  const read = async (id?: string) => {
    try {
      await mark({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const unread = (q.data ?? []).filter((n) => !n.read_at).length;
  return (
    <div>
      <PageHeader title="Thông báo" sub={`${unread} chưa đọc`} action={unread > 0 && <Button variant="secondary" onClick={() => read()}>Đánh dấu tất cả đã đọc</Button>} />
      {q.isLoading ? <LoadingBlock /> : q.error ? <ErrorBox error={q.error} /> : !q.data?.length ? <Empty title="Chưa có thông báo nào." /> : (
        <div className="space-y-2">
          {q.data.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 ${n.read_at ? "bg-card" : "border-primary/40 bg-primary/10"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{!n.read_at && <span className="mr-1 text-primary">● Mới</span>}{n.title}</div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTimeVN(n.created_at)}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {n.session_id && <Button asChild size="sm" onClick={() => !n.read_at && read(n.id)}><Link to="/lich-tap/$id" params={{ id: n.session_id }}>Mở buổi tập</Link></Button>}
                {!n.read_at && <Button size="sm" variant="ghost" onClick={() => read(n.id)}>Đánh dấu đã đọc</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
