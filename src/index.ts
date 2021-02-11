
import { FVMesh, FVMeshData, PointGraphEdgeData } from './lib/mesh';
import { WebGLCanvasFVMeshRenderer, Color3fv, randomColor3fv } from './lib/renderer';

import { data } from './data/data';
import { Point2D } from './lib/geometry';
import { Graph } from './lib/graph';

(() => {

    let optimize = false;

    // show active face index
    const tooltip = document.getElementById('tooltip') as HTMLDivElement;

    // main mesh render canvas
    const view = document.getElementById('view') as HTMLCanvasElement;
    view.width = window.innerWidth;
    view.height = window.innerHeight;

    // webgl renderer for mesh
    const renderer = new WebGLCanvasFVMeshRenderer(view);

    // log div for status updates
    const log = document.getElementById('log') as HTMLDivElement;
    const logToScreen = (str: string) => {
        if (log.innerHTML.length > 500) log.innerHTML = '';
        log.innerHTML += `<br>${str}`
    }

    // switch between running point intersection algorythm from raw data vs cached mesh class 
    const button = document.getElementById('optimize') as HTMLButtonElement;
    button.addEventListener("click", () => {
        optimize = !optimize;
        if (!optimize) {
            button.innerText = 'optimize';
            button.classList.remove('selected');
        } else {
            button.innerText = 'optimized [cached mesh]';
            button.classList.add('selected');
        }
    });

    // graph selection 
    const menu = document.getElementById('menu') as HTMLDivElement;
    const menuItems: HTMLElement[] = [];

    data.forEach((t, i) => {

        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item'
        menuItem.innerText = t.name ? `${t.name }`: `graph ${i}`;
        menuItem.innerText += `: [E=${t.edges.length}, V=${t.vertices.length}]`;

        // select a new graph for viewing and analysis
        menuItem.addEventListener('click', () => {

            menuItem.classList.add('selected');
            menuItems.forEach(other => {
                if (menuItem !== other) {
                    other.classList.remove('selected');
                }
                while (other.children.length > 0) {
                    other.removeChild(other.children[other.children.length - 1]);
                }
            });

            let meshData = runA1(data[i]);
            let meshFaceColors = meshData.faces.map(f => randomColor3fv());
            let meshFaceColorsStatic = [...meshFaceColors]; // only adding this to save the original colors
            let mesh = new FVMesh(meshData);
            let meshFaceIndex = -1;

            // console.log(JSON.stringify(meshData));

            if (renderer) {
                renderer.clear();
                renderer.setMesh(mesh);
                renderer.renderMeshFill(meshFaceColors);

                if (t.edges.length < 10000) renderer.renderEdges(t.edges); // hard to see colors on large meshes when edges are rendered
                if (t.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered

                renderer.onMeshMouseMove((point, mouseEvent) => { // this method will return the mouse cursor remapped to the active mesh coordinate system

                    const faceIndex = optimize ? runA3Optimmized(mesh, point) : runA3(meshData, point);

                    // a new face has appeared!!
                    if (faceIndex >= 0 && faceIndex !== meshFaceIndex) {

                        let meshFaceAdjacencies = runA2(meshData, faceIndex);
                        let meshFaceLayers = runA4(meshData as FVMeshData, faceIndex);

                        meshFaceLayers.forEach((layer, depth) => {
                            const val = depth / (meshFaceLayers.length || 1)
                            // const color: Color3fv = [val, 1, 1]; // gradient
                            // const color = randomColor3fv(); random - epileptic
                            const color = meshFaceColorsStatic[depth];
                            layer.forEach(l => meshFaceColors[l] = color);
                        });

                        if (renderer) {
                            renderer.clear()
                            renderer.renderMeshFill(meshFaceColors);
                            renderer.renderMeshFace(faceIndex, [1, 1, 1]);
                            meshFaceAdjacencies.forEach(j => renderer.renderMeshFace(j, [0, 0, 0]));

                            if (t.edges.length < 10000) renderer.renderEdges(t.edges); // hard to see colors on large meshes when edges are rendered
                            if (t.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered
                        }

                        tooltip.classList.add('active');

                    // the new face is the same....
                    } else if (faceIndex === -1 && meshFaceIndex !== -1) {

                        meshFaceColors = meshData.faces.map(f => randomColor3fv());

                        renderer.clear();
                        renderer.renderMeshFill(meshFaceColors);

                        if (t.edges.length < 10000) renderer.renderEdges(t.edges); // hard to see colors on large meshes when edges are rendered
                        if (t.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered

                        tooltip.classList.remove('active');
                        tooltip.innerHTML = '';
                    }

                    // update the tooltip with the new faceId
                    tooltip.innerText = `${faceIndex}`;
                    tooltip.style.top = `${mouseEvent.clientY-30}px`;
                    tooltip.style.left = `${mouseEvent.clientX}px`;

                    meshFaceIndex = faceIndex;
                })
            }
         });

        menuItems.push(menuItem);
        menu.appendChild(menuItem);
    });


    // **************** ALGORITHMS ****************

    /**
     * @Time O(E*(V+ElogE)) = O((E^2)*(VLogE)) worst case 
     * @Space O(E + V)
     */
    function runA1(data: PointGraphEdgeData): FVMeshData {
        const now = Date.now();
        const result = FVMesh.fromPointGraphEdgeData(data).toJSON();
        logToScreen(`calc A1 [F=${result.faces.length}] took ${Date.now() - now}ms`);
        return result;
    }

    /**
     * @Time O(1) hashmap lookup
     * @Space O(1) existing hashmap lookup - no new data
     * 
     */
    function runA2(data: FVMeshData, faceIndex: number): number[] {
        const now = Date.now();
        const result = data.faceAdjacencies[faceIndex] || [];
        logToScreen(`calc A2 [F=${result.length}] took ${Date.now() - now}ms`);
        return result;
    }

    /**
     * 
     * @Time O(A1) + O(A3-below), since currently we need to rebuild the mesh to access the quadtree,
     * although with an implementation of a static method that runs on the FVMeshData similar to A2 above, it should 
     * drop down to o(A3-below) = O(F*V) 
     * 
     * @Space  O(A1) + O(A3-below) = O(A1) + O(1) = O(A1) = O(E + V);
     * 
     */
    function runA3(data: FVMeshData, point: Point2D) {
        const now = Date.now();
        const result = new FVMesh(data).findEnclosingFace(point, (faceIndex, searchCount) => {
            logToScreen(`calc A3 search at I=${faceIndex}, searched ${searchCount}`);
        });
        if (result !== -1)  logToScreen(`calc A3 [I=${result}] took ${Date.now() - now}ms`);
        return result;
    }

    /**
     * 
     * @Time 
     * 
     * H - Height of QuadTree
     * N - max number of elements per bucket
     * Fv - Vertex count for face @NOTE - once implemented - right now this is substituting a bounds2d check
     * 
     * worst - (O(F*Fv) - search every face and compute polygon for every face 
     * average ( O(H *(N * Fv)) )
     * 
     * @Space O(1) - only things added here are the bbox and search point
     */
    function runA3Optimmized(mesh: FVMesh, point: Point2D) {
        const now = Date.now();
        const result = mesh.findEnclosingFace(point, (faceIndex, searchCount) => {
            logToScreen(`calc A3 OPTIMIZED search at I=${faceIndex}, searched ${searchCount}`);
        });
        if (result !== -1) logToScreen(`calc A3 OPTIMIZED [I=${result}] took ${Date.now() - now}ms`);
        return result;
    }

    /**
     * 
     * @Time O(E + V) BFS
     * @Space O(V) for visited nodes 
     */
    function runA4(data: FVMeshData, faceIndex: number) {
        const now = Date.now();
        const result = Graph.BFSLayers(data.faceAdjacencies, faceIndex);
        logToScreen(`calc A4 [F=${data.faces.length} L=${result.length}] took ${Date.now() - now}ms`);
        return result;
    }

})();


