
import { FVMesh, FVMeshData, PointGraphEdgeData } from './lib/mesh';
import { WebGLCanvasFVMeshRenderer, Color3fv, randomColor3fv } from './lib/renderer';

import { data, validatePointGraphData } from './data/data';
import { Point2D } from './lib/geometry';
import { Graph } from './lib/graph';

/**
 * Main application method - needs a lot of cleanup
 */
(() => {

    let cache = false;
    let curr: FVMeshData | null = null;

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

    // graph selection 
    const menu = document.getElementById('menu') as HTMLDivElement;
    const menuItems: HTMLElement[] = [];

    // load default test cases
    data.forEach((t, i) => {
        createMenuItem(data[i], i)
    });

    // file uploads
    const loader = document.getElementById('fileid') as HTMLInputElement;
    let loadType: 'graph' | 'mesh' | null = null;
    loader.addEventListener('change', (ev) => {

        if (!loadType) return;

        const input = ev.target as HTMLInputElement;
        const files = input.files;
        const file = files ? files[0] : null;
        if (file) {
            const reader = new FileReader();
            const info = file.name.split('.');
            info.pop()
            const name = info.join();
            reader.onload = (e) => {
                const target: any = e.target;
                const str = target.result;
                switch (loadType) {
                    case 'graph': {
                        try {
                            const data: PointGraphEdgeData = validatePointGraphData(JSON.parse(str));
                            const item = createMenuItem(data, name);
                            console.log(`created data for ${file.name}`);
                            item.click();
                        } catch (error) {
                            alert(`Could not parse graph from ${file.name}\nReason : ${error.message}`)
                        }
                        break;
                    }
                    case 'mesh': {
                        alert('not implemented');
                        break;
                    }
                    default: {
                        console.error(`invalid load type ${loadType}`)
                    }
                }
                // clear the input data 
                (input as any).value = null; // dirty, dirty...
                loadType = null;
            };
            reader.readAsText(file);
        }
    });
    const loadGraph = document.getElementById('graph') as HTMLButtonElement;
    loadGraph.addEventListener('click', () => {
        loadType = 'graph';
        loader.click();
    });
    const loadMesh = document.getElementById('mesh') as HTMLButtonElement;
    loadMesh.addEventListener('click', () => {
        loadType = 'mesh';
        loader.click();
    });

    // save mesh to file
    const saveMesh = document.getElementById('save') as HTMLButtonElement;
    let saveMeshData : FVMeshData | null = null;
    let saveMeshName : string | null = null;
    saveMesh.addEventListener('click', () => {
        if (!saveMeshData) return;
        const a = document.createElement("a");
        var file = new Blob([JSON.stringify(saveMeshData)], {type: 'text/plain'});
        a.download = `${saveMeshName || 'mesh'}.json`;
        a.href = URL.createObjectURL(file);
        a.click();
    });

    // switch between running point intersection algorithm on raw mesh data JSON object 
    // (i.e. rebuild the mesh on every mouse move ) vs cached mesh class 
    const cacheMesh = document.getElementById('cache') as HTMLButtonElement;
    cacheMesh.addEventListener("click", () => {
        cache = !cache;
        if (!cache) {
            cacheMesh.innerText = 'cache mesh [faster]';
            cacheMesh.classList.remove('selected');
        } else {
            cacheMesh.innerText = 'mesh cached [click to disable]';
            cacheMesh.classList.add('selected');
        }
    });


    /**
     * Add a new Data to the list
     * @param data data to be added to menu
     * @param id id of data - just for label
     */
    function createMenuItem(data: PointGraphEdgeData, id: string | number) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item'
        menuItem.innerText = data.name ? `${data.name}` : `graph ${id}`;
        menuItem.innerText += `: [E=${data.edges.length}, V=${data.vertices.length}]`;

        // select a new graph for viewing and analysis
        menuItem.addEventListener('click', () => {

            saveMesh.disabled = false;
            cacheMesh.disabled = false;

            menuItem.classList.add('selected');
            menuItems.forEach(other => {
                if (menuItem !== other) {
                    other.classList.remove('selected');
                }
                while (other.children.length > 0) {
                    other.removeChild(other.children[other.children.length - 1]);
                }
            });

            /**
             * @TODO - these should be application globals
             * and not sit inside the handler
             */
            let meshData = runA1(data);
            let meshFaceColors = meshData.faces.map(f => randomColor3fv());
            let meshFaceColorsStatic = [...meshFaceColors]; // only adding this to save the original colors
            let mesh = new FVMesh(meshData);
            let meshFaceIndex = -1;

            // need to assign these here because I haven't moved the above to globals...
            saveMeshData = meshData;
            saveMeshName = data.name ? `${data.name}_mesh` : `mesh ${id}`;

            // console.log(JSON.stringify(meshData));

            if (renderer) {
                renderer.clear();
                renderer.setMesh(mesh);
                renderer.renderMeshFill(meshFaceColors);

                if (data.edges.length < 10000) renderer.renderEdges(data.edges); // hard to see colors on large meshes when edges are rendered
                if (data.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered

                renderer.onMeshMouseMove((point, mouseEvent) => { // this method will return the mouse cursor remapped to the active mesh coordinate system

                    const faceIndex = cache ? runA3Cached(mesh, point) : runA3(meshData, point);

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

                            if (data.edges.length < 10000) renderer.renderEdges(data.edges); // hard to see colors on large meshes when edges are rendered
                            if (data.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered
                        }

                        tooltip.classList.add('active');

                        // the new face is the same....
                    } else if (faceIndex === -1 && meshFaceIndex !== -1) {

                        meshFaceColors = meshData.faces.map(f => randomColor3fv());

                        renderer.clear();
                        renderer.renderMeshFill(meshFaceColors);

                        if (data.edges.length < 10000) renderer.renderEdges(data.edges); // hard to see colors on large meshes when edges are rendered
                        if (data.edges.length < 10000) renderer.renderMeshLines(); // hard to see colors on large meshes when edges are rendered

                        tooltip.classList.remove('active');
                        tooltip.innerHTML = '';
                    }

                    // update the tooltip with the new faceId
                    tooltip.innerText = `${faceIndex}`;
                    tooltip.style.top = `${mouseEvent.clientY - 30}px`;
                    tooltip.style.left = `${mouseEvent.clientX}px`;

                    meshFaceIndex = faceIndex;
                })
            }
        });

        menuItems.push(menuItem);
        menu.appendChild(menuItem);

        return menuItem;
    }

    function runA1(data: PointGraphEdgeData): FVMeshData {
        const now = performance.now();
        const result = FVMesh.fromPointGraphEdgeData(data).toJSON();
        logToScreen(`calc A1 [F=${result.faces.length}] took ${performance.now() - now}ms`);
        return result;
    }

    function runA2(data: FVMeshData, faceIndex: number): number[] {
        const now = performance.now();
        const result = data.faceAdjacencies[faceIndex] || [];
        logToScreen(`calc A2 [F=${result.length}] took ${performance.now() - now}ms`);
        return result;
    }

    function runA3(data: FVMeshData, point: Point2D) {
        const now = performance.now();
        let count = 0;
        const result = new FVMesh(data).findEnclosingFace(point, (faceIndex, searchCount) => {
            count = searchCount;
        });
        if (result !== -1) logToScreen(`calc A3 [I=${result} SEARCHED=${count}] took ${performance.now() - now}ms`);
        return result;
    }

    function runA3Cached(mesh: FVMesh, point: Point2D) {
        const now = performance.now();
        let count = 0;
        const result = mesh.findEnclosingFace(point, (faceIndex, searchCount) => {
            count = searchCount;
        });
        if (result !== -1) logToScreen(`calc A3 CACHED [I=${result}, SEARCHED=${count}] took ${performance.now() - now}ms`);
        return result;
    }

    function runA4(data: FVMeshData, faceIndex: number) {
        const now = performance.now();
        const result = Graph.BFSLayers(data.faceAdjacencies, faceIndex);
        logToScreen(`calc A4 [F=${data.faces.length} L=${result.length}] took ${performance.now() - now}ms`);
        return result;
    }

})();


