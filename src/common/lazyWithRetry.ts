import { ComponentType, lazy } from "react";

/**
 * React.lazy that tries the download a second time before giving up. A chunk can fail to download for a moment
 * (weak network) or for good (a tab opened before a deploy asks for a chunk file the new build no longer has).
 * If the second try also fails the error is thrown to the nearest <LazyBoundary>, which offers a Reload button.
 */
export const lazyWithRetry = <T extends ComponentType<any>>(load: () => Promise<{ default: T }>) =>
  lazy(async () => {
    try {
      return await load();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return load();
    }
  });
