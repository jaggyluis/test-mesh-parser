
import { Point2D, Vector2D, Vector4D } from './geometry';

export interface Bounded2D {

    bounds(): BoundingBox2D
}

export class BoundingBox2D {

    private _dimx: Vector2D | null = null;

    private _dimy: Vector2D | null = null;

    constructor(points : Point2D[] = []) {
        points.forEach(p => this.update(p));
    }

    get origin(): Point2D {
        return [this.dimX[0], this.dimY[0]];
    }

    get centroid() : Point2D {
        return [this.dimX[0] + this.dx / 2, this.dimY[0] + this.dy /2]
    }

    get area() { 
        return this.dx * this.dy; 
    }

    get dx() {
        return this.dimX[1] - this.dimX[0];
    }

    get dy() {
        return this.dimY[1] - this.dimY[0];
    }

    get dimX(): Vector2D {
        return this._dimx || [0, 0];
    }

    get dimY(): Vector2D {
        return this._dimy || [0, 0];
    }

    update(point: Point2D) {

        if (this._dimx === null) {
            this._dimx = [point[0], point[0]]
        } else {
            this._dimx[0] = Math.min(this._dimx[0], point[0]);
            this._dimx[1] = Math.max(this._dimx[1], point[0]);
        }

        if (this._dimy === null) {
            this._dimy = [point[1], point[1]];
        } else {
            this._dimy[0] = Math.min(this._dimy[0], point[1]);
            this._dimy[1] = Math.max(this._dimy[1], point[1]);
        }
    }

    contains(point: Point2D) {
        return point[0] >= this.dimX[0] && point[0] <= this.dimX[1] &&
            point[1] >= this.dimY[0] && point[1] <= this.dimY[1];
    }

    /**
     * 
     * @TODO - not optimized
     */
    containsOther(bounds : BoundingBox2D) {
        for (let point of bounds.iterableCorners()) {
            if (!this.contains(point)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 
     * @TODO - not optimized
     */
    intersectsOther(bounds : BoundingBox2D) {
        for (let point of bounds.iterableCorners()) {
            if (this.contains(point)) {
                return true;
            }
        }
        for (let point of this.iterableCorners()) {
            if (bounds.contains(point)) {
                return true;
            }
        }
        return false;
    }

    *iterableCorners() {
        
        const dimX = this.dimX;
        const dimY = this.dimY;

        yield [dimX[0], dimY[0]] as Point2D;
        yield [dimX[1], dimY[0]] as Point2D;
        yield [dimX[1], dimY[1]] as Point2D;
        yield [dimX[0], dimY[1]] as Point2D;
    }

    toDimensions() : [Vector2D, Vector2D] {
        return [this.dimX, this.dimY];
    }

    static fromDimensions(dimx : Vector2D, dimy : Vector2D) {
        return new BoundingBox2D([[dimx[0], dimy[0]], [dimx[1], dimy[1]]])
    }

    toVector4D() : Vector4D {
        return [...this.dimX, ...this.dimY];
    }

    static fromVector4D(data : Vector4D) {
        return BoundingBox2D.fromDimensions([data[0], data[1]], [data[2], data[3]]);
    }
}


