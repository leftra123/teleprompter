import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Script } from '../types';

interface Props {
  script: Script | null;
  onOpenScripts: () => void;
  onEditScript: () => void;
}

const SPEED_MIN = 1;
const SPEED_MAX = 10;
const TICK_MS = 16;

/** Píxeles por tick para cada nivel de velocidad (aprox. lineal). */
function pxPerTick(speed: number): number {
  return 0.25 + (speed - 1) * 0.35;
}

export default function PrompterScreen({ script, onOpenScripts, onEditScript }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  // Desplazamiento automático básico (versión F1; en F2 se reemplaza por
  // animación nativa con gestos y espejo).
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      offsetRef.current += pxPerTick(speed);
      scrollRef.current?.scrollTo({ y: offsetRef.current, animated: false });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed]);

  // Al cambiar de guión, vuelve al inicio.
  useEffect(() => {
    offsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setPlaying(false);
  }, [script?.id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  };

  return (
    <View style={styles.root}>
      {/* En F3 esta zona negra pasa a ser la vista de cámara. */}
      <View style={[styles.textArea, { paddingTop: insets.top + 8 }]}>
        {script ? (
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={32}
            onScrollBeginDrag={() => setPlaying(false)}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.prompterText}>{script.content}</Text>
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay guión seleccionado.</Text>
            <Text style={styles.emptyHint}>Toca “Guiones” para crear uno.</Text>
          </View>
        )}
        <Pressable
          style={[styles.editFab, { top: insets.top + 8 }]}
          onPress={onEditScript}
          disabled={!script}
        >
          <Text style={styles.editFabText}>✎</Text>
        </Pressable>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={styles.controlButton} onPress={onOpenScripts}>
          <Text style={styles.controlIcon}>☰</Text>
          <Text style={styles.controlLabel}>Guiones</Text>
        </Pressable>

        <View style={styles.speedGroup}>
          <Pressable
            style={styles.speedButton}
            onPress={() => setSpeed((s) => Math.max(SPEED_MIN, s - 1))}
          >
            <Text style={styles.speedButtonText}>−</Text>
          </Pressable>
          <Pressable
            style={[styles.playButton, playing && styles.playButtonActive]}
            onPress={() => setPlaying((p) => !p)}
            disabled={!script}
          >
            <Text style={styles.playButtonText}>{playing ? '❚❚' : '▶'}</Text>
          </Pressable>
          <Pressable
            style={styles.speedButton}
            onPress={() => setSpeed((s) => Math.min(SPEED_MAX, s + 1))}
          >
            <Text style={styles.speedButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.speedIndicator}>
          <Text style={styles.speedIndicatorText}>vel. {speed}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  textArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 400 },
  prompterText: {
    color: colors.text,
    fontSize: fonts.prompterSize,
    lineHeight: fonts.prompterLineHeight,
    fontWeight: '600',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  emptyHint: { color: colors.textDim, fontSize: 16 },
  editFab: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFabText: { color: colors.text, fontSize: 20 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
  },
  controlButton: { alignItems: 'center', minWidth: 64 },
  controlIcon: { color: colors.text, fontSize: 22 },
  controlLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  speedGroup: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  speedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonText: { color: colors.text, fontSize: 24, fontWeight: '600' },
  playButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: { backgroundColor: colors.accent },
  playButtonText: { color: colors.text, fontSize: 22 },
  speedIndicator: { minWidth: 64, alignItems: 'center' },
  speedIndicatorText: { color: colors.textDim, fontSize: 13 },
});
