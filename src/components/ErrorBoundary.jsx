import { Component } from 'react';

/** Last line of defence: never leave the player looking at a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Arrow Escape] Unexpected error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-screen" role="alert">
        <h1>Oops — something went wrong</h1>
        <p>The game hit an unexpected problem. Your saved progress is safe.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload game
        </button>
      </div>
    );
  }
}
