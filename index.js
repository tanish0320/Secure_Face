/**
 * SecureFace Edge AI — App Entry Point
 *
 * Boot order (ORDER MATTERS — do not reorder):
 * 1. react-native-gesture-handler  — must be FIRST import
 * 2. react-native-reanimated       — Reanimated 3 setup
 * 3. react-native-screens          — enableScreens() before any navigator renders
 * 4. AppRegistry                   — register the root component
 */
import 'react-native-gesture-handler'; // ← MUST be first import, no exceptions
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './src/App';
import { name as appName } from './app.json';

// Enable native screen containers for React Navigation (performance + Android back stack)
enableScreens(true);

AppRegistry.registerComponent(appName, () => App);
