import * as React from 'react';

type Align = 'start' | 'center' | 'end';

type CtxType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null;

const Ctx = React.createContext<CtxType>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {/* relative para posicionar correctamente el Content */}
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

type TriggerProps = {
  asChild?: boolean;
  children: React.ReactElement<any>;
};

type WithOptionalOnClick = {
  onClick?: (e: React.MouseEvent) => void;
};

export function DropdownMenuTrigger({ asChild, children }: TriggerProps) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return children;

  const child = React.Children.only(children) as React.ReactElement<any>;
  const originalOnClick = (child.props as WithOptionalOnClick).onClick;

  const handleClick = (e: React.MouseEvent) => {
    ctx.setOpen((v) => !v);
    originalOnClick?.(e);
  };

  const injected = React.cloneElement(child, {
    ...child.props,
    onClick: handleClick,
  });

  return asChild ? injected : <button onClick={handleClick}>{children}</button>;
}

export function DropdownMenuContent({
  children,
  align = 'start',
  className = '',
}: {
  children: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  const ctx = React.useContext(Ctx);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) ctx?.setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [ctx]);

  if (!ctx?.open) return null;

  const alignClass =
    align === 'end'
      ? 'right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0';

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white p-1 shadow-lg ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-gray-500">
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-200" />;
}

export function DropdownMenuItem({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  );
}
