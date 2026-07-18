import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// @ts-ignore — API interna de react-native-web para renderear elementos DOM
import { unstable_createElement } from 'react-native-web';
import { colors } from '../theme';
import {
  CameraFacing,
  CameraQuality,
  CameraStageHandle,
  RecordedVideo,
} from '../lib/cameraTypes';
import type { CameraStageProps } from './CameraStage';

function constraintsFor(facing: CameraFacing, quality: CameraQuality): MediaStreamConstraints {
  const dims =
    quality === '1080p'
      ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 } };
  return {
    video: {
      facingMode: facing === 'front' ? 'user' : 'environment',
      frameRate: { ideal: 30 },
      ...dims,
    },
    audio: true,
  };
}

function pickMimeType(): string {
  const candidates = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? '';
}

/** Variante WEB: vista previa con getUserMedia y grabación con MediaRecorder. */
const CameraStage = forwardRef<CameraStageHandle, CameraStageProps>(function CameraStage(
  { facing, quality, mirrorPreview, onStatus },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recStartRef = useRef(0);
  const [error, setError] = useState<'denied' | 'unavailable' | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const attachStream = useCallback((stream: MediaStream | null) => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, []);

  // Abre/reabre la cámara cuando cambian frontal/trasera o calidad.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      attachStream(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('unavailable');
        onStatus?.('unavailable');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          constraintsFor(facing, quality),
        );
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        attachStream(stream);
        onStatus?.('ready');
      } catch (e: any) {
        if (cancelled) return;
        const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
        setError(denied ? 'denied' : 'unavailable');
        onStatus?.(denied ? 'denied' : 'unavailable');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, quality, retryKey, attachStream, onStatus]);

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      const stream = streamRef.current;
      if (!stream || typeof MediaRecorder === 'undefined') return false;
      const mimeType = pickMimeType();
      try {
        const rec = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: quality === '1080p' ? 8_000_000 : 5_000_000,
        });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.start(1000);
        recorderRef.current = rec;
        recStartRef.current = performance.now();
        return true;
      } catch {
        return false;
      }
    },
    stopRecording: () =>
      new Promise<RecordedVideo | null>((resolve) => {
        const rec = recorderRef.current;
        if (!rec || rec.state === 'inactive') {
          resolve(null);
          return;
        }
        rec.onstop = () => {
          recorderRef.current = null;
          const type = rec.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type });
          chunksRef.current = [];
          if (blob.size === 0) {
            resolve(null);
            return;
          }
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            mimeType: type,
            durationSec: (performance.now() - recStartRef.current) / 1000,
          });
        };
        rec.stop();
      }),
  }));

  const mirrored = facing === 'front' && mirrorPreview;

  const videoEl = unstable_createElement('video', {
    ref: (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el && streamRef.current && el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
      }
    },
    autoPlay: true,
    playsInline: true,
    muted: true,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: mirrored ? 'scaleX(-1)' : undefined,
    },
  });

  return (
    <View style={styles.root} pointerEvents={error ? 'auto' : 'none'}>
      {videoEl}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {error === 'denied' ? 'Permiso de cámara denegado' : 'Cámara no disponible'}
          </Text>
          <Text style={styles.errorHint}>
            {error === 'denied'
              ? 'Permite el acceso a cámara y micrófono en Safari (Ajustes del sitio) y reintenta.'
              : 'Este navegador no permite usar la cámara. El prompter sigue funcionando.'}
          </Text>
          <Pressable style={styles.retry} onPress={() => setRetryKey((k) => k + 1)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

export default CameraStage;

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.background, overflow: 'hidden' },
  errorBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 120,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  errorHint: { color: colors.textDim, fontSize: 13, textAlign: 'center' },
  retry: {
    marginTop: 8,
    backgroundColor: colors.accentDark,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: { color: colors.text, fontWeight: '600' },
});
