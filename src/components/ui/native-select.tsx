import * as React from "react"

import { cn } from "@/lib/utils"

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors outline-none focus:border-[#093657] focus:ring-2 focus:ring-[#093657]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
