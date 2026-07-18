import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { confirmDestructive } from '../lib/confirm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Script } from '../types';

interface Props {
  scripts: Script[];
  selectedId: string | null;
  onSelect: (script: Script) => void;
  onCreate: () => void;
  onEdit: (script: Script) => void;
  onDuplicate: (script: Script) => void;
  onDelete: (script: Script) => void;
  onClose: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

export default function ScriptsScreen({
  scripts,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  const confirmDelete = (script: Script) => {
    confirmDestructive(
      'Eliminar guión',
      `¿Eliminar “${script.title}”? Esta acción no se puede deshacer.`,
      'Eliminar',
      () => onDelete(script),
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.headerAction}>Cerrar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Guiones</Text>
        <Pressable onPress={onCreate} hitSlop={12}>
          <Text style={[styles.headerAction, styles.headerActionAccent]}>+ Nuevo</Text>
        </Pressable>
      </View>

      <FlatList
        data={[...scripts].sort((a, b) => b.updatedAt - a.updatedAt)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no tienes guiones.</Text>
            <Text style={styles.emptyHint}>Toca “+ Nuevo” para crear el primero.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || 'Sin título'}
                </Text>
                <Text style={styles.cardPreview} numberOfLines={2}>
                  {item.content || 'Guión vacío'}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.content.length.toLocaleString('es-CL')} caracteres · {formatDate(item.updatedAt)}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable hitSlop={8} onPress={() => onEdit(item)}>
                  <Text style={styles.cardAction}>✎</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => onDuplicate(item)}>
                  <Text style={styles.cardAction}>⧉</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => confirmDelete(item)}>
                  <Text style={[styles.cardAction, styles.cardActionDanger]}>🗑</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  headerAction: { color: colors.textDim, fontSize: 16 },
  headerActionAccent: { color: colors.accent, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyHint: { color: colors.textDim, fontSize: 15 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: colors.accent },
  cardBody: { flex: 1, marginRight: 10 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardPreview: { color: colors.textDim, fontSize: 14, marginTop: 4, lineHeight: 19 },
  cardMeta: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  cardActions: { justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardAction: { color: colors.text, fontSize: 18, padding: 2 },
  cardActionDanger: { color: colors.danger },
});
