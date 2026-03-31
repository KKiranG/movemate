"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="px-4 py-12 text-center">
            <p className="text-text-secondary">
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 min-h-[44px] text-accent underline active:opacity-70"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
