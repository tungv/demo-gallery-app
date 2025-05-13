export default function AlbumGrid() {
  return (
    <div className="grid grid-cols-2 gap-8 p-8 w-fit">
      <AlbumCard />
      <AlbumCard />
      <AlbumCard />
      <AlbumCard />
    </div>
  );
}

function AlbumCard() {
  return (
    <div className="aspect-square size-72 rounded-lg bg-gray-100">&nbsp;</div>
  );
}
