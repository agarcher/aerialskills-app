import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RealmProvider } from '../lib/db/realm';
import { ImportQueueProvider } from '../lib/files/importQueue';
import { ThemeProvider } from '../styles/theme';
import { AppNavigator } from './navigation';

const App = (): JSX.Element => {
  return (
    <RealmProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ImportQueueProvider>
              <AppNavigator />
            </ImportQueueProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </RealmProvider>
  );
};

export default App;
