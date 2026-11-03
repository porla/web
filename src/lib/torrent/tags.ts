export const splitTags = (text: string) => [
  ...new Set(
    text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  ),
];
