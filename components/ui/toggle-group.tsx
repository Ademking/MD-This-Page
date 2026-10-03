import {
  ToggleGroup as ArkToggleGroup,
  useToggleGroupContext as useArkToggleGroupContext,
} from "@ark-ui/react/toggle-group";
import React from "react";
import { tv } from "tailwind-variants";
import { cn } from "~lib/utils";
import { Toggle, type ToggleProps } from "~components/ui/toggle";

export const useToggleGroup = useArkToggleGroupContext;

type ToggleGroupContextProps = Pick<ToggleProps, "variant" | "size"> & {
  /**
   * Gap between items.
   *
   * @default 0
   */
  spacing?: number;
};

const ToggleGroupContext = React.createContext({} as ToggleGroupContextProps);

interface ToggleGroupProps
  extends React.ComponentProps<typeof ArkToggleGroup.Root>,
    ToggleGroupContextProps {}

const toggleGroupVariants = tv({
  base: [
    "w-fit",
    "flex items-center gap-[--spacing(var(--gap))]",
    "rounded-lg",
  ],
  variants: {
    orientation: {
      horizontal: "flex-row pointer-coarse:*:after:min-w-auto",
      vertical: "flex-col items-stretch pointer-coarse:*:after:min-h-auto",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export const ToggleGroup = (props: ToggleGroupProps) => {
  const {
    multiple = true,
    orientation = "horizontal",
    variant = "ghost",
    size = "md",
    spacing = 0,
    className,
    style,
    ...rest
  } = props;

  return (
    <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
      <ArkToggleGroup.Root
        className={cn(toggleGroupVariants({ orientation }), className)}
        data-slot="toggle-group"
        multiple={multiple}
        orientation={orientation}
        style={
          {
            ...style,
            "--gap": spacing,
          } as React.CSSProperties
        }
        {...rest}
      />
    </ToggleGroupContext.Provider>
  );
};

interface ToggleGroupItemProps
  extends React.ComponentProps<typeof ArkToggleGroup.Item> {}

export const ToggleGroupItem = (props: ToggleGroupItemProps) => {
  const { value, className, ...rest } = props;

  const { variant, size, spacing } = _useToggleGroup();

  return (
    <ArkToggleGroup.Item asChild data-slot="toggle-group-item" value={value}>
      <Toggle
        className={cn(
          "shrink-0 focus:z-10 focus-visible:z-10",
          "data-[spacing=0]:rounded-none",
          "data-[spacing=0]:px-2",
          "data-[orientation=horizontal]:data-[spacing=0]:first:rounded-l-lg",
          "data-[orientation=vertical]:data-[spacing=0]:first:rounded-t-lg",
          "data-[orientation=horizontal]:data-[spacing=0]:last:rounded-r-lg",
          "data-[orientation=vertical]:data-[spacing=0]:last:rounded-b-lg",
          "data-[orientation=horizontal]:data-[spacing=0]:data-[variant=outline]:border-l-0",
          "data-[orientation=vertical]:data-[spacing=0]:data-[variant=outline]:border-t-0",
          "data-[orientation=horizontal]:data-[spacing=0]:data-[variant=outline]:first:border-l",
          className
        )}
        data-spacing={spacing}
        data-variant={variant}
        size={size}
        variant={variant}
        {...rest}
      />
    </ArkToggleGroup.Item>
  );
};

const _useToggleGroup = () => {
  const context = React.useContext(ToggleGroupContext);

  if (!context) {
    throw new Error("useToggleGroupContext must be used within a ToggleGroup");
  }

  return context;
};
