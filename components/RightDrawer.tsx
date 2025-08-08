import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';
import { FileText, Tag, X } from 'lucide-react-native';

interface RightDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
}

export default function RightDrawer({ isVisible, onClose }: RightDrawerProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate responsive drawer width (86% of screen, capped at 420px)
  const drawerWidth = Math.min(screenWidth * 0.86, 420);
  
  // Animation values
  const translateX = useSharedValue(drawerWidth);
  const scrimOpacity = useSharedValue(0);

  // Menu items
  const menuItems: MenuItem[] = [
    {
      id: 'file-explorer',
      title: 'File Explorer',
      icon: <FileText size={24} color="#f4ad3d" strokeWidth={1.5} />,
      route: '/file-explorer',
    },
    {
      id: 'tag-explorer',
      title: 'Tag Explorer',
      icon: <Tag size={24} color="#f4ad3d" strokeWidth={1.5} />,
      route: '/tag-explorer',
    },
  ];

  // Animate drawer visibility
  useEffect(() => {
    if (isVisible) {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      scrimOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withSpring(drawerWidth, {
        damping: 20,
        stiffness: 300,
      });
      scrimOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, drawerWidth]);

  // Swipe to close gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping to the right (closing)
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, drawerWidth);
        scrimOpacity.value = 1 - (event.translationX / drawerWidth);
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationX > drawerWidth * 0.3 || event.velocityX > 500;
      
      if (shouldClose) {
        translateX.value = withSpring(drawerWidth);
        scrimOpacity.value = withTiming(0);
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0);
        scrimOpacity.value = withTiming(1);
      }
    });

  // Animated styles
  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const scrimAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  const handleMenuItemPress = (route: string) => {
    // Close drawer first, then navigate
    onClose();
    router.push(route);
  };

  const handleScrimPress = () => {
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      {/* Semi-transparent scrim */}
      <Animated.View style={[styles.scrim, scrimAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.scrimTouchable} 
          onPress={handleScrimPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[
            styles.drawer, 
            { 
              width: drawerWidth,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
            drawerAnimatedStyle
          ]}
        >
          <BlurView intensity={40} style={styles.drawerBlur}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>More</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <X size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.route)}
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.title}`}
                >
                  <View style={styles.menuItemIcon}>
                    {item.icon}
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrimTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerBlur: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
});