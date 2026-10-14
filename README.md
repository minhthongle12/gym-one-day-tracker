# Gym One Day Tracker

# LONG PHÚ GYM BUDDY — COMPLETE APP BUILD PROMPT

Build a complete, mobile-friendly web application called **Long Phú Gym Buddy** for two people, Thông and Thuận, to manage gym schedules, track Push/Pull/Legs workouts, record exercise weights and review training progress.

The app must be fully functional, not just a UI prototype. Implement the database, business logic, responsive UI, notifications, statistics and deployment configuration.

## 1. Technology stack

- React + TypeScript.
- Tailwind CSS and shadcn/ui.
- Supabase Database for persistent data.
- Supabase Storage for exercise images and other uploaded media.
- Supabase Edge Functions for server-side operations, including Web Push delivery.
- Progressive Web App (PWA), installable on mobile devices.
- Web Push API and service worker for push notifications.
- Use the project's environment variables for all secrets.
- Never expose service-role keys or VAPID private keys in client-side code.

If the project uses Lovable's integrated Supabase setup, configure the required tables, migrations, policies and Edge Functions accordingly.

## 2. App purpose and visual design

The application is designed for two gym partners at **CLB Gym Long Phú**.

Design requirements:
- Modern, clean fitness dashboard.
- Mobile-first responsive layout.
- Dark gym-inspired theme with strong contrast and readable typography.
- Vietnamese as the default interface language.
- Bottom navigation on mobile and a sidebar or top navigation on desktop.
- Clear loading, empty, success and error states.
- Use reusable components and consistent spacing.
- Display dates and times in Vietnam time (Asia/Ho_Chi_Minh).
- Default gym location: CLB Gym Long Phú.

Main navigation:
1. Tổng quan
2. Lịch tập
3. Bài tập
4. Tiến độ
5. Thông báo
6. Cài đặt

## 3. No-login user selection

The app must not require registration, email, password or login.

When the app is opened on a device for the first time, show a simple welcome screen:

**"Ai đang sử dụng Long Phú Gym Buddy?"**

Provide two buttons:
- Thông
- Thuận

When a person is selected:
- Save the selected display name in localStorage.
- Open the main dashboard directly.
- Remember the selection on subsequent visits to the same browser/device.
- Allow switching between Thông and Thuận in Settings.
- Do not ask again unless local browser data is cleared or the user chooses to switch.

Important security limitation: this is a convenience-based identity selection, not authentication. Anyone with access to the public app can select either name. Never treat the selected name as verified identity or use it as the sole security boundary for sensitive database operations.

Do not create a login screen or require Supabase Auth for ordinary app navigation.

Configure database access carefully. Never expose service-role credentials to the browser. Do not disable all Row Level Security policies merely to make the no-login experience work. Use narrowly scoped, validated server-side operations for writes where appropriate, and document the security trade-offs of public access.

## 4. Dashboard

Build a useful home dashboard containing:

- Greeting based on the selected display name.
- Today's date.
- Next scheduled gym session.
- Session time and location.
- Attendance status.
- Quick actions to create a session, view the workout plan and update exercise weights.
- Summary of completed sessions this week and this month.
- Recent workout activity.
- Upcoming sessions.
- Unread in-app notifications.

Statistics must count only valid completed sessions. Cancelled, deleted or archived sessions must not appear in ordinary active-session counts.

## 5. Gym session management

Each session should include:
- Unique session ID.
- Creator display name.
- Session date.
- Start time.
- Gym location.
- Optional notes.
- Attendance status for Thông and Thuận.
- Creation and update timestamps.
- Session lifecycle status.
- Cancellation and deletion metadata where applicable.

### Create a session

Provide a form with:
- Date picker.
- Time picker.
- Location.
- Optional notes.

The default location is "CLB Gym Long Phú".

**Default start time:** calculate the current Vietnam local time plus one hour whenever the user opens a new-session form. Round the result to a practical 5-minute increment. The user can edit the date and time before saving.

Do not hard-code the default time at page load or reuse an old default when reopening the form.

The person who creates the session is automatically marked as having confirmed attendance.

The other person's attendance remains pending until they respond.

### Session confirmation

Each participant can:
- Confirm attendance.
- Decline or cancel their attendance, where appropriate.
- View the current attendance status.

Display clear Vietnamese status labels:
- Chờ xác nhận
- Đã xác nhận
- Không tham gia
- Đã hoàn thành
- Đã hủy
- Đã xóa

Opening a notification must never automatically confirm attendance.

### Completing a session

