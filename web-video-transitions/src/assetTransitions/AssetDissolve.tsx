import { useEffect, useRef, useState } from "react";
import createShader from "gl-shader";
import { linearInterpolation } from "../util";

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
uniform sampler2DArray u_textureImageArray1;
uniform sampler2DArray u_textureImageArray2;
uniform vec4 u_video_texture_array1_texcoords[MAX_IMAGES];
uniform vec4 u_video_texture_array2_texcoords[MAX_IMAGES];
uniform int u_video_texture_array1_len;
uniform int u_video_texture_array2_len;
uniform float u_time;
in vec2 v_texcoord;
out vec4 outputColor;

void main() {
  vec4 color1 = texture(u_video_texture1, v_texcoord);
  vec4 color2 = texture(u_video_texture2, v_texcoord);

  vec4 texcoord1 = u_video_texture_array1_texcoords[0];
  //outputColor = vec4(0.0, 0.0, 0.0, 0.0);
  outputColor = texture(u_textureImageArray1, vec3(v_texcoord, 0.0));
  //outputColor = texture(u_textureImageArray1, vec3((v_texcoord - texcoord1.xy) / texcoord1.zw, float(0)));
  // for (int i = 0; i < u_video_texture_array1_len; i++) {
  //   vec4 texcoord1 = u_video_texture_array1_texcoords[i];
  //   vec4 imgColor1 = texture(u_textureImageArray1, vec3((v_texcoord - texcoord1.xy) / texcoord1.zw, float(i)));
  //   if (imgColor1.a > 0.0) {
  //     color1 = mix(color1, imgColor1, imgColor1.a);
  //   }
  // }

  // for (int i = 0; i < u_video_texture_array2_len; i++) {
  //   vec4 texcoord2 = u_video_texture_array2_texcoords[i];
  //   vec4 imgColor2 = texture(u_textureImageArray2, vec3((v_texcoord - texcoord2.xy) / texcoord2.zw, float(i)));
  //   if (imgColor2.a > 0.0) {
  //     color2 = mix(color2, imgColor2, imgColor2.a);
  //   }
  // }

  // outputColor = mix(color1, color2, u_time);
}
`;

const AssetDissolve = ({
  width,
  height,
  startVideo,
  endVideo,
  duration,
}: AssetTransitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startVideoRef = useRef<HTMLVideoElement>(null);
  const endVideoRef = useRef<HTMLVideoElement>(null);
  const texture1Ref = useRef<WebGLTexture>();
  const texture2Ref = useRef<WebGLTexture>();
  const shaderRef = useRef<ReturnType<typeof createShader>>();
  const textureUnit1 = 0;
  const textureUnit2 = 1;
  const textureArrayUnit1 = 2;
  const textureArrayUnit2 = 3;
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
        { type: "int", name: "u_imageCount1" },
        { type: "int", name: "u_imageCount2" },
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

  const setupVideoTexture = (
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

  const setupTextureArray = async (
    gl: WebGL2RenderingContext,
    shader: Shader,
    texture: WebGLTexture,
    textureUnit: number,
    uniformName: string,
    videoData: AssetVideoModel
  ) => {
    console.log(uniformName);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const loadedImages = await loadImages(videoData.images);

    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      gl.RGBA,
      videoData.width,
      videoData.height,
      loadedImages.length,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

    loadedImages.forEach((image, index) => {
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        0,
        0,
        index,
        image.width,
        image.height,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
    });

    const location = gl.getUniformLocation(shader.program, uniformName);
    gl.uniform1i(location, textureUnit);
  };

  const loadImages = (images: ImageModel[]) => {
    const imagePromises = images.map((asset: ImageModel) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = asset.src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
      });
    });

    return Promise.all(imagePromises);
  };

  const setupImageTextureCoord = (
    gl: WebGL2RenderingContext,
    shader: Shader,
    videoData: AssetVideoModel,
    uniformName: string
  ) => {
    const { images, width, height } = videoData;
    const texcoords = images
      .map((img) => {
        const result = [
          img.xPos / width,
          img.yPos / height,
          img.width / width,
          img.height / height,
        ];

        console.log("RESULT", result);
        return result;
      })
      .flat();

    const location = gl.getUniformLocation(shader.program, uniformName);
    console.log(new Float32Array(texcoords));
    gl.uniform4fv(location, new Float32Array(texcoords));
  };

  const setupImageAssetLength = (
    gl: WebGL2RenderingContext,
    shader: Shader,
    videoData: AssetVideoModel,
    uniformName: string
  ) => {
    const location = gl.getUniformLocation(shader.program, uniformName);
    gl.uniform1i(location, videoData.images.length);
  };

  const initVideoTexture = async () => {
    if (!shaderRef.current) return;
    const shader = shaderRef.current;
    const gl = shader.gl as WebGL2RenderingContext;

    const texture1 = gl.createTexture();
    const texture2 = gl.createTexture();
    const textureArray1 = gl.createTexture();
    const textureArray2 = gl.createTexture();

    if (!texture1 || !texture2 || !textureArray1 || !textureArray2) return;

    texture1Ref.current = setupVideoTexture(
      gl,
      shader,
      texture1,
      textureUnit1,
      "u_video_texture1"
    );
    setupTextureArray(
      gl,
      shader,
      textureArray1,
      textureArrayUnit1,
      "u_textureImageArray1",
      startVideo
    );

    texture2Ref.current = setupVideoTexture(
      gl,
      shader,
      texture2,
      textureUnit2,
      "u_video_texture2"
    );
    setupTextureArray(
      gl,
      shader,
      textureArray2,
      textureArrayUnit2,
      "u_textureImageArray2",
      endVideo
    );

    setupImageTextureCoord(
      gl,
      shader,
      startVideo,
      "u_video_texture_array1_texcoords"
    );
    setupImageTextureCoord(
      gl,
      shader,
      endVideo,
      "u_video_texture_array2_texcoords"
    );

    setupImageAssetLength(gl, shader, startVideo, "u_video_texture_array1_len");
    setupImageAssetLength(gl, shader, endVideo, "u_video_texture_array2_len");

    console.log("initVideoTexture");
  };

  useEffect(() => {
    initGL();
    initBuffers();
    initVideoTexture();
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

    if (startVideo.duration - startVideo.currentTime < duration) {
      endVideo.play();
      setIsTransition(true);
      timeStampRef.current = timeStampRef.current || performance.now();

      const t = Math.min(
        (deltaTime - timeStampRef.current) / ((duration * 1000) / 2),
        1
      );
      timeRef.current = linearInterpolation(0, 1, t);
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
