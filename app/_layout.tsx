import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AudioProvider } from '@/contexts/AudioContext';
import MiniPlayer from '@/components/MiniPlayer';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AudioProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <MiniPlayer />
      <StatusBar style="auto" />
    </AudioProvider>
  );
}
