import { Composition } from "remotion";
import { MontageVideo, CLIPS, totalMontageFrames } from "./Montage";

export const RemotionCompositions: React.FC = () => {
  return (
    <Composition
      id="Montage"
      component={MontageVideo}
      durationInFrames={totalMontageFrames(CLIPS)}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
