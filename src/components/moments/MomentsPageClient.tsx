"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { MomentsGallery } from "@/components/moments/MomentsGallery";
import { GroupedGallery } from "@/components/moments/GroupedGallery";
import { UploadModal } from "@/components/moments/UploadModal";
import { cn } from "@/lib/utils";
import type { PagedPhotos, PhotoDto, AuthUser } from "@/lib/types";

type Tab = "all" | "byGuest";

interface Props {
  readonly initial: PagedPhotos | null;
  readonly user: AuthUser | null;
}

export function MomentsPageClient({ initial, user }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [groupedPhotos, setGroupedPhotos] = useState<PhotoDto[] | null>(null);
  const [loadingGrouped, setLoadingGrouped] = useState(false);

  async function switchToGrouped() {
    setTab("byGuest");
    if (groupedPhotos !== null) return; // already loaded

    setLoadingGrouped(true);
    try {
      const res = await fetch("/api/moments/photos?page=1&pageSize=100");
      if (!res.ok) throw new Error("Could not load photos.");
      const data = (await res.json()) as PagedPhotos;
      setGroupedPhotos(data.data);
    } catch {
      toast.error("Could not load grouped photos.");
      setGroupedPhotos([]);
    } finally {
      setLoadingGrouped(false);
    }
  }

  const totalCount = initial?.meta.total ?? 0;

  return (
    <>
      {/* Upload / sign-in row */}
      <div className="flex justify-center">
        {user ? (
          <UploadModal />
        ) : (
          <p className="text-sm text-muted-foreground">
            Invited guest?{" "}
            <Link href="/login" className="text-gold underline underline-offset-4">
              Sign in
            </Link>{" "}
            to add your photos.
          </p>
        )}
      </div>

      {/* Tab switcher */}
      <div className="mt-6 flex items-center justify-between gap-4 border-b pb-4">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "photograph" : "photographs"}
        </p>
        <div className="flex gap-1 rounded-full border bg-muted/40 p-1">
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            <LayoutGrid className="size-3.5" /> All
          </TabButton>
          <TabButton active={tab === "byGuest"} onClick={() => void switchToGrouped()}>
            <Users className="size-3.5" /> By Guest
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === "all" ? (
          initial ? (
            <MomentsGallery initial={initial} />
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              No memories yet — be the first to share one.
            </p>
          )
        ) : loadingGrouped ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GroupedGallery photos={groupedPhotos ?? []} />
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
