import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./fx/theme";
import { TestA } from "./tests/TestA";
import { TestB } from "./tests/TestB";
import { TestC } from "./tests/TestC";
import { Showcase, SHOWCASE_FRAMES } from "./showcase/Showcase";
import { SCENES } from "./showcase/scenes";
import { RobotTake } from "./nine/RobotTake";
import { DEMOS, DEMO_FRAMES } from "./nine/demos";

export const Root: React.FC = () => (
  <>
    <Composition id="TestA" component={TestA} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="TestB" component={TestB} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="TestC" component={TestC} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="Showcase" component={Showcase} durationInFrames={SHOWCASE_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="RobotTake" component={RobotTake} durationInFrames={170} fps={FPS} width={W} height={H} />
    <Composition id="RobotTakeAlpha" component={() => <RobotTake transparent />} durationInFrames={170} fps={FPS} width={540} height={756} />
    {DEMOS.map(([id, C]) => <Composition key={id} id={id} component={C} durationInFrames={DEMO_FRAMES} fps={FPS} width={W} height={H} />)}
    {SCENES.map((s) => <Composition key={s.id} id={s.id} component={s.C} durationInFrames={s.dur} fps={FPS} width={W} height={H} />)}
  </>
);
