import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { CameraStageHandle, RecordedVideo, formatClock } from '../lib/cameraTypes';
import { setKeepAwake } from '../lib/wakeLock';
import CameraStage from '../components/CameraStage';
import PreviewModal from '../components/PreviewModal';

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

type RecState = 'idle' | 'countdown' | 'recording';

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
  const cameraRef = useRef<CameraStageHandle>(null);
  const offsetRef = useRef(0);
  const contentHRef = useRef(0);
  const viewportHRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [recState, setRecState] = useState<RecState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [recorded, setRecorded] = useState<RecordedVideo | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'ready' | 'denied' | 'unavailable' | null>(
    null,
  );

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

  // Cuenta regresiva → inicia grabación al llegar a 0.
  useEffect(() => {
    if (recState !== 'countdown') return;
    if (countdown <= 0) {
      beginRecording();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, countdown]);

  // Cronómetro durante la grabación.
  useEffect(() => {
    if (recState !== 'recording') return;
    const started = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 500);
    return () => clearInterval(t);
  }, [recState]);

  // Pantalla siempre encendida mientras el prompter corre o se graba.
  useEffect(() => {
    const active = playing || recState !== 'idle';
    setKeepAwake(active);
    return () => setKeepAwake(false);
  }, [playing, recState]);

  const beginRecording = useCallback(() => {
    const ok = cameraRef.current?.startRecording() ?? false;
    if (!ok) {
      setRecState('idle');
      return;
    }
    setRecState('recording');
    // El guión vuelve al inicio y arranca solo.
    offsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setAtEnd(false);
    if (script) setPlaying(true);
  }, [script]);

  const stopRecording = useCallback(async () => {
    setRecState('idle');
    setPlaying(false);
    const video = await cameraRef.current?.stopRecording();
    if (video) setRecorded(video);
  }, []);

  const onRecordPress = useCallback(() => {
    if (recState === 'recording') {
      stopRecording();
    } else if (recState === 'countdown') {
      setRecState('idle'); // cancelar cuenta regresiva
    } else if (settings.countdownOn) {
      setCountdown(settings.countdownSecs);
      setRecState('countdown');
    } else {
      beginRecording();
    }
  }, [recState, settings.countdownOn, settings.countdownSecs, beginRecording, stopRecording]);

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
  const recording = recState === 'recording';

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        {/* Cámara de fondo (web: getUserMedia; nativo: llega en F5). */}
        <CameraStage
          ref={cameraRef}
          facing={settings.facing}
          quality={settings.quality}
          mirrorPreview={settings.mirrorFront}
          onStatus={setCameraStatus}
        />

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

        {/* Cronómetro */}
        {recording && settings.chronometer && (
          <View pointerEvents="none" style={[styles.chrono, { top: insets.top + 8 }]}>
            <View style={styles.chronoDot} />
            <Text style={styles.chronoText}>{formatClock(elapsed)}</Text>
          </View>
        )}

        {/* Cuenta regresiva */}
        {recState === 'countdown' && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
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

        {/* Botón de grabación */}
        <Pressable
          style={[styles.recButton, recording && styles.recButtonActive]}
          onPress={onRecordPress}
          disabled={cameraStatus !== 'ready' && recState === 'idle'}
        >
          <View
            style={[
              styles.recInner,
              recording ? styles.recInnerStop : null,
              cameraStatus !== 'ready' && !recording ? { opacity: 0.35 } : null,
            ]}
          />
        </Pressable>

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
          <Text style={styles.speedIndicatorText}>v{speed}</Text>
        </View>
      </View>

      <PreviewModal video={recorded} onClose={() => setRecorded(null)} />
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
  chrono: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chronoDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B30' },
  chronoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  countdownText: { color: '#FFFFFF', fontSize: 140, fontWeight: '800' },
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
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
  },
  sideGroup: { flexDirection: 'row', gap: 10 },
  controlButton: { alignItems: 'center', minWidth: 46 },
  controlIcon: { color: colors.text, fontSize: 22 },
  controlLabel: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  recButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recButtonActive: { borderColor: '#FF3B30' },
  recInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B30',
  },
  recInnerStop: { width: 26, height: 26, borderRadius: 6 },
  speedGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speedButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonText: { color: colors.text, fontSize: 20, fontWeight: '600' },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: { backgroundColor: colors.accent },
  playButtonText: { color: colors.text, fontSize: 17 },
  speedIndicatorText: { color: colors.textDim, fontSize: 11, width: 22 },
});
