import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { getUserLists } from "./queries";
import { logoutAction, createListAction } from "./actions";
import CreateListDialog from "./CreateListDialog";

export default async function DashboardPage() {
  const user = await requireAuth().catch(() => redirect("/login"));
  const lists = await getUserLists(user.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-semibold">Forget Me Note</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name}
              </span>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Shopping Lists</h2>
          <CreateListDialog />
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              No shopping lists
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new shopping list.
            </p>
            <div className="mt-6">
              <CreateListDialog />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="block"
              >
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-md transition-shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">{list.name}</h3>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{list.itemCount} items</span>
                    <span>{list.memberCount} members</span>
                  </div>
                  {list.isAdmin && (
                    <span className="inline-block mt-3 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}