import {DEEP_LINK_PREFIXES} from './constants';
import type {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from '../types/navigation';

export const deepLinkConfig: LinkingOptions<RootStackParamList> = {
  prefixes: DEEP_LINK_PREFIXES,
  config: {
    screens: {
      WebView: {
        path: '*',
      },
    },
  },
};
