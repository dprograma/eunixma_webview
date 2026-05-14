import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import type {
  WebViewNavigation,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewProgressEvent,
  WebViewMessageEvent,
  ShouldStartLoadRequest,
} from 'react-native-webview/lib/WebViewTypes';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../types/navigation';
import {BASE_URL} from '../config/constants';
import {useBackHandler} from '../hooks/useBackHandler';
import {useWebViewRef} from '../hooks/useWebViewRef';
import {
  handleMessage as handleBridgeMessage,
  setWebViewRef,
  BRIDGE_INJECTED_JS,
} from '../services/WebViewBridge';
import ProgressBar from '../components/ProgressBar';
import ErrorFallback from '../components/ErrorFallback';
import Logger from '../utils/logger';

type WebViewScreenRoute = RouteProp<RootStackParamList, 'WebView'>;

// OAuth providers blocked in WebViews — open in system browser instead
const OAUTH_PATTERNS = [
  'accounts.google.com',
  'facebook.com/dialog',
  'facebook.com/login',
  'appleid.apple.com',
  'twitter.com/i/oauth',
  'github.com/login/oauth',
];

// Scroll detection: only notifies when crossing the at-top threshold
// Uses requestAnimationFrame for performance (throttles rapid scroll events)
const SCROLL_DETECTION_JS = `
(function() {
  var wasAtTop = true;
  var rafPending = false;
  window.addEventListener('scroll', function() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function() {
      rafPending = false;
      var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      var atTop = scrollTop <= 8;
      if (atTop !== wasAtTop) {
        wasAtTop = atTop;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SCROLL_POSITION',
          scrollTop: scrollTop
        }));
      }
    });
  }, { passive: true });
})();
`;

// Merge bridge JS + scroll detection into a single injected script
const INJECTED_JS =
  BRIDGE_INJECTED_JS.trimEnd().replace(/true;\s*$/, '') +
  '\n' +
  SCROLL_DETECTION_JS +
  '\ntrue;';

export default function WebViewScreen() {
  const route = useRoute<WebViewScreenRoute>();
  const {webViewRef, reload} = useWebViewRef();
  const [canGoBack, setCanGoBack] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Only enable pull-to-refresh when the page is scrolled to the very top
  const [isAtTop, setIsAtTop] = useState(true);

  const url = route.params?.url ?? BASE_URL;

  useBackHandler(webViewRef, canGoBack);

  useEffect(() => {
    setWebViewRef(webViewRef);
  }, [webViewRef]);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
      setIsAtTop(true); // Reset to top on each page navigation
      Logger.info(
        'WebView',
        `canGoBack: ${navState.canGoBack}, url: ${navState.url}`,
      );
    },
    [],
  );

  const handleLoadProgress = useCallback((event: WebViewProgressEvent) => {
    setProgress(event.nativeEvent.progress);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  const handleError = useCallback((event: WebViewErrorEvent) => {
    const {description} = event.nativeEvent;
    Logger.error('WebView', 'Load error', description);
    setHasError(true);
    setErrorMessage(description || 'Failed to load the page.');
    setIsLoading(false);
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    const {statusCode, description} = event.nativeEvent;
    Logger.error('WebView', `HTTP ${statusCode}`, description);
    if (statusCode >= 500) {
      setHasError(true);
      setErrorMessage(
        'The server is temporarily unavailable. Please try again later.',
      );
    } else if (statusCode === 404) {
      setHasError(true);
      setErrorMessage("The page you're looking for was not found.");
    }
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setProgress(0);
    setIsLoading(true);
    reload();
  }, [reload]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    reload();
  }, [reload]);

  // Intercept scroll position from injected JS; pass all other messages to bridge
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SCROLL_POSITION') {
        setIsAtTop(data.scrollTop <= 8);
        return;
      }
    } catch {
      // Not JSON — fall through to bridge
    }
    handleBridgeMessage(event);
  }, []);

  // Block OAuth URLs inside the WebView; open them in the system browser instead.
  // Google blocks WebView user-agents (Error 403: disallowed_useragent).
  // Facebook blocks inactive embedded app sessions.
  // Opening in the system browser bypasses both restrictions.
  const handleShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) => {
      const {url: requestUrl} = request;
      const isOAuth = OAUTH_PATTERNS.some(pattern =>
        requestUrl.includes(pattern),
      );
      if (isOAuth) {
        Logger.info('WebView', 'Redirecting OAuth to system browser', requestUrl);
        Linking.openURL(requestUrl).catch(err => {
          Logger.error('WebView', 'Cannot open OAuth URL', err);
          Alert.alert(
            'Browser Required',
            'Please open this page in your browser to sign in.',
          );
        });
        return false; // Cancel navigation inside WebView
      }
      return true;
    },
    [],
  );

  const webViewElement = (
    <WebView
      ref={webViewRef}
      source={{uri: url}}
      style={styles.webview}
      onNavigationStateChange={handleNavigationStateChange}
      onLoadProgress={handleLoadProgress}
      onLoadEnd={handleLoadEnd}
      onError={handleError}
      onHttpError={handleHttpError}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      injectedJavaScript={INJECTED_JS}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      allowsBackForwardNavigationGestures
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="compatibility"
      allowFileAccess
      allowFileAccessFromFileURLs
      setSupportMultipleWindows={false}
      cacheEnabled
      pullToRefreshEnabled={Platform.OS === 'ios'}
      textZoom={100}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ProgressBar progress={progress} visible={isLoading} />
      {hasError ? (
        <ErrorFallback message={errorMessage} onRetry={handleRetry} />
      ) : Platform.OS === 'android' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              enabled={isAtTop} // Only allow refresh when page is at the very top
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }>
          {webViewElement}
        </ScrollView>
      ) : (
        webViewElement
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
