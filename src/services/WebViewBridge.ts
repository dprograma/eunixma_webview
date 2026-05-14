import type WebView from 'react-native-webview';
import type {WebViewMessageEvent} from 'react-native-webview';
import type {BridgeMessage, OutgoingMessageType} from '../types/bridge';
import * as BiometricService from './BiometricService';
import {captureImage, pickFile, pickImage} from '../utils/fileUtils';
import {getToken} from './NotificationService';
import Logger from '../utils/logger';

let webViewRefInstance: React.RefObject<WebView | null> | null = null;

export function setWebViewRef(ref: React.RefObject<WebView | null>): void {
  webViewRefInstance = ref;
}

export function sendToWeb(
  type: OutgoingMessageType,
  payload: unknown,
  requestId?: string,
): void {
  if (!webViewRefInstance?.current) {
    Logger.warn('WebViewBridge', 'WebView ref not available');
    return;
  }

  const message = JSON.stringify({type, payload, requestId});
  webViewRefInstance.current.injectJavaScript(
    `window.dispatchEvent(new CustomEvent('nativeBridge', { detail: ${message} }));true;`,
  );
}

export async function handleMessage(event: WebViewMessageEvent): Promise<void> {
  let message: BridgeMessage;
  try {
    message = JSON.parse(event.nativeEvent.data);
  } catch {
    Logger.error('WebViewBridge', 'Failed to parse message', event.nativeEvent.data);
    return;
  }

  const {type, payload, requestId} = message;

  try {
    switch (type) {
      case 'REQUEST_BIOMETRIC': {
        const promptMessage =
          (payload?.promptMessage as string) ?? 'Confirm your identity';
        const result = await BiometricService.authenticate(promptMessage);
        sendToWeb('BIOMETRIC_RESULT', result, requestId);
        break;
      }

      case 'REQUEST_CAMERA': {
        const result = await captureImage();
        sendToWeb(
          'CAMERA_RESULT',
          result
            ? {success: true, ...result}
            : {success: false, error: 'CANCELLED'},
          requestId,
        );
        break;
      }

      case 'REQUEST_FILE_PICK': {
        const pickType = (payload?.type as string) ?? 'file';
        const result =
          pickType === 'image' ? await pickImage() : await pickFile();
        sendToWeb(
          'FILE_PICK_RESULT',
          result
            ? {success: true, ...result}
            : {success: false, error: 'CANCELLED'},
          requestId,
        );
        break;
      }

      case 'GET_PUSH_TOKEN': {
        const token = await getToken();
        sendToWeb('PUSH_TOKEN', {token}, requestId);
        break;
      }

      case 'LOG': {
        Logger.info('WebApp', (payload?.message as string) ?? '', payload?.data);
        break;
      }

      default:
        Logger.warn('WebViewBridge', `Unknown message type: ${type}`);
    }
  } catch (err) {
    Logger.error('WebViewBridge', `Error handling ${type}`, err);
    sendToWeb('ERROR', {error: 'NATIVE_ERROR', type}, requestId);
  }
}

export const BRIDGE_INJECTED_JS = `
(function() {
  if (window.isReactNativeWebView) return;
  window.isReactNativeWebView = true;
  window.nativeBridge = {
    send: function(type, payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {},
        requestId: Date.now().toString()
      }));
    }
  };
  window.dispatchEvent(new Event('nativeBridgeReady'));
})();
true;
`;
