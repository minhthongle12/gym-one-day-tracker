import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Session = Database["public"]["Tables"]["gym_sessions"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type WeightEntry = Database["public"]["Tables"]["exercise_weight_history"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type WorkoutLog = Database["public"]["Tables"]["workout_logs"]["Row"];

function check<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error("Không tải được dữ liệu. Kiểm tra kết nối mạng và thử lại.");
  return r.data as T;
}

// RLS hides soft-deleted sessions from public reads.
export const sessionsQuery = queryOptions({
  queryKey: ["sessions"],
  queryFn: async () =>
    check(await supabase.from("gym_sessions").select("*").order("session_date", { ascending: false }).order("start_time", { ascending: false })),
});

export const sessionQuery = (id: string) =>
  queryOptions({
    queryKey: ["session", id],
    queryFn: async () => check(await supabase.from("gym_sessions").select("*").eq("id", id).maybeSingle()),
  });

export const exercisesQuery = queryOptions({
  queryKey: ["exercises"],
  queryFn: async () => check(await supabase.from("exercises").select("*").order("sort_order")),
  staleTime: 5 * 60_000,
});

export const weightsQuery = queryOptions({
  queryKey: ["weights"],
  queryFn: async () =>
    check(await supabase.from("exercise_weight_history").select("*").order("entry_date").order("created_at")),
});

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () => check(await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)),
  refetchInterval: 60_000,
});

export const sessionLogsQuery = (id: string) =>
  queryOptions({
    queryKey: ["logs", id],
    queryFn: async () => check(await supabase.from("workout_logs").select("*").eq("session_id", id).order("created_at")),
  });

// Inner join: logs of deleted sessions are excluded by the sessions RLS policy.
export const activeLogsQuery = queryOptions({
  queryKey: ["logs-active"],
  queryFn: async () =>
    check(
      await supabase
        .from("workout_logs")
        .select("*, gym_sessions!inner(status, session_date), exercises!inner(category)")
        .eq("gym_sessions.status", "completed"),
    ),
});

/** Latest valid (non-superseded) entry per exercise for a member. */
export function latestByExercise(entries: WeightEntry[], member: string) {
  const map = new Map<string, WeightEntry>();
  for (const e of entries) {
    if (e.member !== member || e.superseded_by) continue;
    const cur = map.get(e.exercise_id);
    if (!cur || e.entry_date > cur.entry_date || (e.entry_date === cur.entry_date && e.created_at > cur.created_at)) map.set(e.exercise_id, e);
  }
  return map;
}
