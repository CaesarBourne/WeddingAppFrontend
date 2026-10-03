import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NumberSeatsButton } from "@/components/admin/NumberSeatsButton";
import { SeatGroupMemberRow } from "@/components/admin/SeatGroupMemberRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import { requireAdmin } from "@/lib/auth";
import type { SeatGroupDto, UserDto } from "@/lib/types";

const MAX_GUESTS_PER_SEAT_GROUP = 7;

/** Seated guests first in natural order ("2" before "10"), unseated guests last. */
function bySeatNumber(a: UserDto, b: UserDto) {
  if (!a.seatNumber) return b.seatNumber ? 1 : 0;
  if (!b.seatNumber) return -1;
  return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true });
}

export default async function SeatGroupsListPage() {
  await requireAdmin();

  const [usersRes, seatGroupsRes] = await Promise.all([
    apiFetch("/users"),
    apiFetch("/users/seat-groups"),
  ]);

  const users: UserDto[] = usersRes.ok ? await usersRes.json() : [];
  const seatGroups: SeatGroupDto[] = seatGroupsRes.ok ? await seatGroupsRes.json() : [];
  const guests = users.filter((u) => u.role === "guest");

  const guestsByGroup = new Map<string, UserDto[]>();
  const unassigned: UserDto[] = [];
  for (const g of guests) {
    if (g.seatGroup) {
      const list = guestsByGroup.get(g.seatGroup.id) ?? [];
      list.push(g);
      guestsByGroup.set(g.seatGroup.id, list);
    } else {
      unassigned.push(g);
    }
  }

  // Each group's suggested starting seat continues on from the attending guests in the groups above it.
  let nextSeat = 1;
  const groupRows = seatGroups.map((group) => {
    const members = [...(guestsByGroup.get(group.id) ?? [])].sort(bySeatNumber);
    const attendingIds = members.filter((m) => !m.unavailable).map((m) => m.id);
    const defaultStart = nextSeat;
    nextSeat += attendingIds.length;
    return { group, members, attendingIds, defaultStart };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b p-4">
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/admin">
              <ArrowLeft /> Guest list
            </Link>
          }
        />
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Seat Groups
        </span>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        {seatGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No seat groups yet — create one from the guest list.
          </p>
        ) : (
          groupRows.map(({ group, members, attendingIds, defaultStart }) => {
            const isFull = members.length >= MAX_GUESTS_PER_SEAT_GROUP;
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      {group.name}
                    </span>
                    <Badge variant={isFull ? "default" : "secondary"}>
                      {members.length}/{MAX_GUESTS_PER_SEAT_GROUP}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No guests assigned yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <ul className="flex flex-col gap-2">
                        {members.map((m) => (
                          <SeatGroupMemberRow key={m.id} member={m} />
                        ))}
                      </ul>
                      <NumberSeatsButton
                        groupName={group.name}
                        guestIds={attendingIds}
                        defaultStart={defaultStart}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {unassigned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Not in a seat group ({unassigned.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {unassigned.map((m) => (
                  <li key={m.id} className="text-sm font-medium">
                    {m.name || "—"}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
