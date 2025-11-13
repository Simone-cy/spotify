import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react-native';
import { useAudio } from '@/contexts/AudioContext';
import Slider from '@react-native-community/slider';

export default function PlayerScreen() {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
  } = useAudio();

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isPlaying ? 1.05 : 1);
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  if (!currentSong) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={['#1a1a1a', '#121212']}
          style={StyleSheet.absoluteFillObject}
        />
        <Volume2 size={80} color="#888" />
        <Text style={styles.emptyTitle}>Nessun brano in riproduzione</Text>
        <Text style={styles.emptySubtitle}>
          Seleziona un brano dalla libreria per iniziare
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2a2a2a', '#121212']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.albumArtContainer, animatedStyle]}>
          <View style={styles.albumArt}>
            <LinearGradient
              colors={['#1DB954', '#1ed760', '#1fdf64']}
              style={styles.albumGradient}
            >
              <Volume2 size={100} color="#fff" />
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#404040"
            thumbTintColor="#fff"
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={previousSong} style={styles.controlButton}>
            <SkipBack size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playButton}
          >
            {isPlaying ? (
              <Pause size={40} color="#000" />
            ) : (
              <Play size={40} color="#000" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={nextSong} style={styles.controlButton}>
            <SkipForward size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArt: {
    width: 300,
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  albumGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  songTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  songArtist: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
