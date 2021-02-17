import { Bounded2D } from "./bbox";
import { Point2D, Vector2D } from "./geometry";
import { Edge } from "./graph";
import { FVMesh } from "./mesh";

export type Color4fv = [number, number, number, number];

export type Color3fv = [number, number, number];

export function randomColor3fv() {

    const color: Color3fv = [Math.random(), Math.random(), Math.random()];

    return color;
}

export function randomColor4fv() {

    const color: Color3fv = [Math.random(), Math.random(), Math.random()];

    return color;
}


export class WebGLCanvasFVMeshRenderer {


    private _vs = `

        precision mediump float;

        attribute vec3 vertPosition;

        varying vec3 fragColor;

        uniform mat4 mProj;
        uniform mat4 mView;
        uniform mat4 mModel;

        uniform vec3 vColor;
                
        void main() 
        {
            fragColor = vColor;
            gl_Position = mProj * mView * mModel * vec4(vertPosition, 1.0);
        }
     `;


    private _fs = `

        precision mediump float;

        varying vec3 fragColor;

        void main()
        {
            gl_FragColor = vec4(fragColor, 1.0);
        }
    
    `;

    private _bg: Color4fv = [0.2, 0.2, 0.2, 1.0];

    private _canvas: HTMLCanvasElement;
    private _program: WebGLProgram | null = null;

    private _projectionMatrix: Float32Array = WebGLCanvasFVMeshRenderer.identityMatrix();
    private _viewMatrix: Float32Array = WebGLCanvasFVMeshRenderer.identityMatrix();
    private _modelMatrix: Float32Array = WebGLCanvasFVMeshRenderer.identityMatrix()

    private _mesh: FVMesh | null = null;
    private _meshFaceColors: Color3fv[] = [];
    private _meshFaceTriangleIndices : number[][][] = [];
    private _meshVBO: WebGLBuffer | null = null;
    private _meshIBO: WebGLBuffer | null = null;
    private _meshMouseMoveCallback: (meshPoint: Point2D, mouseEvent: MouseEvent) => void = () => { }

    private get _gl() { return this._canvas.getContext('webgl') }

    private _reduceToBuffer(values: number[][]) {
        return values.reduce((buffer, arr) => { buffer.push(...arr); return buffer }, [] as number[]);
    }
    
    private _updateProjectionMatrix() {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._projectionMatrix = WebGLCanvasFVMeshRenderer.projectionMatrix(this._canvas.clientWidth, this._canvas.clientHeight);

        const mProj = gl.getUniformLocation(this._program, 'mProj');
        gl.uniformMatrix4fv(mProj, false, this._projectionMatrix);
    }

    private _updateModelMatrix() {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._modelMatrix = this._mesh ? WebGLCanvasFVMeshRenderer.scaleAndCenterTransformationMatrix(this._mesh) : WebGLCanvasFVMeshRenderer.identityMatrix();

        const mModel = gl.getUniformLocation(this._program, 'mModel');
        gl.uniformMatrix4fv(mModel, false, this._modelMatrix);
    }

    private _setVertices(vertices: Point2D[]) {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._meshVBO = this._meshVBO || gl.createBuffer();
        const vboBuffer = this._reduceToBuffer(vertices); 

        gl.bindBuffer(gl.ARRAY_BUFFER, this._meshVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vboBuffer), gl.STATIC_DRAW);

        const vertPosition = gl.getAttribLocation(this._program, 'vertPosition');
        const vertSize = vertices[0].length;

        gl.vertexAttribPointer(vertPosition, vertSize, gl.FLOAT, false, vertSize * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(vertPosition);
    }


    private _renderTriangles(triangleIndices: number[][][], colors: Color3fv[] = []) {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._meshIBO = this._meshIBO || gl.createBuffer();
        const iboBuffer = this._reduceToBuffer(triangleIndices.map(triangleIndexArray => this._reduceToBuffer(triangleIndexArray)));

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(iboBuffer), gl.STATIC_DRAW);

        const vColor = gl.getUniformLocation(this._program, 'vColor');

        let offset = 0;

