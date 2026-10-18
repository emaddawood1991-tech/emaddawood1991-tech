import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Group} from 'three';

/** Loads a verified anatomical model from assets/anatomy/<file>. Blocks rendering until loaded. */
export const GLBModel: React.FC<{file: string; scale?: number}> = ({file, scale = 1}) => {
  const [model, setModel] = useState<Group | null>(null);
  const [handle] = useState(() => delayRender(`glb-${file}`, {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    new GLTFLoader().load(
      staticFile(`anatomy/${file}`),
      (g) => {
        setModel(g.scene);
        continueRender(handle);
      },
      undefined,
      (e) => {
        throw new Error(`GLB load failed (${file}): ${e}`);
      },
    );
  }, [file, handle]);
  return model ? <primitive object={model} scale={scale} /> : null;
};
