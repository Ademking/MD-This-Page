import { ark } from "@ark-ui/react/factory";
import type React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "~lib/utils";

const kbdVariants = tv({
  base: [
    "h-5 min-w-5",
    "px-1",
    "inline-flex items-center justify-center gap-1",
    "select-none font-medium font-sans text-foreground text-xs",
    "rounded-sm border border-transparent",
    "pointer-events-none",
    "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background",
    "[&_svg:not([class*='size-'])]:size-3",
  ],
  variants: {
    variant: {
      default: "bg-muted",
      outline: "border border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface KbdProps
  extends React.ComponentProps<typeof ark.kbd>,
    VariantProps<typeof kbdVariants> {}

export const Kbd = (props: KbdProps) => {
  const { variant = "default", className, ...rest } = props;

  return (
    <ark.kbd
      className={cn(kbdVariants({ variant }), className)}
      data-slot="kbd"
      {...rest}
    />
  );
};

export const KbdGroup = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn("inline-flex items-center gap-1", className)}
      data-slot="kbd-group"
      {...rest}
    />
  );
};
