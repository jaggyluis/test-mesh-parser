
import { Point2D } from "../lib/geometry";
import { Edge } from "../lib/graph";
import { PointGraphEdgeData } from "../lib/mesh"

export const data: PointGraphEdgeData[] = [

    /**
     * 
     * 0
     * 
     * 3       2
     * |       | 
     * |       |   
     * |       |     
     * 0 _ _ _ 1 
     *         |
     *         |
     *         |
     *         4
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [2, -2]],
        "edges": [[0, 1], [1, 2], [0, 3], [1, 4]],
        "name": 'invalid graph',
        "__faces": []
    },


    /**
     * 
     * 1
     * 
     * 3 _ _ _ 2
     * |       | 
     * |       |   
     * |       |     
     * 0 _ _ _ 1 
     * 
     * 
     * 
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2]],
        "edges": [[0, 1], [1, 2], [0, 3], [2, 3]],
        "name": "simple square cycle",
        "__faces": [
            '0-1-2-3'
        ]
    },

    /**
     * 
     * 2
     * 
     * 3 _ _ _ 2
     * |     / | 
     * |   /   |   
     * | /     |     
     * 0 _ _ _ 1 
     * 
     * 
     * 
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2]],
        "edges": [[0, 1], [1, 2], [0, 2], [0, 3], [2, 3]],
        "name": "rectangle with diagonal",
        "__faces": [
            '0-1-2',
            '0-2-3',
        ],
        "__faceAdjacencies" : { 
            "0-1-2": ["0-2-3"],
            "0-2-3": ["0-1-2"],
        },
        "__faceLevels" : {

        },
        "__facePoints" : [
            [0.2, 0.1, 0],
            [0.5, 0.8, 1] 
        ]
    },

    /**
     * 
     * 3
     * 
     * 3 _ _ _ 2
     * |     / | \
     * |   /   |   \
     * | /     |     \
     * 0 _ _ _ 1 _ _ _ 4
     * 
     * 
     * 
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [10, 0]],
        "edges": [[0, 1], [1, 2], [0, 2], [0, 3], [2, 3], [1, 4], [2, 4]],
        "name": "2 diagonals",
        "__faces": [
            '0-1-2',
            '0-2-3',
            '1-2-4',
        ],
        "__faceAdjacencies" : {
            '0-1-2' : [
                '0-2-3',
                '1-2-4'
            ],
            '0-2-3' : [
                '0-1-2'
            ],
            '1-2-4' : [
                '0-1-2'
            ]
        }
    },

    /**
     * 
     * 4
     * 
     * 3 _ _ _ 2
     * |     /   \
     * |   /       \
     * | /           \
     * 0 _ _ _ 1 _ _ _ 4
     * 
     * 
     * 
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0]],
        "edges": [[0, 1], [0, 2], [0, 3], [2, 3], [1, 4], [2, 4]],
        "name": "flat edge quad + triangle",
        "__faces": [
            '0-1-2-4',
            '0-2-3'
        ],
        "__faceAdjacencies" : {
            '0-1-2-4' : [
                '0-2-3'
            ],
            '0-2-3' : [
                '0-1-2-4',
            ]
        }
    },

    /**
     * 
     * 6
     * 
     * 3 _ _ _ 2 _ _ _ 5 _ _ _ _ 6
     * |         \              |
     * |           \            |
     * |             \          |
     * 0 _ _ _ 1 _ _ _ 4 _ _ _ _7 
     * 
     * 
     * 
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0], [4, 2], [6, 2], [6, 0]],
        "edges": [[0, 1], [0, 3], [2, 3], [1, 4], [2, 4], [2, 5], [5, 6], [6, 7], [4, 7]],
        "name": "2 adjacent faces",
        "__faces": [
            '0-1-2-3-4',
            '2-4-5-6-7'
        ],
        "__faceAdjacencies" : {
            '0-1-2-3-4' : [
                '2-4-5-6-7'
            ],
            '2-4-5-6-7' : [
                '0-1-2-3-4'
            ]
        }
    },


    /** 
     *                 _ 5 _
     * 7           _ /      \ _
     *           /             \
     * 3 _ _ _ 2                6
     * |         \              |
     * |           \            |
     * |             \          |
     * 0 _ _ _ 1 _ _ _ 4 _ _ _ _7 
     * |                        |
     * |                        |
     * |                        |
     * 8 _ _ _ _ _ _ _ _ _ _ _ _9
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0], [4, 10], [6, 2], [6, 0], [0, -2], [6, -2]],
        "edges": [[0, 1], [0, 3], [2, 3], [1, 4], [2, 4], [2, 5], [5, 6], [6, 7], [4, 7], [0, 8], [8, 9], [7, 9]],
        "name": "3 adjacent faces",
        "__faces": [
            '0-1-4-7-8-9',
            '0-1-2-3-4',
            '2-4-5-6-7',
        ],
        "__faceAdjacencies" : {
            '0-1-4-7-8-9' : [
                '0-1-2-3-4',
                '2-4-5-6-7'
            ],
            '0-1-2-3-4' : [
                '0-1-4-7-8-9',
                '2-4-5-6-7'
            ],
            '2-4-5-6-7' : [
                '0-1-4-7-8-9',
                '0-1-2-3-4'
            ]
        }
    },


    /**
     * 
     * 8
     * 
     * 3 _ _ _ 2 _ _ _ 5 _ _ _ _ 6
     * |         \              |
     * |           \            |
     * |             \          |
     * 0 _ _ _ 1 _ _ _ 4 _ _ _ _7 
     * |     /    ___/          |
     * |   /  ___/              |
     * | /___/                  |
     * 8 _ _ _ _ _ _ _ _ _ _ _ _9
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0], [4, 2], [6, 2], [6, 0], [0, -2], [6, -2]],
        "edges": [[0, 1], [0, 3], [2, 3], [1, 4], [2, 4], [2, 5], [5, 6], [6, 7], [4, 7], [0, 8], [8, 9], [7, 9], [8, 1], [4, 8]],
        "name": "acute angles",
        "__faces": [
            '0-1-2-3-4',
            '0-1-8',
            '1-4-8',
            '4-7-8-9',
            '2-4-5-6-7'
        ],
        "__faceAdjacencies" : {
            '0-1-2-3-4' : [
                '0-1-8',
                '1-4-8',
                '2-4-5-6-7'
            ],
            '0-1-8' : [
                '0-1-2-3-4',
                '1-4-8'
            ],
            '1-4-8' : [
                '0-1-2-3-4',
                '0-1-8',
                '4-7-8-9'
            ],
            '4-7-8-9' : [
                '1-4-8',
                '2-4-5-6-7'
            ],
            '2-4-5-6-7' : [
                '0-1-2-3-4',
                '4-7-8-9'
            ]
        }
    },

    /**
     * 
     * 
     * 
     * 3 _ _ _ 2 _ _ _ 5 _ _ _ _ 6
     * |       |       |        |
     * |       |       |        |
     * |       |       |        |
     * 0       1 _ _ _ 4        7 
     * |                        |
     * |                        |
     * |                        |
     * 8 _ _ _ _ _ _ _ _ _ _ _ _9
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0], [4, 2], [6, 2], [6, 0], [0, -2], [6, -2]],
        "edges": [[0, 3], [2, 3], [1, 4], [2, 5], [5, 6], [6, 7], [0, 8], [8, 9], [7, 9], [1, 2], [4, 5]],
        "name": "convex + concave",
        "__faces": [
            '0-1-2-3-4-5-6-7-8-9',
            '1-2-4-5'
        ],
        "__faceAdjacencies" : {
            '0-1-2-3-4-5-6-7-8-9' : [
                '1-2-4-5'
            ],
            '1-2-4-5' : [
                '0-1-2-3-4-5-6-7-8-9'
            ]
        }
    },

    /**
     * 
     * 
     * 
     * 3 _ _ _ 2       5 _ _ _ _ 6
     * |       |       |        |
     * |       |       |        |
     * |       |       |        |
     * 0       1 _ _ _ 4        7 _ 
     * |                            \ _
     * |                                \ _ 
     * |                                    \
     * 8 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 9
     */

    {
        "vertices": [[0, 0], [2, 0], [2, 2], [0, 2], [4, 0], [4, 2], [6, 2], [5, -1], [0, -2], [20, -2]],
        "edges": [[0, 3], [2, 3], [1, 4], [5, 6], [6, 7], [0, 8], [8, 9], [7, 9], [1, 2], [4, 5]],
        "name": 'complex shape bounds',
        "__faces": [
            '0-1-2-3-4-5-6-7-8-9',
        ],
        "__facePoints" : [
            [3,1,-1],
            [0.5, 0.5, 0],
            [15, -1.8, 0]
        ]
    },

    createGrid(10, 10, 1, 'grid [small]'),
    createGrid(100, 100, 0.4, 'grid [medium]'),
    createGrid(200, 200, 1, 'grid [stress] - slow'),
    createWeirdoGrid(8, 8, 1, 0, 'weirdo grid edge lenth 1'),
    createWeirdoGrid(30, 30, 100, 0, 'weirdo grid edge length 100'),
    createWeirdoGrid(8, 8, 1, 0.2, 'random remove [small]'),
    createWeirdoGrid(30, 30, 100, 0.3, 'random remove [medium]'),
    createWeirdoGrid(100, 100, 0.01, 0.3, 'random remove [stress] - slow'),
];


