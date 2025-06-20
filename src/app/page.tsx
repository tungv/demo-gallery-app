import { Subtitle, Title } from "@/components/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<Title>Gallery App</Title>
			<Subtitle>Welcome to the Gallery App</Subtitle>

			<Button asChild>
				<Link href="/creator/upload">Upload</Link>
			</Button>
		</div>
	);
}
