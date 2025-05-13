import { Title } from "@/components/typography";
import AlbumGrid from "./AlbumGrid";
import CreateAlbumButton from "./CreateAlbumButton";

export default function AlbumsPage() {
  return (
    <div className="grid grid-cols-1 gap-8 grid-rows-[auto_1fr]">
      <header className="flex items-center justify-between p-8">
        <Title>Albums</Title>

        <CreateAlbumButton />
      </header>

      <AlbumGrid />
    </div>
  );
}
