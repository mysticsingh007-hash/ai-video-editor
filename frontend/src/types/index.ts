export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  size: number;
  duration: number;
  fps: number;
  resolution: string;
  codec: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
  updatedAt: string;
}

export interface Detection {
  id: string;
  videoId: string;
  type: 'logo' | 'watermark' | 'timestamp' | 'channel_overlay';
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
  isMoving: boolean;
  createdAt: string;
}

export interface Region {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
}

export interface Job {
  id: string;
  userId: string;
  videoId: string;
  type: 'detection' | 'processing' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
}