Allow an authorized session operation to mark a session as completed.

Completed sessions should retain their actual date and associated workout records for historical statistics and progress tracking.

### Delete a session

The creator must be able to delete any session they created, whether it is upcoming or completed, without needing the other participant's approval.

Before deleting, show a confirmation dialog:

"Bạn có chắc muốn xóa buổi tập này? Buổi tập sẽ không còn xuất hiện trong lịch và thống kê thông thường."

Buttons:
- Quay lại
- Xác nhận xóa

Use soft deletion or archival rather than physically deleting the record.

After deletion:
- Remove the session from active schedules.
- Exclude it from normal session counts and statistics.
- Preserve its historical record and audit information.
- Record who initiated the deletion and when.
- Notify the other participant through the in-app notification center and attempt push delivery.
- Prevent a deleted session from being accidentally restored by ordinary client actions.

Because the app does not require login, creator identity cannot be securely verified by a selected name alone. Do not falsely claim that this permission system provides strong identity security.

### Cancellation versus deletion

Cancellation and deletion are separate actions.

- Cancellation changes the session's active status and preserves the record.
- Deletion hides the session from ordinary schedules and statistics while retaining its archived record and audit trail.

Do not physically erase session history.

## 6. Push notification system

Implement Web Push using:
- Browser Notification API.
- Service worker.
- Push API subscriptions.
- VAPID public/private key pair.
- Supabase Edge Functions or another secure server-side delivery mechanism.

Store push subscriptions in Supabase. Store the VAPID private key only in server-side secrets.

Provide a button in Settings:

"Bật thông báo"

Explain that the user must grant browser notification permission.

Provide a test-notification option and a clear status for unsupported browsers, denied permissions and failed subscriptions.

### Generic push notifications

**Push notifications must not distinguish between Thông and Thuận.**

Use the same generic title and message for all subscribed devices. Do not personalize push notification text with member names.

For a newly created gym session, use:

Title:
"Long Phú Gym Buddy — Có lịch tập mới!"

Body:
"Có buổi tập gym vào lúc [HH:mm], ngày [dd/MM/yyyy] tại CLB Gym Long Phú. Hãy mở ứng dụng để xem lịch và xác nhận tham gia."

Example:

"Long Phú Gym Buddy — Có lịch tập mới!"

"Có buổi tập gym vào lúc 18:30, ngày 15/10/2026 tại CLB Gym Long Phú. Hãy mở ứng dụng để xem lịch và xác nhận tham gia."

For a cancelled or deleted session, use a similarly generic message, such as:

"Có thay đổi về lịch tập. Hãy mở Long Phú Gym Buddy để xem chi tiết."

### Push delivery behavior

- Send the same generic message to every valid device subscription registered for the app.
- Do not require the push system to identify a device as belonging to Thông or Thuận.
- If both people have subscribed on their devices, both can receive the same notification.
- Deduplicate subscriptions where appropriate.
- Remove expired or invalid subscriptions when the push provider indicates they are no longer valid.
- Handle delivery failures without crashing session creation.
- Never report a successful delivery unless the delivery system confirms the relevant success state.
- If push delivery fails, retain the in-app notification as a fallback.

### Notification click behavior

When the user taps a push notification:
- Open the deployed application.
- Navigate to the relevant session if its ID is available.
- Otherwise, open the schedule page.
- Display the session's date, time, location and attendance status.
- Allow the user to open the session and respond.
- Never automatically confirm attendance.

## 7. In-app notification center

Build a notification center that stores notifications in Supabase.

Each notification should include:
- Notification ID.
- Title.
- Message.
- Related session ID, if applicable.
- Creation timestamp.
- Read/unread status.

Include:
- Unread notification count.
- Mark as read.
- Mark all as read.
- Open related session.

Use generic messages for routine workout notifications. Do not remove participant information from the underlying session itself; only simplify the notification content and push routing.

## 8. Push / Pull / Legs exercise library

Create exactly 30 exercise entries divided into the following categories.

### PUSH — 11 exercises

1. Barbell Bench Press
2. Incline Dumbbell Press
3. Machine Chest Press
4. Cable Fly
5. Pec Deck
6. Seated Shoulder Press
7. Dumbbell Lateral Raise
8. Cable Lateral Raise
9. Face Pull
10. Rope Triceps Pushdown
11. Overhead Triceps Extension

### PULL — 9 exercises

12. Lat Pulldown
13. Assisted Pull-up
14. Seated Cable Row
15. Chest-Supported Row
16. One-Arm Dumbbell Row
17. Straight-Arm Pulldown
18. Barbell Curl
19. Incline Dumbbell Curl
20. Hammer Curl

