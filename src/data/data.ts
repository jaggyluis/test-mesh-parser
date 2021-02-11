
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
        ]
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
        "name": "quad with flat edge + triangle",
        "__faces": [
            '0-1-2-4',
            '0-2-3'
        ]
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
        ]
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
        ]
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
        ]
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
        ]
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
        ]
    },

    createGrid(10, 10, 1, 'grid [small]'),
    createGrid(100, 100, 0.4, 'grid [medium]'),
    createGrid(200, 200, 1, 'grid [stress]'),
    createWeirdoGrid(8, 8, 1, 0, 'weirdo grid edge lenth 1'),
    createWeirdoGrid(30, 30, 100, 0, 'weirdo grid edge length 100'),
    createWeirdoGrid(8, 8, 1, 0.2, 'random remove [small]'),
    createWeirdoGrid(30, 30, 100, 0.3, 'random remove [medium]'),
]

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