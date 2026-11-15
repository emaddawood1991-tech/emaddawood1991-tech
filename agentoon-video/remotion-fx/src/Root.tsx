import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./fx/theme";
import { TestA } from "./tests/TestA";
import { TestB } from "./tests/TestB";
import { TestC } from "./tests/TestC";

export const Root: React.FC = () => (
  <>
    <Composition id="TestA" component={TestA} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="TestB" component={TestB} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="TestC" component={TestC} durationInFrames={150} fps={FPS} width={W} height={H} />
  </>
);
