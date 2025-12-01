import { lazy } from "react";
import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";

const CheckboxField = lazy(() => import("@/components/forms/checkbox-field.tsx"));
const ColorField = lazy(() => import("@/components/forms/color-field.tsx"));
const FileListField = lazy(() => import("@/components/forms/file-list-field.tsx"));
const NumberField = lazy(() => import("@/components/forms/number-field.tsx"));
const RadioGroupField = lazy(() => import("@/components/forms/radio-group-field.tsx"));
const SelectField = lazy(() => import("@/components/forms/select-field.tsx"));
const TextareaField = lazy(() => import("@/components/forms/textarea-field.tsx"));
const TextField = lazy(() => import("@/components/forms/text-field.tsx"));

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    ColorField,
    FileListField,
    NumberField,
    RadioGroupField,
    SelectField,
    TextareaField,
    TextField,
  },
  formComponents: {
  },
  fieldContext,
  formContext,
});
