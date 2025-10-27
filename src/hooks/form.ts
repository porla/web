import { lazy } from "react";
import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";

const TextField = lazy(() => import("@/components/forms/text-field.tsx"));
const FileListField = lazy(() => import("@/components/forms/file-list-field.tsx"));

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    FileListField
  },
  formComponents: {
  },
  fieldContext,
  formContext,
});
