import * as React from "react";
import { cn } from "./ultils";

// Constantes para clases CSS reutilizables
const INPUT_BASE_CLASSES = [
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
  "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base",
  "bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0",
  "file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
] as const;

const INPUT_FOCUS_CLASSES = [
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
] as const;

const INPUT_INVALID_CLASSES = [
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
] as const;

// Interface específica para mejor tipado
interface InputProps extends React.ComponentProps<"input"> {
  // Se pueden añadir props personalizadas aquí si es necesario
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          INPUT_BASE_CLASSES,
          INPUT_FOCUS_CLASSES,
          INPUT_INVALID_CLASSES,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };