import { staticFile } from "remotion";

// Place your audio files in public/audio/music/ and public/audio/voiceovers/
// Then reference them here with staticFile()

export const MUSIC_LIBRARY = {
  upbeat: staticFile("audio/music/upbeat.mp3"),
  calm: staticFile("audio/music/calm.mp3"),
  dramatic: staticFile("audio/music/dramatic.mp3"),
  sporty: staticFile("audio/music/sporty.mp3"),
  promotional: staticFile("audio/music/promotional.mp3"),
};

export const FPS = 30;

// Helpers
export const seconds = (s: number) => s * FPS;
export const frames = (f: number) => f;
