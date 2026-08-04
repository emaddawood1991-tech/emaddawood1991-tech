import "./index.css";
import { Composition } from "remotion";
import { MedicalVideo, totalFrames as medicalFrames } from "./templates/MedicalVideo";
import { InstagramReel, totalFrames as instagramFrames } from "./templates/InstagramReel";
import { SportsHighlight, totalFrames as sportsFrames } from "./templates/SportsHighlight";
import { VacationMemory, totalFrames as vacationFrames } from "./templates/VacationMemory";
import { PromotionalVideo, totalFrames as promoFrames } from "./templates/PromotionalVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Medical"     component={MedicalVideo}     durationInFrames={medicalFrames}   fps={30} width={1280} height={720} />
      <Composition id="Instagram"   component={InstagramReel}    durationInFrames={instagramFrames} fps={30} width={1080} height={1920} />
      <Composition id="Sports"      component={SportsHighlight}  durationInFrames={sportsFrames}    fps={30} width={1280} height={720} />
      <Composition id="Vacation"    component={VacationMemory}   durationInFrames={vacationFrames}  fps={30} width={1280} height={720} />
      <Composition id="Promotional" component={PromotionalVideo} durationInFrames={promoFrames}     fps={30} width={1280} height={720} />
    </>
  );
};
