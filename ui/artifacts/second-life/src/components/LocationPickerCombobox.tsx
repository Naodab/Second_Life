"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  const [resetKey, setResetKey] = React.useState(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [contentWidth, setContentWidth] = React.useState<number>()

  const selected = value ? items.find((i) => i.code === value) : undefined

  const handleOpenChange = (next: boolean) => {
    if (disabled) return
    setOpen(next)
    if (next) {
      setResetKey((k) => k + 1)
      requestAnimationFrame(() => {
        const w = triggerRef.current?.offsetWidth
        if (w) setContentWidth(w)
      })
    }
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-gray-50 border-transparent",
            className
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !value && "text-muted-foreground"
            )}
          >
            {value ? (selected?.fullName ?? value) : allLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        sideOffset={4}
        style={
          contentWidth
            ? { width: contentWidth }
            : { minWidth: "min(18rem, calc(100vw - 2rem))" }
        }
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command key={resetKey} shouldFilter={true}>
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
                    value ? "opacity-0" : "opacity-100"
                  )}
                />
                {allLabel}
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.code} ${item.fullName} ${item.name ?? ""} ${item.codeName ?? ""}`}
                  onSelect={() => {
                    onValueChange(item.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.fullName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
