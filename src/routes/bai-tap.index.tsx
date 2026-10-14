import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_IMAGE, ErrorBox, LoadingBlock, PageHeader } from "@/components/gym/shared";
import { useMember } from "@/lib/member-context";
import { exercisesQuery, latestByExercise, weightsQuery } from "@/lib/queries";

export const Route = createFileRoute("/bai-tap/")({
  head: () => ({
    meta: [
      { title: "Bài tập PPL — Long Phú Gym Buddy" },
      { name: "description", content: "Thư viện 30 bài tập Push/Pull/Legs kèm hướng dẫn kỹ thuật." },
      { property: "og:title", content: "Bài tập PPL — Long Phú Gym Buddy" },
      { property: "og:description", content: "30 bài tập Push/Pull/Legs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

function Library() {
  const member = useMember();
  const ex = useQuery(exercisesQuery);
  const w = useQuery(weightsQuery);
  const [cat, setCat] = useState("ALL");
  const latest = latestByExercise(w.data ?? [], member);
  const list = (ex.data ?? []).filter((e) => cat === "ALL" || e.category === cat);
  return (
    <div>
      <PageHeader title="Bài tập" sub="Giáo án Push / Pull / Legs" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["ALL", "Tất cả"], ["PUSH", "PUSH"], ["PULL", "PULL"], ["LEGS", "LEGS"]].map(([v, l]) => (
          <Button key={v} size="sm" variant={cat === v ? "default" : "secondary"} onClick={() => setCat(v)}>{l}</Button>
        ))}
      </div>
      {ex.isLoading ? <LoadingBlock /> : ex.error ? <ErrorBox error={ex.error} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => {
            const l = latest.get(e.id);
            return (
              <Link key={e.id} to="/bai-tap/$slug" params={{ slug: e.slug }} className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50">
                <img src={e.image_url ?? CATEGORY_IMAGE[e.category]} alt={e.name_en} loading="lazy" width={1024} height={768} className="aspect-[16/9] w-full object-cover" />
                <div className="p-3">
                  <div className="text-xs font-semibold text-primary">{e.category}</div>
                  <div className="font-display text-xl font-bold leading-tight">{e.name_vi}</div>
                  <div className="text-sm text-muted-foreground">{e.name_en}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{e.primary_muscles.join(", ")} · {e.equipment}</div>
                  <div className="mt-2 text-sm font-medium">{l ? `${l.weight_kg} kg` : "Chưa cập nhật"}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
