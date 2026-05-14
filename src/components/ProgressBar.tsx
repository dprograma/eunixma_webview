import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

type Props = {
  progress: number;
  visible: boolean;
};

export default function ProgressBar({progress, visible}: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (progress >= 1) {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        delay: 200,
        useNativeDriver: false,
      }).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [progress, widthAnim, opacityAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          width: widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: '#2196F3',
    zIndex: 10,
  },
});
