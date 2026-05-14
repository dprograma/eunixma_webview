export type RootStackParamList = {
  WebView: {url?: string} | undefined;
  Offline: undefined;
  Biometric: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
