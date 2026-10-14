CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_vi text NOT NULL,
  category text NOT NULL CHECK (category IN ('PUSH','PULL','LEGS')),
  primary_muscles text[] NOT NULL DEFAULT '{}',
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  equipment text NOT NULL,
  difficulty text NOT NULL,
  weight_type text NOT NULL CHECK (weight_type IN ('barbell','dumbbell','machine','cable','assisted')),
  image_url text,
  anatomy_image_url text,
  starting_position text NOT NULL,
  steps text[] NOT NULL DEFAULT '{}',
  breathing text NOT NULL,
  mistakes text[] NOT NULL DEFAULT '{}',
  safety text[] NOT NULL DEFAULT '{}',
  sets_reps text NOT NULL,
  progression text NOT NULL,
  video_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercises TO anon, authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read exercises" ON public.exercises FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.gym_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by text NOT NULL CHECK (created_by IN ('thong','thuan')),
  session_date date NOT NULL,
  start_time time NOT NULL,
  location text NOT NULL DEFAULT 'CLB Gym Long Phú',
  notes text,
  thong_status text NOT NULL DEFAULT 'pending' CHECK (thong_status IN ('pending','confirmed','declined')),
  thuan_status text NOT NULL DEFAULT 'pending' CHECK (thuan_status IN ('pending','confirmed','declined')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  deleted_at timestamptz,
  deleted_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gym_sessions_date_idx ON public.gym_sessions (session_date, start_time) WHERE deleted_at IS NULL;
GRANT SELECT ON public.gym_sessions TO anon, authenticated;
GRANT ALL ON public.gym_sessions TO service_role;
ALTER TABLE public.gym_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active sessions" ON public.gym_sessions FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);

CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.gym_sessions(id) ON DELETE RESTRICT,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  member text NOT NULL CHECK (member IN ('thong','thuan')),
  weight_kg numeric(6,2),
  sets int CHECK (sets BETWEEN 1 AND 50),
  reps int CHECK (reps BETWEEN 1 AND 200),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workout_logs_session_idx ON public.workout_logs (session_id);
GRANT SELECT ON public.workout_logs TO anon, authenticated;
GRANT ALL ON public.workout_logs TO service_role;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read logs" ON public.workout_logs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.exercise_weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  member text NOT NULL CHECK (member IN ('thong','thuan')),
  entry_date date NOT NULL,
  weight_kg numeric(6,2) NOT NULL CHECK (weight_kg >= 0 AND weight_kg <= 1000),
  bodyweight_kg numeric(6,2),
  sets int CHECK (sets BETWEEN 1 AND 50),
  reps int CHECK (reps BETWEEN 1 AND 200),
  rpe int CHECK (rpe BETWEEN 1 AND 10),
  notes text,
  workout_log_id uuid REFERENCES public.workout_logs(id),
  superseded_by uuid REFERENCES public.exercise_weight_history(id),
  corrects_id uuid REFERENCES public.exercise_weight_history(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ewh_lookup_idx ON public.exercise_weight_history (member, exercise_id, entry_date);
GRANT SELECT ON public.exercise_weight_history TO anon, authenticated;
GRANT ALL ON public.exercise_weight_history TO service_role;
ALTER TABLE public.exercise_weight_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read weights" ON public.exercise_weight_history FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  session_id uuid REFERENCES public.gym_sessions(id),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read notifications" ON public.notifications FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired')),
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor text,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_sessions BEFORE UPDATE ON public.gym_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_exercises BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_push BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Deleted sessions can never be restored
CREATE OR REPLACE FUNCTION public.block_undelete() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Deleted sessions cannot be modified'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_block_undelete BEFORE UPDATE ON public.gym_sessions FOR EACH ROW EXECUTE FUNCTION public.block_undelete();

INSERT INTO public.exercises (sort_order, slug, name_en, name_vi, category, primary_muscles, secondary_muscles, equipment, difficulty, weight_type, starting_position, steps, breathing, mistakes, safety, sets_reps, progression, video_url) VALUES
(1,'barbell-bench-press','Barbell Bench Press','Đẩy ngực tạ đòn','PUSH',ARRAY['Ngực giữa'],ARRAY['Vai trước','Tay sau'],'Tạ đòn, ghế phẳng','Trung bình','barbell','Nằm ngửa trên ghế phẳng, mắt ngay dưới thanh đòn, hai bàn chân đặt chắc trên sàn, siết bả vai về sau và xuống.',ARRAY['Nắm thanh đòn rộng hơn vai một chút','Nhấc tạ khỏi giá, giữ thẳng trên vai','Hạ tạ có kiểm soát xuống giữa ngực, khuỷu tay khoảng 45–70° so với thân','Chạm nhẹ ngực rồi đẩy tạ lên theo đường hơi cong về phía vai','Khóa nhẹ khuỷu tay ở trên, giữ bả vai siết'],'Hít vào và giữ hơi khi hạ tạ; thở ra khi đẩy qua điểm khó.',ARRAY['Nảy tạ khỏi ngực','Mở khuỷu tay 90°','Nhấc mông khỏi ghế','Cổ tay gập ra sau'],ARRAY['Luôn có người hỗ trợ hoặc dùng thanh chặn an toàn','Không khóa ngón cái (suicide grip)','Khởi động kỹ vai'],'3–4 hiệp × 6–10 lần','Tăng 2,5 kg khi hoàn thành đủ số lần ở mọi hiệp với kỹ thuật tốt.','https://www.youtube.com/results?search_query=Barbell+Bench+Press+proper+form'),
(2,'incline-dumbbell-press','Incline Dumbbell Press','Đẩy ngực trên tạ đơn ghế dốc','PUSH',ARRAY['Ngực trên'],ARRAY['Vai trước','Tay sau'],'Tạ đơn, ghế điều chỉnh 30–45°','Trung bình','dumbbell','Ngồi tựa ghế dốc 30–45°, đặt tạ lên đùi rồi đưa lên ngang vai khi nằm xuống.',ARRAY['Giữ tạ ngang ngực trên, lòng bàn tay hướng về phía trước','Đẩy tạ lên trên và hơi chụm vào nhau','Dừng khi tay gần thẳng','Hạ tạ chậm về ngang ngực trên'],'Hít vào khi hạ, thở ra khi đẩy.',ARRAY['Ghế quá dốc khiến vai làm hết việc','Hạ tạ quá sâu gây căng vai','Đập hai tạ vào nhau'],ARRAY['Đưa tạ về đùi khi kết thúc thay vì thả rơi','Chọn mức tạ kiểm soát được'],'3 hiệp × 8–12 lần','Tăng lần lặp đến 12, sau đó lên mức tạ đơn kế tiếp.','https://www.youtube.com/results?search_query=Incline+Dumbbell+Press+proper+form'),
(3,'machine-chest-press','Machine Chest Press','Đẩy ngực máy','PUSH',ARRAY['Ngực'],ARRAY['Vai trước','Tay sau'],'Máy đẩy ngực','Dễ','machine','Chỉnh ghế để tay cầm ngang giữa ngực, lưng tựa sát đệm.',ARRAY['Nắm tay cầm, siết bả vai','Đẩy về phía trước đến khi tay gần thẳng','Trở về chậm đến khi cảm nhận ngực giãn'],'Thở ra khi đẩy, hít vào khi trở về.',ARRAY['Ghế quá thấp hoặc cao','Nhô vai về trước','Dùng quán tính'],ARRAY['Không thả tạ đập vào chồng tạ','Chỉnh ghế trước mỗi lần tập'],'3 hiệp × 10–12 lần','Tăng 1 nấc tạ khi làm được 12 lần ở mọi hiệp.','https://www.youtube.com/results?search_query=Machine+Chest+Press+proper+form'),
(4,'cable-fly','Cable Fly','Ép ngực cáp','PUSH',ARRAY['Ngực'],ARRAY['Vai trước'],'Máy cáp đôi','Trung bình','cable','Đứng giữa hai ròng rọc ở độ cao vai, bước một chân lên trước, khuỷu hơi cong.',ARRAY['Giữ khuỷu tay hơi cong cố định','Kéo hai tay theo hình vòng cung về trước ngực','Ép ngực 1 giây','Mở tay chậm về vị trí đầu'],'Thở ra khi ép, hít vào khi mở.',ARRAY['Biến thành động tác đẩy','Mở tay quá rộng ra sau vai','Dùng tạ quá nặng'],ARRAY['Giữ thân ổn định','Tránh kéo căng vai quá mức'],'3 hiệp × 12–15 lần','Tăng lần lặp trước, sau đó tăng một nấc cáp.','https://www.youtube.com/results?search_query=Cable+Fly+proper+form'),
(5,'pec-deck','Pec Deck','Ép ngực máy bướm','PUSH',ARRAY['Ngực'],ARRAY['Vai trước'],'Máy Pec Deck','Dễ','machine','Ngồi lưng sát đệm, tay cầm ngang ngực, khuỷu hơi cong.',ARRAY['Ép hai tay vào nhau trước ngực','Giữ 1 giây','Mở tay chậm đến khi ngực giãn vừa phải'],'Thở ra khi ép, hít vào khi mở.',ARRAY['Ghế sai độ cao','Nhún vai','Mở quá rộng'],ARRAY['Không để tạ kéo tay ra sau vai đột ngột'],'3 hiệp × 12–15 lần','Tăng một nấc khi đạt 15 lần sạch.','https://www.youtube.com/results?search_query=Pec+Deck+proper+form'),
(6,'seated-shoulder-press','Seated Shoulder Press','Đẩy vai ngồi','PUSH',ARRAY['Vai trước','Vai giữa'],ARRAY['Tay sau','Ngực trên'],'Tạ đơn hoặc máy, ghế có tựa','Trung bình','dumbbell','Ngồi thẳng lưng tựa ghế gần thẳng đứng, tạ ở ngang tai, lòng bàn tay hướng trước.',ARRAY['Siết bụng, giữ lưng tựa ghế','Đẩy tạ thẳng lên trên đầu','Dừng khi tay gần thẳng','Hạ chậm về ngang tai'],'Thở ra khi đẩy, hít vào khi hạ.',ARRAY['Ưỡn lưng quá mức','Hạ tạ quá thấp','Đẩy tạ ra phía trước'],ARRAY['Dừng nếu đau khớp vai','Khởi động vai xoay trước'],'3 hiệp × 8–12 lần','Tăng lần lặp đến 12 rồi tăng tạ.','https://www.youtube.com/results?search_query=Seated+Dumbbell+Shoulder+Press+proper+form'),
(7,'dumbbell-lateral-raise','Dumbbell Lateral Raise','Nâng tạ đơn sang ngang','PUSH',ARRAY['Vai giữa'],ARRAY['Cầu vai'],'Tạ đơn','Dễ','dumbbell','Đứng thẳng, tạ cạnh hông, khuỷu hơi cong, thân hơi đổ trước.',ARRAY['Nâng tạ sang hai bên','Dẫn bằng khuỷu tay','Dừng ngang vai','Hạ chậm 2–3 giây'],'Thở ra khi nâng, hít vào khi hạ.',ARRAY['Vung người lấy đà','Nhún vai','Nâng quá cao'],ARRAY['Dùng tạ nhẹ, ưu tiên kiểm soát'],'3–4 hiệp × 12–20 lần','Tăng lần lặp, sau đó tăng 1–2 kg.','https://www.youtube.com/results?search_query=Dumbbell+Lateral+Raise+proper+form'),
(8,'cable-lateral-raise','Cable Lateral Raise','Nâng vai ngang cáp','PUSH',ARRAY['Vai giữa'],ARRAY['Cầu vai'],'Máy cáp đơn, ròng rọc thấp','Dễ','cable','Đứng nghiêng cạnh máy, tay xa máy cầm tay cáp ngang hông bên kia.',ARRAY['Nâng tay sang ngang với khuỷu hơi cong','Dừng ngang vai','Hạ chậm, giữ lực căng cáp'],'Thở ra khi nâng, hít vào khi hạ.',ARRAY['Nghiêng người lấy đà','Nhún vai'],ARRAY['Bám tay còn lại vào máy để giữ thăng bằng'],'3 hiệp × 12–15 lần mỗi bên','Tăng lần lặp rồi tăng một nấc.','https://www.youtube.com/results?search_query=Cable+Lateral+Raise+proper+form'),
(9,'face-pull','Face Pull','Kéo dây cáp về mặt','PUSH',ARRAY['Vai sau'],ARRAY['Cơ xoay vai','Cầu vai giữa'],'Máy cáp, dây thừng','Dễ','cable','Đặt ròng rọc ngang hoặc cao hơn mặt, cầm dây thừng lòng bàn tay hướng xuống.',ARRAY['Lùi lại để dây căng','Kéo dây về phía mặt, tách hai đầu dây','Khuỷu cao, xoay tay ra ngoài ở cuối','Trở về chậm'],'Thở ra khi kéo, hít vào khi trả.',ARRAY['Ngả người ra sau','Khuỷu thấp','Dùng tạ quá nặng'],ARRAY['Bài bổ trợ sức khỏe vai, ưu tiên kỹ thuật'],'3 hiệp × 12–20 lần','Tăng lần lặp trước khi tăng tạ.','https://www.youtube.com/results?search_query=Face+Pull+proper+form'),
(10,'rope-triceps-pushdown','Rope Triceps Pushdown','Đẩy cáp tay sau dây thừng','PUSH',ARRAY['Tay sau'],ARRAY[]::text[],'Máy cáp, dây thừng','Dễ','cable','Đứng trước ròng rọc cao, cầm dây thừng, khuỷu sát thân.',ARRAY['Giữ khuỷu cố định cạnh sườn','Đẩy dây xuống đến khi tay thẳng','Tách hai đầu dây ở cuối','Trở về chậm đến ngang ngực'],'Thở ra khi đẩy xuống, hít vào khi trả.',ARRAY['Khuỷu đưa ra trước','Dùng vai và thân đẩy'],ARRAY['Không khóa khuỷu mạnh'],'3 hiệp × 10–15 lần','Tăng lần lặp rồi tăng một nấc.','https://www.youtube.com/results?search_query=Rope+Triceps+Pushdown+proper+form'),
(11,'overhead-triceps-extension','Overhead Triceps Extension','Duỗi tay sau qua đầu','PUSH',ARRAY['Tay sau (đầu dài)'],ARRAY[]::text[],'Tạ đơn hoặc cáp','Trung bình','dumbbell','Ngồi hoặc đứng thẳng, hai tay giữ một tạ đơn trên đầu.',ARRAY['Hạ tạ ra sau đầu bằng cách gập khuỷu','Giữ khuỷu hướng lên, gần đầu','Duỗi tay đưa tạ lên lại'],'Hít vào khi hạ, thở ra khi duỗi.',ARRAY['Khuỷu mở rộng','Ưỡn lưng','Hạ quá nhanh'],ARRAY['Nắm chắc tạ, cẩn thận vùng đầu'],'3 hiệp × 10–12 lần','Tăng lần lặp đến 12 rồi tăng tạ.','https://www.youtube.com/results?search_query=Overhead+Triceps+Extension+proper+form'),
(12,'lat-pulldown','Lat Pulldown','Kéo xà máy','PULL',ARRAY['Cơ lưng xô'],ARRAY['Tay trước','Cầu vai giữa'],'Máy kéo xà','Dễ','machine','Ngồi chặn đùi dưới đệm, nắm thanh rộng hơn vai.',ARRAY['Hơi ngả người sau 10–15°','Kéo thanh xuống ngực trên, dẫn bằng khuỷu','Ép bả vai xuống','Trả chậm đến khi tay gần thẳng'],'Thở ra khi kéo, hít vào khi trả.',ARRAY['Kéo ra sau gáy','Ngả người quá nhiều','Dùng quán tính'],ARRAY['Không thả thanh đột ngột'],'3–4 hiệp × 8–12 lần','Tăng một nấc khi đạt 12 lần.','https://www.youtube.com/results?search_query=Lat+Pulldown+proper+form'),
(13,'assisted-pull-up','Assisted Pull-up','Hít xà có hỗ trợ','PULL',ARRAY['Cơ lưng xô'],ARRAY['Tay trước','Lưng giữa'],'Máy hít xà hỗ trợ','Trung bình','assisted','Quỳ hoặc đứng lên bệ hỗ trợ, nắm tay cầm rộng bằng vai hoặc hơn.',ARRAY['Bắt đầu tay thẳng, vai hạ xuống','Kéo người lên đến khi cằm qua tay cầm','Hạ chậm có kiểm soát'],'Thở ra khi kéo lên, hít vào khi hạ.',ARRAY['Đung đưa','Chỉ kéo nửa biên độ'],ARRAY['Bước lên/xuống bệ cẩn thận'],'3 hiệp × 6–10 lần','Giảm dần mức hỗ trợ (số trên máy là lực trợ giúp, càng nhỏ càng khó).','https://www.youtube.com/results?search_query=Assisted+Pull+Up+machine+proper+form'),
(14,'seated-cable-row','Seated Cable Row','Kéo cáp ngồi','PULL',ARRAY['Lưng giữa','Cơ lưng xô'],ARRAY['Tay trước','Vai sau'],'Máy kéo cáp ngồi','Dễ','cable','Ngồi chân đặt lên bệ, gối hơi cong, lưng thẳng, cầm tay cầm chữ V.',ARRAY['Kéo tay cầm về bụng','Ép bả vai về sau','Trả chậm, để bả vai giãn ra'],'Thở ra khi kéo, hít vào khi trả.',ARRAY['Gập lưng','Ngả người quá nhiều','Nhún vai'],ARRAY['Giữ cột sống trung tính'],'3 hiệp × 10–12 lần','Tăng một nấc khi đạt 12 lần.','https://www.youtube.com/results?search_query=Seated+Cable+Row+proper+form'),
(15,'chest-supported-row','Chest-Supported Row','Chèo tạ tựa ngực','PULL',ARRAY['Lưng giữa'],ARRAY['Cơ lưng xô','Vai sau','Tay trước'],'Ghế dốc + tạ đơn hoặc máy','Dễ','dumbbell','Nằm sấp trên ghế dốc 30–45°, tạ đơn treo thẳng dưới vai.',ARRAY['Kéo tạ lên về phía hông','Ép bả vai','Hạ chậm đến tay thẳng'],'Thở ra khi kéo, hít vào khi hạ.',ARRAY['Nhấc ngực khỏi ghế','Nhún vai'],ARRAY['Giữ cổ trung tính'],'3 hiệp × 10–12 lần','Tăng lần lặp rồi tăng tạ.','https://www.youtube.com/results?search_query=Chest+Supported+Dumbbell+Row+proper+form'),
(16,'one-arm-dumbbell-row','One-Arm Dumbbell Row','Chèo tạ đơn một tay','PULL',ARRAY['Cơ lưng xô'],ARRAY['Lưng giữa','Tay trước'],'Tạ đơn, ghế phẳng','Dễ','dumbbell','Một tay và một gối chống lên ghế, lưng song song sàn, tay kia cầm tạ.',ARRAY['Kéo tạ về phía hông','Giữ khuỷu gần thân','Hạ chậm đến khi tay thẳng'],'Thở ra khi kéo, hít vào khi hạ.',ARRAY['Xoay thân','Kéo bằng tay trước'],ARRAY['Giữ lưng thẳng'],'3 hiệp × 8–12 lần mỗi bên','Tăng lần lặp rồi tăng tạ.','https://www.youtube.com/results?search_query=One+Arm+Dumbbell+Row+proper+form'),
(17,'straight-arm-pulldown','Straight-Arm Pulldown','Kéo cáp tay thẳng','PULL',ARRAY['Cơ lưng xô'],ARRAY['Tay sau (đầu dài)'],'Máy cáp, thanh thẳng hoặc dây','Dễ','cable','Đứng trước ròng rọc cao, tay gần thẳng cầm thanh ngang mặt, hơi gập hông.',ARRAY['Giữ tay gần thẳng','Kéo thanh xuống đùi theo vòng cung','Trả chậm lên ngang mặt'],'Thở ra khi kéo, hít vào khi trả.',ARRAY['Gập khuỷu biến thành pushdown','Dùng thân lấy đà'],ARRAY['Giữ bụng siết'],'3 hiệp × 12–15 lần','Tăng lần lặp rồi tăng nấc.','https://www.youtube.com/results?search_query=Straight+Arm+Pulldown+proper+form'),
(18,'barbell-curl','Barbell Curl','Cuốn tạ đòn','PULL',ARRAY['Tay trước'],ARRAY['Cẳng tay'],'Tạ đòn','Dễ','barbell','Đứng thẳng, cầm thanh rộng bằng vai, lòng bàn tay hướng trước.',ARRAY['Giữ khuỷu sát thân','Cuốn thanh lên ngang vai','Hạ chậm đến tay thẳng'],'Thở ra khi cuốn, hít vào khi hạ.',ARRAY['Vung lưng','Khuỷu đưa ra trước'],ARRAY['Không ưỡn lưng dưới'],'3 hiệp × 8–12 lần','Tăng 1–2,5 kg khi đạt 12 lần.','https://www.youtube.com/results?search_query=Barbell+Curl+proper+form'),
(19,'incline-dumbbell-curl','Incline Dumbbell Curl','Cuốn tạ đơn ghế dốc','PULL',ARRAY['Tay trước (đầu dài)'],ARRAY['Cẳng tay'],'Tạ đơn, ghế dốc 45–60°','Trung bình','dumbbell','Ngồi tựa ghế dốc, tay buông thẳng sau thân.',ARRAY['Cuốn tạ lên, giữ cánh tay trên cố định','Siết ở đỉnh','Hạ chậm đến tay thẳng'],'Thở ra khi cuốn, hít vào khi hạ.',ARRAY['Đưa vai ra trước','Dùng tạ quá nặng'],ARRAY['Tránh kéo căng quá mức vai trước'],'3 hiệp × 10–12 lần','Tăng lần lặp rồi tăng tạ.','https://www.youtube.com/results?search_query=Incline+Dumbbell+Curl+proper+form'),
(20,'hammer-curl','Hammer Curl','Cuốn búa','PULL',ARRAY['Cơ cánh tay (brachialis)','Cơ cánh tay quay'],ARRAY['Tay trước'],'Tạ đơn','Dễ','dumbbell','Đứng thẳng, tạ cạnh hông, lòng bàn tay hướng vào nhau.',ARRAY['Cuốn tạ lên giữ tư thế trung tính','Khuỷu sát thân','Hạ chậm'],'Thở ra khi cuốn, hít vào khi hạ.',ARRAY['Vung tạ','Xoay cổ tay'],ARRAY['Giữ cổ tay thẳng'],'3 hiệp × 10–12 lần','Tăng lần lặp rồi tăng tạ.','https://www.youtube.com/results?search_query=Hammer+Curl+proper+form'),
(21,'barbell-squat','Barbell Squat','Gánh đùi tạ đòn','LEGS',ARRAY['Cơ đùi trước','Mông'],ARRAY['Đùi trong','Cơ dựng sống','Bụng'],'Tạ đòn, khung squat','Khó','barbell','Đặt thanh đòn trên cơ thang, chân rộng bằng vai, mũi chân hơi mở.',ARRAY['Hít sâu, siết bụng','Đẩy hông ra sau và gập gối đồng thời','Xuống đến khi đùi ngang hoặc thấp hơn song song nếu kiểm soát được','Gối theo hướng mũi chân','Đẩy qua cả bàn chân để đứng lên'],'Hít vào và giữ hơi (brace) khi xuống; thở ra gần đỉnh.',ARRAY['Gối chụm vào trong','Gót nhấc khỏi sàn','Cong lưng dưới'],ARRAY['Đặt thanh chặn an toàn ở khung','Khởi động với thanh không'],'3–4 hiệp × 5–8 lần','Tăng 2,5–5 kg khi hoàn thành đủ lần mọi hiệp.','https://www.youtube.com/results?search_query=Barbell+Back+Squat+proper+form'),
(22,'leg-press','Leg Press','Đạp đùi máy','LEGS',ARRAY['Cơ đùi trước','Mông'],ARRAY['Đùi sau'],'Máy đạp đùi','Dễ','machine','Ngồi lưng sát đệm, chân đặt giữa bàn đạp rộng bằng vai.',ARRAY['Mở khóa an toàn','Hạ bàn đạp đến gối khoảng 90°','Đẩy lên, không khóa gối'],'Hít vào khi hạ, thở ra khi đẩy.',ARRAY['Hông nhấc khỏi ghế','Khóa gối','Hạ quá sâu khiến lưng cong'],ARRAY['Luôn khóa an toàn khi xong'],'3 hiệp × 10–12 lần','Tăng 5–10 kg khi đạt 12 lần.','https://www.youtube.com/results?search_query=Leg+Press+proper+form'),
(23,'romanian-deadlift','Romanian Deadlift','Romanian Deadlift (RDL)','LEGS',ARRAY['Đùi sau','Mông'],ARRAY['Cơ dựng sống','Cẳng tay'],'Tạ đòn hoặc tạ đơn','Trung bình','barbell','Đứng thẳng cầm thanh trước đùi, chân rộng bằng hông, gối hơi cong.',ARRAY['Đẩy hông ra sau, lưng thẳng','Trượt thanh sát chân xuống đến giữa cẳng chân','Cảm nhận đùi sau căng','Đẩy hông về trước để đứng lên'],'Hít vào và giữ khi hạ, thở ra khi lên.',ARRAY['Cong lưng','Gập gối như squat','Thanh xa chân'],ARRAY['Dừng biên độ trước khi lưng bị cong'],'3 hiệp × 8–10 lần','Tăng 2,5–5 kg khi giữ lưng thẳng trọn biên độ.','https://www.youtube.com/results?search_query=Romanian+Deadlift+proper+form'),
(24,'leg-extension','Leg Extension','Đá đùi máy','LEGS',ARRAY['Cơ đùi trước'],ARRAY[]::text[],'Máy đá đùi','Dễ','machine','Ngồi, đệm chân đặt trên cổ chân, khớp gối thẳng hàng trục máy.',ARRAY['Duỗi gối nâng đệm lên','Siết đùi 1 giây','Hạ chậm'],'Thở ra khi duỗi, hít vào khi hạ.',ARRAY['Vung nhanh','Nhấc hông'],ARRAY['Giảm tạ nếu đau gối'],'3 hiệp × 12–15 lần','Tăng nấc khi đạt 15 lần.','https://www.youtube.com/results?search_query=Leg+Extension+machine+proper+form'),
(25,'lying-leg-curl','Lying Leg Curl','Móc đùi nằm','LEGS',ARRAY['Đùi sau'],ARRAY['Bắp chân'],'Máy móc đùi nằm','Dễ','machine','Nằm sấp, đệm ngay trên gót chân, gối ở mép ghế.',ARRAY['Gập gối kéo đệm về mông','Giữ hông áp sát ghế','Hạ chậm'],'Thở ra khi gập, hít vào khi hạ.',ARRAY['Nhấc hông','Vung tạ'],ARRAY['Không duỗi gối quá mức khi hạ'],'3 hiệp × 10–12 lần','Tăng nấc khi đạt 12 lần.','https://www.youtube.com/results?search_query=Lying+Leg+Curl+proper+form'),
(26,'seated-leg-curl','Seated Leg Curl','Móc đùi ngồi','LEGS',ARRAY['Đùi sau'],ARRAY['Bắp chân'],'Máy móc đùi ngồi','Dễ','machine','Ngồi, đệm đùi chặn trên gối, đệm chân dưới cổ chân.',ARRAY['Gập gối kéo đệm xuống dưới ghế','Giữ 1 giây','Trả chậm'],'Thở ra khi gập, hít vào khi trả.',ARRAY['Đệm đùi lỏng','Trả quá nhanh'],ARRAY['Chỉnh trục máy ngang khớp gối'],'3 hiệp × 10–12 lần','Tăng nấc khi đạt 12 lần.','https://www.youtube.com/results?search_query=Seated+Leg+Curl+proper+form'),
(27,'standing-calf-raise','Standing Calf Raise','Nhón bắp chân đứng','LEGS',ARRAY['Bắp chân (gastrocnemius)'],ARRAY['Cơ dép'],'Máy nhón bắp chân đứng','Dễ','machine','Đứng dưới đệm vai, mũi chân trên bục, gót buông thấp.',ARRAY['Nhón gót cao nhất có thể','Giữ 1 giây','Hạ gót xuống dưới mép bục'],'Thở ra khi nhón, hít vào khi hạ.',ARRAY['Nảy nhanh','Gập gối'],ARRAY['Giữ gối gần thẳng nhưng không khóa'],'3–4 hiệp × 10–15 lần','Tăng tạ khi đạt 15 lần với dừng ở đỉnh.','https://www.youtube.com/results?search_query=Standing+Calf+Raise+proper+form'),
(28,'seated-calf-raise','Seated Calf Raise','Nhón bắp chân ngồi','LEGS',ARRAY['Cơ dép'],ARRAY['Bắp chân'],'Máy nhón bắp chân ngồi','Dễ','machine','Ngồi, đệm chặn trên đùi gần gối, mũi chân trên bục.',ARRAY['Nhón gót lên','Giữ 1 giây','Hạ gót sâu'],'Thở ra khi nhón, hít vào khi hạ.',ARRAY['Biên độ ngắn','Nảy'],ARRAY['Mở khóa an toàn cẩn thận'],'3 hiệp × 12–20 lần','Tăng tạ khi đạt 20 lần.','https://www.youtube.com/results?search_query=Seated+Calf+Raise+proper+form'),
(29,'hip-thrust','Hip Thrust','Đẩy hông','LEGS',ARRAY['Mông lớn'],ARRAY['Đùi sau','Đùi trước'],'Tạ đòn, ghế, đệm thanh','Trung bình','barbell','Lưng trên tựa mép ghế, thanh đòn (có đệm) trên hông, bàn chân rộng bằng hông.',ARRAY['Siết bụng, cằm hơi cúi','Đẩy hông lên đến khi thân song song sàn','Siết mông ở đỉnh','Hạ chậm'],'Hít vào ở dưới, thở ra khi đẩy lên.',ARRAY['Ưỡn lưng quá mức ở đỉnh','Bàn chân quá xa/gần'],ARRAY['Dùng đệm thanh để bảo vệ hông'],'3 hiệp × 8–12 lần','Tăng 5 kg khi đạt 12 lần.','https://www.youtube.com/results?search_query=Barbell+Hip+Thrust+proper+form'),
(30,'hip-abductor-machine','Hip Abductor Machine','Dạng hông máy','LEGS',ARRAY['Mông nhỡ','Mông bé'],ARRAY[]::text[],'Máy dạng hông','Dễ','machine','Ngồi lưng tựa, đệm đặt ngoài gối.',ARRAY['Đẩy hai gối ra ngoài','Giữ 1 giây','Trả chậm'],'Thở ra khi đẩy, hít vào khi trả.',ARRAY['Trả nhanh','Dùng quán tính'],ARRAY['Chỉnh biên độ phù hợp'],'3 hiệp × 12–20 lần','Tăng nấc khi đạt 20 lần.','https://www.youtube.com/results?search_query=Hip+Abductor+Machine+proper+form');