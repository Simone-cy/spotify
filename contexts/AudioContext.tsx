import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface Song {
  uri: string;
  title: string;
  artist: string;
  duration: number;
}

interface AudioContextType {
  sound: Audio.Sound | null;
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playlist: Song[];
  currentIndex: number;
  playSong: (song: Song, songList?: Song[], index?: number) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setPlaylist: (songs: Song[], startIndex?: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylistState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (sound) {
      const interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying);

          if (status.didJustFinish) {
            await nextSong();
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sound, currentIndex, playlist]);

  const playSong = async (song: Song, songList?: Song[], index?: number) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);

      if (songList) {
        setPlaylistState(songList);
        setCurrentIndex(index ?? 0);
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const pauseSong = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSong = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const nextSong = async () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      await playSong(playlist[nextIndex], playlist, nextIndex);
    }
  };

  const previousSong = async () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      await playSong(playlist[prevIndex], playlist, prevIndex);
    }
  };

  const seekTo = async (newPosition: number) => {
    if (sound) {
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    }
  };

  const setPlaylist = (songs: Song[], startIndex: number = 0) => {
    setPlaylistState(songs);
    if (songs.length > 0 && startIndex < songs.length) {
      playSong(songs[startIndex], songs, startIndex);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        sound,
        currentSong,
        isPlaying,
        position,
        duration,
        playlist,
        currentIndex,
        playSong,
        pauseSong,
        resumeSong,
        nextSong,
        previousSong,
        seekTo,
        setPlaylist,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
