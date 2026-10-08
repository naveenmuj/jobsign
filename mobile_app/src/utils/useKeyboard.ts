import { useEffect, useState } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';

export interface KeyboardState {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  dismissKeyboard: () => void;
}

/**
 * Universal Keyboard Height & Visibility Hook
 * 
 * Provides real-time soft keyboard height and visibility across Android and iOS.
 * Essential for modals and bottom sheets where native Dialog windows do not
 * automatically resize on Android.
 */
export function useKeyboard(): KeyboardState {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 0;
      setKeyboardHeight(height);
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    dismissKeyboard: Keyboard.dismiss,
  };
}
