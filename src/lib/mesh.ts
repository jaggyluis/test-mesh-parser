import { Graph, AdjacencyList, Edge } from './graph';
import { Bounded2D, BoundingBox2D, QuadTree } from './bbox';
import { angleTwoVectors, Path, Point2D, Vector4D, Polygon2D, Vector2D, vectorTwoPoints } from './geometry';

export type PointGraphEdgeData = { vertices: Point2D[], edges: Edge[], [key: string]: any }

export type FVMeshData = {
    faces: Path[],
    faceAdjacencies: AdjacencyList,
    faceCentroids: Vector4D[],
    vertices: Point2D[],
    bounds: [Vector2D, Vector2D]
};

/**
 * Wrapper class for mesh face centroids for use in QuadTree lookup
 * Not using the full face for the lookup since it produces overlapping bounding conditions
 */
class FVMeshFaceBoundedPoint implements Bounded2D {

    /**
     * 
     * @param _point bounding conditions for the face, represented as [centroidX, centroidY, faceBoundsDimX, faceBoundsDimY]
     * @param faceIndex face identifier
     */
    constructor(private readonly _point: Vector4D, public readonly faceIndex: number) { }

    /**
     * This is the bounds that will be used for the QuadTree lookup
     */
    get bounds() {
        return new BoundingBox2D([[this._point[0], this._point[1]]]);
    }

    /**
     * This is the bounds that will be used for the search filter
     */
    get faceBounds() {

        const dimx: Vector2D = [this._point[0] - this._point[2] / 2, this._point[0] + this._point[2] / 2];
        const dimy: Vector2D = [this._point[1] - this._point[3] / 2, this._point[1] + this._point[3] / 2];

        return BoundingBox2D.fromDimensions(dimx, dimy);
    }
}

/**
 * Main Mesh class - this class is mainly a dual graph for the point graph that generates it
 * It used to extend Graph, but that wasn't super clean so I moved the dual graph into a class property as _faceGraph
 */
export class FVMesh implements Bounded2D {

    private readonly _vertices: Point2D[];

    private _faces: Path[] = [];

    private _faceLookupTree: QuadTree<FVMeshFaceBoundedPoint>;

    private _faceGraph: Graph; // dual graph of the points/edges input

    private _faceCentroids: Vector4D[] = [];

    private _bounds: BoundingBox2D;

    /**
     * 
     * @returns the faceId of this face
     */
    private _addFace(face: Path, centroid: Vector4D) {

        const faceIndex = this._faceCentroids.push(centroid) - 1;
        const faceBoundedPoint = new FVMeshFaceBoundedPoint(centroid, faceIndex);

        this._faceLookupTree.insert(faceBoundedPoint);
        this._faces.push(face);

        return faceIndex;
    }

    /**
     * 
     * @param faceIndex1 
     * @param faceIndex2 
     * @returns whether the operation was successful
     */
    private _addFaceAdjacency(faceIndex1: number, faceIndex2: number) {
        if (!this._faces[faceIndex1] || !this._faces[faceIndex2]) {
            return false;
        }
        this._faceGraph.addEdge([faceIndex1, faceIndex2]);
        return true;
    }

    constructor(meshData: FVMeshData) {

        this._vertices = meshData.vertices;

        this._bounds = BoundingBox2D.fromDimensions(meshData.bounds[0], meshData.bounds[1]);

        this._faceLookupTree = new QuadTree<FVMeshFaceBoundedPoint>(this._bounds);
        this._faceGraph = new Graph(meshData.faceAdjacencies);

        meshData.faces.forEach((f, i) => this._addFace(f, meshData.faceCentroids[i]))
    }

    get faces() { return this._faces; }

    get vertices() { return this._vertices; }

    get bounds() { return this._bounds; }

    /**
     * 
     * @Time 
     * worst - (O(F*V)) - search every face and compute polygon for every face 
     * 
     * H - Height of QuadTree
     * N - max number of elements per bucket
     * V - Vertex count for face
     * 
     * average (O(H + N * V)))
     * 
     * @param onFaceSearched utility method for logging status
     */
    findEnclosingFace(point: Point2D, onFaceSearched: (faceIndex: number, searchCount: number) => void = () => { }): number {
        if (!this.bounds.contains(point)) {
            return -1;
        }

        const bbox = new BoundingBox2D([point]);

        let searchCount = 0;
        const search = this._faceLookupTree.search(bbox, (facePoint: FVMeshFaceBoundedPoint, faceNode: QuadTree<FVMeshFaceBoundedPoint>) => {

            onFaceSearched(facePoint.faceIndex, ++searchCount);

            if (facePoint.faceBounds.contains(point)) {
                const facePgon = Polygon2D.fromPath(this._faces[facePoint.faceIndex], this._vertices);       
                return facePgon.contains(point);
            }

            return false;

        });

        if (search) {
            return search.faceIndex;
        }

        return -1;
    }

    toJSON(): FVMeshData {
        return {
            faces: this._faces,
            faceAdjacencies: this._faceGraph.toJSON(),
            vertices: this._vertices,
            faceCentroids: this._faceCentroids,
            bounds: [this._bounds.dimX, this._bounds.dimY] as [Vector2D, Vector2D]
        };
    }

