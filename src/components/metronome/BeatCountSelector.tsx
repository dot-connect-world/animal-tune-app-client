import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RFValue, RWValue, RHValue, isTablet } from '../../utils/responsive';

interface BeatCountSelectorProps {
  value: number;
  onChange: (beats: number) => void;
  disabled?: boolean;
}

const BEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function BeatCountSelector({
  value,
  onChange,
  disabled = false,
}: BeatCountSelectorProps) {

  const renderButton = (option: number) => {
    const isActive = value === option;
    return (
      <TouchableOpacity
        key={option}
        style={[
          styles.button,
          isActive && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.7}
        onPress={() => onChange(option)}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>
          {option}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {BEAT_OPTIONS.slice(0, 4).map(renderButton)}
      </View>
      <View style={styles.row}>
        {BEAT_OPTIONS.slice(4).map(renderButton)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RWValue(14),
    paddingHorizontal: RWValue(isTablet ? 18 : 12),
    paddingVertical: RHValue(isTablet ? 10 : 8),
    marginTop: RHValue(isTablet ? 10 : 6),
    alignSelf: 'center',
    maxWidth: isTablet ? RWValue(380) : RWValue(280),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RWValue(4),
    marginBottom: RHValue(4),
  },
  button: {
    flex: 1,
    paddingVertical: RHValue(isTablet ? 8 : 6),
    borderRadius: RWValue(8),
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#FFB74D',
    borderColor: '#F59E0B',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: RFValue(isTablet ? 15 : 13),
    fontWeight: '700',
    color: '#8E8E93',
  },
  buttonTextActive: {
    color: '#1C1C1E',
  },
});
