import { ark } from "@ark-ui/react/factory";
import { cn } from "~lib/utils";

interface SeparatorProps extends React.ComponentProps<typeof ark.div> {
  /**
   * The orientation of the separator.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

export const Separator = (props: SeparatorProps) => {
  const { orientation = "horizontal", className, ...rest } = props;

  return (
    <ark.div
      aria-orientation={orientation}
      className={cn(
        "shrink-0",
        "bg-input",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className
      )}
      data-orientation={orientation}
      data-slot="separator"
      role="separator"
      {...rest}
    />
  );
};
