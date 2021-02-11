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

    private _area : number | null = null;

    constructor(points: Point2D[] = [], private readonly _id : Id | null = null) {

        points.forEach(p => this.addPoint2D(p));
    }

    get bounds() { return this._bounds; }

    get id() { return this._id; }

    get area() { return Math.abs(this.signedArea()); }

    get points() { return this._points; }

    isClockwise() {
        
        return this.signedArea() > 0;
    }

    /**
     * Calculate winding direction and area - a < 0 ? CCW : CW 
     */
    signedArea() {

        if (!this._area) {

            let area = 0;

            for (let i = 0; i<this._points.length; i++) {
                let j = (i+1)%this._points.length;
                area += (this._points[j][0] - this._points[i][0]) * (this._points[j][1] + this._points[i][1]);
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

    contains(point: Point2D) {
        if (!this._bounds.contains(point)) {
            return false;
        } else {
            /**
             * @NOTE - this is the big missing piece here for containment checks 
             * @TODO - needs to be implemented
             * 
             * The implementation of this will also resolve the meshing issues on the renderer side -
             * cannot currently mesh convex pgons correctly
             */
            return true;
        }
    }

    static fromPath(path: Path, vertices: Point2D[], id : Id | null = null) {

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

export function vectorEquality(v1: Vector2D, v2: Vector2D) {
    return v1[0] === v2[0] && v1[1] === v2[1];
}

export function triangleContains(triangle : Triangle, point : Point2D) {

}

export function triangleArea(triangle : Triangle) {

}

/**
 * Ported this https://github.com/linuxlewis/tripy/blob/master/tripy.py
 * @link https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf
 * @param polygon 
 */
function earclip(polygon : Polygon2D) : Path[] {

    if (polygon.isClockwise()) return []; // not going to deal with this condition since the app shouldnt be creating them

    const triangles : Path[] = [];

    const ear  = [];

    const points = [...polygon.points];

    for (let currIndex = 0; currIndex < polygon.points.length; currIndex++ ) {

        let prevIndex = currIndex === 0 ? polygon.points.length -1 : currIndex-1;
        let prevPoint = points[prevIndex];
        
        let currPoint = points[currIndex];

        let nextIndex = (currIndex + 1) % points.length;
        let nextPoint = points[nextIndex];
        

    }

    return [];

    function isEar(p1 : Point2D , p2 : Point2D, p3 : Point2D) {

    }
}