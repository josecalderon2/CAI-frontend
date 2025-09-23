"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./ultils";

// Interface para las props con mejor tipado
interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  // Props específicas del componente si las hubiera
}

// Constantes para clases reutilizables
const LABEL_BASE_CLASSES = [
  "flex items-center gap-2 text-sm leading-none font-medium select-none",
  "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
] as const;

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    data-slot="label"
    className={cn(LABEL_BASE_CLASSES, className)}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName || "Label";

export { Label };