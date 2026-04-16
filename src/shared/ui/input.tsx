import * as React from 'react'

import { cn } from '../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        className={cn(
          [
            'flex h-12 w-full rounded-2xl border border-input/70 bg-background/90 px-4 py-3 text-sm',
            'shadow-[0_12px_28px_rgba(17,24,39,0.06)] transition-colors duration-200',
            'placeholder:text-muted-foreground/70',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' '),
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
