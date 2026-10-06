import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/redux/store';
import { router } from 'expo-router';
import { Provider } from 'react-redux';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const done = await AsyncStorage.getItem('onboardingComplete');
        if (!done && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, [pathname]);

  if (!loaded || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="/onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </Provider>
  );
}