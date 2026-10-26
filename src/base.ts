declare global {
  interface Window {
    porla: { base_path: string };
  }
}

export function prefixPath(path: string) {
  let base = window.porla.base_path;
  if (base.endsWith("/")) base = base.substring(0, base.length - 1);
  return `${base}${path}`;
}
