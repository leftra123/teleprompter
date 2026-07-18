import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { CameraFacing, CameraQuality, CameraStageHandle } from '../lib/cameraTypes';

export interface CameraStageProps {
  facing: CameraFacing;
  quality: CameraQuality;
  mirrorPreview: boolean;
  /** Notifica si la cámara quedó lista o con error. */
  onStatus?: (status: 'ready' | 'denied' | 'unavailable') => void;
}

/**
 * Variante NATIVA (stub): la cámara nativa llega en F5 con la app de tiendas.
 * En web se usa CameraStage.web.tsx (getUserMedia + MediaRecorder).
 */
const CameraStage = forwardRef<CameraStageHandle, CameraStageProps>(function CameraStage(
  { onStatus },
  ref,
) {
  useImperativeHandle(ref, () => ({
    startRecording: () => false,
    stopRecording: async () => null,
  }));

  React.useEffect(() => {
    onStatus?.('unavailable');
  }, [onStatus]);

  return (
    <View style={styles.root}>
      <Text style={styles.text}>
        La cámara nativa estará disponible en la app de App Store / Play Store (F5).
      </Text>
    </View>
  );
});

export default CameraStage;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 24,
    backgroundColor: colors.background,
  },
  text: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginBottom: 90 },
});
