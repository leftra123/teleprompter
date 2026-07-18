import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Settings } from '../lib/settings';
import Slider from './Slider';
import Segmented from './Segmented';

interface Props {
  visible: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

type Tab = 'texto' | 'area' | 'camara' | 'tiempo';

export default function SettingsPanel({ visible, settings, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('texto');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Zona superior transparente: tocar fuera cierra el panel. */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Segmented<Tab>
            options={[
              { value: 'texto', label: 'Texto' },
              { value: 'area', label: 'Área' },
              { value: 'camara', label: 'Cámara' },
              { value: 'tiempo', label: 'Tiempo' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <Text style={styles.closeText}>Listo</Text>
          </Pressable>
        </View>

        {tab === 'texto' ? (
          <>
            <Row label="Tamaño de fuente" value={`${settings.fontSize}pt`}>
              <Slider
                value={settings.fontSize}
                min={20}
                max={72}
                step={2}
                onChange={(v) => onChange({ fontSize: v })}
              />
            </Row>

            <Row label="Alineación">
              <Segmented
                options={[
                  { value: 'left', label: 'Izquierda' },
                  { value: 'center', label: 'Centrar' },
                  { value: 'right', label: 'Derecha' },
                ]}
                value={settings.align}
                onChange={(v) => onChange({ align: v })}
              />
            </Row>

            <Row label="Espejo">
              <Segmented
                options={[
                  { value: 'off', label: 'Apagado' },
                  { value: 'h', label: 'Horizontal' },
                  { value: 'v', label: 'Vertical' },
                ]}
                value={settings.mirrorH ? 'h' : settings.mirrorV ? 'v' : 'off'}
                onChange={(v) =>
                  onChange({ mirrorH: v === 'h', mirrorV: v === 'v' })
                }
              />
            </Row>
          </>
        ) : tab === 'area' ? (
          <>
            <Row label="Alto del área" value={`${settings.areaPct}%`}>
              <Slider
                value={settings.areaPct}
                min={30}
                max={100}
                step={5}
                onChange={(v) => onChange({ areaPct: v })}
              />
            </Row>

            <Row label="Opacidad del fondo" value={`${settings.bgOpacity}%`}>
              <Slider
                value={settings.bgOpacity}
                min={0}
                max={100}
                step={5}
                onChange={(v) => onChange({ bgOpacity: v })}
              />
            </Row>

            <Row label="Fondo">
              <Segmented
                options={[
                  { value: 'dark', label: 'Negro' },
                  { value: 'light', label: 'Blanco' },
                ]}
                value={settings.bgLight ? 'light' : 'dark'}
                onChange={(v) => onChange({ bgLight: v === 'light' })}
              />
            </Row>

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Guía de lectura</Text>
              <Switch
                value={settings.guide}
                onValueChange={(v) => onChange({ guide: v })}
                trackColor={{ true: colors.accentDark, false: colors.surfaceLight }}
                thumbColor="#FFFFFF"
              />
            </View>
          </>
        ) : tab === 'camara' ? (
          <>
            <Row label="Cámara">
              <Segmented
                options={[
                  { value: 'front', label: 'Frontal' },
                  { value: 'back', label: 'Trasera' },
                ]}
                value={settings.facing}
                onChange={(v) => onChange({ facing: v })}
              />
            </Row>

            <Row label="Calidad">
              <Segmented
                options={[
                  { value: '720p', label: '720p HD' },
                  { value: '1080p', label: '1080p Full HD' },
                ]}
                value={settings.quality}
                onChange={(v) => onChange({ quality: v })}
              />
            </Row>

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Espejo cámara frontal</Text>
              <Switch
                value={settings.mirrorFront}
                onValueChange={(v) => onChange({ mirrorFront: v })}
                trackColor={{ true: colors.accentDark, false: colors.surfaceLight }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.hint}>
              El espejo afecta solo la vista previa; el video se graba normal.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Cuenta regresiva antes de grabar</Text>
              <Switch
                value={settings.countdownOn}
                onValueChange={(v) => onChange({ countdownOn: v })}
                trackColor={{ true: colors.accentDark, false: colors.surfaceLight }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.countdownOn && (
              <Row label="Segundos" value={`${settings.countdownSecs}s`}>
                <Slider
                  value={settings.countdownSecs}
                  min={3}
                  max={10}
                  step={1}
                  onChange={(v) => onChange({ countdownSecs: v })}
                />
              </Row>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Cronómetro al grabar</Text>
              <Switch
                value={settings.chronometer}
                onValueChange={(v) => onChange({ chronometer: v })}
                trackColor={{ true: colors.accentDark, false: colors.surfaceLight }}
                thumbColor="#FFFFFF"
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  closeButton: { paddingHorizontal: 4 },
  closeText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  row: { marginBottom: 16 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowValue: { color: colors.textDim, fontSize: 14 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 2, marginBottom: 8 },
});
