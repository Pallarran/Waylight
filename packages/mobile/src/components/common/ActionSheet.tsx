import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';

export interface ActionSheetOption {
  title: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelText?: string;
}

export default function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelText = 'Cancel',
}: ActionSheetProps) {
  const showNativeActionSheet = () => {
    if (Platform.OS === 'ios') {
      const buttonTitles = [...options.map(option => option.title), cancelText];
      const destructiveButtonIndex = options.findIndex(option => option.destructive);
      const cancelButtonIndex = options.length;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message,
          options: buttonTitles,
          destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            options[buttonIndex].onPress();
          }
          onClose();
        }
      );
    } else {
      // Android fallback using Alert
      const buttons = [
        ...options.map(option => ({
          text: option.title,
          onPress: option.onPress,
          style: option.destructive ? ('destructive' as const) : ('default' as const),
        })),
        {
          text: cancelText,
          style: 'cancel' as const,
          onPress: onClose,
        },
      ];

      Alert.alert(title || '', message, buttons);
    }
  };

  // For consistency, always use custom bottom sheet
  const renderCustomActionSheet = () => (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[300]}
      initialSnap={0}
    >
      <View style={styles.container}>
        {(title || message) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        )}

        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                option.destructive && styles.destructiveOption,
                option.disabled && styles.disabledOption,
              ]}
              onPress={() => {
                if (!option.disabled) {
                  option.onPress();
                  onClose();
                }
              }}
              disabled={option.disabled}
            >
              <View style={styles.optionContent}>
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      option.destructive
                        ? '#EF4444'
                        : option.disabled
                        ? '#94A3B8'
                        : '#0F172A'
                    }
                    style={styles.optionIcon}
                  />
                )}
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructiveText,
                    option.disabled && styles.disabledText,
                  ]}
                >
                  {option.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>{cancelText}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );

  if (!visible) return null;

  return renderCustomActionSheet();
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  destructiveOption: {
    backgroundColor: '#FEF2F2',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  destructiveText: {
    color: '#EF4444',
  },
  disabledText: {
    color: '#94A3B8',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
});