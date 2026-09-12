import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Info, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type AppNotification } from "@/lib/notifications";

function Icon({ kind }: { kind: AppNotification["kind"] }) {
  if (kind === "outreach") return <PhoneCall className="h-4 w-4" />;
  if (kind === "recall") return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function NotificationBell() {
  const { notifications, read, unreadCount, markRead, markAllRead } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-96 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread of {notifications.length}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
        <Separator className="shrink-0" />
        <div
          role="region"
          aria-label="Notification list"
          tabIndex={0}
          className="min-h-0 max-h-96 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <ul className="divide-y">
            {notifications.map((n) => {
              const isRead = read.includes(n.id);
              return (
                <li key={n.id}>
                  <Link
                    to={n.href}
                    onClick={() => markRead(n.id)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <span
                      className={
                        n.severity === "critical"
                          ? "mt-0.5 text-destructive"
                          : n.severity === "warning"
                            ? "mt-0.5 text-amber-600"
                            : "mt-0.5 text-muted-foreground"
                      }
                    >
                      <Icon kind={n.kind} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={`break-words text-sm ${isRead ? "font-normal text-muted-foreground" : "font-medium"}`}
                        >
                          {n.title}
                        </span>
                        {!isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {n.timestamp}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {notifications.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications right now.
              </li>
            )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
