import React, { Component, ReactNode, Suspense } from "react";

interface IProps {
  /** Shown while a lazy screen downloads. */
  fallback?: ReactNode;
  children: ReactNode;
  /** When this changes (e.g. the user opens another report) a failed load is cleared and tried again. */
  resetKey?: string;
}

interface IState {
  failed: boolean;
}

/**
 * Suspense plus an error boundary for lazy-loaded screens. If a screen's code cannot be downloaded (see
 * lazyWithRetry) the user gets a message with a Reload button instead of a blank page. It does not reload by itself,
 * so nothing typed on the page is lost without the user choosing it.
 */
class LazyBoundary extends Component<IProps, IState> {
  state: IState = { failed: false };

  static getDerivedStateFromError(): IState {
    return { failed: true };
  }

  componentDidUpdate(prev: IProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="text-center p-4">
          <div className="text-muted mb-2">This screen could not be loaded. Check your connection, or the app may have been updated.</div>
          <button type="button" className="btn btn-sm btn-dark" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return <Suspense fallback={this.props.fallback ?? null}>{this.props.children}</Suspense>;
  }
}

export default LazyBoundary;
