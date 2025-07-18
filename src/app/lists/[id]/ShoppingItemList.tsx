"use client";

import { Check, ShoppingCart, Store, StickyNote, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/lib/types";
import { toggleItemStatusAction, markItemBoughtAction } from "./actions";

interface ShoppingItemListProps {
  items: ShoppingItem[];
  listId: string;
}

export default function ShoppingItemList({ items, listId }: ShoppingItemListProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
        <p>No items in this list yet.</p>
      </div>
    );
  }

  const toBuyTodayItems = items.filter(item => item.status === 'to_buy_today');
  const activeItems = items.filter(item => item.status === 'active');

  return (
    <div className="divide-y dark:divide-zinc-700">
      {toBuyTodayItems.length > 0 && (
        <>
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20">
            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              To Buy Today
            </h3>
          </div>
          {toBuyTodayItems.map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
        </>
      )}

      {activeItems.length > 0 && (
        <>
          {toBuyTodayItems.length > 0 && (
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800">
              <h3 className="text-sm font-medium text-muted-foreground">
                Other Items
              </h3>
            </div>
          )}
          {activeItems.map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
        </>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: ShoppingItem }) {
  const isToBuyToday = item.status === 'to_buy_today';

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        isToBuyToday && "bg-amber-50/50 dark:bg-amber-900/10"
      )}
    >
      <form action={markItemBoughtAction}>
        <input type="hidden" name="itemId" value={item.id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Mark as bought"
        >
          <Check className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            isToBuyToday && "text-amber-900 dark:text-amber-100"
          )}>
            {item.name}
          </span>
          {item.shop_tag && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
              <Store className="h-3 w-3" />
              {item.shop_tag}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-sm text-muted-foreground flex items-start gap-1">
            <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
            {item.notes}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Added by {item.createdByName}</span>
          {item.marked_by_user_id && (
            <span>• Marked by {item.markedByName}</span>
          )}
        </div>
      </div>

      <form action={toggleItemStatusAction}>
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="currentStatus" value={item.status} />
        <Button
          type="submit"
          variant={isToBuyToday ? "default" : "outline"}
          size="sm"
        >
          {isToBuyToday ? "Unmark" : "Buy Today"}
        </Button>
      </form>
    </div>
  );
}