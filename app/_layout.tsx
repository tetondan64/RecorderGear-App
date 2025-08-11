import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RecordingsStore } from '@/data/recordingsStore';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const disabled =
      process.env.EXPO_PUBLIC_DISABLE_CROSS_TAB_SYNC?.toLowerCase() === 'true';

    if (!disabled) {
      RecordingsStore.initCrossTabSync();
      return () => {
        RecordingsStore.disableCrossTabSync();
      };
    }

    // If disabled, ensure any existing channel is cleaned up
    RecordingsStore.disableCrossTabSync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
