import { Tabs } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
           tabBarItemStyle: { flex: 1 },
          tabBarBackground: () => (
            <LinearGradient
              colors={['rgba(15,23,42,0.95)', 'rgba(30,41,59,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarStyle: {
            borderTopWidth: 0,
            height: 90 + insets.bottom,
            paddingBottom: 20 + insets.bottom,
            paddingTop: 15,
            paddingHorizontal: 35,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: '',
            tabBarButton: (props) => (
              <TouchableOpacity {...props} style={styles.recordButtonWrapper}>
                <View style={styles.recordButton}>
                  <Mic size={20} color="#fff" strokeWidth={1.5} />
                  <Text style={styles.recordButtonText}>Record</Text>
                </View>
              </TouchableOpacity>
            ),
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
  recordButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  recordButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
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