### LEGS — 10 exercises

21. Barbell Squat
22. Leg Press
23. Romanian Deadlift
24. Leg Extension
25. Lying Leg Curl
26. Seated Leg Curl
27. Standing Calf Raise
28. Seated Calf Raise
29. Hip Thrust
30. Hip Abductor Machine

Store the exercise catalog in the database rather than hard-coding it into individual UI components.

Each exercise should include:
- Exercise ID.
- English name.
- Vietnamese name.
- PPL category.
- Primary muscles.
- Secondary muscles.
- Equipment.
- Difficulty level.
- Exercise image.
- Anatomy or muscle illustration.
- Step-by-step technique.
- Breathing guidance.
- Common mistakes.
- Safety advice.
- Recommended sets and repetitions.
- Progression guidance.
- Tutorial video URL.
- Created and updated timestamps.

Use accurate exercise information. Do not invent YouTube video IDs or pretend that an unverified video has been verified. If a reliable video URL cannot be established, provide a YouTube search link for the exact exercise name instead.

Use properly licensed images or images that the project has permission to display. Do not use fabricated image URLs.

## 9. Exercise cards and detail pages

Create a visually clear exercise library with category filters:
- PUSH
- PULL
- LEGS
- All exercises

Each card should show:
- Exercise image.
- Vietnamese name.
- English name.
- Main muscle group.
- Equipment.
- Current user's recorded working weight, or "Chưa cập nhật".

Clicking a card or its image must open a dedicated exercise detail page.

The detail page should contain:
1. Large exercise image.
2. English and Vietnamese names.
3. Primary and secondary muscles.
4. Anatomy illustration highlighting the muscles involved.
5. Equipment required.
6. Starting position.
7. Detailed execution steps.
8. Breathing instructions.
9. Common mistakes.
10. Safety considerations.
11. Suggested sets and reps.
12. Progression tips.
13. A tutorial video or YouTube search link.
14. The selected user's recorded weights and weight history.

Use a consistent template across all 30 exercise detail pages.

## 10. Exercise weight tracking

Each person has their own exercise records.

Initially, all weights must display:

"Chưa cập nhật"

Never fabricate initial weights or assume that both people lift the same amount.

For each exercise, let the selected person record:
- Working weight.
- Sets.
- Repetitions.
- Optional notes.
- Date.
- Optional perceived difficulty.

Clarify weight conventions:
- Dumbbells: record weight per dumbbell.
- Barbell exercises: record total weight including the bar.
- Machines: record the displayed machine load.
- Bodyweight exercises: record bodyweight separately from added weight; allow assisted exercises to record assistance.

Show the applicable weight convention on each exercise's detail page or entry form.

### Weight history

Keep every saved training entry as historical data.

When the user updates a weight:
- Add a new history entry rather than overwriting earlier entries.
- Show the latest recorded working weight.
- Show historical entries by date.
- Show a progress chart over time.
- Allow corrections to mistaken entries with an audit trail.
- Clearly distinguish between an exercise's latest recorded weight and its historical values.

The current user's records should be the default view. Provide a separate, clearly labeled way to view the other person's progress if the app's shared-data configuration permits it.

## 11. Training log

Create a training log for each completed session.

Users should be able to:
- Open a completed session.
- Select exercises performed.
- Record sets, repetitions and working weights.
- Add notes.
- Save progress.
- Review previous training logs.

Keep historical records linked to their session and exercise IDs.

If a session is cancelled, deleted or archived, do not silently erase its training log. Retain it according to the app's archival policy, and exclude deleted-session data from ordinary active statistics.

## 12. Statistics and progress

Build a statistics page containing:
- Completed sessions this week.
- Completed sessions this month.
- Total completed sessions.
- Workout calendar with exact dates.
- Recent training activity.
- Exercise weight progression charts.
- Exercise-specific history.
- PPL category distribution.

Rules:
- Count only completed, non-deleted sessions in ordinary statistics.
- Do not count upcoming, pending, cancelled or deleted sessions as completed.
- Preserve historical records for auditing.
- Use actual recorded dates; do not fabricate workout dates.
- Clearly label any statistic that is based on incomplete data.

Use charts with date-based axes and readable tooltips.

## 13. Settings

Include:
- Current selected display name.
- Switch between Thông and Thuận.
- Default gym location.
- Push notification permission and subscription status.
- Enable notifications button.
- Test notification button.
- PWA installation instructions when supported.
- App version and basic troubleshooting information.

