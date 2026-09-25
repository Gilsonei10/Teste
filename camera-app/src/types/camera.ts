export type LayoutMode = 'pip' | 'split-v' | 'split-h';

export type CaptureMode = 'photo' | 'video';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facing: 'user' | 'environment' | 'unknown';
}

export interface CapturedMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  blob: Blob;
  timestamp: number;
  duration?: number; // in seconds for video
  layoutMode: LayoutMode;
}

export interface DualCameraState {
  backStream: MediaStream | null;
  frontStream: MediaStream | null;
  audioStream: MediaStream | null;
  primaryFacing: 'user' | 'environment';
  layoutMode: LayoutMode;
  isSimultaneousSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}
