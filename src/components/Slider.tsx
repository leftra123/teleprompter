import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const THUMB = 26;
const TRACK_H = 5;

/** Slider sin dependencias externas; funciona en iOS, Android y web. */
export default function Slider({ value, min, max, step = 1, onChange }: Props) {
  const [width, setWidth] = useState(0);

  // Refs para evitar closures obsoletos dentro del PanResponder.
  const stateRef = useRef({ min, max, step, width, onChange });
  stateRef.current = { min, max, step, width, onChange };

  const update = useCallback((x: number) => {
    const s = stateRef.current;
    if (s.width <= 0) return;
    const usable = s.width - THUMB;
    const frac = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    let next = s.min + frac * (s.max - s.min);
    next = Math.round(next / s.step) * s.step;
    next = Math.min(s.max, Math.max(s.min, next));
    s.onChange(next);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    }),
  ).current;

  const frac = max > min ? (value - min) / (max - min) : 0;
  const thumbLeft = frac * Math.max(0, width - THUMB);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { width: thumbLeft + THUMB / 2 }]} />
      <View style={[styles.thumb, { left: thumbLeft }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 40,
    justifyContent: 'center',
    flex: 1,
  },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.surfaceLight,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
  },
});