Changing the selected name changes the local display selection only. Do not claim that it authenticates the user or verifies their identity.

## 14. Database design

Create suitable Supabase tables, including at minimum:

### exercises
Stores the 30 exercise definitions and instructional metadata.

### gym_sessions
Stores session details, creator display name, participant attendance statuses, lifecycle status, timestamps and soft-deletion metadata.

### workout_logs
Stores workout records linked to a session and exercise.

### exercise_weight_history
Stores dated working weights, sets, reps, notes and correction metadata.

### notifications
Stores in-app notification content, related session IDs, timestamps and read status.

### push_subscriptions
Stores browser push endpoint, encryption keys, timestamps and subscription status.

### audit_logs
Stores important actions such as session creation, confirmation, cancellation, completion, deletion and corrections.

Use foreign keys, appropriate indexes, constraints and timestamps.

Store archived or deleted session information without physically erasing its audit history.

Do not place VAPID private keys or Supabase service-role keys in database records accessible to the public client.

## 15. No-login security constraints

This app intentionally has no login, but public access creates security limitations.

- Never expose service-role keys or server secrets.
- Do not disable Row Level Security globally.
- Do not treat localStorage member selection as verified identity.
- Validate all incoming data on the server for operations performed through Edge Functions.
- Avoid trusting a client-provided creator name as proof of ownership.
- Avoid allowing arbitrary clients to change audit history.
- Clearly document which operations are publicly accessible.
- Use the least-privilege design that is practical for this no-login use case.
- If a secure creator-only deletion guarantee is impossible without authentication, disclose that limitation instead of falsely claiming the permission is secure.

The app can provide a convenient two-person workflow without login, but it cannot securely distinguish the real Thông from the real Thuận based only on a name stored in the browser.

## 16. Responsive behavior and accessibility

Ensure that:
- The app works on mobile phones, tablets and desktops.
- Forms are usable on small screens.
- Buttons have clear labels and adequate touch targets.
- Dialogs can be dismissed safely.
- Important statuses do not rely on color alone.
- Empty states explain how to get started.
- Errors provide actionable Vietnamese messages.
- Dates and times consistently use Vietnam time.
- Network failures do not silently discard saved data.

## 17. PWA setup

Configure:
- Web app manifest.
- App name: Long Phú Gym Buddy.
- Suitable app icons.
- Theme color.
- Service worker.
- Offline fallback page where practical.
- Installability on supported browsers.
- Web Push support over HTTPS.

Explain that users may need to install the PWA or grant notification permission depending on their browser and operating system. Do not promise that every browser can deliver notifications under every condition.

## 18. Seed data and initial state

Seed exactly the 30 exercises listed above.

Do not seed fake:
- Gym sessions.
- Completed workout records.
- Exercise weights.
- Attendance confirmations.
- Notification delivery results.

Initialize exercise weights as "Chưa cập nhật" until real records are entered.

Set the default gym location to "CLB Gym Long Phú".

## 19. Acceptance tests

Before considering the application complete, verify:

1. A first-time visitor can select Thông or Thuận without logging in.
2. The selected name persists on the same browser.
3. The user can switch names in Settings.
4. A new session defaults to Vietnam local time plus one hour, rounded to a practical 5-minute increment.
5. The session creator is automatically confirmed.
6. The other participant can confirm or decline.
7. The creator can delete their upcoming or completed session after a confirmation dialog.
8. Deletion is soft deletion and retains an audit trail.
9. Deleted sessions disappear from normal schedules and statistics.
10. Completed-session statistics exclude cancelled and deleted sessions.
11. All 30 exercises appear in the correct PPL categories.
12. Clicking an exercise card or image opens its detail page.
13. Weight entries are initially empty and never fabricated.
14. New weight entries preserve historical data.
15. Push notification content is generic and does not mention Thông or Thuận.
16. Every valid subscribed device receives the same generic push message when a new session is created, subject to browser and push-service availability.
17. Clicking a push notification opens the app or relevant session without automatically confirming attendance.
18. Push delivery failure does not prevent the session from being saved.
19. In-app notifications remain available as a fallback.
20. Database secrets remain server-side and RLS is not globally disabled.
21. The application is responsive and deployable through Lovable.

Implement the application end-to-end. Do not stop at static mockups. Run available checks, fix errors, and provide a concise summary of completed features, deployment steps and any manual configuration still required.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gym-one-day-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cbe586ac-6f1c-40a5-9728-bbe1a4e1d552).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
