import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RecordingsStore } from '@/data/recordingsStore';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const enabled = process.env.EXPO_PUBLIC_ENABLE_CROSS_TAB_SYNC !== 'false';
    RecordingsStore.setCrossTabSyncEnabled(enabled);
    return () => {
      RecordingsStore.disableCrossTabSync();
    };
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
