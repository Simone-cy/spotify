import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  setupNotificationCategories,
  requestNotificationPermissions,
  showMediaNotification,
  dismissMediaNotification,
} from '@/lib/notificationService';

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

  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef(false);
  const playlistRef = useRef<Song[]>([]);
  const currentIndexRef = useRef(-1);
  const playSongRef = useRef<((song: Song, songList?: Song[], index?: number) => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const playSong = useCallback(async (song: Song, songList?: Song[], index?: number) => {
    try {
      const currentSound = soundRef.current;
      if (currentSound) {
        await currentSound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true }
      );

      soundRef.current = newSound;
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
  }, []);

  useEffect(() => {
    playSongRef.current = playSong;
  }, [playSong]);

  const pauseSong = useCallback(async () => {
    const currentSound = soundRef.current;
    if (currentSound) {
      await currentSound.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const resumeSong = useCallback(async () => {
    const currentSound = soundRef.current;
    if (currentSound) {
      await currentSound.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const nextSong = useCallback(async () => {
    const currentPlaylist = playlistRef.current;
    const currentIdx = currentIndexRef.current;
    if (currentPlaylist.length > 0 && currentIdx < currentPlaylist.length - 1) {
      const nextIndex = currentIdx + 1;
      if (playSongRef.current) {
        await playSongRef.current(currentPlaylist[nextIndex], currentPlaylist, nextIndex);
      }
    }
  }, []);

  const previousSong = useCallback(async () => {
    const currentPlaylist = playlistRef.current;
    const currentIdx = currentIndexRef.current;
    if (currentPlaylist.length > 0 && currentIdx > 0) {
      const prevIndex = currentIdx - 1;
      if (playSongRef.current) {
        await playSongRef.current(currentPlaylist[prevIndex], currentPlaylist, prevIndex);
      }
    }
  }, []);

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

  useEffect(() => {
    const initAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      if (Platform.OS !== 'web') {
        await requestNotificationPermissions();
        await setupNotificationCategories();

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    };

    initAudio();

    let notificationSubscription: Notifications.Subscription | undefined;

    if (Platform.OS !== 'web') {
      notificationSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const action = response.actionIdentifier;

          if (action === 'play-pause') {
            if (isPlayingRef.current) {
              pauseSong();
            } else {
              resumeSong();
            }
          } else if (action === 'next') {
            nextSong();
          } else if (action === 'previous') {
            previousSong();
          }
        }
      );
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (notificationSubscription) {
        notificationSubscription.remove();
      }
      dismissMediaNotification();
    };
  }, [pauseSong, resumeSong, nextSong, previousSong, sound]);

  useEffect(() => {
    if (sound) {
      const interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying);

          if (status.didJustFinish) {
            nextSong();
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sound, nextSong]);

  useEffect(() => {
    if (currentSong && Platform.OS !== 'web') {
      showMediaNotification(currentSong.title, currentSong.artist, isPlaying);
    }
  }, [currentSong, isPlaying]);

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
