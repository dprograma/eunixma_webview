import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import * as BiometricService from '../services/BiometricService';

export default function BiometricScreen() {
  const navigation = useNavigation();
  const [biometryType, setBiometryType] = useState<string>('Biometrics');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    BiometricService.isAvailable().then(({biometryType: type}) => {
      setBiometryType(type);
    });
    // Auto-trigger on mount
    handleAuthenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    const result = await BiometricService.authenticate(
      `Use ${biometryType} to unlock`,
    );

    setIsAuthenticating(false);

    if (result.success) {
      navigation.goBack();
    } else {
      setError(
        result.error === 'BIOMETRIC_NOT_AVAILABLE'
          ? 'Biometric authentication is not available on this device.'
          : 'Authentication failed. Please try again.',
      );
    }
  }, [biometryType, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Authentication Required</Text>
      <Text style={styles.message}>
        Use {biometryType} to unlock the app.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {isAuthenticating ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleAuthenticate}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
