import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Script } from '../types';

interface Props {
  script: Script;
  onSave: (id: string, title: string, content: string) => void;
  onClose: () => void;
}

const AUTOSAVE_MS = 600;

export default function EditorScreen({ script, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title: script.title, content: script.content });

  latestRef.current = { title, content };

  // Guardado automático con debounce.
  useEffect(() => {
    if (title === script.title && content === script.content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(script.id, latestRef.current.title, latestRef.current.content);
      setSavedAt(Date.now());
    }, AUTOSAVE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content]);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSave(script.id, latestRef.current.title, latestRef.current.content);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Text style={styles.headerAction}>Listo</Text>
        </Pressable>
        <Text style={styles.headerStatus}>
          {savedAt ? 'Guardado ✓' : 'Guardado automático'}
        </Text>
      </View>

      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Título del guión"
        placeholderTextColor={colors.textDim}
      />

      <TextInput
        style={[styles.contentInput, { marginBottom: insets.bottom + 8 }]}
        value={content}
        onChangeText={setContent}
        placeholder="Escribe aquí tu guión, sin límite de caracteres…"
        placeholderTextColor={colors.textDim}
        multiline
        textAlignVertical="top"
        autoFocus={script.content.length === 0}
      />
    </KeyboardAvoidingView>
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
  headerAction: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  headerStatus: { color: colors.textDim, fontSize: 13 },
  titleInput: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contentInput: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
