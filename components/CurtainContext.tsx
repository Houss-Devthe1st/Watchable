import React, { createContext, useCallback, useContext } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
// +2 prevents a subpixel gap at the center seam when the curtains are fully closed
const HALF = W / 2 + 2;

interface CurtainContextType {
  close: (onClosed: () => void) => void;
  open: () => void;
}

const CurtainContext = createContext<CurtainContextType>({
  close: () => {},
  open: () => {},
});

export const useCurtain = () => useContext(CurtainContext);

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const leftX = useSharedValue(-HALF);
  const rightX = useSharedValue(HALF);

  const close = useCallback(
    (onClosed: () => void) => {
      rightX.value = withTiming(0, { duration: 360, easing: Easing.in(Easing.ease) });
      leftX.value = withTiming(0, { duration: 360, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onClosed)();
      });
    },
    [leftX, rightX]
  );

  const open = useCallback(() => {
    leftX.value = withTiming(-HALF, { duration: 420, easing: Easing.out(Easing.ease) });
    rightX.value = withTiming(HALF, { duration: 420, easing: Easing.out(Easing.ease) });
  }, [leftX, rightX]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
  }));

  return (
    <CurtainContext.Provider value={{ close, open }}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.panel, styles.left, leftStyle]} />
      <Animated.View pointerEvents="none" style={[styles.panel, styles.right, rightStyle]} />
    </CurtainContext.Provider>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    width: HALF,
    height: H,
    top: 0,
    backgroundColor: '#312e81',
    zIndex: 9999,
  },
  left: { left: 0 },
  right: { right: 0 },
});
