import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import WebViewScreen from '../screens/WebViewScreen';
import OfflineScreen from '../screens/OfflineScreen';
import BiometricScreen from '../screens/BiometricScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen name="WebView" component={WebViewScreen} />
      <Stack.Screen
        name="Offline"
        component={OfflineScreen}
        options={{gestureEnabled: false}}
      />
      <Stack.Screen
        name="Biometric"
        component={BiometricScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
