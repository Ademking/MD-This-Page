import { ark } from "@ark-ui/react/factory";
import type React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "~lib/utils";

export const alertVariants = tv({
  base: [
    "relative",
    "px-3.5 py-3",
    "grid w-full items-start gap-x-2 gap-y-0.5",
    "text-card-foreground text-sm",
    "rounded-xl border",
    "has-[>svg]:has-data-[slot=alert-action]:grid-cols-[--spacing(4)_1fr_auto] has-[>svg]:grid-cols-[--spacing(4)_1fr]",
    "has-[>svg]:gap-x-2 [&_svg]:h-lh [&_svg]:w-4",
    "has-data-[slot=alert-action]:grid-cols-[1fr_auto]",
  ],
  variants: {
    variant: {
      default: [
        "bg-input/4",
        "[&_svg]:text-muted-foreground",
        "[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-muted",
      ],
      destructive: [
        "bg-destructive/4",
        "border-destructive/32",
        "[&_svg]:text-destructive",
        "[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-destructive/10",
      ],
      info: [
        "bg-info/4",
        "border-info/32",
        "[&_svg]:text-info",
        "[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-info/10",
      ],
      warning: [
        "bg-warning/4",
        "border-warning/32",
        "[&_svg]:text-warning",
        "[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-warning/10",
      ],
      success: [
        "bg-success/4",
        "border-success/32",
        "[&_svg]:text-success",
        "[&_[data-slot=alert-action]_[data-variant=ghost]]:hover:bg-success/10",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AlertProps
  extends React.ComponentProps<typeof ark.div>,
    VariantProps<typeof alertVariants> {}

export const Alert = (props: AlertProps) => {
  const { variant, className, ...rest } = props;

  return (
    <ark.div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      {...rest}
    />
  );
};

export const AlertTitle = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "font-heading font-medium",
        "[svg~&]:col-start-2",
        className
      )}
      data-slot="alert-title"
      {...rest}
    />
  );
};

export const AlertDescription = (
  props: React.ComponentProps<typeof ark.div>
) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "flex flex-col gap-2.5",
        "text-muted-foreground",
        "[svg~&]:col-start-2",
        className
      )}
      data-slot="alert-description"
      {...rest}
    />
  );
};

export const AlertAction = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "flex gap-1",
        "max-sm:col-start-2 max-sm:mt-2",
        "sm:[svg~[data-slot=alert-title]~&]:col-start-3",
        "sm:row-start-1 sm:row-end-3 sm:self-center",
        "sm:[[data-slot=alert-description]~&]:col-start-2",
        "sm:[[data-slot=alert-title]~&]:col-start-2",
        "sm:[svg~&]:col-start-2",
        "sm:[svg~[data-slot=alert-description]~&]:col-start-3",
        className
      )}
      data-slot="alert-action"
      {...rest}
    />
  );
};
