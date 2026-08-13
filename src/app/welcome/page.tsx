import Link from "next/link";
import { Home, Image as ImageIcon, Lock, UtensilsCrossed } from "lucide-react";
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
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            {env.NEXT_PUBLIC_WEDDING_DATE} · {env.NEXT_PUBLIC_COUPLE_NAMES}
          </Link>
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
              You&apos;re cordially invited to the traditional wedding ceremony of Funmi and Emmanuel.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3">
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/">
                  <Home />
                  Dashboard
                </Link>
              }
            />
          </div>

          {!user.photosBlocked && (
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
            </div>
          )}

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
        </CardContent>
      </Card>
    </main>
  );
}
