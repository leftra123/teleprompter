import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import PrompterScreen from './src/screens/PrompterScreen';
import ScriptsScreen from './src/screens/ScriptsScreen';
import EditorScreen from './src/screens/EditorScreen';
import {
  createScript,
  duplicateScript,
  getLastScriptId,
  loadScripts,
  saveScripts,
  setLastScriptId,
} from './src/lib/storage';
import { Script } from './src/types';
import { colors } from './src/theme';

export default function App() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showScripts, setShowScripts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Carga inicial desde almacenamiento local.
  useEffect(() => {
    (async () => {
      const stored = await loadScripts();
      const lastId = await getLastScriptId();
      setScripts(stored);
      setSelectedId(
        stored.find((s) => s.id === lastId)?.id ?? stored[0]?.id ?? null,
      );
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next: Script[]) => {
    setScripts(next);
    saveScripts(next); // fire-and-forget: AsyncStorage serializa escrituras
  }, []);

  const selectScript = useCallback((script: Script) => {
    setSelectedId(script.id);
    setLastScriptId(script.id);
    setShowScripts(false);
  }, []);

  const handleCreate = useCallback(() => {
    const fresh = createScript('Nuevo guión');
    persist([fresh, ...scripts]);
    setSelectedId(fresh.id);
    setLastScriptId(fresh.id);
    setEditingId(fresh.id);
  }, [scripts, persist]);

  const handleDuplicate = useCallback(
    (script: Script) => {
      persist([duplicateScript(script), ...scripts]);
    },
    [scripts, persist],
  );

  const handleDelete = useCallback(
    (script: Script) => {
      const next = scripts.filter((s) => s.id !== script.id);
      persist(next);
      if (selectedId === script.id) {
        const fallback = next[0]?.id ?? null;
        setSelectedId(fallback);
        if (fallback) setLastScriptId(fallback);
      }
    },
    [scripts, selectedId, persist],
  );

  const handleSave = useCallback(
    (id: string, title: string, content: string) => {
      persist(
        scripts.map((s) =>
          s.id === id ? { ...s, title, content, updatedAt: Date.now() } : s,
        ),
      );
    },
    [scripts, persist],
  );

  const selected = scripts.find((s) => s.id === selectedId) ?? null;
  const editing = scripts.find((s) => s.id === editingId) ?? null;

  if (!loaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <PrompterScreen
        script={selected}
        onOpenScripts={() => setShowScripts(true)}
        onEditScript={() => selected && setEditingId(selected.id)}
      />

      <Modal visible={showScripts} animationType="slide" onRequestClose={() => setShowScripts(false)}>
        <ScriptsScreen
          scripts={scripts}
          selectedId={selectedId}
          onSelect={selectScript}
          onCreate={handleCreate}
          onEdit={(s) => setEditingId(s.id)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onClose={() => setShowScripts(false)}
        />
      </Modal>

      <Modal visible={editing !== null} animationType="slide" onRequestClose={() => setEditingId(null)}>
        {editing && (
          <EditorScreen script={editing} onSave={handleSave} onClose={() => setEditingId(null)} />
        )}
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background },
});
