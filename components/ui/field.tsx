import { ark } from "@ark-ui/react/factory";
import {
  Field as ArkField,
  useFieldContext as useArkFieldContext,
} from "@ark-ui/react/field";
import { Fieldset as ArkFieldset } from "@ark-ui/react/fieldset";
import type React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "~lib/utils";
import { Separator } from "~components/ui/separator";

export const useField = useArkFieldContext;

const fieldVariants = tv({
  base: [
    "group/field",
    "w-full",
    "flex gap-2",
    "data-invalid:text-destructive",
    "dark:data-invalid:text-destructive-foreground",
  ],
  variants: {
    orientation: {
      vertical: ["flex-col *:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "*:data-[slot=field-label]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "flex-col *:w-full [&>.sr-only]:w-auto",
        "@md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto",
        "@md/field-group:*:data-[slot=field-label]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start",
        "@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
    },
    reverse: {
      true: [
        "data-[orientation=horizontal]:flex-row-reverse",
        "data-[orientation=vertical]:flex-col-reverse",
        "data-[orientation=responsive]:flex-col-reverse",
        "data-[orientation=responsive]:@md/field-group:flex-row-reverse",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
    reverse: false,
  },
});

interface FieldProps
  extends React.ComponentProps<typeof ArkField.Root>,
    VariantProps<typeof fieldVariants> {}

export const Field = (props: FieldProps) => {
  const {
    orientation = "vertical",
    reverse = false,
    className,
    ...rest
  } = props;

  return (
    <ArkField.Root
      className={cn(fieldVariants({ orientation, reverse }), className)}
      data-orientation={orientation}
      data-slot="field"
      {...rest}
    />
  );
};

export const FieldSet = (
  props: React.ComponentProps<typeof ArkFieldset.Root>
) => {
  const { className, ...rest } = props;

  return (
    <ArkFieldset.Root
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      data-slot="field-set"
      {...rest}
    />
  );
};

interface FieldLegendProps
  extends React.ComponentProps<typeof ArkFieldset.Legend> {
  /**
   * The variant of the legend.
   */
  variant?: "legend" | "label";
}

export const FieldLegend = (props: FieldLegendProps) => {
  const { variant = "legend", className, ...rest } = props;

  return (
    <ArkFieldset.Legend
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      data-slot="field-legend"
      data-variant={variant}
      {...rest}
    />
  );
};

export const FieldGroup = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "group/field-group @container/field-group",
        "flex w-full flex-col gap-4",
        "data-[data-slot=checkbox-group]:gap-3",
        "*:data-[slot=field-group]:gap-4",
        className
      )}
      data-slot="field-group"
      {...rest}
    />
  );
};

export const FieldContent = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "group/field-content",
        "flex flex-1 flex-col gap-1.5",
        "leading-snug",
        className
      )}
      data-slot="field-content"
      {...rest}
    />
  );
};

export const FieldLabel = (
  props: React.ComponentProps<typeof ArkField.Label>
) => {
  const { className, ...rest } = props;

  return (
    <ArkField.Label
      className={cn(
        "group/field-label peer/field-label",
        "select-none font-medium text-sm leading-snug",
        "flex w-fit gap-1",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5",
        "group-data-disabled/field:opacity-64",
        "dark:has-data-[state=checked]:bg-primary/10",
        className
      )}
      data-slot="field-label"
      {...rest}
    />
  );
};

export const FieldRequiredIndicator = (
  props: React.ComponentProps<typeof ark.span>
) => {
  const { className, children, ...rest } = props;

  return (
    <ArkField.RequiredIndicator
      aria-hidden
      className={cn(
        "select-none text-destructive text-sm",
        "dark:text-destructive-foreground",
        className
      )}
      data-slot="field-required-indicator"
      {...rest}
    >
      {children ?? "*"}
    </ArkField.RequiredIndicator>
  );
};

export const FieldTitle = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "w-fit",
        "flex items-center gap-2",
        "font-medium text-sm leading-snug",
        "group-data-[disabled=true]/field:opacity-64",
        className
      )}
      data-slot="field-title"
      {...rest}
    />
  );
};

export const FieldDescription = (props: React.ComponentProps<typeof ark.p>) => {
  const { className, ...rest } = props;

  return (
    <ark.p
      className={cn(
        "pointer-events-none",
        "font-normal text-muted-foreground text-sm leading-normal",
        "group-has-data-[orientation=horizontal]/field:text-balance",
        "@md/field-group:group-data-[orientation=responsive]/field:text-balance",
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
        "in-[[data-slot=field]:has([data-slot=radio-group-item])]:ms-6 in-[[data-slot=field]:has([data-slot=radio-group-item])]:-mt-1.5!",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      data-slot="field-description"
      {...rest}
    />
  );
};

export const FieldSeparator = (props: React.ComponentProps<typeof ark.div>) => {
  const { className, children, ...rest } = props;

  return (
    <ark.div
      className={cn(
        "relative",
        "h-5",
        "-my-2 group-data-[variant=outline]/field-group:-mb-2",
        "text-sm",
        className
      )}
      data-content={!!children}
      data-slot="field-separator"
      {...rest}
    >
      <Separator className="absolute inset-0 top-1/2" />

      {!!children && (
        <span
          className={cn(
            "relative block",
            "w-fit",
            "mx-auto px-2",
            "bg-background",
            "text-muted-foreground text-sm"
          )}
        >
          {children}
        </span>
      )}
    </ark.div>
  );
};

export const FieldHelper = (
  props: React.ComponentProps<typeof ArkField.HelperText>
) => {
  const { className, ...rest } = props;

  return (
    <ArkField.HelperText
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="field-helper"
      {...rest}
    />
  );
};

export const FieldError = (
  props: React.ComponentProps<typeof ArkField.ErrorText>
) => {
  const { className, ...rest } = props;

  return (
    <ArkField.ErrorText
      className={cn(
        "font-normal text-destructive text-sm",
        "dark:text-destructive-foreground",
        className
      )}
      data-slot="field-error"
      {...rest}
    />
  );
};
