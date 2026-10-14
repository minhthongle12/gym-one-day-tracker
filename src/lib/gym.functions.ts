import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DEFAULT_LOCATION,
  initialAttendance,
  PUSH_CHANGE_BODY,
  PUSH_CHANGE_TITLE,
  PUSH_NEW_TITLE,
  pushNewSessionBody,
} from "./domain";

// NOTE: This app has no login. The `actor` below is a self-declared display name
// from the browser — a convenience, not verified identity. All writes go through
// these validated server functions; the browser has read-only database access.

const member = z.enum(["thong", "thuan"]);
const uuid = z.string().uuid();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function audit(a: Awaited<ReturnType<typeof admin>>, action: string, actor: string | null, entity: string, entityId: string | null, details: Record<string, unknown> = {}) {
  await a.from("audit_logs").insert({ action, actor, entity, entity_id: entityId, details: details as never });
}

async function notifyAll(a: Awaited<ReturnType<typeof admin>>, title: string, message: string, sessionId: string | null) {
  await a.from("notifications").insert({ title, message, session_id: sessionId });
  const { sendPushToAll } = await import("./push.server");
  try {
    return await sendPushToAll(a, { title, body: message, url: sessionId ? `/lich-tap/${sessionId}` : "/lich-tap" });
  } catch (e) {
    console.error(e);
    return { total: 0, sent: 0, failed: 0, expired: 0 };
  }
}

async function loadActiveSession(a: Awaited<ReturnType<typeof admin>>, id: string) {
  const { data, error } = await a.from("gym_sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Không tải được buổi tập.");
  if (!data || data.deleted_at) throw new Error("Buổi tập không tồn tại hoặc đã bị xóa.");
  return data;
}

export const createSession = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        actor: member,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        location: z.string().trim().min(1).max(120).default(DEFAULT_LOCATION),
        notes: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const a = await admin();
    const { data: row, error } = await a
      .from("gym_sessions")
      .insert({
        created_by: data.actor,
        session_date: data.date,
        start_time: data.time,
        location: data.location,
        notes: data.notes || null,
        ...initialAttendance(data.actor),
      })
      .select()
      .single();
    if (error || !row) throw new Error("Không lưu được buổi tập. Vui lòng thử lại.");
    await audit(a, "session.create", data.actor, "gym_session", row.id, { date: data.date, time: data.time });
    const push = await notifyAll(a, PUSH_NEW_TITLE, pushNewSessionBody(data.date, data.time, data.location), row.id);
    return { id: row.id, push };
  });

export const respondAttendance = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ actor: member, id: uuid, response: z.enum(["confirmed", "declined"]) }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const s = await loadActiveSession(a, data.id);
    if (s.status !== "scheduled") throw new Error("Chỉ phản hồi được buổi tập sắp diễn ra.");
    const col = data.actor === "thong" ? "thong_status" : "thuan_status";
    const { error } = await a.from("gym_sessions").update({ [col]: data.response }).eq("id", data.id);
    if (error) throw new Error("Không cập nhật được trạng thái.");
    await audit(a, `session.${data.response === "confirmed" ? "confirm" : "decline"}`, data.actor, "gym_session", data.id);
    return { ok: true };
  });

export const completeSession = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ actor: member, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const s = await loadActiveSession(a, data.id);
    if (s.status !== "scheduled") throw new Error("Buổi tập này không thể đánh dấu hoàn thành.");
    const { error } = await a.from("gym_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error("Không cập nhật được buổi tập.");
    await audit(a, "session.complete", data.actor, "gym_session", data.id);
    return { ok: true };
  });

export const cancelSession = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ actor: member, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const s = await loadActiveSession(a, data.id);
    if (s.status !== "scheduled") throw new Error("Chỉ hủy được buổi tập sắp diễn ra.");
    const { error } = await a
      .from("gym_sessions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: data.actor })
      .eq("id", data.id);
    if (error) throw new Error("Không hủy được buổi tập.");
    await audit(a, "session.cancel", data.actor, "gym_session", data.id);
    await notifyAll(a, PUSH_CHANGE_TITLE, PUSH_CHANGE_BODY, data.id);
    return { ok: true };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ actor: member, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const s = await loadActiveSession(a, data.id);
    // Convenience check only: the actor name is self-declared, not authenticated.
    if (s.created_by !== data.actor) throw new Error("Chỉ người tạo buổi tập mới có thể xóa.");
    const { error } = await a
      .from("gym_sessions")
      .update({ deleted_at: new Date().toISOString(), deleted_by: data.actor })
      .eq("id", data.id);
    if (error) throw new Error("Không xóa được buổi tập.");
    await audit(a, "session.delete", data.actor, "gym_session", data.id, { previous_status: s.status });
    await notifyAll(a, PUSH_CHANGE_TITLE, PUSH_CHANGE_BODY, null);
    return { ok: true };
  });

