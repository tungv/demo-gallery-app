import { Button } from "@/components/ui/button";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import {
  AlbumCardRoot,
  EditMode,
  ModeToggleButton,
  ViewMode,
} from "./AlbumCard.ui";
import { Input } from "@/components/ui/input";

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
    <AlbumCardRoot>
      <article className="place-self-center text-lg font-bold text-muted-foreground">
        thumbnail
      </article>
      <footer className="flex items-center gap-2 flex-row justify-between p-2 bg-muted">
        <ViewMode className="contents">
          <span>Untitled Album 1</span>
          <Button variant="outline" asChild>
            <ModeToggleButton>
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </ModeToggleButton>
          </Button>
        </ViewMode>

        <EditMode className="contents">
          <Input
            autoFocus
            placeholder="Album title"
            defaultValue="Untitled Album 1"
          />
          <Button variant="outline" asChild>
            <ModeToggleButton>
              <CheckIcon className="size-4" />
              <span className="sr-only">Save</span>
            </ModeToggleButton>
          </Button>
          <Button variant="outline" asChild>
            <ModeToggleButton>
              <XIcon className="size-4" />
              <span className="sr-only">Cancel</span>
            </ModeToggleButton>
          </Button>
        </EditMode>
      </footer>
    </AlbumCardRoot>
  );
}
