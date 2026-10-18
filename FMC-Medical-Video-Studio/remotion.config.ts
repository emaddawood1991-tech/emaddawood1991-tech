import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
// yuv420p (limited range) — the jpeg image format otherwise yields yuvj420p, which some players/Instagram transcodes render with shifted contrast.
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// Software WebGL so Three.js renders headless in containers.
Config.setChromiumOpenGlRenderer('angle');
