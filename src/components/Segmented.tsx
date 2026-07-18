import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Control segmentado simple (estilo iOS) sin dependencias. */
export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.root}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: 3,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: colors.accentDark,
  },
  label: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.text,
  },
});
