import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { Demo45, FPS, TOTAL_FRAMES } from "./demo/Demo45";
import { DemoVertical, VFPS, V_TOTAL } from "./demo/DemoVertical";

export const RemotionRoot = () => (
  <>
    <Composition id="vertical-vo" component={DemoVertical} durationInFrames={V_TOTAL} fps={VFPS} width={1080} height={1920} defaultProps={{ voiceover: true }} />
    <Composition id="vertical-music" component={DemoVertical} durationInFrames={V_TOTAL} fps={VFPS} width={1080} height={1920} defaultProps={{ voiceover: false }} />
    <Composition
      id="demo45"
      component={Demo45}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={750}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
