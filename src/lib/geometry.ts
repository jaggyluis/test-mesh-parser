import { Bounded2D, BoundingBox2D } from "./bbox";


/**
 * @NOTE - using simple types for Vector and Point, but they could be classses
 */
export type Vector2D = [number, number];

export type Point2D = Vector2D;

export type Point4D = [number, number, number, number];

export type Path = [number, number, ...number[]];

export class Polygon2D implements Bounded2D {

    private _points: Point2D[] = [];

    private _bounds = new BoundingBox2D();

    private _area : number | null = null;

    constructor(points: Point2D[] = [], private readonly _id : string | number | null = null) {

        points.forEach(p => this.addPoint2D(p));
    }

    get bounds() { return this._bounds; }

    get id() { return this._id; }

    get area() { return Math.abs(this.signedArea()); }

    isClockwise() {
        
        return this.signedArea() > 0;
    }

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
        this._area = null;
    }

    contains(point: Point2D) {
        if (!this._bounds.contains(point)) {
            return false;
        } else {
            // TODO
            return true;
        }
    }

    static fromPath(path: Path, vertices: Point2D[], id : string | number | null = null) {

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