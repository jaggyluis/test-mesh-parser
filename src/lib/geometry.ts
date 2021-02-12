import { Bounded2D, BoundingBox2D } from "./bbox";


/**
 * @NOTE - using simple types for Vector and Point, but they could be classses
 */
export type Vector2D = [number, number];

export type Vector4D = [number, number, number, number];

export type Point2D = Vector2D;

export type Triangle = [Point2D, Point2D, Point2D];

export type Path = [number, number, ...number[]]; // paths should have at least 2 points

export type Id = string | number;

export class Polygon2D implements Bounded2D {

    private _points: Point2D[] = [];

    private _bounds = new BoundingBox2D();

    private _area: number | null = null;

    private _convex : boolean  = true;

    constructor(points: Point2D[] = [], private readonly _id: Id | null = null) {

        points.forEach(p => this.addPoint2D(p));
    }

    get id() { return this._id; }

    get area() { return Math.abs(this.signedArea()); }

    get points() { return this._points; }

    bounds() {
        
        return this._bounds;
    }

    isClockwise() {

        return this.signedArea() > 0;
    }

    /**
     * @TODO - this needs work. should be cached from the signed area calculation and added
     * to the FVMeshBoundedPoint class, so that we can determine how to triangulate without
     * needing to do all the other stuff.
     */
    isConvex() {

        if (this._area === null) this.signedArea(); // recompute the convexity if it has been invalidated

        return this._convex;
    }

    /**
     * Calculate winding direction and area - a < 0 ? CCW : CW 
     */
    signedArea() {

        if (this._area === null) {

            let area = 0;

            for (let i = 0; i < this._points.length; i++) {
                let h = i === 0 ? this._points.length -1 : i - 1;
                let j = (i + 1) % this._points.length;
                area += (this._points[j][0] - this._points[i][0]) * (this._points[j][1] + this._points[i][1]);

                const cross = vectorCrossZ(vectorTwoPoints(this._points[h], this._points[i]), vectorTwoPoints(this._points[i], this._points[j]));

                if (cross < 0) {
                    this._convex = false;
                }
            }

            this._area = area / 2;
        }

        return this._area;
    }

    addPoint2D(point: Point2D) {
        this._bounds.update(point);
        this._points.push(point);
        this._area = null; // invalidate the area when a new point is added
    }

    /**
     * This is not a great solution for point containment, but works for now 
     *
     * @NOTE - this is the big missing piece here for containment checks 
     * @TODO - needs to be implemented
     * 
     * The implementation of this will also resolve the meshing issues on the renderer side -
     * cannot currently mesh convex pgons correctly
     */

    contains(point: Point2D) {
        if (!this._bounds.contains(point)) {
            return false;
        } else {
            for (let triangle of this.triangulationIterator()) { // shouldnt need to do this 
                if (triangleContains(triangle, point)) {
                    return true;
                }
            }

            return false;
        }
    }

    *triangulationIterator(): Generator<Triangle> {
        if (this.isConvex()) {
            for (let triangle of fan(this)) {
                yield triangle;
            }
        } else {
            for (let triangle of earclip(this)) {
                yield triangle;
            }
        }
    }

    /**
     * Maps a set of external indices by this polygon's triangulation
     * @param indices external indices to map against
     */
    *triangulationIndexIterator(indices : number[]) {
        if (this.isConvex()) {
            for (let indexArray of fanIndices(this, indices)) {
                yield indexArray;
            }
        } else {
            for (let triangle of earclipIndices(this, indices)) {
                yield triangle;
            }
        }
    }

    static fromPath(path: Path, vertices: Point2D[], id: Id | null = null) {

        const pgon = new Polygon2D([], id);
        path.forEach(i => pgon.addPoint2D(vertices[i]));;;
        return pgon;
    }
}

/**
 * 
 * @NOTE -  needed to look this one up actually, it's been a while
 * @link https://bl.ocks.org/shancarter/1034db3e675f2d3814e6006cf31dbfdc
 * 
 */
export function angleTwoVectors(source: Vector2D, compare: Vector2D) {

    var a2 = Math.atan2(source[1], source[0]);
    var a1 = Math.atan2(compare[1], compare[0]);
    var sign = a1 > a2 ? 1 : -1;
    var angle = a1 - a2;
    var K = -sign * Math.PI * 2;
    var angle = (Math.abs(K + angle) < Math.abs(angle)) ? K + angle : angle;
    var degrees = 360 * angle / (Math.PI * 2);

    return degrees
}

export function vectorTwoPoints(start: Point2D, end: Point2D) {
    return [end[0] - start[0], end[1] - start[1]] as Vector2D;
}

export function vectorCrossZ(v1 : Vector2D, v2 : Vector2D) {
    return (v1[0] * v2[1]) - (v1[1] * v2[0]);
}

export function vectorEquality(v1: Vector2D, v2: Vector2D) {
    return v1[0] === v2[0] && v1[1] === v2[1];
}

export function triangleContains(triangle: Triangle, point: Point2D) {

    for (let i = 0; i < triangle.length; i++) {

        let prevIndex = i === 0 ? triangle.length - 1 : i - 1;
        let nextIndex = (i + 1) % triangle.length;

        const prevVec = vectorTwoPoints(triangle[i], triangle[prevIndex])
        const testVec = vectorTwoPoints(triangle[i], point);
        const nextVec = vectorTwoPoints(triangle[i], triangle[nextIndex]);

        if (angleTwoVectors(nextVec, testVec) > angleTwoVectors(nextVec, prevVec)) {
            return false;
        }
    }

    return true;
}


function* fan(polygon: Polygon2D): Generator<Triangle> {
    for (let i = 1; i < polygon.points.length - 1; i++) {
        yield [polygon.points[0], polygon.points[i], polygon.points[i + 1]] as Triangle
    }
}

function* fanIndices(polygon : Polygon2D, indices : number[]) {
    for (let i = 1; i < polygon.points.length - 1; i++) {
        yield [indices[0], indices[i], indices[i + 1]];
    }
}

function* earclip(polygon: Polygon2D): Generator<Triangle> {
    /**
     * @TODO
     */

    if (polygon.isClockwise()) return;

    let points = [...polygon.points];
    let pointCount = points.length;
    let ears : Point2D[] = [];

    for (let i = 0; i< points.length; i++) {
        let h = i === 0 ? points.length -1 : i - 1;
        let j = (i + 1) % points.length;
        if (isEar(points[h], points[i], points[j], points)) {
            ears.push(points[i]);
        }
    }

    while(ears.length && pointCount >= 3) {

        let ear = ears.pop();

        
    }

    function isEar(prevPoint : Point2D, currPoint : Point2D, nextPoint : Point2D, points : Point2D[]) {
        return true;
    }
}

function* earclipIndices(polgon : Polygon2D, indices : number[]) {
    /**
     * @TODO
     */
}