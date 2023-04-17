import { useEffect, useMemo, useRef, useState } from "react";
import createShader from "gl-shader";
import { linearInterpolation, getAssets } from "../util";

const vertexShaderCode = `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texcoord = a_texcoord;
}
`;

const fragmentShaderCode = `#version 300 es
#define MAX_IMAGES 20
precision highp float;
precision highp sampler2DArray;

uniform sampler2D u_video_texture1;
uniform sampler2D u_video_texture2;
uniform sampler2D u_overlay_texture1;
uniform sampler2D u_overlay_texture2;
uniform float u_time;
in vec2 v_texcoord;
out vec4 outputColor;

void main() {
  vec4 originColor1 = texture(u_video_texture1, v_texcoord);
  vec4 originColor2 = texture(u_video_texture2, v_texcoord);

  vec4 overlayColor1 = texture(u_overlay_texture1, v_texcoord);
  vec4 overlayColor2 = texture(u_overlay_texture2, v_texcoord);

  vec4 color1 = mix(originColor1, overlayColor1, overlayColor1.a);
  vec4 color2 = mix(originColor2, overlayColor2, overlayColor2.a);

  outputColor = mix(color1, color2, u_time);
}
`;

const AssetDissolve = (props: AssetTransitionProps) => {
  const { width, height, startVideo, endVideo, duration } = props;
  const startAssetsRef = useRef<CanvasAsset[]>(getAssets(startVideo));
  const endAssetsRef = useRef<CanvasAsset[]>(getAssets(endVideo));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startVideoRef = useRef<HTMLVideoElement>(null);
  const endVideoRef = useRef<HTMLVideoElement>(null);
  const texture1Ref = useRef<WebGLTexture>();
  const texture2Ref = useRef<WebGLTexture>();
  const shaderRef = useRef<ReturnType<typeof createShader>>();
  const overlayTexture1Ref = useRef<WebGLTexture>();
  const overlayTexture2Ref = useRef<WebGLTexture>();
  const videoTextureUnit1 = 0;
  const videoTextureUnit2 = 1;
  const overlayTextureUnit1 = 2;
  const overlayTextureUnit2 = 3;
  const timeRef = useRef<number>(0);
  const timeStampRef = useRef<number>(0);
  const [isTransition, setIsTransition] = useState(false);

  const initGL = () => {
    if (!canvasRef.current) {
      console.error("Canvas element not found.");
      return;
    }
    const gl = canvasRef.current.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2 is not supported in this browser.");
      return;
    }
    const shader = createShader(
      gl,
      vertexShaderCode,
      fragmentShaderCode,
      [
        { type: "sampler2D", name: "u_video_texture1" },
        { type: "sampler2D", name: "u_video_texture2" },
        { type: "sampler2D", name: "u_overlay_texture1" },
        { type: "sampler2D", name: "u_overlay_texture2" },
        { type: "float", name: "u_time" },
      ],
      [
        { type: "vec2", name: "a_position" },
        { type: "vec2", name: "a_texcoord" },
      ]
    );
    if (!shader) {
      console.error("Shader failed to compile.");
      return;
    }
    shader.bind();
    shaderRef.current = shader;

    const program = shader.program;
    gl.useProgram(program);

    console.log("initGL");
  };

  const initBuffers = () => {
    if (!shaderRef.current) {
      console.error("Shader not found.");
      return;
    }
    const shader = shaderRef.current;
    const gl = shader.gl;
    const program = shader.program;

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      console.error("Failed to create position buffer.");
      return;
    }
    const texcoordBuffer = gl.createBuffer();
    if (!texcoordBuffer) {
      console.error("Failed to create texture coordinate buffer.");
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [1, 1, -1, 1, 1, -1, -1, -1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    const texcoords = [1, 0, 0, 0, 1, 1, 0, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    const texcoordLoc = gl.getAttribLocation(program, "a_texcoord");
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

    console.log("initBuffers");
  };

  const setupTexture = (
    gl: WebGL2RenderingContext,
    shader: Shader,
    texture: WebGLTexture,
    textureUnit: number,
    uniformName: string
  ) => {
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const location = gl.getUniformLocation(shader.program, uniformName);
    gl.uniform1i(location, textureUnit);

    return texture;
  };

  const drawOverlayImageCanvas = (assets: CanvasAsset[]) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    assets.forEach((asset) => {
      ctx.drawImage(
        asset.element,
        asset.model.xPos,
        asset.model.yPos,
        asset.model.width,
        asset.model.height
      );
    });

    return canvas;
  };

  const initTextures = async () => {
    if (!shaderRef.current) return;
    const shader = shaderRef.current;
    const gl = shader.gl as WebGL2RenderingContext;

    const texture1 = gl.createTexture();
    const texture2 = gl.createTexture();
    const overlayTexture1 = gl.createTexture();
    const overlayTexture2 = gl.createTexture();

    if (!texture1 || !texture2 || !overlayTexture1 || !overlayTexture2) return;

    texture1Ref.current = setupTexture(
      gl,
      shader,
      texture1,
      videoTextureUnit1,
      "u_video_texture1"
    );

    overlayTexture1Ref.current = setupTexture(
      gl,
      shader,
      overlayTexture1,
      overlayTextureUnit1,
      "u_overlay_texture1"
    );

    texture2Ref.current = setupTexture(
      gl,
      shader,
      texture2,
      videoTextureUnit2,
      "u_video_texture2"
    );

    overlayTexture2Ref.current = setupTexture(
      gl,
      shader,
      overlayTexture2,
      overlayTextureUnit2,
      "u_overlay_texture2"
    );

    console.log("initVideoTexture");
  };

  useEffect(() => {
    initGL();
    initBuffers();
    initTextures();
  }, [startVideo, endVideo]);

  const render = (deltaTime: number) => {
    if (!shaderRef.current) {
      console.log("no shader");
      return;
    }
    const shader = shaderRef.current;
    if (!texture1Ref.current) {
      console.log("no texture1");
      return;
    }
    const texture1 = texture1Ref.current;
    if (!texture2Ref.current) {
      console.log("no texture2");
      return;
    }
    const texture2 = texture2Ref.current;
    if (!startVideoRef.current) {
      console.log("no startVideo");
      return;
    }

    const overlayTexture1 = overlayTexture1Ref.current;
    const overlayTexture2 = overlayTexture2Ref.current;

    if (!overlayTexture1 || !overlayTexture2) return;

    const startVideo = startVideoRef.current;
    if (!endVideoRef.current) {
      console.log("no endVideo");
      return;
    }
    const endVideo = endVideoRef.current;

    const gl = shader.gl;

    const startOverlayCanvas = drawOverlayImageCanvas(startAssetsRef.current);
    const endOverlayCanvas = drawOverlayImageCanvas(endAssetsRef.current);

    if (!startOverlayCanvas || !endOverlayCanvas) return;

    gl.activeTexture(gl.TEXTURE0 + overlayTextureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, overlayTexture1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      startOverlayCanvas
    );

    gl.activeTexture(gl.TEXTURE0 + videoTextureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      startVideo
    );

    if (startVideo.duration - startVideo.currentTime < duration) {
      endVideo.play();
      setIsTransition(true);
      timeStampRef.current = timeStampRef.current || performance.now();

      const t = Math.min(
        (deltaTime - timeStampRef.current) / ((duration * 1000) / 2),
        1
      );
      timeRef.current = linearInterpolation(0, 1, t);
      gl.activeTexture(gl.TEXTURE0 + overlayTextureUnit2);
      gl.bindTexture(gl.TEXTURE_2D, overlayTexture2);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        endOverlayCanvas
      );

      gl.activeTexture(gl.TEXTURE0 + videoTextureUnit2);
      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        endVideo
      );
      timeRef.current = timeRef.current > 1 ? 1 : timeRef.current;
      shader.uniforms.u_time = timeRef.current;
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (endVideo.duration < endVideo.currentTime) {
      setIsTransition(false);
      endVideo.pause();
      return;
    }
    requestAnimationFrame(render);
  };

  useEffect(() => {
    if (!startVideoRef.current) return;
    startVideoRef.current.play();
    requestAnimationFrame(render);
  }, []);

  return (
    <>
      <h1> Image Dissolve Transition </h1>
      {isTransition ? (
        <h1 style={{ color: "blue" }}>transition start</h1>
      ) : (
        <h1 style={{ color: "red" }}>not transition</h1>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3>video 1</h3>
          <video
            ref={startVideoRef}
            src={startVideo.src}
            width={startVideo.width}
            height={startVideo.height}
            muted
            style={{ display: "block" }}
          ></video>
          {startVideo.images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              width={image.width}
              height={image.height}
              style={{ display: "block" }}
            />
          ))}
        </div>
        <div>
          <h3>video 2</h3>
          <video
            ref={endVideoRef}
            src={endVideo.src}
            width={startVideo.width}
            height={startVideo.height}
            muted
            style={{ display: "block" }}
          ></video>
          {endVideo.images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              width={image.width}
              height={image.height}
              style={{ display: "block" }}
            />
          ))}
        </div>
      </div>
      <h1>result</h1>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: "1px solid black" }}
      ></canvas>
    </>
  );
};

export default AssetDissolve;
