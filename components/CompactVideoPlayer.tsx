"use client";

import React from 'react';
import { YouTubePlayer } from './YouTubePlayer';

const CompactVideoPlayer = ({ videoId }: { videoId: string }) => {
  if (!videoId) return null;

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden" style={{ zIndex: 10 }}>
      <div className="force-fullscreen-player">
        <YouTubePlayer
          videoId={videoId}
          className="w-full h-full"
          startTimeOffset={0}
        />
      </div>
    </div>
  );
};

export default CompactVideoPlayer;