"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

type ComboboxItemData = { value: string; label: string; meta?: string }

function SearchableComboboxRoot({
  children,
  ...props
}: Combobox.Root.Props<ComboboxItemData, false>) {
  return (
    <Combobox.Root
      autoHighlight={false}
      highlightItemOnHover
      {...props}
    >
      {children}
    </Combobox.Root>
  )
}

function SearchableComboboxInput({
  className,
  ...props
}: Combobox.Input.Props) {
  return (
    <Combobox.Input
      data-slot="searchable-combobox-input"
      className={cn(
        "h-10 flex-1 bg-transparent px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function SearchableComboboxTrigger({
  className,
  ...props
}: Combobox.Trigger.Props) {
  return (
    <Combobox.Trigger
      data-slot="searchable-combobox-trigger"
      className={cn(
        "mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-[#eef4f8] hover:text-foreground",
        className
      )}
      {...props}
    >
      <Combobox.Icon
        render={<ChevronDownIcon className="size-4" />}
      />
    </Combobox.Trigger>
  )
}

function SearchableComboboxPopup({
  className,
  ...props
}: Combobox.Popup.Props) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner className="isolate z-50">
        <Combobox.Popup
          data-slot="searchable-combobox-popup"
          className={cn(
            "relative isolate z-50 max-h-60 min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </Combobox.Positioner>
    </Combobox.Portal>
  )
}

function SearchableComboboxEmpty({
  className,
  ...props
}: Combobox.Empty.Props) {
  return (
    <Combobox.Empty
      data-slot="searchable-combobox-empty"
      className={cn("px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function SearchableComboboxItem({
  className,
  children,
  ...props
}: Combobox.Item.Props) {
  return (
    <Combobox.Item
      data-slot="searchable-combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-3 text-sm outline-hidden select-none focus:bg-[#eef4f8] focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Combobox.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
            <CheckIcon className="size-4 text-[#093657]" />
          </span>
        }
      />
      {children}
    </Combobox.Item>
  )
}

export {
  SearchableComboboxRoot,
  SearchableComboboxInput,
  SearchableComboboxTrigger,
  SearchableComboboxPopup,
  SearchableComboboxEmpty,
  SearchableComboboxItem,
  type ComboboxItemData,
}
