export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

export interface TranscriptSegmentPayload {
  id: number | string;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  fileId: string;
  segments: TranscriptSegment[];
  fullText: string;
  language?: string;
  duration?: number;
  createdAt: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}
