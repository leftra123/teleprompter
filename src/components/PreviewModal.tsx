import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { RecordedVideo } from '../lib/cameraTypes';

export interface PreviewModalProps {
  video: RecordedVideo | null;
  onClose: () => void;
}

/** Variante NATIVA (stub): la reproducción/guardado nativo llega en F5. */
export default function PreviewModal({ video, onClose }: PreviewModalProps) {
  return (
    <Modal visible={video !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Text style={styles.text}>Vista previa disponible en la app nativa (F5).</Text>
        <Pressable style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: { color: colors.textDim, fontSize: 14 },
  button: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: colors.text, fontWeight: '600' },
});
