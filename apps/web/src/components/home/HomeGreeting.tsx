import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Bell, Flame, ScanLine } from "lucide-react";
import { Egg } from "@/components/pet/Egg";
import { Pet } from "@/components/pet/Pet";
import type { PetSpeciesId } from "@/components/pet/species";
import { buttonVariants } from "@/components/ui/button";
import { CountBadge } from "@/components/common/CountBadge";
import { useUnreadNotifications } from "@/api/notifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";
import { NotificationsSheet } from "@/components/notifications/NotificationsSheet";
import { ScanDialog } from "@/components/scan/ScanDialog";

type Props = {
  name: string | null;
  species: PetSpeciesId | null;
  streak: number;
  onPetTap: () => void;
  now: Date;
};

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return "home.greeting.morning";
  if (hour >= 12 && hour < 17) return "home.greeting.afternoon";
  if (hour >= 17 && hour < 21) return "home.greeting.evening";
  return "home.greeting.night";
}

// Top of Home: my pet (always moving, tap to play), a greeting, the streak, the QR scanner (#82) and notifications.
// Scrolled past it, a slim bar stays on top with the name, streak and bell (#75). The bell opens a bottom sheet.
export function HomeGreeting({ name, species, streak, onPetTap, now }: Props) {
  const { t } = useTranslation();
  const unread = useUnreadNotifications();
  const [sheet, setSheet] = useState(false);
  const [scan, setScan] = useState(false);
  const [compact, setCompact] = useState(false);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-40px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bell = (
    <button
      type="button"
      onClick={() => setSheet(true)}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
      )}
      aria-label={
        unread > 0
          ? `${t("common.notifications")} (${unread} ${t("notifications.unread")})`
          : t("common.notifications")
      }
    >
      <Bell />
      <CountBadge count={unread} className="top-1.5 right-1" />
    </button>
  );
  const scanButton = (
    <button
      type="button"
      onClick={() => setScan(true)}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
      aria-label={t("scan.open")}
    >
      <ScanLine />
    </button>
  );
  const streakBadge = streak >= 2 && (
    <span title={t("home.streakHint")}>
      <Badge tone="warning" icon={Flame}>
        {t("home.streak", { count: streak })}
      </Badge>
    </span>
  );

  return (
    <>
      <div
        aria-hidden={!compact}
        inert={!compact}
        className={cn(
          "fixed inset-x-0 top-0 z-20 mx-auto flex max-w-md items-center gap-2 border-b bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur transition-[translate,opacity] duration-300 ease-out",
          compact
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <p className="min-w-0 flex-1 truncate py-3 text-base font-medium">
          {name ?? " "}
        </p>
        {streakBadge}
        {scanButton}
        {bell}
      </div>
      <NotificationsSheet open={sheet} onOpenChange={setSheet} />
      <ScanDialog open={scan} onOpenChange={setScan} />
      <header
        ref={header}
        className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
      >
        {species ? (
          <Pet
            species={species}
            size={88}
            onTap={onPetTap}
            className="shrink-0"
          />
        ) : (
          <Link
            to="/welcome?step=egg"
            aria-label={t("pet.hatchNow")}
            className="shrink-0"
          >
            <Egg style="mystery" className="h-14" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {t(greetingKey(now.getHours()))}
          </p>
          <h1 className="truncate text-xl font-medium">{name ?? " "}</h1>
        </div>
        {streakBadge}
        {scanButton}
        {bell}
      </header>
    </>
  );
}
