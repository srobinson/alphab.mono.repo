import { Button } from "@/components/ui/button";
import CommandDialog from "@/components/CommandDialog";
import Kbd from "@/components/ui/kbd";
import { Command, ArrowBigUp } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { GithubIcon } from "@/components/icons/GitHub";

export const DesignPreview = () => {
  return (
    <>
      <div className="absolute top-0 left-0 w-full ">
        <div className="p-10 flex flex-row gap-4">
          <CommandDialog />
          <Button>
            <Kbd>
              <Command className="w-3 h-3" />
              <ArrowBigUp className="w-3.5 h-3.5" />P
            </Kbd>
          </Button>
          <LinkButton href="https://github.com/zed-gallery">
            <Kbd>
              <ArrowBigUp className="w-3.5 h-3.5" />
              <span>P</span>
            </Kbd>
          </LinkButton>
          <LinkButton href="https://github.com/zed-gallery">
            <Kbd>
              <ArrowBigUp className="w-3.5 h-3.5" />
              <span>P</span>
            </Kbd>
          </LinkButton>
          <LinkButton href="https://github.com/zed-gallery">
            <Kbd>
              <ArrowBigUp className="w-3.5 h-3.5" />
              <span>P</span>
            </Kbd>
          </LinkButton>
        </div>
      </div>
    </>
  );
};
