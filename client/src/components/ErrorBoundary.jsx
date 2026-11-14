import { Component } from "react";
import ErrorPage from "./ErrorPage";

// Catches crashes while rendering (a bug in any component) so the user sees the
// error page instead of a blank white screen.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorPage
        kind="server"
        // Technical details are shown in development only.
        detail={
          import.meta.env.DEV
            ? String(this.state.error.stack || this.state.error)
            : undefined
        }
      />
    );
  }
}
