import {useState, useEffect, useRef} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {CONNECTIVITY_DEBOUNCE_MS} from '../config/constants';

type ConnectivityState = {
  isConnected: boolean;
  connectionType: string;
};

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>({
    isConnected: true,
    connectionType: 'unknown',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setState({
          isConnected: netState.isConnected ?? true,
          connectionType: netState.type,
        });
      }, CONNECTIVITY_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return state;
}
