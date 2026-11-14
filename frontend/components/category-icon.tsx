import {
  BookOpen,
  HeartHandshake,
  Laptop,
  Rocket,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

const icons: Record<string, LucideIcon> = {
  BookOpen,
  HeartHandshake,
  Laptop,
  Rocket,
  Wallet,
};

export function CategoryIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = (name && icons[name]) || BookOpen;
  return <Icon className={cn("h-5 w-5", className)} />;
}
