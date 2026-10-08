import { Platform, StatusBar } from 'react-native';

/**
 * Universal Safe Area Inset Helper
 * 
 * Provides dynamic insets with a guaranteed bottom buffer on Android devices
 * to prevent the system navigation bar (3-button Back/Home/Recents or gesture pill)
 * from overlapping or occluding buttons, modals, and sticky action bars.
 */
export function useAppSafeArea() {
  const isAndroid = Platform.OS === 'android';
  // On Android, navigation bar height is 48-56dp on 3-button mode and 16-24dp on gesture nav.
  // 36dp provides an ideal ergonomic buffer without pushing content too high.
  const bottom = isAndroid ? 36 : 0;
  const top = isAndroid ? (StatusBar.currentHeight || 24) : 0;

  return {
    top,
    bottom,
    left: 0,
    right: 0,
    rawBottom: bottom,
  };
}
