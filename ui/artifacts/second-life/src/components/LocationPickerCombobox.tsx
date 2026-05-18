"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type LocationPickerItem = {
  id: string
  code: string
  fullName: string
  name?: string
  codeName?: string
}

type LocationPickerComboboxProps = {
  items: LocationPickerItem[]
  value: string | undefined
  onValueChange: (code: string | undefined) => void
  allLabel: string
  searchPlaceholder: string
  emptySearchText?: string
  disabled?: boolean
  className?: string
}

export function LocationPickerCombobox({
  items,
  value,
  onValueChange,
  allLabel,
  searchPlaceholder,
  emptySearchText = "Không tìm thấy.",
  disabled = false,
  className,
}: LocationPickerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const [contentWidth, setContentWidth] = React.useState<number>()

  const valueKey = value?.trim() ?? ""
  const selected =
    valueKey.length > 0
      ? items.find(
        (i) =>
          String(i.code ?? "").trim() === valueKey ||
          String(i.id ?? "").trim() === valueKey,
      )
      : undefined

  const handleOpenChange = (next: boolean) => {
    if (disabled) return
    setOpen(next)
    if (next) {
      requestAnimationFrame(() => {
        const w = triggerRef.current?.offsetWidth
        if (w) setContentWidth(w)
      })
    }
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "w-full justify-between gap-2 border-transparent bg-muted/60 font-normal text-foreground hover:bg-muted/80 dark:bg-card dark:hover:bg-muted/50",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !value && "text-muted-foreground",
          )}
        >
          {value ? (selected?.fullName ?? value) : allLabel}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border-border bg-popover text-popover-foreground"
        align="start"
        sideOffset={4}
        style={
          contentWidth != null && contentWidth > 0
            ? { width: contentWidth }
            : { minWidth: "min(18rem, calc(100vw - 2rem))" }
        }
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={true}>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptySearchText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={`__all__ ${allLabel}`}
                onSelect={() => {
                  onValueChange(undefined)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value ? "opacity-0" : "opacity-100",
                  )}
                />
                {allLabel}
              </CommandItem>
              {items.map((item) => {
                const selectedRow =
                  valueKey.length > 0 &&
                  (String(item.code ?? "").trim() === valueKey ||
                    String(item.id ?? "").trim() === valueKey)
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.code} ${item.id} ${item.fullName} ${item.name ?? ""} ${item.codeName ?? ""}`}
                    onSelect={() => {
                      onValueChange(item.code)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedRow ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {item.fullName}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
