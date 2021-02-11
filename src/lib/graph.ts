

export type Edge = [number, number];

export type AdjacencySet = { [nodeIndex: number]: Set<number> };

export type AdjacencyList = { [nodeIndex: number]: number[] };

export class Graph {

    protected _adjacencies: AdjacencySet = {};

    protected _addEdge(edge: Edge) {

        if (this._adjacencies[edge[0]]) {
            this._adjacencies[edge[0]].add(edge[1]);
        } else {
            this._adjacencies[edge[0]] = new Set<number>([edge[1]]);
        }
    }

    protected _removeEdge(edge: Edge) {

        if (this._adjacencies[edge[0]]) {
            this._adjacencies[edge[0]].delete(edge[1]);
        }
        if (!this._adjacencies[edge[0]].size) {
            delete this._adjacencies[edge[0]];
        }
    }

    constructor(adjacencies: AdjacencyList = {}) {
        Object.keys(adjacencies).forEach(nodeIndex => {
            adjacencies[+nodeIndex].forEach(neighborIndex => {
                this.addEdge([+nodeIndex, +neighborIndex]);
            });
        });
    }

    *iterableNodeIndices(minDegree: number = 0) {
        for (let nodeIndex in this._adjacencies) {
            if (this._adjacencies[nodeIndex].size >= minDegree) {
                yield +nodeIndex;
            }
        }
    }

    *iterableEdges(minDegree: number = 1) {
        for (let nodeIndex of this.iterableNodeIndices(minDegree)) {
            for (let neighbor of this.iterableNeighborIndices(nodeIndex)) {
                yield [+nodeIndex, neighbor] as Edge;
            }
        }
    }

    *iterableNeighborIndices(nodeIndex: number) {
        if (this._adjacencies[nodeIndex]) {
            for (let neighbor of this._adjacencies[nodeIndex]) {
                yield neighbor;
            }
        }
    }

    addEdge(edge: Edge, directed = false) {
        this._addEdge(edge);
        if (!directed) {
            this._addEdge([edge[1], edge[0]]);
        }
    }

    removeEdge(edge: Edge, directed = false) {
        this._removeEdge(edge);
        if (!directed) {
            this._removeEdge([edge[1], edge[0]]);
        }
    }

    hasNeighbor(nodeIndex: number, neighborIndex: number) {
        if (this._adjacencies[nodeIndex]) {
            return this._adjacencies[nodeIndex].has(neighborIndex);
        }
        return false;
    }

    toJSON() {
        const adjacencies: AdjacencyList = {};
        for (let nodeIndex of this.iterableNodeIndices()) {
            adjacencies[nodeIndex] = [...this.iterableNeighborIndices(nodeIndex)];
        }
        return { adjacencies };
    }

    /**
     * @Time O(E)
     * @Space O(E+V) 
     */
    static fromEdges(edges: Edge[] = []) {
        const graph = new Graph();
        edges.forEach(edge => graph.addEdge(edge));
        return graph;
    }

    /**
     * @Time O(E+V)
     * @Space O(V)
     */
    static BFSLayers(adjacencyList: AdjacencyList, startNodeIndex: number) {

        // output result
        const layers: number[][] = [];
        // list of all visited nodes from the graph
        const visited = new Set<number>();
        // queue element for this search is not a single node, but a whole layer
        const queue = [new Set<number>([startNodeIndex])];
        // run the bfs search
        while (queue.length) {
            // building the output layer here from the set
            const layer = [];
            /** 
             * @NOTE - unfortunately we cant use an O(1) queue in js without a custom LinkedList class,
             *  so this is O(n) where n is the queue length  
             */
            const layerSet = queue.shift() as Set<number>;
            // next layer to iterate - will be added to the result once it comes off the queue 
            const layerSetNext = new Set<number>();

            for (let nodeIndex of layerSet) {
                if (!visited.has(nodeIndex)) {

                    visited.add(nodeIndex);
                    layer.push(nodeIndex);

                    if (adjacencyList[nodeIndex]) {
                        adjacencyList[nodeIndex].forEach(neighborIndex => {
                            if (!visited.has(neighborIndex) && !layerSet.has(neighborIndex)) {
    
                                layerSetNext.add(neighborIndex);
                            }
                        });
                    }
                }
            }

            // no need to output an empty last layer
            if (layer.length) layers.push(layer);
            // don't want to queue empty layers - infinite loop
            if (layerSetNext.size) queue.push(layerSetNext);
        }

        return layers;
    }
}
