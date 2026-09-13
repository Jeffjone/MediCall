import logoAsset from "@/assets/medicall-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="MediCall logo"
      className={cn("h-9 w-9 shrink-0 object-contain", className)}
    />
  );
}
