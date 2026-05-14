import {useEffect} from 'react';
import {BackHandler} from 'react-native';
import type WebView from 'react-native-webview';

export function useBackHandler(
  webViewRef: React.RefObject<WebView | null>,
  canGoBack: boolean,
) {
  useEffect(() => {
    const handler = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default (exit app)
      }
      return false; // Let system handle (exit app)
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );
    return () => subscription.remove();
  }, [canGoBack, webViewRef]);
}
