import ReactNativeBiometrics from 'react-native-biometrics';
import Logger from '../utils/logger';

const biometrics = new ReactNativeBiometrics();

export type BiometryType = 'Biometrics' | 'TouchID' | 'FaceID' | 'None';

export async function isAvailable(): Promise<{
  available: boolean;
  biometryType: BiometryType;
}> {
  try {
    const {available, biometryType} = await biometrics.isSensorAvailable();
    return {
      available,
      biometryType: (biometryType as BiometryType) ?? 'None',
    };
  } catch (err) {
    Logger.error('BiometricService', 'Availability check failed', err);
    return {available: false, biometryType: 'None'};
  }
}

export async function authenticate(
  promptMessage = 'Confirm your identity',
): Promise<{success: boolean; error?: string}> {
  try {
    const {available} = await isAvailable();
    if (!available) {
      return {success: false, error: 'BIOMETRIC_NOT_AVAILABLE'};
    }

    const {success} = await biometrics.simplePrompt({promptMessage});
    return {success};
  } catch (err) {
    Logger.error('BiometricService', 'Authentication failed', err);
    return {success: false, error: 'BIOMETRIC_ERROR'};
  }
}

export async function createKeys(): Promise<{
  success: boolean;
  publicKey?: string;
}> {
  try {
    const {publicKey} = await biometrics.createKeys();
    return {success: true, publicKey};
  } catch (err) {
    Logger.error('BiometricService', 'Key creation failed', err);
    return {success: false};
  }
}
