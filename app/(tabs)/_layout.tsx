import { Tabs } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { FileText, Mic, Bot, Menu } from 'lucide-react-native';
import RightDrawer from '@/components/RightDrawer';

export default function TabLayout() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: '#f4ad3d',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
          tabBarStyle: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            height: 90 + insets.bottom,
            paddingBottom: 20 + insets.bottom,
            paddingTop: 15,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            href: '/library',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: '',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={[styles.fabContainer, focused && styles.fabContainerActive, styles.fabCentered]}>
                <BlurView intensity={18} style={styles.fabBlur}>
                  <Mic size={size} color={color} strokeWidth={1.5} />
                </BlurView>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="ai-tools"
          options={{
            title: 'AI Tools',
            tabBarIcon: ({ size, color }) => (
              <Bot size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: '',
            tabBarButton: (props) => (
              <TouchableOpacity 
                style={styles.hamburgerContainer}
                onPress={() => setIsDrawerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="More"
              >
                <BlurView intensity={18} style={styles.hamburgerButton}>
                  <Menu 
                    size={24} 
                    color="rgba(255, 255, 255, 0.7)" 
                    strokeWidth={1.5}
                  />
                </BlurView>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>
      
      <RightDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(244, 173, 61, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabContainerActive: {
    backgroundColor: 'rgba(244, 173, 61, 0.4)',
    borderColor: '#f4ad3d',
  },
  fabCentered: {
    marginBottom: 0,
    alignSelf: 'center',
  },
  fabBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
