import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="h-dvh grid grid-cols-1 gap-8 p-8 place-items-center w-dvw">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <Button asChild>
          <Link href="/demo/login">Logout</Link>
        </Button>
      </div>
    </div>
  );
}
