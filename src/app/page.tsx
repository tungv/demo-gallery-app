import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <ShoppingCart className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Forget Me Note
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          The collaborative shopping list that remembers so you don't have to.
          Share lists with family and friends, organize by shops, and never forget an item again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <h3 className="font-semibold">Collaborate</h3>
            <p className="text-sm text-muted-foreground">
              Share shopping lists with family members and coordinate who buys what.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Organize</h3>
            <p className="text-sm text-muted-foreground">
              Tag items by shop to make your shopping trips more efficient.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Remember</h3>
            <p className="text-sm text-muted-foreground">
              Add notes to items and mark what needs to be bought today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
