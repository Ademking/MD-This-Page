import { ark } from "@ark-ui/react/factory";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "~lib/utils";

export const badgeVariants = tv({
  base: [
    "relative",
    "inline-flex items-center justify-center gap-1",
    "select-none whitespace-nowrap font-medium text-xs",
    "rounded-md border border-transparent",
    "overflow-hidden",
    "transition-colors",
    "outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/32",
    "[&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
    "[button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
    "motion-reduce:transition-none!",
  ],
  variants: {
    variant: {
      default: [
        "bg-foreground",
        "text-background",
        "focus-visible:border-foreground focus-visible:ring-foreground/20",
        "dark:focus-visible:ring-foreground/40",
        "[a&]:hover:bg-foreground/90",
      ],
      secondary: [
        "bg-secondary",
        "text-secondary-foreground",
        "border-secondary/20",
        "focus-visible:border-foreground focus-visible:ring-foreground/50",
        "[a&]:hover:bg-secondary/90",
      ],
      outline: [
        "text-foreground",
        "border-border",
        "[a&]:hover:bg-accent",
        "[a&]:hover:text-accent-foreground",
      ],
      success: [
        "bg-success/10",
        "text-success",
        "border-success/20",
        "focus-visible:border-success focus-visible:ring-success/20",
        "[a&]:hover:bg-success/20",
      ],
      info: [
        "bg-info/10",
        "text-info",
        "border-info/20",
        "focus-visible:border-info focus-visible:ring-info/50",
        "[a&]:hover:bg-info/20",
      ],
      warning: [
        "bg-warning/10",
        "text-warning",
        "border-warning/20",
        "focus-visible:border-warning focus-visible:ring-warning/20",
        "dark:focus-visible:ring-warning/40",
        "[a&]:hover:bg-warning/20",
      ],
      destructive: [
        "bg-destructive/10 dark:bg-destructive/5",
        "text-destructive-foreground",
        "border-destructive-foreground/20",
        "focus-visible:border-destructive focus-visible:ring-destructive/24",
        "dark:focus-visible:ring-destructive/40",
        "[a&]:hover:bg-destructive/20",
      ],
    },
    size: {
      sm: ["h-5 min-w-5", "px-1"],
      md: ["h-5.5 min-w-5.5", "px-1.5"],
      lg: ["h-6.5 min-w-6.5", "px-2", "text-sm"],
    },
    pill: {
      true: [
        "rounded-full",
        "has-[>svg]:data-[size=sm]:pe-1.5",
        "has-[>svg]:data-[size=md]:pe-2",
        "has-[>svg]:data-[size=lg]:pe-2 sm:has-[>svg]:data-[size=lg]:pe-2.5",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    pill: false,
  },
});

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface BadgeProps
  extends React.ComponentProps<typeof ark.span>,
    VariantProps<typeof badgeVariants> {}

export const Badge = (props: BadgeProps) => {
  const {
    variant = "default",
    size = "md",
    pill = false,
    className,
    ...rest
  } = props;

  return (
    <ark.span
      className={cn(badgeVariants({ variant, size, pill }), className)}
      data-size={size}
      data-slot="badge"
      data-variant={variant}
      {...rest}
    />
  );
};
