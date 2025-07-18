import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { getListDetails, getListItems, getListShops } from "./queries";
import ShoppingItemList from "./ShoppingItemList";
import AddItemForm from "./AddItemForm";
import InviteMemberDialog from "./InviteMemberDialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShoppingListPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth().catch(() => redirect("/login"));
  
  const [list, items, shops] = await Promise.all([
    getListDetails(id, user.id),
    getListItems(id),
    getListShops(id),
  ]);

  if (!list) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center">
                <ShoppingCart className="h-6 w-6 text-primary mr-2" />
                <h1 className="text-xl font-semibold">{list.name}</h1>
              </div>
            </div>
            {list.isAdmin && (
              <InviteMemberDialog listId={id} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Add Item</h2>
              <AddItemForm listId={id} shops={shops} />
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-zinc-700">
                <h2 className="text-lg font-semibold">Shopping Items</h2>
              </div>
              <ShoppingItemList items={items} listId={id} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members ({list.memberCount})
              </h3>
              <ul className="space-y-2">
                {list.members.map((member) => (
                  <li key={member.userId} className="flex items-center justify-between">
                    <span className="text-sm">{member.name}</span>
                    {member.isAdmin && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Buy Today</span>
                  <span className="font-medium">
                    {items.filter(item => item.status === 'to_buy_today').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium">
                    {items.filter(item => item.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}