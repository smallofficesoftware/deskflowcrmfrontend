import { ComponentProps, ComponentType, Suspense, lazy } from "react";

/**
 * Code-split a default-exported component without touching its JSX call
 * sites: the returned component has the same props, loads its chunk the
 * first time it renders, and carries its own <Suspense> so a late chunk never
 * blanks the surrounding screen (fallback is empty).
 */
export function lazyView<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) {
  const Lazy = lazy(loader);
  const LazyView = (props: ComponentProps<T>) => (
    <Suspense fallback={null}>
      <Lazy {...(props as any)} />
    </Suspense>
  );
  return LazyView;
}
