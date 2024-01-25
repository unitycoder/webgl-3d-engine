import { updateDebug } from "./utils/updateDebug";
import { globalState } from "./utils/globalState";

import fragmentShaderSource from "./shaders/default/fragment.glsl";
import vertexShaderSource from "./shaders/default/vertex.glsl";

import { ShaderProgram } from "./lib/ShaderProgram";
import { createVertexArrayObject, setRectangle } from "./lib/Util";

export class Scene {
  private gl: WebGL2RenderingContext | null = null;
  private shaderProgram: ShaderProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;

  constructor() {
    if (globalState.canvasEl) {
      this.gl = globalState.canvasEl.getContext("webgl2");
    }
    if (!this.gl) throw new Error("WebGL2 not supported");
    this.init();
  }

  private init() {
    if (!this.gl) return;

    this.shaderProgram = new ShaderProgram({
      gl: this.gl,
      fragmentCode: fragmentShaderSource,
      vertexCode: vertexShaderSource,
    });

    // Create a buffer
    this.positionBuffer = this.gl.createBuffer();

    this.vao = createVertexArrayObject({
      name: "a_position",
      program: this.shaderProgram.program,
      buffer: this.positionBuffer,
      gl: this.gl,
      size: 2,
    });
  }

  private render() {
    const gl = this.gl;
    if (!gl || !this.shaderProgram) return;

    // Clear the canvas and depth buffer
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    this.shaderProgram.use();
    gl.bindVertexArray(this.vao);

    // draw X random rectangles in random colors
    for (let ii = 0; ii < 2; ++ii) {
      const x = (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 2;
      // Put a rectangle in the position buffer
      setRectangle(gl, 0, 0, x, y, this.positionBuffer);

      // Set a random color.
      this.shaderProgram.setUniform4f("u_color", [
        Math.random(),
        Math.random(),
        Math.random(),
        1,
      ]);

      // Draw the rectangle.
      const primitiveType = gl.TRIANGLES;
      const offset = 0;
      const count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }
  }

  update() {}

  onResize() {
    let w = globalState.stageSize.value[0];
    let h = globalState.stageSize.value[1];
    const ratio = globalState.pixelRatio.value;

    // Possibly need to Math.round() w and h here, but will leave for now
    w = w * ratio;
    h = h * ratio;

    const canvas = globalState.canvasEl;
    if (!canvas || !this.gl) return;

    if (canvas.width !== w && canvas.height !== h) {
      // Sets only the resolution of the canvas
      canvas.width = w;
      canvas.height = h;
    }

    this.gl.viewport(0, 0, w, h);

    this.render();
    updateDebug(`Canvas size: ${w.toFixed(2)}x${h.toFixed(2)}`);
  }

  destroy() {
    this.shaderProgram?.destroy();

    this.positionBuffer && this.gl?.deleteBuffer(this.positionBuffer);
    this.vao && this.gl?.deleteVertexArray(this.vao);
  }
}
