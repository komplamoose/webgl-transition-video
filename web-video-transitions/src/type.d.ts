declare interface TransitionProps {
  width: number;
  height: number;
  startVideoSrc: string;
  endVideoSrc: string;
  duration: number;
}

declare interface AssetTransitionProps {
  width: number;
  height: number;
  startVideo: AssetVideoModel;
  endVideo: AssetVideoModel;
  duration: number;
}

declare interface AssetVideoModel {
  src: string;
  width: number;
  height: number;
  images : ImageModel[];
}

declare interface ImageModel {
  src: string;
  width: number;
  height: number;
  xPos: number;
  yPos: number;
  rotation: number;
  zIndex: number;
}

type Shader = ReturnType<typeof createShader>;