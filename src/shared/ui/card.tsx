import * as React from 'react'

import { cn } from '../lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        'rounded-[26px] border border-border/70 bg-card/88 text-card-foreground shadow-[0_20px_60px_rgba(17,24,39,0.08)] backdrop-blur-xl',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)

Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} ref={ref} {...props} />
  ),
)

CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      ref={ref}
      {...props}
    />
  ),
)

CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p className={cn('text-sm leading-6 text-muted-foreground', className)} ref={ref} {...props} />
))

CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />,
)

CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('flex items-center p-6 pt-0', className)} ref={ref} {...props} />
  ),
)

CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
