import React, { useEffect, useRef, useState } from "react";

interface DissolveProps {
  width: number;
  height: number;
  src1: string;
  src2: string;
}

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
varying vec2 v_texcoord;

void main() {
  vec4 color1 = texture2D(u_texture1, v_texcoord);
  vec4 color2 = texture2D(u_texture2, v_texcoord);
  gl_FragColor = mix(color1, color2, u_time);
}
`;

const Dissolve = ({ width, height, src1, src2 }: DissolveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texture1Ref = useRef<WebGLTexture | null>(null);
  const texture2Ref = useRef<WebGLTexture | null>(null);
  const uniformLoc1Ref = useRef<WebGLUniformLocation | null>(null);
  const uniformLoc2Ref = useRef<WebGLUniformLocation | null>(null);
  const timeRef = useRef<number>(0);
  const transitionStartRef = useRef<boolean>(false);
  const textureUnit1 = 0;
  const textureUnit2 = 1;

  const initGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found.");
      return;
    }
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2 is not supported in this browser.");
      return;
    }
    glRef.current = gl;
  };

  const initShaderProgram = () => {
    const gl = glRef.current;
    if (!gl) {
      console.error("WebGL context not found.");
      return;
    }
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      console.error("Failed to create vertex shader.");
      return;
    }
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(
        "Failed to compile vertex shader: " + gl.getShaderInfoLog(vertexShader)
      );
      return;
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!fragmentShader) {
      console.error("Failed to create fragment shader.");
      return;
    }
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(
        "Failed to compile fragment shader: " +
          gl.getShaderInfoLog(fragmentShader)
      );
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      console.error("Failed to create shader program.");
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        "Failed to link shader program: " + gl.getProgramInfoLog(program)
      );
      return;
    }
    gl.useProgram(program);
    programRef.current = program;
  };

  const initBuffers = () => {
    const gl = glRef.current;
    if (!gl) {
      console.error("WebGL context not found.");
      return;
    }
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
    const positionLoc = gl.getAttribLocation(programRef.current!, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    const texcoords = [1, 0, 0, 0, 1, 1, 0, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    const texcoordLoc = gl.getAttribLocation(programRef.current!, "a_texcoord");
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);
  };

  const initTextures = () => {
    const gl = glRef.current;
    if (!gl) {
      console.error("WebGL context not found.");
      return;
    }
    const texture1 = gl.createTexture();
    if (!texture1) {
      console.error("Failed to create texture 1.");
      return;
    }
    const texture2 = gl.createTexture();
    if (!texture2) {
      console.error("Failed to create texture 2.");
      return;
    }

    gl.activeTexture(gl.TEXTURE0 + textureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    texture1Ref.current = texture1;
    uniformLoc1Ref.current = gl.getUniformLocation(
      programRef.current!,
      "u_texture1"
    );
    gl.uniform1i(uniformLoc1Ref.current, textureUnit1);

    gl.activeTexture(gl.TEXTURE0 + textureUnit2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    texture2Ref.current = texture2;
    uniformLoc2Ref.current = gl.getUniformLocation(
      programRef.current!,
      "u_texture2"
    );
    gl.uniform1i(uniformLoc2Ref.current, textureUnit2);
  };

  useEffect(() => {
    initGL();
    initShaderProgram();
    initBuffers();
    initTextures();
  }, []);

  const render = (deltaTime: number) => {
    const gl = glRef.current;
    if (!gl) {
      console.error("WebGL context not found.");
      return;
    }
    const texture1 = texture1Ref.current;
    const texture2 = texture2Ref.current;
    if (!texture1 || !texture2) {
      console.error("Texture not found.");
      return;
    }
    const video1 = videoRef1.current;
    const video2 = videoRef2.current;
    if (!video1 || !video2) {
      console.error("Video not found.");
      return;
    }

    gl.activeTexture(gl.TEXTURE0 + textureUnit1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video1);

    if (transitionStartRef.current) {
      gl.activeTexture(gl.TEXTURE0 + textureUnit2);
      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video2
      );
      console.log(deltaTime);
      timeRef.current += (deltaTime / 1000 + timeRef.current) / 5000;
      //timeRef.current += 0.001;
    }

    const timeLoc = gl.getUniformLocation(programRef.current!, "u_time");
    if (timeRef.current <= 1) {
      gl.uniform1f(timeLoc, timeRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    } else {
      console.log("Transition End");
    }
  };

  useEffect(() => {
    if (videoRef1.current && videoRef2.current) {
      videoRef1.current.play();
      videoRef2.current.play();
      console.log("PLAY");
      //render(0);
      setTimeout(() => {
        transitionStartRef.current = true;
      }, 5000);
    }
  }, [videoRef1, videoRef2]);

  return (
    <>
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
            ref={videoRef1}
            src={src1}
            muted
            loop
            style={{ display: "block" }}
          ></video>
        </div>
        <div>
          <h3>video 2</h3>
          <video
            ref={videoRef2}
            src={src2}
            muted
            loop
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

export default Dissolve;
