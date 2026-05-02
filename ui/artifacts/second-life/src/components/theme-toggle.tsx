import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-full text-foreground hover:bg-primary/10",
            className,
          )}
          aria-label="Giao diện"
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Chọn giao diện sáng, tối hoặc theo hệ thống</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4" />
          Sáng
          {theme === "light" ? <span className="ml-auto text-xs text-muted-foreground">•</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4" />
          Tối
          {theme === "dark" ? <span className="ml-auto text-xs text-muted-foreground">•</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4" />
          Theo hệ thống
          {theme === "system" ? <span className="ml-auto text-xs text-muted-foreground">•</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