const weightFields = {
  weight_kg: z.number().min(0).max(1000),
  bodyweight_kg: z.number().min(20).max(300).nullable().optional(),
  sets: z.number().int().min(1).max(50).nullable().optional(),
  reps: z.number().int().min(1).max(200).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
};

export const addWeightEntry = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ actor: member, exercise_id: uuid, entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ...weightFields }).parse(d),
  )
  .handler(async ({ data }) => {
    const a = await admin();
    const { actor, ...rest } = data;
    const { data: row, error } = await a.from("exercise_weight_history").insert({ ...rest, member: actor }).select("id").single();
    if (error || !row) throw new Error("Không lưu được mức tạ.");
    await audit(a, "weight.add", actor, "exercise_weight_history", row.id);
    return { id: row.id };
  });

export const correctWeightEntry = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ actor: member, id: uuid, ...weightFields }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const { data: old } = await a.from("exercise_weight_history").select("*").eq("id", data.id).maybeSingle();
    if (!old) throw new Error("Không tìm thấy bản ghi.");
    if (old.member !== data.actor) throw new Error("Chỉ sửa được bản ghi của chính bạn.");
    if (old.superseded_by) throw new Error("Bản ghi này đã được sửa trước đó.");
    const { actor, id, ...rest } = data;
    const { data: row, error } = await a
      .from("exercise_weight_history")
      .insert({ ...rest, member: actor, exercise_id: old.exercise_id, entry_date: old.entry_date, corrects_id: id, workout_log_id: old.workout_log_id })
      .select("id")
      .single();
    if (error || !row) throw new Error("Không lưu được bản sửa.");
    await a.from("exercise_weight_history").update({ superseded_by: row.id }).eq("id", id);
    await audit(a, "weight.correct", actor, "exercise_weight_history", id, { before: old, new_id: row.id });
    return { id: row.id };
  });

export const addWorkoutLog = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        actor: member,
        session_id: uuid,
        exercise_id: uuid,
        weight_kg: z.number().min(0).max(1000),
        sets: z.number().int().min(1).max(50),
        reps: z.number().int().min(1).max(200),
        notes: z.string().trim().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const a = await admin();
    const s = await loadActiveSession(a, data.session_id);
    if (s.status !== "completed") throw new Error("Chỉ ghi nhật ký cho buổi tập đã hoàn thành.");
    const { actor, ...rest } = data;
    const { data: log, error } = await a.from("workout_logs").insert({ ...rest, member: actor }).select("id").single();
    if (error || !log) throw new Error("Không lưu được nhật ký.");
    await a.from("exercise_weight_history").insert({
      member: actor,
      exercise_id: data.exercise_id,
      entry_date: s.session_date,
      weight_kg: data.weight_kg,
      sets: data.sets,
      reps: data.reps,
      notes: data.notes ?? null,
      workout_log_id: log.id,
    });
    await audit(a, "workout_log.add", actor, "workout_log", log.id, { session_id: data.session_id });
    return { id: log.id };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: uuid.optional() }).parse(d))
  .handler(async ({ data }) => {
    const a = await admin();
    const q = a.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    const { error } = data.id ? await q.eq("id", data.id) : await q;
    if (error) throw new Error("Không cập nhật được thông báo.");
    return { ok: true };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        endpoint: z.string().url().startsWith("https://").max(1000),
        p256dh: z.string().min(10).max(200),
        auth: z.string().min(4).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const a = await admin();
    const { error } = await a
      .from("push_subscriptions")
      .upsert({ ...data, status: "active", last_error: null }, { onConflict: "endpoint" });
    if (error) throw new Error("Không lưu được đăng ký thông báo.");
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" }).handler(async () => {
  const a = await admin();
  const { sendPushToAll } = await import("./push.server");
  return sendPushToAll(a, {
    title: "Long Phú Gym Buddy",
    body: "Đây là thông báo thử nghiệm. Thông báo đang hoạt động!",
    url: "/thong-bao",
  });
});
