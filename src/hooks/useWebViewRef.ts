import {useRef, useCallback} from 'react';
import type WebView from 'react-native-webview';

export function useWebViewRef() {
  const webViewRef = useRef<WebView | null>(null);

  const reload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const goForward = useCallback(() => {
    webViewRef.current?.goForward();
  }, []);

  const injectJS = useCallback((js: string) => {
    webViewRef.current?.injectJavaScript(js);
  }, []);

  return {webViewRef, reload, goBack, goForward, injectJS};
}
