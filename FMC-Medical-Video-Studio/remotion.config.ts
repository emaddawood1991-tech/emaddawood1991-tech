import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setOverwriteOutput(true);
// Software WebGL so Three.js renders headless in containers.
Config.setChromiumOpenGlRenderer('angle');
