import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectionDropdownProps<T> {
  options: readonly T[];
  selectedValue: T | null;
  onSelect: (value: T | null) => void;
  placeholder: string;
  disabled?: boolean;
  compact?: boolean;
}

export function SelectionDropdown<T extends string>({
  options,
  selectedValue,
  onSelect,
  placeholder,
  disabled = false,
  compact = false,
}: SelectionDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: T) => {
    onSelect(value);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdown,
          compact && styles.dropdownCompact,
          disabled && styles.dropdownDisabled,
          isOpen && styles.dropdownOpen,
        ]}
        onPress={handleToggle}
        disabled={disabled}
        testID={compact ? 'selection-dropdown-1' : 'selection-dropdown-0'}
      >
        <Text
          style={[
            styles.dropdownText,
            compact && styles.dropdownTextCompact,
            !selectedValue && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedValue || placeholder}
        </Text>
        <ChevronDown
          size={compact ? 16 : 20}
          color={disabled ? '#cbd5e1' : '#64748b'}
          style={[styles.chevron, isOpen && styles.chevronRotated]}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedValue === item && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item && styles.selectedOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedValue === item && (
                    <Check size={18} color="#667eea" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
    transform: [{ skewX: '1deg' }],
  },
  dropdownCompact: {
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    transform: [],
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  dropdownDisabled: {
    backgroundColor: '#000000',
    borderColor: '#e2e8f0',
  },
  dropdownOpen: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  dropdownTextCompact: {
    fontSize: 14,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  disabledText: {
    color: '#cbd5e1',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 16,
    margin: 20,
    maxHeight: 300,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedOption: {
    backgroundColor: '#333333',
    borderRadius: 12,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '0.5deg' }],
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  selectedOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
});