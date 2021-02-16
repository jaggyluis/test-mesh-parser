import { Bounded2D, BoundingBox2D } from "./bbox";


/**
 * QuadTree class for quick 2d searching by bounds
 */
export class QuadTree<T extends Bounded2D> implements Bounded2D {

    private readonly MAX_ITEMS = 10;

    private readonly MAX_LEVELS = 5;

    private readonly _items : T[] = [];

    private readonly _nodes : QuadTree<T>[] = [];

    /**
     * 
     * Retrieve the appropriate sub-node for a bounding box
     * Will return -1 if the bounds does not fit cleanly inside any of the sub-nodes
     */
    private _nodeIndex(bounds : BoundingBox2D) {
        for (let i = 0; i<this._nodes.length; i++) {
            if (this._nodes[i].bounds().containsOther(bounds)) {
                return i;
            }
        }
        return -1;
    }

    private _split() {

        // make sure not to split multiple times
        if (this.hasSubNodes()) return;

        const w = this.bounds().dx ;
        const h = this.bounds().dy ;
        const [x,y] = this.bounds().origin;

        // initialize a new quad tree for each sub quadrant of this bounds
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x + w /2, x + w ], [y + h /2, y + h]),  this._level + 1)); // tr
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x , x + w/2 ], [y + h /2, y + h]),  this._level + 1)); // tl
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x, x + w/2 ], [y, y + h/2]),  this._level + 1)); // br
        this._nodes.push(new QuadTree<T>(BoundingBox2D.fromDimensions([x + w /2, x + w ], [y, y + h/2]),  this._level + 1)); // bl
    }

    constructor(private readonly _bounds : BoundingBox2D, private readonly _level : number = 0) {}

    bounds() { 
        return this._bounds; 
    }

    hasSubNodes() {
        return !!this._nodes.length;
    }

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

        if (this.hasSubNodes()) {
            const index = this._nodeIndex(item.bounds());   
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

            if (!this.hasSubNodes()) {
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

        // get the subnode index
        const index = this._nodeIndex(bounds);

        if (index !== -1 && this.hasSubNodes()) {
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

        // get the subnode index
        const index = this._nodeIndex(bounds);

        if (index !== -1 && this.hasSubNodes()) {
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