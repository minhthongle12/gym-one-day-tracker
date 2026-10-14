import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, ErrorBox, LoadingBlock, PageHeader, SessionCard } from "@/components/gym/shared";
import { NewSessionButton } from "@/components/gym/NewSessionDialog";
import { sessionsQuery, type Session } from "@/lib/queries";
import { vnDateStr } from "@/lib/time";

export const Route = createFileRoute("/lich-tap/")({
  head: () => ({
    meta: [
      { title: "Lịch tập — Long Phú Gym Buddy" },
      { name: "description", content: "Xem, tạo và xác nhận các buổi tập gym tại CLB Gym Long Phú." },
      { property: "og:title", content: "Lịch tập — Long Phú Gym Buddy" },
      { property: "og:description", content: "Lịch tập gym của Thông và Thuận." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Schedule,
});

function List({ items, empty }: { items: Session[]; empty: string }) {
  if (!items.length) return <Empty title={empty} />;
  return <div className="grid gap-3 md:grid-cols-2">{items.map((s) => <SessionCard key={s.id} s={s} />)}</div>;
}

function Schedule() {
  const q = useQuery(sessionsQuery);
  const today = vnDateStr();
  const all = q.data ?? [];
  const upcoming = all
    .filter((s) => s.status === "scheduled" && s.session_date >= today)
    .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));
  const overdue = all.filter((s) => s.status === "scheduled" && s.session_date < today);
  const completed = all.filter((s) => s.status === "completed");
  const cancelled = all.filter((s) => s.status === "cancelled");

  return (
    <div>
      <PageHeader title="Lịch tập" sub="Giờ Việt Nam" action={<NewSessionButton />} />
      {q.isLoading ? <LoadingBlock /> : q.error ? <ErrorBox error={q.error} /> : (
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="upcoming">Sắp tới ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="overdue">Chưa chốt ({overdue.length})</TabsTrigger>
            <TabsTrigger value="done">Hoàn thành ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Đã hủy ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming"><List items={upcoming} empty="Chưa có buổi tập sắp tới. Hãy tạo buổi mới!" /></TabsContent>
          <TabsContent value="overdue"><List items={overdue} empty="Không có buổi đã qua ngày mà chưa đánh dấu hoàn thành." /></TabsContent>
          <TabsContent value="done"><List items={completed} empty="Chưa có buổi tập hoàn thành." /></TabsContent>
          <TabsContent value="cancelled"><List items={cancelled} empty="Không có buổi bị hủy." /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
