// src/components/CameraPreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import type { ImageData } from '../types';

interface CameraPreviewProps {
  /** Callback when an image is captured – receives an ImageData object */
  onCapture: (image: ImageData) => void;
}

/**
 * Camera preview using react-native-vision-camera v3 API.
 * Uses `useCameraDevice('back')` (v3 hook) and checks for 'granted' permission string.
 */
const CameraPreview: FC<CameraPreviewProps> = ({ onCapture }) => {
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Request camera permission on mount (v3 returns 'granted' | 'denied' | 'not-determined')
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const capture = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto();
        const image: ImageData = { uri: `file://${photo.path}` };
        onCapture(image);
      } catch (e) {
        console.warn('Camera capture failed', e);
      }
    }
  };

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera permission denied.</Text>
        <Text style={styles.errorHint}>Enable camera access in device Settings.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No camera found on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <TouchableOpacity style={styles.captureBtn} onPress={capture}>
        <View style={styles.captureBtnInner} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  centered: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  errorHint: {
    color: '#aaa',
    fontSize: 13,
  },
  captureBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});

export default CameraPreview;
export { CameraPreview };
