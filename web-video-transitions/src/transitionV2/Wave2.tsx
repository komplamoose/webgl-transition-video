import { useEffect, useRef, useState } from "react";
import createShader from "gl-shader";
import { linearInterpolation } from "../util";

const vertexShaderCode = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texcoord = a_texcoord;
}
`;

const fragmentShaderCode = `
precision mediump float;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform float u_time;
uniform float u_wave_amplitude;
uniform float u_wave_frequency;
varying vec2 v_texcoord;

void main() {
    vec4 color1 = texture2D(u_texture1, v_texcoord);
    vec4 color2 = texture2D(u_texture2, v_texcoord);

    float wave = 0.5 * (1.0 + sin(u_wave_frequency * (v_texcoord.y - u_time)));

    wave = clamp(wave, 0.0, 1.0) * u_wave_amplitude;

    float mix_amount = clamp(u_time + wave, 0.0, 1.0);
    vec4 final_color = mix(color1, color2, mix_amount);

    gl_FragColor = final_color;
}
`;

const Wave2 = ({
  width,
  height,
  startVideoSrc,
  endVideoSrc,
  duration,
}: TransitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startVideoRef = useRef<HTMLVideoElement>(null);
  const endVideoRef = useRef<HTMLVideoElement>(null);
  const texture1Ref = useRef<WebGLTexture | null>(null);
  const texture2Ref = useRef<WebGLTexture | null>(null);
  const shaderRef = useRef<ReturnType<typeof createShader> | null>(null);
  const textureUnit1 = 0;
  const textureUnit2 = 1;
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
      gl as WebGLRenderingContext,
      vertexShaderCode,
      fragmentShaderCode,
      [
        { type: "sampler2D", name: "u_texture1" },
        { type: "sampler2D", name: "u_texture2" },
        { type: "float", name: "u_time" },
        { type: "float", name: "u_wave_amplitude" },
        { type: "float", name: "u_wave_frequency" },
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

  const initTexture = () => {
    if (!shaderRef.current) return;
    const shader = shaderRef.current;
    const gl = shader.gl;

    const texture1 = gl.createTexture();
    const texture2 = gl.createTexture();
    if (!texture1 || !texture2) return;

    gl.activeTexture(gl.TEXTURE0);
    gl.activeTexture(gl.TEXTURE0 + textureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    texture1Ref.current = texture1;

    shader.uniforms.u_texture1 = textureUnit1;

    gl.activeTexture(gl.TEXTURE0 + textureUnit2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    texture2Ref.current = texture2;

    shader.uniforms.u_texture2 = textureUnit2;

    console.log("initTexture");
  };

  useEffect(() => {
    initGL();
    initBuffers();
    initTexture();
  }, [startVideoSrc, endVideoSrc]);

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
    const startVideo = startVideoRef.current;
    if (!endVideoRef.current) {
      console.log("no endVideo");
      return;
    }
    const endVideo = endVideoRef.current;

    const gl = shader.gl;

    gl.activeTexture(gl.TEXTURE0 + textureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      startVideo
    );

    if (startVideo.duration - startVideo.currentTime < duration / 2) {
      setIsTransition(true);
      timeStampRef.current = timeStampRef.current || performance.now();
      const t = Math.min(
        (deltaTime - timeStampRef.current) / ((duration * 1000) / 2),
        1
      );

      timeRef.current = linearInterpolation(0.0, 0.5, t);

      gl.activeTexture(gl.TEXTURE0 + textureUnit2);
      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        endVideo
      );
      shader.uniforms.u_wave_amplitude = 0.5;
      shader.uniforms.u_wave_frequency = 12.0;
      timeRef.current = timeRef.current > 0.5 ? 0.5 : timeRef.current;
      shader.uniforms.u_time = timeRef.current;
    }

    if (startVideo.duration === startVideo.currentTime) {
      if (endVideo.paused) timeStampRef.current = performance.now();
      endVideo.play();
      const t = Math.min(
        (deltaTime - timeStampRef.current) / ((duration * 1000) / 2),
        1
      );

      timeRef.current = linearInterpolation(0.5, 1, t);
      gl.activeTexture(gl.TEXTURE0 + textureUnit1);
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        startVideo
      );

      gl.activeTexture(gl.TEXTURE0 + textureUnit2);
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
      if (timeRef.current === 1) {
        shader.uniforms.u_wave_amplitude = 0;
        shader.uniforms.u_wave_frequency = 0;
      }
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (endVideo.duration === endVideo.currentTime) {
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
      <h1> Wave 2 (stable) Transition</h1>
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
            src={startVideoSrc}
            muted
            preload="auto"
            style={{ display: "block" }}
          ></video>
        </div>
        <div>
          <h3>video 2</h3>
          <video
            ref={endVideoRef}
            src={endVideoSrc}
            muted
            preload="auto"
            style={{ display: "block" }}
          ></video>
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

export default Wave2;
