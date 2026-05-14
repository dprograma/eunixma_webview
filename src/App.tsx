import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import type {NavigationContainerRef} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import {deepLinkConfig} from './config/deepLinking';
import {useConnectivity} from './hooks/useConnectivity';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import * as NotificationService from './services/NotificationService';
import Logger from './utils/logger';
import type {RootStackParamList} from './types/navigation';

export default function App() {
  const {isConnected} = useConnectivity();
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);
  const wasConnectedRef = useRef(true);

  useEffect(() => {
    NotificationService.init().catch(err => {
      Logger.error('App', 'Notification init failed', err);
    });
  }, []);

  // Handle connectivity changes — navigate to/from Offline screen
  useEffect(() => {
    if (!navigationRef.current?.isReady()) {
      return;
    }

    const currentRoute = navigationRef.current.getCurrentRoute()?.name;

    if (!isConnected && wasConnectedRef.current) {
      // Just went offline
      if (currentRoute !== 'Offline') {
        navigationRef.current.navigate('Offline');
      }
    } else if (isConnected && !wasConnectedRef.current) {
      // Just came back online
      if (currentRoute === 'Offline') {
        navigationRef.current.goBack();
      }
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  const handleReady = () => {
    try {
      SplashScreen.hide();
    } catch {
      // SplashScreen may not be configured yet
    }
  };

  return (
    <ErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
        linking={deepLinkConfig}
        onReady={handleReady}>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
