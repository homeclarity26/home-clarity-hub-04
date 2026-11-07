import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { Demo45, FPS, TOTAL_FRAMES } from "./demo/Demo45";

export const RemotionRoot = () => (
  <>
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