/**
 * Sanitize input data from client
 * @param data 
 */
export function validatePointGraphData(data : PointGraphEdgeData) {
    
    if (!data.edges || !Array.isArray(data.edges)) {
        throw new Error(`invalid PointGraphData edges. should be [number, number][], but got ${data.edges}`)
    } else {
        data.edges.forEach(edge => {
            if (!Array.isArray(edge) || edge.length !== 2 || typeof edge[0] !== 'number' || typeof edge[1] !== 'number') {
                throw new Error(`invalid PointGraphData edge. should be [number, number], but got ${edge}`);
            }
        })
    }

    if (!data.vertices || !Array.isArray(data.vertices)) {
        throw new Error(`invalid PointGraphData vertices. should be [number, number][], but got ${data.vertices}`)
    } else {
        data.vertices.forEach(vertex => {
            if (!Array.isArray(vertex) || vertex.length !== 2 || typeof vertex[0] !== 'number' || typeof vertex[1] !== 'number') {
                throw new Error(`invalid PointGraphData vertex. should be [number, number], but got ${vertex}`);
            }
        })
    }

    return data;
}

function createGrid(dimx: number, dimy: number, dist: number, name: string = 'grid'): PointGraphEdgeData {

    const vertices: Point2D[] = [];
    const edges: Edge[] = [];

    for (let i = 0; i <= dimx; i++) {
        for (let j = 0; j <= dimy; j++) {
            vertices.push([i * dist, j * dist]);
            if (j < dimy) {
                edges.push([vertices.length - 1, vertices.length]);
            }

            if (i < dimx) {
                edges.push([vertices.length - 1, vertices.length + dimy])
            }
        }
    }

    return { vertices, edges, name };
}

function createWeirdoGrid(dimx: number, dimy: number, dist: number, removeRatio = 0, name: string = 'weirdo'): PointGraphEdgeData {

    const vertices: Point2D[] = [];
    const edges: Edge[] = [];

    for (let i = 0; i <= dimx; i++) {

        for (let j = 0; j <= dimy; j++) {

            const x = i * dist + ((Math.random() - 0.5) * dist * 0.9);
            const y = j * dist + ((Math.random() - 0.5) * dist * 0.9);

            vertices.push([x, y]);
            if (j < dimy && Math.random() > removeRatio) {
                edges.push([vertices.length - 1, vertices.length]);
            }

            if (i < dimx && Math.random() > removeRatio) {
                edges.push([vertices.length - 1, vertices.length + dimy])
            }
        }
    }

    return { vertices, edges, name };
}