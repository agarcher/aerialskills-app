import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryScreen from '../../features/library/LibraryScreen';
import VideoDetailScreen from '../../features/video/VideoDetailScreen';
import { useAppTheme } from '../../styles/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = (): JSX.Element => {
  const theme = useAppTheme();
  return (
    <NavigationContainer theme={theme.navigation}>
      <Stack.Navigator>
        <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'Aerial Library' }} />
        <Stack.Screen
          name="VideoDetail"
          component={VideoDetailScreen}
          options={{ title: 'Video Detail', presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
