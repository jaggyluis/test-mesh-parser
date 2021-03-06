import { Bounded2D, BoundingBox2D } from "./bbox";
import { Point2D, vectorCrossZ, vectorTwoPoints, triangleContains, Triangle } from "./geometry";

export type Id = string | number;

export type Path = [number, number, ...number[]]; // paths should have at least 2 points

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
            for (let indexArray of earclipIndices(this, indices)) {
                yield indexArray;
            }
        }
    }

    static fromPath(path: Path, vertices: Point2D[], id: Id | null = null) {

        return new Polygon2D(path.map(vertexIndex => vertices[vertexIndex]), id);
    }
}

// ####################################################
// ############# Polygon utility methods ##############
// ####################################################

function* fan(polygon: Polygon2D): Generator<Triangle> {
    for (let i = 1; i < polygon.points.length - 1; i++) {
        yield [polygon.points[0], polygon.points[i], polygon.points[i + 1]] as Triangle
    }
}

function* fanIndices(polygon : Polygon2D, indices : number[]) : Generator<number[]> {
    for (let i = 1; i < polygon.points.length - 1; i++) {
        yield [indices[0], indices[i], indices[i + 1]];
    }
}

function findEars(polygon : Polygon2D) : Point2D[] {
    const ears : Point2D[] = [];
    for (let i = 0; i< polygon.points.length; i++) {
        // next  point
        let p = polygon.points[i];
        // get the index of the next and previous points
        let h = i === 0 ? polygon.points.length -1 : i - 1;
        let j = (i + 1) % polygon.points.length;
        // test if the point at i is an ear
        if (isEar([polygon.points[h], polygon.points[i], polygon.points[j]], polygon.points)) {
            ears.push(p);
        }
    }
    return ears;
}

/**
 * @NOTE - this is a modified version of this https://github.com/linuxlewis/tripy/blob/master/tripy.py
 */
function* earclip(polygon: Polygon2D): Generator<Triangle> {

    if (polygon.isClockwise()) return;

    let points = [...polygon.points];
    let ears = findEars(polygon);

    while(ears.length && points.length >= 3) {
        // get the next ear
        let p = ears.pop() as Point2D;
        // get the index of the ear in the current point list
        let i = points.indexOf(p);
        //get the index of the next and previous points
        let h = i === 0 ? points.length -1 : i - 1;
        let j = (i + 1) % points.length;

        // yield this triangle
        const triangle : Triangle = [points[h], points[i], points[j]];
        yield triangle;

        // more points to triangulate
        if (points.length > 3) {
            // we need to test if we will create any new ears by removing the current ear
            let hh = h === 0 ? points.length -1 : h -1;
            let jj = (j + 1) % points.length;

            let ps = [
                [points[hh], points[h], points[j]], // possible new ears created from before/after points
                [points[h], points[j], points[jj]]
            ];

            for (let group of ps ) {
                if (isEar([group[0], group[1], group[2]], points)) { // a new ear has appeared!
                    if (!ears.includes(group[1])) { // double check that this ear isnt in actually an old one... 
                        ears.push(group[1])
                    }
                } else if (ears.includes(group[1])) { // this point was an ear, but is no longer one...
                    ears.splice(ears.indexOf(group[1], 1)); /// get rid of it
                }
            }
        }

        // remove this ear/point from the points list
        points.splice(i, 1);
    }
}

function* earclipIndices(polygon : Polygon2D, indices : number[]) : Generator<number[]> {

    if (polygon.isClockwise()) return;

    let points = [...polygon.points];
    let pointIndices = [...indices];
    let ears = findEars(polygon);

    while(ears.length && points.length >= 3) {
        // get the next ear
        let p = ears.pop() as Point2D;
        // get the index of the ear in the current point list
        let i = points.indexOf(p);
        //get the index of the next and previous points
        let h = i === 0 ? points.length -1 : i - 1;
        let j = (i + 1) % points.length;
        // remove this ear/point from the points list

        yield [pointIndices[h], pointIndices[i], pointIndices[j]];

        // more points to triangulate
        if (points.length > 3) {
            // we need to test if we will create any new ears by removing the current ear
            let hh = h === 0 ? points.length -1 : h -1;
            let jj = (j + 1) % points.length;

            let ps = [
                [points[hh], points[h], points[j]], // possible new ears created from before/after points
                [points[h], points[j], points[jj]]
            ];

            for (let group of ps ) {
                if (isEar([group[0], group[1], group[2]], points)) { // a new ear has appeared!
                    if (!ears.includes(group[1])) { // double check that this ear isnt in actually an old one... 
                        ears.push(group[1])
                    }
                } else if (ears.includes(group[1])) { // this point was an ear, but is no longer one...
                    ears.splice(ears.indexOf(group[1], 1)); /// get rid of it
                }
            }
        }

        // remove this ear/point from the points list
        pointIndices.splice(i, 1);
        points.splice(i, 1);
    }
}

function isEar(triangle : Triangle, points : Point2D[]) {
    
    const trianglePolygon = new Polygon2D(triangle);

    if (trianglePolygon.isClockwise() || !trianglePolygon.area ) {
        return false;
    }
    for (let point of points) {
        if (!trianglePolygon.points.includes(point)) {
            if (trianglePolygon.contains(point)) {
                return false;
            }
        }
    }

    return true;
}
