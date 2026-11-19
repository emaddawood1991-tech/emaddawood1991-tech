import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./fx/theme";
import { FounderSkill, FSK_FRAMES } from "./nine/FounderSkill";
import { FindSkills, FS_FRAMES } from "./nine/FindSkills";
import { NinePreview, PREVIEW_FRAMES } from "./nine/Preview";
import { PaperRaw } from "./fx/ScrapbookCollage";
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
    <Composition id="FounderSkill" component={FounderSkill} durationInFrames={FSK_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="FindSkills" component={FindSkills} durationInFrames={FS_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="NinePreview" component={NinePreview} durationInFrames={PREVIEW_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="PaperBake" component={() => <PaperRaw driftX={0} driftY={0} />} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="RobotTakeAlpha" component={() => <RobotTake transparent />} durationInFrames={170} fps={FPS} width={540} height={756} />
    {DEMOS.map(([id, C]) => <Composition key={id} id={id} component={C} durationInFrames={DEMO_FRAMES} fps={FPS} width={W} height={H} />)}
    {SCENES.map((s) => <Composition key={s.id} id={s.id} component={s.C} durationInFrames={s.dur} fps={FPS} width={W} height={H} />)}
  </>
);