    /**
     * @Time O(E*(V+ElogE)) = O(E*2VLogE) worst case (1 big cycle)
     * @param pointGraphEdgeData input data for A1
     */
    static fromPointGraphEdgeData(pointGraphEdgeData: PointGraphEdgeData) {

        const vertices = pointGraphEdgeData.vertices;

        const graph = Graph.fromEdges(pointGraphEdgeData.edges);

        const bounds = new BoundingBox2D(vertices);

        const mesh = new FVMesh({
            vertices,
            faces: [],
            faceAdjacencies: {},
            faceCentroids: [],
            bounds: [bounds.dimX, bounds.dimY]
        });

        /**
         * 
         * DFS method to find the next CCW point to add to an existing path.
         * @Time - O(V+ElogE)
         * need to check every edge on every vertex best is O(F) where F is the number of vertices on the face - i.e a grid will only search 3 depths
         * but worst case we need to check nearly every edge for a given vertex 
         * 
         * @Space - O(V + V*E) => O(V*E) 
         * set of visited vertices + depth of call stack
         * 
         * @NOTE - this could probably be optimized to track the current winding of the path while 
         * the search is happening, so that it can only return paths with a CCW winding.
         * Right now we need to return the path and then check its winding as a Pgon later 
         * 
         * @NOTE - hit the call stack max on large meshes for this one, although it works
         *  
         */
        function findCCWCycleForPathDFSRecursive(path: Path, visited = new Set()): Path | null {

            const startIndex = path[0];
            const prevIndex = path[path.length - 2];
            const currIndex = path[path.length - 1];

            if (graph.hasNeighbor(currIndex, startIndex) && path.length > 2) {

                return path;

            } else {

                const startVertex = vertices[prevIndex];
                const endVertex = vertices[currIndex];

                const currDirection = vectorTwoPoints(startVertex, endVertex);
                const nextDirections = [];

                for (let index of graph.iterableNeighborIndices(currIndex)) {

                    if (index !== prevIndex && !visited.has(index)) {

                        const nextVertex = vertices[index];
                        const nextDirection = vectorTwoPoints(endVertex, nextVertex);
                        const nextAngle = angleTwoVectors(currDirection, nextDirection);

                        nextDirections.push({ index, angle: nextAngle });
                    }
                }

                nextDirections.sort((a, b) => b.angle - a.angle);

                for (let v of nextDirections) {

                    visited.add(v.index);

                    const cycle = findCCWCycleForPathDFSRecursive([...path, v.index], visited);

                    if (cycle) {
                        return cycle;
                    }
                }

                return null;
            }
        }

        /**
         * 
         * DFS method to find the next CCW point to add to an existing path.
         * @Time - O(V+ElogE)
         * need to check every edge on every vertex best is O(F) where F is the number of vertices on the face - i.e a grid will only search 3 depths
         * but worst case we need to check nearly every edge for a given vertex 
         * 
         * @Space - O(V + V*E) => O(V*E) 
         * set of visited vertices + size of stack
         * 
         * @NOTE - this could probably be optimized to track the current winding of the path while 
         * the search is happening, so that it can only return paths with a CCW winding.
         * Right now we need to return the path and then check its winding as a Pgon later 
         * 
         *  
         */
        function findCCWCycleForEdgeDFSStack(edge: Edge): Path | null {

            const visited = new Set();
            const paths : Path[] = [edge];

            while (paths.length) {

                const path = paths.pop() as Path;

                const startIndex = path[0];
                const prevIndex = path[path.length - 2];
                const currIndex = path[path.length - 1];

                if (graph.hasNeighbor(currIndex, startIndex) && path.length > 2) {

                    return path;

                } else {

                    const startVertex = vertices[prevIndex];
                    const endVertex = vertices[currIndex];

                    const currDirection = vectorTwoPoints(startVertex, endVertex);
                    const nextDirections = [];

                    for (let index of graph.iterableNeighborIndices(currIndex)) {

                        if (index !== prevIndex && !visited.has(index)) {

                            const nextVertex = vertices[index];
                            const nextDirection = vectorTwoPoints(endVertex, nextVertex);
                            const nextAngle = angleTwoVectors(currDirection, nextDirection);

                            nextDirections.push({ index, angle: nextAngle });
                        }
                    }

                    /**
                     * @NOTE - we actually want this sorted in the other direction than the recursive version,
                     * so that the most likely item is first on the stack
                     */
                    nextDirections.sort((a, b) => a.angle - b.angle);

                    for (let v of nextDirections) {
                        visited.add(v.index);
                        paths.push([...path, v.index]);
                    }
                }
            }

            return null;
        }

        const meshFaceEdgeAdjacencies: { [edgeId: string]: number[] } = {}

        /**
         * Run DFS for every edge with a vertex with at least 2 connections
         */
        for (let edge of graph.iterableEdges(2)) {

            const face = findCCWCycleForEdgeDFSStack(edge);

            if (face) {

                const facePgon = Polygon2D.fromPath(face, vertices);
                const faceBounds = facePgon.bounds;

                if (facePgon.isClockwise()) continue;

                const faceCentroid = faceBounds.centroid;
                const faceIndex = mesh._addFace(face, [faceCentroid[0], faceCentroid[1], faceBounds.dx, faceBounds.dy]); // using the area of this pgon as a lookup

                face.forEach((faceEdgeStartIndex, i) => {

                    const faceEdgeEndIndex = face[(i + 1) % face.length];
                    const faceEdge: Edge = [faceEdgeStartIndex, faceEdgeEndIndex];
                    const faceEdgeId = [faceEdgeStartIndex, faceEdgeEndIndex].sort().join('-');

                    if (!meshFaceEdgeAdjacencies[faceEdgeId]) {
                        meshFaceEdgeAdjacencies[faceEdgeId] = [faceIndex];

                    } else {

                        meshFaceEdgeAdjacencies[faceEdgeId].forEach(otherFaceIndex => {
                            mesh._addFaceAdjacency(faceIndex, otherFaceIndex);
                        });

                        meshFaceEdgeAdjacencies[faceEdgeId].push(faceIndex);
                    }

                    graph.removeEdge(faceEdge, true);
                })

            } else {

                graph.removeEdge(edge, true);
            }
        }

        return mesh;
    }
}

