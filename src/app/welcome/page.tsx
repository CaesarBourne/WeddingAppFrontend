import Link from "next/link";
import { Image as ImageIcon, Lock, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AvatarUpload } from "@/components/auth/AvatarUpload";
import { getFoodOrderingEnabledAction } from "@/lib/actions/food";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function WelcomePage() {
  const user = await requireUser();
  const orderingEnabled = await getFoodOrderingEnabledAction();

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {env.NEXT_PUBLIC_WEDDING_DATE} · {env.NEXT_PUBLIC_COUPLE_NAMES}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <AvatarUpload userId={user.id} />

          <div>
            <h1 className="font-serif-display text-3xl">
              Welcome,
              <br />
              <span className="text-primary">{user.name ?? "Guest"}</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              You&apos;re cordially invites to the traditional wedding ceremony.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3">
            {orderingEnabled ? (
              <Button
                nativeButton={false}
                render={
                  <Link href="/food">
                    <UtensilsCrossed />
                    Choose Your Meal
                  </Link>
                }
              />
            ) : (
              <Button disabled title="Meal selection opens on the wedding day.">
                <Lock />
                Choose Your Meal
              </Button>
            )}
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              nativeButton={false}
              render={
                <Link href="/moments">
                  <ImageIcon />
                  View Gallery
                </Link>
              }
            />

            {user.buttonEnabled ? (
              <Button
                variant="secondary"
                nativeButton={false}
                render={
                  <Link href="/moments?myAlbum=true">
                    <ImageIcon />
                    My Photos
                  </Link>
                }
              />
            ) : (
              <Button variant="secondary" disabled title="Coming soon — stay tuned!">
                <Lock />
                Coming Soon
              </Button>
            )}
          </div>

          {!user.buttonEnabled && (
            <p className="text-xs text-muted-foreground">
              Thank you 
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
