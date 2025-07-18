import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getInvitationDetails, acceptInvitationAction } from "./actions";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinInvitationPage({ params }: PageProps) {
  const { code } = await params;
  const user = await getCurrentUser();
  
  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/login?returnTo=/join/${code}`);
  }

  const invitation = await getInvitationDetails(code);

  if (!invitation) {
    notFound();
  }

  // Check if user is already a member
  if (invitation.isAlreadyMember) {
    redirect(`/lists/${invitation.listId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <ShoppingCart className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight">Join Shopping List</h2>
          <p className="text-muted-foreground mt-2">
            You've been invited to join a shopping list
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6 space-y-4">
            <h3 className="text-xl font-semibold">{invitation.listName}</h3>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{invitation.memberCount} members</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Invited by {invitation.invitedByName}
            </p>
          </div>

          <form action={acceptInvitationAction}>
            <input type="hidden" name="code" value={code} />
            <Button className="w-full" size="lg">
              Accept Invitation
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            By joining, you'll be able to view and add items to this shopping list.
          </p>
        </div>
      </div>
    </div>
  );
}