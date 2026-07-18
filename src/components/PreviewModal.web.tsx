import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — API interna de react-native-web para renderear elementos DOM
import { unstable_createElement } from 'react-native-web';
import { colors } from '../theme';
import { formatClock } from '../lib/cameraTypes';
import type { PreviewModalProps } from './PreviewModal';

function extFor(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  return 'video';
}

/** Variante WEB: reproduce el video grabado y permite guardarlo/compartirlo. */
export default function PreviewModal({ video, onClose }: PreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const save = async () => {
    if (!video) return;
    setSaving(true);
    setNote(null);
    const blob = video.blob as Blob;
    const name = `teleprompter-${Date.now()}.${extFor(video.mimeType)}`;
    try {
      const file = new File([blob], name, { type: blob.type });
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: { files: File[] }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        // iPhone: hoja de compartir → "Guardar video" lo deja en Fotos.
        await nav.share({ files: [file] });
        setNote('Compartido ✓');
      } else {
        const a = document.createElement('a');
        a.href = video.url;
        a.download = name;
        a.click();
        setNote('Descarga iniciada ✓');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setNote('No se pudo guardar. Prueba de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (video) URL.revokeObjectURL(video.url);
    setNote(null);
    onClose();
  };

  const videoEl = video
    ? unstable_createElement('video', {
        src: video.url,
        controls: true,
        playsInline: true,
        style: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' },
      })
    : null;

  return (
    <Modal visible={video !== null} animationType="slide" onRequestClose={discard}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu grabación</Text>
          {video && (
            <Text style={styles.meta}>
              {formatClock(video.durationSec)} · {extFor(video.mimeType).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.player}>{videoEl}</View>

        {note && <Text style={styles.note}>{note}</Text>}

        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.buttonGhost]} onPress={discard}>
            <Text style={styles.buttonGhostText}>Descartar</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.buttonPrimaryText}>
              {saving ? 'Guardando…' : 'Guardar / Compartir'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          En iPhone: elige “Guardar video” en la hoja de compartir para dejarlo en Fotos.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 13 },
  player: { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' },
  note: { color: colors.accent, fontSize: 13, textAlign: 'center', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonGhost: { backgroundColor: colors.surfaceLight },
  buttonGhostText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  buttonPrimary: { backgroundColor: colors.accentDark },
  buttonPrimaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
