import "./index.css";
import { Composition } from "remotion";
import { MedicalVideo,    totalFrames as medicalFrames    } from "./templates/MedicalVideo";
import { InstagramReel,   totalFrames as instagramFrames  } from "./templates/InstagramReel";
import { SportsHighlight, totalFrames as sportsFrames     } from "./templates/SportsHighlight";
import { VacationMemory,  totalFrames as vacationFrames   } from "./templates/VacationMemory";
import { PromotionalVideo,totalFrames as promoFrames      } from "./templates/PromotionalVideo";
import { CartoonABC,      totalFrames as abcFrames        } from "./templates/CartoonABC";
import { CartoonNumbers,  totalFrames as numbersFrames    } from "./templates/CartoonNumbers";
import { CartoonColors,   totalFrames as colorsFrames     } from "./templates/CartoonColors";
import { BarChart,        totalFrames as barChartFrames   } from "./templates/BarChart";
import { FMCMontage,      totalFrames as fmcFrames         } from "./templates/FMCMontage";
import { FMCPortrait, FMCLandscape, totalFrames as fmcCampaignFrames } from "./templates/FMCCampaign";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Professional templates ── */}
      <Composition id="Medical"          component={MedicalVideo}     durationInFrames={medicalFrames}    fps={30} width={1280} height={720}  />
      <Composition id="Instagram"        component={InstagramReel}    durationInFrames={instagramFrames}  fps={30} width={1080} height={1920} />
      <Composition id="Sports"           component={SportsHighlight}  durationInFrames={sportsFrames}     fps={30} width={1280} height={720}  />
      <Composition id="Vacation"         component={VacationMemory}   durationInFrames={vacationFrames}   fps={30} width={1280} height={720}  />
      <Composition id="Promotional"      component={PromotionalVideo} durationInFrames={promoFrames}      fps={30} width={1280} height={720}  />

      {/* ── Kids educational cartoons ── */}
      <Composition id="CartoonABC"       component={CartoonABC}       durationInFrames={abcFrames}        fps={30} width={1920} height={1080} />
      <Composition id="CartoonNumbers"   component={CartoonNumbers}   durationInFrames={numbersFrames}    fps={30} width={1920} height={1080} />
      <Composition id="CartoonColors"    component={CartoonColors}    durationInFrames={colorsFrames}     fps={30} width={1920} height={1080} />

      {/* ── Data visualisation ── */}
      <Composition id="BarChart"         component={BarChart}         durationInFrames={barChartFrames}   fps={30} width={1920} height={1080} />

      {/* ── FMC client montages ── */}
      <Composition id="FMCMontage"       component={FMCMontage}       durationInFrames={fmcFrames}        fps={30} width={1920} height={1080} />

      {/* ── FMC Campaign v2 (dual format) ── */}
      <Composition id="FMCPortrait"      component={FMCPortrait}      durationInFrames={fmcCampaignFrames} fps={30} width={1080}  height={1920} />
      <Composition id="FMCLandscape"     component={FMCLandscape}     durationInFrames={fmcCampaignFrames} fps={30} width={1920}  height={1080} />
    </>
  );
};
