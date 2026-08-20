import type { Operator } from "./types";

export const OPERATOR_COLOR: Record<Operator, string> = {
  metro: "var(--color-metro)",
  bilbobus: "var(--color-bilbobus)",
  bizkaibus: "var(--color-bizkaibus)",
  renfe: "var(--color-renfe)",
};

export const OPERATOR_LABEL: Record<Operator, string> = {
  metro: "Metro Bilbao",
  bilbobus: "Bilbobus",
  bizkaibus: "Bizkaibus",
  renfe: "Renfe Cercanías",
};
