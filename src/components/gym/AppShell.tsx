import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, Dumbbell, Home, LineChart, Settings, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MEMBER_NAME, MEMBERS } from "@/lib/domain";
import { useMemberState } from "@/lib/member-context";
import { notificationsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Tổng quan", icon: Home },
  { to: "/lich-tap", label: "Lịch tập", icon: CalendarDays },
  { to: "/bai-tap", label: "Bài tập", icon: Dumbbell },
  { to: "/tien-do", label: "Tiến độ", icon: LineChart },
  { to: "/cai-dat", label: "Cài đặt", icon: Settings },
];

function useUnread() {
  const { data } = useQuery(notificationsQuery);
  return data?.filter((n) => !n.read_at).length ?? 0;
}

function Welcome() {
  const { setMember } = useMemberState();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <img src="/icon-192.png" alt="" width={96} height={96} className="rounded-2xl" />
      <div>
        <p className="text-sm uppercase tracking-widest text-primary">CLB Gym Long Phú</p>
        <h1 className="mt-2 text-4xl font-bold uppercase">Ai đang sử dụng Long Phú Gym Buddy?</h1>
      </div>
      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        {MEMBERS.map((m) => (
          <Button key={m} size="lg" className="h-20 text-2xl font-display font-bold" onClick={() => setMember(m)}>
            {MEMBER_NAME[m]}
          </Button>
        ))}
      </div>
      <p className="max-w-sm text-xs text-muted-foreground">
        Không cần đăng nhập. Lựa chọn được lưu trên trình duyệt này và có thể đổi trong Cài đặt.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { member, ready } = useMemberState();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = useUnread();
  if (!ready) return <div className="min-h-screen" />;
  if (!member) return <Welcome />;
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile Top Bar with Logo & Notifications */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-display text-base font-bold uppercase tracking-wide">
            Long Phú Gym
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {MEMBER_NAME[member]}
          </span>
          <Link
            to="/thong-bao"
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              path === "/thong-bao" ? "border-primary bg-primary/20 text-primary" : "bg-card text-foreground hover:bg-muted"
            )}
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                {unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={36} height={36} className="rounded-lg" />
          <span className="font-display text-xl font-bold uppercase leading-tight">
            Long Phú<br />Gym Buddy
          </span>
        </Link>

        {/* Dedicated Desktop Notifications Quick Access */}
        <Link
          to="/thong-bao"
          className={cn(
            "mb-4 flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
            path === "/thong-bao" && "border-primary bg-primary/10 text-primary font-semibold"
          )}
        >
          <span className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-primary" />
            <span>Thông báo</span>
          </span>
          {unread > 0 ? (
            <span className="rounded-full bg-destructive px-1.5 py-0.2 text-[11px] font-bold text-destructive-foreground">
              {unread}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">0</span>
          )}
        </Link>

        {/* Main Clean 5-Item Navigation */}
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active(n.to) ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              <n.icon className="h-4 w-4" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4 text-xs text-muted-foreground">
          Đang dùng: <b className="text-foreground">{MEMBER_NAME[member]}</b>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-6">{children}</main>

      {/* Streamlined Mobile Bottom Navigation (5 items) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-sidebar/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px]",
              active(n.to) ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <n.icon className="h-5 w-5" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
