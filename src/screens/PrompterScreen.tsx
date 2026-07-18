import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Script } from '../types';
import { Settings } from '../lib/settings';

interface Props {
  script: Script | null;
  settings: Settings;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onOpenScripts: () => void;
  onOpenSettings: () => void;
  onEditScript: () => void;
}

const SPEED_MIN = 1;
const SPEED_MAX = 10;

/** Velocidad en píxeles/segundo, proporcional al tamaño de fuente
 *  (misma velocidad de LECTURA aunque cambie la fuente). */
function pxPerSecond(speed: number, fontSize: number): number {
  const lineHeight = fontSize * 1.35;
  const linesPerSecond = 0.06 + speed * 0.085; // ~0.15–0.9 líneas/s
  return lineHeight * linesPerSecond;
}

export default function PrompterScreen({
  script,
  settings,
  onChangeSettings,
  onOpenScripts,
  onOpenSettings,
  onEditScript,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const contentHRef = useRef(0);
  const viewportHRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const { fontSize, align, mirrorH, mirrorV, areaPct, bgOpacity, bgLight, guide, speed } =
    settings;
  const lineHeight = Math.round(fontSize * 1.35);

  // Scroll automático suave con requestAnimationFrame.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const pps = pxPerSecond(speed, fontSize);
    const tick = (t: number) => {
      if (last !== null) {
        offsetRef.current += (pps * (t - last)) / 1000;
        const maxOffset = Math.max(0, contentHRef.current - viewportHRef.current);
        if (offsetRef.current >= maxOffset) {
          offsetRef.current = maxOffset;
          scrollRef.current?.scrollTo({ y: maxOffset, animated: false });
          setPlaying(false);
          setAtEnd(true);
          return;
        }
        scrollRef.current?.scrollTo({ y: offsetRef.current, animated: false });
      }
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, fontSize]);

  // Al cambiar de guión, vuelve al inicio.
  useEffect(() => {
    offsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setPlaying(false);
    setAtEnd(false);
  }, [script?.id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
    setAtEnd(false);
  };

  const restart = () => {
    offsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setAtEnd(false);
    setPlaying(true);
  };

  const areaHeight = Math.round((screenH * areaPct) / 100);
  const textColor = bgLight ? '#111111' : '#FFFFFF';
  const bgBase = bgLight ? '255,255,255' : '0,0,0';
  const areaBg = `rgba(${bgBase},${(bgOpacity / 100).toFixed(2)})`;

  return (
    <View style={styles.root}>
      {/* En F3 esta zona pasa a ser la vista de cámara. */}
      <View style={styles.stage}>
        <View
          style={[
            styles.textArea,
            {
              height: areaHeight,
              paddingTop: insets.top + 6,
              backgroundColor: areaBg,
              transform: [{ scaleX: mirrorH ? -1 : 1 }, { scaleY: mirrorV ? -1 : 1 }],
            },
          ]}
        >
          {script ? (
            <ScrollView
              ref={scrollRef}
              onScroll={onScroll}
              scrollEventThrottle={32}
              onScrollBeginDrag={() => setPlaying(false)}
              onContentSizeChange={(_, h) => {
                contentHRef.current = h;
              }}
              onLayout={(e) => {
                viewportHRef.current = e.nativeEvent.layout.height;
              }}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.round(areaHeight * 0.8) },
              ]}
            >
              <Text
                style={{
                  color: textColor,
                  fontSize,
                  lineHeight,
                  fontWeight: '600',
                  textAlign: align,
                }}
              >
                {script.content}
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay guión seleccionado.</Text>
              <Text style={styles.emptyHint}>Toca “Guiones” para crear uno.</Text>
            </View>
          )}

          {guide && (
            <View pointerEvents="none" style={[styles.guide, { top: insets.top + 6 + lineHeight }]}>
              <View style={styles.guideArrow} />
              <View style={styles.guideLine} />
            </View>
          )}
        </View>

        <Pressable
          style={[styles.editFab, { top: insets.top + 8 }]}
          onPress={onEditScript}
          disabled={!script}
        >
          <Text style={styles.editFabText}>✎</Text>
        </Pressable>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.sideGroup}>
          <Pressable style={styles.controlButton} onPress={onOpenSettings}>
            <Text style={styles.controlIcon}>⚙︎</Text>
            <Text style={styles.controlLabel}>Ajustes</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={onOpenScripts}>
            <Text style={styles.controlIcon}>☰</Text>
            <Text style={styles.controlLabel}>Guiones</Text>
          </Pressable>
        </View>

        <View style={styles.speedGroup}>
          <Pressable
            style={styles.speedButton}
            onPress={() => onChangeSettings({ speed: Math.max(SPEED_MIN, speed - 1) })}
          >
            <Text style={styles.speedButtonText}>−</Text>
          </Pressable>
          <Pressable
            style={[styles.playButton, playing && styles.playButtonActive]}
            onPress={() => (atEnd ? restart() : setPlaying((p) => !p))}
            disabled={!script}
          >
            <Text style={styles.playButtonText}>{playing ? '❚❚' : atEnd ? '↺' : '▶'}</Text>
          </Pressable>
          <Pressable
            style={styles.speedButton}
            onPress={() => onChangeSettings({ speed: Math.min(SPEED_MAX, speed + 1) })}
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
  stage: { flex: 1 },
  textArea: { overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  emptyHint: { color: colors.textDim, fontSize: 16 },
  guide: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.accent,
  },
  guideLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.55,
  },
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
  sideGroup: { flexDirection: 'row', gap: 18 },
  controlButton: { alignItems: 'center', minWidth: 52 },
  controlIcon: { color: colors.text, fontSize: 22 },
  controlLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  speedGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  speedIndicator: { minWidth: 52, alignItems: 'center' },
  speedIndicatorText: { color: colors.textDim, fontSize: 13 },
});
