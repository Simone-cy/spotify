import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Upload, Play, Trash2 } from 'lucide-react-native';
import { useAudio, Song } from '@/contexts/AudioContext';

const STORAGE_KEY = 'local_audio_files';

export default function LibraryScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionResponse, requestPermission] =
    MediaLibrary.usePermissions();
  const { playSong } = useAudio();

  useEffect(() => {
    loadSavedSongs();
  }, []);

  useEffect(() => {
    filterSongs();
  }, [searchQuery, songs]);

  const loadSavedSongs = async () => {
    try {
      const savedSongs = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSongs) {
        const parsedSongs = JSON.parse(savedSongs);
        setSongs(parsedSongs);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const saveSongs = async (newSongs: Song[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSongs));
    } catch (error) {
      console.error('Error saving songs:', error);
    }
  };

  const filterSongs = () => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  };

  const pickAudioFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets) {
        const newSongs: Song[] = result.assets.map((asset) => ({
          uri: asset.uri,
          title: asset.name.replace(/\.[^/.]+$/, ''),
          artist: 'Unknown Artist',
          duration: 0,
        }));

        const updatedSongs = [...songs, ...newSongs];
        setSongs(updatedSongs);
        await saveSongs(updatedSongs);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Errore', 'Impossibile selezionare i file audio');
    }
  };

  const scanMediaLibrary = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Non disponibile',
        'La scansione della libreria non è disponibile su web. Usa il pulsante di caricamento file.'
      );
      return;
    }

    if (!permissionResponse?.granted) {
      const permission = await requestPermission();
      if (!permission.granted) {
        Alert.alert(
          'Permesso negato',
          'È necessario il permesso per accedere alla libreria multimediale'
        );
        return;
      }
    }

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000,
      });

      const newSongs: Song[] = media.assets.map((asset) => ({
        uri: asset.uri,
        title: asset.filename.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        duration: asset.duration,
      }));

      setSongs(newSongs);
      await saveSongs(newSongs);
      Alert.alert('Successo', `${newSongs.length} brani trovati`);
    } catch (error) {
      console.error('Error scanning media library:', error);
      Alert.alert('Errore', 'Impossibile scansionare la libreria multimediale');
    }
  };

  const clearLibrary = async () => {
    Alert.alert(
      'Svuota libreria',
      'Vuoi rimuovere tutti i brani dalla libreria?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Svuota',
          style: 'destructive',
          onPress: async () => {
            setSongs([]);
            await saveSongs([]);
            Alert.alert('Fatto', 'Libreria svuotata');
          },
        },
      ]
    );
  };

  const handlePlaySong = (song: Song, index: number) => {
    playSong(song, filteredSongs, index);
  };


  const handleDeleteSongByUri = (uri: string) => {
    Alert.alert(
      'Elimina brano',
      'Vuoi rimuovere questo brano dalla libreria?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const updatedSongs = songs.filter((song) => song.uri !== uri);
            setSongs(updatedSongs);
            await saveSongs(updatedSongs);
          },
        },
      ]
    );
  };

  const renderSongItem = ({
    item,
    index,
  }: {
    item: Song;
    index: number;
  }) => (
    <View style={styles.songItem}>
      <TouchableOpacity
        style={styles.songContent}
        onPress={() => handlePlaySong(item, index)}
        activeOpacity={0.7}
      >
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Play size={20} color="#1DB954" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteSongByUri(item.uri)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Trash2 size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Locali</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickAudioFiles}>
            <Upload size={20} color="#fff" />
            <Text style={styles.buttonText}>Carica File</Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.button} onPress={scanMediaLibrary}>
              <Search size={20} color="#fff" />
              <Text style={styles.buttonText}>Scansiona</Text>
            </TouchableOpacity>
          )}
        </View>
        {songs.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearLibrary}
          >
            <Trash2 size={20} color="#fff" />
            <Text style={styles.buttonText}>Svuota libreria</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca brani..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nessun brano trovato</Text>
            <Text style={styles.emptySubtext}>
              Carica file audio o scansiona la libreria
            </Text>
          </View>
        }
      />
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    margin: 20,
    marginTop: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  songInfo: {
    flex: 1,
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
  deleteButton: {
    padding: 15,
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
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
  },
});
