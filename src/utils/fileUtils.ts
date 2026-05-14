import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {requestCameraPermission, requestStoragePermission} from './permissions';
import Logger from './logger';

export type FileResult = {
  uri: string;
  name: string;
  type: string;
  size?: number;
  base64?: string;
};

export async function pickFile(): Promise<FileResult | null> {
  try {
    const [result] = await pick({
      type: [types.allFiles],
    });
    return {
      uri: result.uri,
      name: result.name ?? 'file',
      type: result.type ?? 'application/octet-stream',
      size: result.size ?? undefined,
    };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    Logger.error('FileUtils', 'File pick error', err);
    return null;
  }
}

export async function captureImage(): Promise<FileResult | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return null;
  }

  return new Promise(resolve => {
    launchCamera(
      {mediaType: 'photo', quality: 0.8, includeBase64: true},
      response => {
        if (response.didCancel || response.errorCode) {
          if (response.errorCode) {
            Logger.error('FileUtils', 'Camera error', response.errorMessage);
          }
          resolve(null);
          return;
        }
        const asset = response.assets?.[0];
        if (asset) {
          resolve({
            uri: asset.uri ?? '',
            name: asset.fileName ?? 'photo.jpg',
            type: asset.type ?? 'image/jpeg',
            size: asset.fileSize,
            base64: asset.base64,
          });
        } else {
          resolve(null);
        }
      },
    );
  });
}

export async function pickImage(): Promise<FileResult | null> {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    return null;
  }

  return new Promise(resolve => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, includeBase64: true},
      response => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }
        const asset = response.assets?.[0];
        if (asset) {
          resolve({
            uri: asset.uri ?? '',
            name: asset.fileName ?? 'image.jpg',
            type: asset.type ?? 'image/jpeg',
            size: asset.fileSize,
            base64: asset.base64,
          });
        } else {
          resolve(null);
        }
      },
    );
  });
}
