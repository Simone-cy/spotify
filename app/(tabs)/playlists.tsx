import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Plus, Music, Trash2, Edit } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

interface Playlist {
  id: string;
  name: string;
  description: string;
  created_at: string;
  songs: PlaylistSongData[];
}

interface PlaylistSongData {
  id: string;
  song_uri: string;
  title: string;
  artist: string;
  duration: number;
}

const PLAYLISTS_KEY = 'app_playlists';

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchPlaylists();
    }, [])
  );

  const fetchPlaylists = async () => {
    try {
      const savedPlaylists = await AsyncStorage.getItem(PLAYLISTS_KEY);
      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);
        setPlaylists(parsed);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
    }
  };

  const savePlaylists = async (newPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(newPlaylists));
      setPlaylists(newPlaylists);
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  };

  const openCreateModal = () => {
    setEditingPlaylist(null);
    setPlaylistName('');
    setPlaylistDescription('');
    setModalVisible(true);
  };

  const openEditModal = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description);
    setModalVisible(true);
  };

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la playlist');
      return;
    }

    let updatedPlaylists: Playlist[] = [];

    if (editingPlaylist) {
      updatedPlaylists = playlists.map((p) =>
        p.id === editingPlaylist.id
          ? {
              ...p,
              name: playlistName,
              description: playlistDescription,
            }
          : p
      );
    } else {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: playlistName,
        description: playlistDescription,
        created_at: new Date().toISOString(),
        songs: [],
      };
      updatedPlaylists = [...playlists, newPlaylist];
    }

    await savePlaylists(updatedPlaylists);
    setModalVisible(false);
    Alert.alert(
      'Successo',
      editingPlaylist ? 'Playlist aggiornata' : 'Playlist creata'
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questa playlist?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const filtered = playlists.filter((p) => p.id !== playlistId);
            await savePlaylists(filtered);
          },
        },
      ]
    );
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <View style={styles.playlistItem}>
      <TouchableOpacity
        style={styles.playlistContent}
        onPress={() => router.push(`/playlist/${item.id}`)}
      >
        <View style={styles.playlistIcon}>
          <Music size={30} color="#1DB954" />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.playlistDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.playlistCount}>
            {item.songs.length} brani
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.playlistActions}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.actionButton}
        >
          <Edit size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeletePlaylist(item.id)}
          style={styles.actionButton}
        >
          <Trash2 size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Le Tue Playlist</Text>
        <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
          <Plus size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crea Playlist</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        renderItem={renderPlaylistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Music size={60} color="#888" />
            <Text style={styles.emptyText}>Nessuna playlist</Text>
            <Text style={styles.emptySubtext}>
              Crea la tua prima playlist per organizzare la tua musica
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPlaylist ? 'Modifica Playlist' : 'Nuova Playlist'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome della playlist"
              placeholderTextColor="#888"
              value={playlistName}
              onChangeText={setPlaylistName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrizione (opzionale)"
              placeholderTextColor="#888"
              value={playlistDescription}
              onChangeText={setPlaylistDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePlaylist}
              >
                <Text style={styles.modalButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
  },
  playlistContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistDescription: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  playlistCount: {
    color: '#888',
    fontSize: 12,
  },
  playlistActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#282828',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#404040',
  },
  saveButton: {
    backgroundColor: '#1DB954',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
