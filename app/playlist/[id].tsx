import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Plus,
  Trash2,
  Music,
} from 'lucide-react-native';
import { useAudio, Song } from '@/contexts/AudioContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlaylistSong {
  id: string;
  song_uri: string;
  title: string;
  artist: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: PlaylistSong[];
}

const PLAYLISTS_KEY = 'app_playlists';
const STORAGE_KEY = 'local_audio_files';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const { playSong } = useAudio();

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        loadPlaylist();
      }
    }, [id])
  );

  const loadPlaylist = async () => {
    try {
      const savedPlaylists = await AsyncStorage.getItem(PLAYLISTS_KEY);
      if (savedPlaylists) {
        const playlists = JSON.parse(savedPlaylists);
        const found = playlists.find((p: Playlist) => p.id === id);
        if (found) {
          setPlaylist(found);
          setSongs(found.songs || []);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  const loadAvailableSongs = async () => {
    try {
      const savedSongs = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSongs) {
        const parsedSongs = JSON.parse(savedSongs);
        setAvailableSongs(parsedSongs);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const handleOpenAddSongs = () => {
    loadAvailableSongs();
    setModalVisible(true);
  };

  const handleAddSong = async (song: Song) => {
    if (!playlist) return;

    const newSong: PlaylistSong = {
      id: Date.now().toString(),
      song_uri: song.uri,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
    };

    const updatedPlaylist = {
      ...playlist,
      songs: [...playlist.songs, newSong],
    };

    try {
      const savedPlaylists = await AsyncStorage.getItem(PLAYLISTS_KEY);
      if (savedPlaylists) {
        const playlists = JSON.parse(savedPlaylists);
        const updated = playlists.map((p: Playlist) =>
          p.id === playlist.id ? updatedPlaylist : p
        );
        await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
        setPlaylist(updatedPlaylist);
        setSongs(updatedPlaylist.songs);
        Alert.alert('Successo', 'Brano aggiunto alla playlist');
      }
    } catch (error) {
      console.error('Error adding song:', error);
      Alert.alert('Errore', 'Impossibile aggiungere il brano');
    }
  };

  const handleRemoveSong = (songId: string) => {
    Alert.alert(
      'Conferma rimozione',
      'Vuoi rimuovere questo brano dalla playlist?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            if (!playlist) return;

            const updatedSongs = playlist.songs.filter(
              (s) => s.id !== songId
            );
            const updatedPlaylist = {
              ...playlist,
              songs: updatedSongs,
            };

            try {
              const savedPlaylists = await AsyncStorage.getItem(PLAYLISTS_KEY);
              if (savedPlaylists) {
                const playlists = JSON.parse(savedPlaylists);
                const updated = playlists.map((p: Playlist) =>
                  p.id === playlist.id ? updatedPlaylist : p
                );
                await AsyncStorage.setItem(
                  PLAYLISTS_KEY,
                  JSON.stringify(updated)
                );
                setPlaylist(updatedPlaylist);
                setSongs(updatedSongs);
              }
            } catch (error) {
              console.error('Error removing song:', error);
              Alert.alert('Errore', 'Impossibile rimuovere il brano');
            }
          },
        },
      ]
    );
  };

  const handlePlaySong = (song: PlaylistSong, index: number) => {
    const songList: Song[] = songs.map((s) => ({
      uri: s.song_uri,
      title: s.title,
      artist: s.artist,
      duration: s.duration,
    }));

    playSong(songList[index], songList, index);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      const songList: Song[] = songs.map((s) => ({
        uri: s.song_uri,
        title: s.title,
        artist: s.artist,
        duration: s.duration,
      }));

      playSong(songList[0], songList, 0);
    }
  };

  const renderSongItem = ({
    item,
    index,
  }: {
    item: PlaylistSong;
    index: number;
  }) => {
    const isSelected = selectedSongId === item.id;

    return (
      <View style={styles.songItem}>
        <TouchableOpacity
          style={styles.songContent}
          onPress={() => {
            if (isSelected) {
              handlePlaySong(item, index);
              setSelectedSongId(null);
            } else {
              setSelectedSongId(item.id);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.songPosition}>{index + 1}</Text>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
          {isSelected ? (
            <Trash2 size={18} color="#ff4444" />
          ) : (
            <Play size={18} color="#1DB954" />
          )}
        </TouchableOpacity>
        {isSelected && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => {
                setSelectedSongId(null);
                handlePlaySong(item, index);
              }}
              style={styles.actionButton}
            >
              <Play size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Riproduci</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedSongId(null);
                handleRemoveSong(item.id);
              }}
              style={[styles.actionButton, styles.deleteActionButton]}
            >
              <Trash2 size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Rimuovi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderAvailableSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.availableSongItem}
      onPress={() => handleAddSong(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Plus size={20} color="#1DB954" />
    </TouchableOpacity>
  );

  if (!playlist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.emptyText}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{playlist.name}</Text>
          {playlist.description ? (
            <Text style={styles.description}>{playlist.description}</Text>
          ) : null}
          <Text style={styles.songCount}>{songs.length} brani</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {songs.length > 0 && (
          <TouchableOpacity
            style={styles.playAllButton}
            onPress={handlePlayAll}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.playAllText}>Riproduci tutto</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAddSongs}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Aggiungi brani</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={songs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Music size={60} color="#888" />
            <Text style={styles.emptyText}>Nessun brano in questa playlist</Text>
            <Text style={styles.emptySubtext}>
              Aggiungi brani dalla tua libreria
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aggiungi brani</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Chiudi</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSongs}
              renderItem={renderAvailableSongItem}
              keyExtractor={(item, index) => `${item.uri}-${index}`}
              contentContainerStyle={styles.modalList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Nessun brano disponibile
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Aggiungi brani alla libreria prima
                  </Text>
                </View>
              }
            />
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
  backButton: {
    marginBottom: 15,
  },
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  songCount: {
    fontSize: 12,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  playAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  playAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#404040',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  songContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  songPosition: {
    color: '#888',
    fontSize: 14,
    width: 30,
    textAlign: 'center',
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: '#888',
    fontSize: 14,
  },
  removeButton: {
    padding: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#1DB954',
    borderRadius: 6,
    gap: 6,
  },
  deleteActionButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  modalList: {
    padding: 20,
  },
  availableSongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#282828',
    borderRadius: 8,
    marginBottom: 8,
  },
});
