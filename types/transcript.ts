export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

export interface TranscriptPayload {
  segments: TranscriptSegment[];
  fullText: string;
  language?: string;
  duration?: number;
}

export interface Transcript extends TranscriptPayload {
  id: string;
  fileId: string;
  createdAt: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}