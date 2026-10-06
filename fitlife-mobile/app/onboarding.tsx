import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    image: require('../assets/images/omb1.png'),    
    title: 'Welcome to FitLife!',
    description: 'Your journey to a healthier lifestyle starts here.',
  },
  {
    key: 'slide2',
    image: require('../assets/images/omb1.png'),    
    title: 'Track Your Progress',
    description: 'Monitor your workouts, nutrition, and more.',
  },
  {
    key: 'slide3',
    image: require('../assets/images/omb1.png'),
    title: 'Join the Community',
    description: 'Connect with coaches and friends for motivation.',
  },
];

export const unstable_settings = { initialRouteName: 'onboarding' };

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true');
    router.replace('/auth/login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={{ width: 300, height: 200, marginBottom: 20 }} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
          ))}
        </View>
        <View style={styles.buttonRow}>
          {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNext} style={styles.nextButton} >
            <Text style={styles.nextText}>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

OnboardingScreen.options = { headerShown: false };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F97316', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 32 },
  footer: { padding: 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#eee', margin: 4 },
  activeDot: { backgroundColor: '#F97316' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipButton: { padding: 12 },
  skipText: { color: '#999', fontSize: 16 },
  nextButton: { backgroundColor: '#F97316', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
