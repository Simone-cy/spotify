import { Tabs } from 'expo-router';
import { Music, Library, ListMusic } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#282828',
          height: Platform.OS === 'web' ? 60 : 80,
          paddingBottom: Platform.OS === 'web' ? 10 : 25,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Player',
          tabBarIcon: ({ size, color }) => (
            <Music size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Audio Locali',
          tabBarIcon: ({ size, color }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlist',
          tabBarIcon: ({ size, color }) => (
            <ListMusic size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
