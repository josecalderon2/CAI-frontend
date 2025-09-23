'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../ui/ultils';

const Avatar = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn(
      'relative flex size-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
);

const AvatarImage = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn('aspect-square size-full', className)}
    {...props}
  />
);

const AvatarFallback = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn(
      'flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground',
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback };
