import React, {Component, ErrorInfo, ReactNode} from 'react';
import ErrorFallback from './ErrorFallback';
import Logger from '../utils/logger';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {hasError: false};

  static getDerivedStateFromError(): State {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Logger.error('ErrorBoundary', error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({hasError: false});
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title="App Error"
          message="An unexpected error occurred. Please try again."
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
