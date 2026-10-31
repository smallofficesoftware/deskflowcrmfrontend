import { ComponentProps, ComponentType } from "react";
import LazyBoundary from "../components/LazyBoundary";
import { lazyWithRetry } from "./lazyWithRetry";

/**
 * Code-split a default-exported component without touching its JSX call
 * sites: the returned component has the same props, loads its chunk the
 * first time it renders, and carries its own <Suspense> so a late chunk never
 * blanks the surrounding screen (fallback is empty). The download is retried
 * once, and a chunk that still cannot load shows a Reload message instead of
 * a blank page (see LazyBoundary).
 */
export function lazyView<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) {
  const Lazy = lazyWithRetry(loader);
  const LazyView = (props: ComponentProps<T>) => (
    <LazyBoundary>
      <Lazy {...(props as any)} />
    </LazyBoundary>
  );
  return LazyView;
}
