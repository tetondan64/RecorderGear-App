import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SummaryStylesProvider } from '@/context/SummaryStylesContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <SummaryStylesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
      </SummaryStylesProvider>
      <StatusBar style="auto" />
    </>
  );
}