        for (let i = 0; i < triangleIndices.length; i++) {

            const triangles = triangleIndices[i];
            const color = colors[i];

            gl.uniform3fv(vColor, color);

            for (let j = 0; j < triangles.length; j++) {
                gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, offset * Int16Array.BYTES_PER_ELEMENT);
                offset += 3;
            }
        }
    }

    private _renderFaceEdges(faces: number[][]) {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._meshIBO = this._meshIBO || gl.createBuffer();
        const iboBuffer = this._reduceToBuffer(faces); 

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(iboBuffer), gl.STATIC_DRAW);

        const vColor = gl.getUniformLocation(this._program, 'vColor');

        let offset = 0;

        for (let i = 0; i < faces.length; i++) {

            const face = faces[i];

            gl.uniform3fv(vColor, [1, 1, 1]);
            gl.drawElements(gl.LINE_LOOP, face.length, gl.UNSIGNED_SHORT, offset * Int16Array.BYTES_PER_ELEMENT);

            offset += face.length;
        }
    }

    private _renderEdges(edges: Edge[]) {

        if (!this._program || !this._gl) return;

        const gl = this._gl;

        this._meshIBO = this._meshIBO || gl.createBuffer();
        const iboBuffer = this._reduceToBuffer(edges);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(iboBuffer), gl.STATIC_DRAW);

        const vColor = gl.getUniformLocation(this._program, 'vColor');
        gl.uniform3fv(vColor, [0.4, 0.4, 0.4]);

        for (let i = 0; i < edges.length; i++) {
            gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 2 * i * Int16Array.BYTES_PER_ELEMENT);             //using triangle fan here since i'm only rendering convex polygons
        }
    }

    constructor(canvas: HTMLCanvasElement) {

        this._canvas = canvas;

        if (!this._gl) return;

        const gl = this._gl;

        gl.clearColor(...this._bg);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK); // leaving this here to debug badly wound polygons

        const vShader = gl.createShader(gl.VERTEX_SHADER);
        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        if (vShader) {
            gl.shaderSource(vShader, this._vs);
            gl.compileShader(vShader);
            if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
                console.error("ERROR : vertexShader", gl.getShaderInfoLog(vShader));
                return;
            }
        }

        if (fShader) {
            gl.shaderSource(fShader, this._fs);
            gl.compileShader(fShader);
            if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
                console.error("ERROR : fragmentShader", gl.getShaderInfoLog(fShader));
                return;
            }

        }

        if (program && vShader && fShader) {

            gl.attachShader(program, vShader);
            gl.attachShader(program, fShader);

            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error("ERROR : linking", gl.getProgramInfoLog(program));
                return;
            }

            gl.validateProgram(program);
            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                console.error("ERROR : validation", gl.getProgramInfoLog(program));
                return;
            }

            this._program = program;
            gl.useProgram(this._program);

            const mView = gl.getUniformLocation(this._program, 'mView');
            gl.uniformMatrix4fv(mView, false, this._viewMatrix);

            const mProj = gl.getUniformLocation(this._program, 'mProj');
            gl.uniformMatrix4fv(mProj, false, this._projectionMatrix);
        }

        this._updateProjectionMatrix();
        window.addEventListener('resize', () => {
            this._updateProjectionMatrix();
            this.clear()
            this.renderMeshFill(this._meshFaceColors);
            this.renderMeshLines();
        })

        this._canvas.addEventListener('mousemove', ev => {

            if (this._mesh) {

                const canvasX = ev.clientX;
                const canvasY = ev.clientY;

                const projectionRatio = this._projectionMatrix[5];
                const projectionX = 2 * ((canvasX / this._canvas.clientWidth) - 0.5);
                const projectionY = (2 * ((1 - (canvasY / this._canvas.clientHeight)) - 0.5)) / projectionRatio;

                const scale = this._modelMatrix[0];
                const tx = this._modelMatrix[12] / scale;
                const ty = this._modelMatrix[13] / scale;

                const modelX = projectionX / scale - tx;
                const modelY = projectionY / scale - ty;

                const modelPoint: Vector2D = [modelX, modelY];

                this._meshMouseMoveCallback(modelPoint, ev);
            }
        })
    }

    renderMeshFace(meshFaceIndex: number, meshFaceColor: Color3fv | null = null) {

        if (!this._mesh) return;

        const face = this._mesh.triangulatedFace(meshFaceIndex);
        const color = meshFaceColor || this._meshFaceColors[meshFaceIndex];

        if (face && color) {
            this._renderTriangles([face], [color]);
        }
    }

    renderMeshFill(meshFaceColors: Color3fv[] = this._meshFaceColors) {

        if (!this._mesh) return;

        this._meshFaceColors = meshFaceColors;
        this._renderTriangles(this._meshFaceTriangleIndices, this._meshFaceColors)
    }

    renderMeshLines() {

        if (!this._mesh) return;

        this._renderFaceEdges(this._mesh.faces)
    }

    renderEdges(edges: Edge[]) {

        if (!this._mesh) return;

        this._renderEdges(edges);
    }

    setMesh(mesh: FVMesh) {

        this._mesh = mesh;
        this._meshFaceTriangleIndices = [...this._mesh.triangulatedFaces()];

        this._setVertices(mesh.vertices);
        this._updateModelMatrix();
    }

    clear() {

        if (!this._gl) return;

        const gl = this._gl;

        gl.clearColor(...this._bg);
        gl.clear(gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    onMeshMouseMove(callback: (modelPoint: Point2D, mouseEvent: MouseEvent) => void) {

        this._meshMouseMoveCallback = callback;
    }

    static identityMatrix() {

        const matrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        return matrix;
    }

    static projectionMatrix(w: number, h: number) {

        const matrix = new Float32Array([
            1, 0, 0, 0,
            0, w / h, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        return matrix;
    }

    static scaleAndCenterTransformationMatrix(boundedObject: Bounded2D) {

        const bbox = boundedObject.bounds();
        const origin = bbox.origin;

        const dx = bbox.dx;
        const dy = bbox.dy;

        const ratio = Math.max(dx, dy);

        const scaleX = 1 / ratio;
        const scaleY = 1 / ratio;

        const tx = origin[0] + dx / 2;
        const ty = origin[1] + dy / 2;

        const matrix = new Float32Array([
            scaleX, 0, 0, 0,
            0, scaleY, 0, 0,
            0, 0, 1, 0,
            -tx * scaleX, -ty * scaleY, 0, 1
        ]);

        return matrix;
    }
}

