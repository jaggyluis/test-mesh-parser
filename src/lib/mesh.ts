import { Graph, AdjacencyList, Edge } from './graph';
import { Bounded2D, BoundingBox2D } from './bbox';
import { angleTwoVectors, Path, Point2D, Vector4D, Vector2D, vectorTwoPoints, Triangle } from './geometry';
import { QuadTree } from './tree';
import { Polygon2D } from './polygon';

export type PointGraphEdgeData = {
    vertices: Point2D[],
    edges: Edge[], [key: string]: any
}

export type FVMeshData = {
    faces: Path[],
    faceAdjacencies: AdjacencyList,
    faceCentroids: Vector4D[],
    vertices: Point2D[],
    bounds: [Vector2D, Vector2D]
};

/**
 * Utility wrapper class for mesh face centroids for use in QuadTree lookup
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
    bounds() {

        return new BoundingBox2D([[this._point[0], this._point[1]]]);
    }

    /**
     * This is the bounds that will be used for the search filter
     */
    faceBounds() {

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

    /**
     * 
     * @NOTE - should probably find a way to not recompute this
     */
    private _getFacePolygon(faceIndex: number): Polygon2D {

        return Polygon2D.fromPath(this._faces[faceIndex], this._vertices);
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

    bounds() {
        return this._bounds;
    }

    triangulatedFace(faceIndex: number): number[][] {
        if (!this._faceCentroids[faceIndex]) {
            return [];
        } else {
            return [...this._getFacePolygon(faceIndex).triangulationIndexIterator(this._faces[faceIndex])]
        }
    }

    triangulatedFaces(): number[][][] {
        return this._faces.map((face, faceIndex) => this.triangulatedFace(faceIndex));
    }


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
        if (!this.bounds().contains(point)) {
            return -1;
        }

        const bbox = new BoundingBox2D([point]);

        let searchCount = 0;
        const search: FVMeshFaceBoundedPoint | null = this._faceLookupTree.search(bbox, (facePoint: FVMeshFaceBoundedPoint, faceNode: QuadTree<FVMeshFaceBoundedPoint>) => {

            onFaceSearched(facePoint.faceIndex, ++searchCount);

            if (facePoint.faceBounds().contains(point)) {
                return this._getFacePolygon(facePoint.faceIndex).contains(point);
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
         * set of visited vertices + size of stack
         * 
         * @NOTE - this could probably be optimized to track the current winding of the path while 
         * the search is happening, so that it can only return paths with a CCW winding.
         * Right now we need to return the path and then check its winding as a Pgon later .
         * 
         * The original implementation of this method was recursive,
         * but I hit the max call stack on larger meshes
         *  
         */
        function findCCWCycleForEdgeDFSStack(edge: Edge): Path | null {

            const visited = new Set();
            const paths: Path[] = [edge];

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

                    // sort points ccw
                    nextDirections.sort((a, b) => a.angle - b.angle);

                    visited.add(currIndex);

                    for (let v of nextDirections) {

                        paths.push([...path, v.index]);
                    }
                }
            }

            return null;
        }

        const meshFaceEdgeAdjacencies: { [edgeId: string]: number[] } = {}

        for (let edge of graph.iterableEdges()) { /** @NOTE - used to only iterate edges with min index 2, but that's causing some bugs */

            const face = findCCWCycleForEdgeDFSStack(edge);

            if (face) {

                const facePgon = Polygon2D.fromPath(face, vertices);
                const faceBounds = facePgon.bounds();

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

