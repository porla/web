import { lazy } from "react";
import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";

const ColorField = lazy(() => import("@/components/forms/color-field.tsx"));
const FileListField = lazy(() => import("@/components/forms/file-list-field.tsx"));
const TextField = lazy(() => import("@/components/forms/text-field.tsx"));

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    ColorField,
    FileListField,
    TextField,
  },
  formComponents: {
  },
  fieldContext,
  formContext,
});
