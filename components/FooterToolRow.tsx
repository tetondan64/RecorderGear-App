import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lightbulb, MessageCircle, Pin } from 'lucide-react-native';

interface FooterToolRowProps {
  onSummarize?: () => void;
  onChat?: () => void;
  onPin?: () => void;
}

export default function FooterToolRow({ onSummarize, onChat, onPin }: FooterToolRowProps) {
  const tools = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: <Lightbulb size={20} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />,
      onPress: onSummarize,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageCircle size={20} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />,
      onPress: onChat,
    },
    {
      id: 'pin',
      label: 'Pin',
      icon: <Pin size={20} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />,
      onPress: onPin,
    },
  ];

  return (
    <View style={styles.container}>
      {tools.map((tool) => (
        <TouchableOpacity 
          key={tool.id}
          style={styles.toolButton} 
          onPress={tool.onPress}
          disabled={true} // Disabled placeholder state
        >
          <BlurView intensity={18} style={styles.toolButtonBlur}>
            {tool.icon}
            <Text style={styles.toolButtonText}>{tool.label}</Text>
          </BlurView>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolButton: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    opacity: 0.6, // Disabled state
  },
  toolButtonBlur: {
    backgroundColor: 'rgba(244, 173, 61, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 0,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
  },
});