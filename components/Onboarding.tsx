import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_W = Dimensions.get('window').width;

const SLIDES = [
  {
    id: '1',
    icon: icons.moviesapp,
    title: 'Welcome to Watchable',
    description:
      'Your personal movie companion. Discover new films, save your favourites, and track everything you watch.',
    iconSize: 88,
    tintColor: undefined,
  },
  {
    id: '2',
    icon: icons.home,
    title: 'Browse & Discover',
    description:
      "Explore trending releases and the latest movies. Filter by genre to find exactly what you're in the mood for.",
    iconSize: 58,
    tintColor: '#fff' as const,
  },
  {
    id: '3',
    icon: icons.save,
    title: 'Save for Later',
    description:
      'Bookmark any movie with one tap. Your personal watch-later list is always ready when you are.',
    iconSize: 58,
    tintColor: '#fff' as const,
  },
  {
    id: '4',
    icon: icons.play,
    title: 'Track & Rate',
    description:
      'Mark movies as watched and rate them 1–5 stars. See your total watch time and personal stats.',
    iconSize: 52,
    tintColor: '#fff' as const,
  },
];

const Dot = ({ active }: { active: boolean }) => {
  const width = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.35);

  useEffect(() => {
    width.value = withTiming(active ? 24 : 8, { duration: 250 });
    opacity.value = withTiming(active ? 1 : 0.35, { duration: 250 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
};

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 500 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
  }));

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      onComplete();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <Animated.View style={[styles.container, entranceStyle]}>
      <Image source={images.bg} style={styles.bg} />

      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={onComplete} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.glowOuter}>
              <View style={styles.glowInner}>
                <Image
                  source={item.icon}
                  style={{ width: item.iconSize, height: item.iconSize, resizeMode: 'contain' }}
                  tintColor={item.tintColor}
                />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === activeIndex} />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.btnText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030014',
  },
  bg: {
    position: 'absolute',
    width: '100%',
    opacity: 0.65,
    top: 0,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 181, 219, 0.1)',
  },
  skipText: {
    color: '#A8B5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  glowOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 52,
  },
  glowInner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  description: {
    color: '#A8B5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 56,
    gap: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: 'rgba(79, 70, 229, 0.85)',
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
