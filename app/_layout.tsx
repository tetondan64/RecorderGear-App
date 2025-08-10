import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SummaryStylesProvider } from '@/context/SummaryStylesContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SummaryStylesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </SummaryStylesProvider>
  );
}
