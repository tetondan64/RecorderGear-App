import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HeaderProps {
  title: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  leftIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
  rightIcons?: Array<{
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel?: string;
  }>;
  addIcon?: React.ReactNode;
  onAddIconPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  rightIcon,
  onRightIconPress,
  leftIcon,
  onLeftIconPress,
  rightIcons,
  addIcon,
  onAddIconPress,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        
        {/* Add Button */}
        {addIcon && (
          <TouchableOpacity onPress={onAddIconPress} style={styles.addIconButton}>
            {addIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filter Icons Row */}
      {(rightIcons || leftIcon || rightIcon) && (
        <View style={styles.filtersRow}>
          {/* Left icon (trash) */}
          {leftIcon && (
            <TouchableOpacity onPress={onLeftIconPress} style={styles.filterIconButton}>
              {leftIcon}
            </TouchableOpacity>
          )}
          
          {/* Filter icons group */}
          <View style={styles.iconsGroup}>
            {rightIcons && rightIcons.map((iconItem, index) => (
              <TouchableOpacity 
                key={index}
                onPress={iconItem.onPress} 
                style={styles.filterIconButton}
                accessibilityLabel={iconItem.accessibilityLabel}
              >
                {iconItem.icon}
              </TouchableOpacity>
            ))}
            
            {/* Single right icon fallback */}
            {rightIcon && !rightIcons && (
              <TouchableOpacity onPress={onRightIconPress} style={styles.filterIconButton}>
                {rightIcon}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 32,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#f4ad3d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f4ad3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  iconsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;