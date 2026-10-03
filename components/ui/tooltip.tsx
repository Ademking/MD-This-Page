import { Portal } from "@ark-ui/react/portal";
import {
  Tooltip as ArkTooltip,
  useTooltipContext,
} from "@ark-ui/react/tooltip";
import type React from "react";
import { cn } from "~lib/utils";

export const useTooltip = useTooltipContext;

export const Tooltip = (
  props: React.ComponentProps<typeof ArkTooltip.Root>
) => {
  const {
    positioning = {
      placement: "top",
    },
    lazyMount = true,
    unmountOnExit = true,
    closeDelay = 100,
    openDelay = 0,
    ...rest
  } = props;

  return (
    <ArkTooltip.Root
      closeDelay={closeDelay}
      data-slot="tooltip"
      lazyMount={lazyMount}
      openDelay={openDelay}
      positioning={positioning}
      unmountOnExit={unmountOnExit}
      {...rest}
    />
  );
};

export const TooltipTrigger = (
  props: React.ComponentProps<typeof ArkTooltip.Trigger>
) => <ArkTooltip.Trigger data-slot="tooltip-trigger" {...props} />;

export const TooltipContent = (
  props: React.ComponentProps<typeof ArkTooltip.Content>
) => {
  const { className, children, ...rest } = props;

  return (
    <Portal>
      <ArkTooltip.Positioner data-slot="tooltip-positioner">
        <ArkTooltip.Content
          className={cn(
            "z-50 w-fit",
            "px-3 py-1.5",
            "bg-foreground",
            "text-background text-xs",
            "rounded-lg shadow-lg/5",
            "origin-(--transform-origin) animate-in",
            "fade-in-0 zoom-in-[98%]",
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[98%]",
            "data-[state=closed]:animate-out",
            "data-[placement=bottom]:slide-in-from-top-2",
            "data-[placement=left]:slide-in-from-end-2",
            "data-[placement=right]:slide-in-from-start-2",
            "data-[placement=top]:slide-in-from-bottom-2",
            "motion-reduce:animate-none!",
            className
          )}
          data-slot="tooltip-content"
          {...rest}
        >
          <TooltipArrow />

          {children}
        </ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </Portal>
  );
};

export const TooltipArrow = (
  props: React.ComponentProps<typeof ArkTooltip.Arrow>
) => {
  const { style, ...rest } = props;

  return (
    <ArkTooltip.Arrow
      data-slot="tooltip-arrow"
      style={
        {
          "--arrow-background": "var(--foreground)",
          "--arrow-size": "calc(1.5 * var(--spacing))",
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      <ArkTooltip.ArrowTip />
    </ArkTooltip.Arrow>
  );
};
