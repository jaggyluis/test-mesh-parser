
import { Point2D, Vector2D } from './geometry';

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

    static fromDimensions(dimx : Vector2D, dimy : Vector2D) {
        
        const bbox = new BoundingBox2D();
        bbox.update([dimx[0], dimy[0]]);
        bbox.update([dimx[1], dimy[1]]);

        return bbox;
    }
}

export interface Bounded2D {

    bounds: BoundingBox2D
}


export class QuadTree<T extends Bounded2D> implements Bounded2D {

    private readonly MAX_ITEMS = 10;

    private readonly MAX_LEVELS = 5;

    private readonly _items : T[] = [];

    private readonly _nodes : QuadTree<T>[] = [];

    private _nodeIndex(bounds : BoundingBox2D) {

        for (let i = 0; i<this._nodes.length; i++) {
            if (this._nodes[i].bounds.containsOther(bounds)) {
                return i;
            }
        }

        return -1;
    }

    private _split() {

        const w = this.bounds.dx ;
        const h = this.bounds.dy ;
        const [x,y] = this.bounds.origin;

        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x + w /2, x + w ], [y + h /2, y + h]),  this._level + 1)); // tr
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x , x + w/2 ], [y + h /2, y + h]),  this._level + 1)); // tl
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x, x + w/2 ], [y, y + h/2]),  this._level + 1)); // br
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x + w /2, x + w ], [y, y + h/2]),  this._level + 1)); // bl
    }

    constructor(private readonly _bounds : BoundingBox2D, private readonly _level : number = 0) {}

    get bounds() { return this._bounds; }

    *itemsIterator(ignoreSubNodes : number[] = []) : Generator<T> {
        for (let i = 0; i< this._nodes.length; i++) {
            if (!ignoreSubNodes.includes(i)) {
                for (let item of this._nodes[i].itemsIterator()) {
                    yield item;
                }
            }
        }
        for (let item of this._items) {
            yield item;
        }
    }

    /**
     * 
     * @Time O(n) - we might need to split the node and re-insert all items 
     */
    insert(item : T, force : boolean = false) {
        if (this._nodes.length) {
            const index = this._nodeIndex(item.bounds);
            if (index != -1) {
                this._nodes[index].insert(item);
                return;
            }
        }

        // if we got here, the item did not fit in any sub nodes
        this._items.push(item);

        // if we are forcing an insert, it will go into this node without checking subnodes
        // this flag is mainly here to prevent infinite recursion
        if (force) return;

        if (this._items.length > this.MAX_ITEMS && this._level < this.MAX_LEVELS) {
            if (!this._nodes.length) {
                this._split();
            }
            const items =  [...this._items];
            this._items.length = 0;
            items.forEach(item => this.insert(item, true));
        }
    }

    /**
     * 
     * Post order traversal of the Quad tree with bounds as a heuristic
     * If a filter is provided, it will be used a a mapper function to determine if a result has been bound
     * 
     * @Time - worst case O(n), 
     */
    search(bounds : BoundingBox2D, filter : (item : T, node : QuadTree<T> ) => boolean = () => true ) : T | null {
        const index = this._nodeIndex(bounds);
        if (index !== -1 && this._nodes.length) {
            // search the subnode if a match was foind
            const search = this._nodes[index].search(bounds, filter);
            if (search) {
                return search;
            }
        }
        // if the search is not complete, search other subnodes, then the items in this node, but ignore the node at index
        // since we already searched it
        for (let item of this.itemsIterator([index])) {
            if (filter(item, this)) {
                return item;
            }
        }
        return null;
    }

    /**
     * 
     * Range searching
     */
    retrieve(bounds : BoundingBox2D, result : T[] = []) {
        const index = this._nodeIndex(bounds);
        if (index !== -1 && this._nodes.length) {
            // retrieve any items from the matched tree node
            this._nodes[index].retrieve(bounds, result); 
        }
        // retrieve items in this node only
        for (let item of this.itemsIterator([0,1,2,3])) { 
            result.push(item);
        }
        return result;
    }
}