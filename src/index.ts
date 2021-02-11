
import { FVMesh, FVMeshData, PointGraphEdgeData } from './lib/mesh';
import { WebGLCanvasFVMeshRenderer, Color3fv, randomColor3fv } from './lib/renderer';

import { data } from './data/data';
import { Point2D } from './lib/geometry';
import { Graph } from './lib/graph';

(() => {

    const view = document.getElementById('view');
    const menu = document.getElementById('menu');
    const tooltip = document.getElementById('tooltip');
    const log = document.getElementById('log');
    const button = document.getElementById('optimize');

    let optimize = false;

    if (button) {

        button.addEventListener("click", () => {
            optimize = !optimize;
            if (!optimize) {
                button.innerText = 'optimize';
                button.classList.remove('selected');
            } else {
                button.innerText = 'optimized [cached mesh]';
                button.classList.add('selected');
            }
        })
    }

    const renderer = view && view instanceof HTMLCanvasElement ? new WebGLCanvasFVMeshRenderer(view) : null;

    if (menu) {

        const menuItems: HTMLElement[] = [];

        data.forEach((t, i) => {

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item'
            menuItem.innerText = `graph ${i} : [E=${t.edges.length}, V=${t.vertices.length}]`

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
                let mesh = new FVMesh(meshData);
                let meshFaceIndex = -1;

                if (renderer) {
                    renderer.clear();
                    renderer.setMesh(mesh);
                    renderer.renderFill(meshFaceColors);

                    renderer.onMeshMouseMove((point, mouseEvent) => {

                        const faceIndex = optimize ? runA3Optimmized(mesh, point) : runA3(meshData, point);

                        if (faceIndex >= 0 && faceIndex !== meshFaceIndex) {

                            let meshFaceAdjacencies = runA2(meshData, faceIndex);
                            let meshFaceLayers = runA4(meshData as FVMeshData, faceIndex); 

                            meshFaceLayers.forEach((layer, depth) => {
                                const val = depth / (meshFaceLayers.length || 1)
                                const color : Color3fv = [val, val, val];
                                layer.forEach(l => meshFaceColors[l] = color);
                            });

                            if (renderer) {
                                renderer.clear()
                                renderer.renderFill(meshFaceColors);
                                renderer.renderFace(faceIndex, [1,1,1])
                                meshFaceAdjacencies.forEach(j => renderer.renderFace(j, [0,0,0]));
                            } 
                        
                        } else if (faceIndex === -1 && meshFaceIndex !== -1 ) {

                            meshFaceColors = meshData.faces.map(f => randomColor3fv());

                            renderer.clear();
                            renderer.renderFill(meshFaceColors);

                            if (tooltip) {
                                tooltip.classList.remove('active');
                                tooltip.innerHTML = '';
                            }
                        }

                        if (tooltip) {
                            tooltip.classList.add('active');
                            tooltip.innerText = `${faceIndex}`;
                            tooltip.style.top = `${mouseEvent.clientY}px`;
                            tooltip.style.left = `${mouseEvent.clientX}px`;
                        }

                        meshFaceIndex = faceIndex;
                    })
                }

                if (meshData.faces) {

                    const submenuItems: HTMLElement[] = [];

                    const subMenu = document.createElement('div');
                    subMenu.className = 'sub-menu';
                    menuItem.appendChild(subMenu);

                    subMenu.addEventListener('mouseleave', () => {
                        if (renderer) {
                            renderer.clear();
                            renderer.renderFill();
                        }
                    })

                    meshData.faces.forEach((face, i) => {

                        let meshFaceIndex = i;
                        let meshFaceAdjacencies : number[] = [];

                        const submenuItem = document.createElement('div');
                        submenuItem.className = 'menu-item'
                        submenuItem.innerText = `face ${i}`

                        submenuItem.addEventListener('mouseenter', () => {

                            meshFaceAdjacencies = runA2(meshData, meshFaceIndex);

                            let meshFaceLayers = runA4(meshData as FVMeshData, meshFaceIndex); 

                            meshFaceLayers.forEach((layer, depth) => {
                                const val = depth / (meshFaceLayers.length || 1)
                                const color : Color3fv = [val, val, val];
                                layer.forEach(l => meshFaceColors[l] = color);
                            });

                            if (renderer) {
                                renderer.clear()
                                renderer.renderFill(meshFaceColors);
                                renderer.renderFace(meshFaceIndex, [1,1,1])
                                meshFaceAdjacencies.forEach(j => renderer.renderFace(j, [0,0,0]));
                            } 
                        });

                        submenuItems.push(submenuItem);
                        subMenu.appendChild(submenuItem);
                    });
                }
            });

            menuItems.push(menuItem);
            menu.appendChild(menuItem);
        });

    }

    function runA1(data: PointGraphEdgeData): FVMeshData {
        const now = Date.now();
        const result = FVMesh.fromPointGraphEdgeData(data).toJSON();
        logToScreen(`calc A1 [F=${result.faces.length}] took ${Date.now() - now}ms`);
        return result;

    }

    /**
     * @Time O(1) hashmap lookup
     * @Space O(0) existing hashmap lookup - no new data
     * 
     */
    function runA2(data: FVMeshData, faceIndex: number): number[] {
        const now = Date.now();
        const result = data.adjacencies[faceIndex] || [];
        logToScreen(`calc A2 [F=${result.length}] took ${Date.now() - now}ms`);
        return result;
    }

    function runA3(data: FVMeshData, point: Point2D) {
        const now = Date.now();
        const result = new FVMesh(data).findEnclosingFace(point, (faceIndex, searchCount) => {
            logToScreen(`calc A3 search at I=${faceIndex}, searched ${searchCount}`);
        });
        if (result !== -1) {
            logToScreen(`calc A3 [I=${result}] took ${Date.now() - now}ms`);
        }

        return result;
    }

    function runA3Optimmized(mesh : FVMesh, point : Point2D) {
        const now = Date.now();
        const result = mesh.findEnclosingFace(point, (faceIndex, searchCount) => {
            logToScreen(`calc A3 OPTIMIZED search at I=${faceIndex}, searched ${searchCount}`);
        });
        if (result !== -1) {
            logToScreen(`calc A3 OPTIMIZED [I=${result}] took ${Date.now() - now}ms`);
        }

        return result;
    }

    /**
     * 
     * @Time O(E + V) BFS
     * @Space O(V) for visited nodes 
     */
    function runA4(data: FVMeshData, faceIndex: number) {
        const now = Date.now();
        const result = Graph.BFSLayers(data.adjacencies, faceIndex);
        logToScreen(`calc A4 [F=${data.faces.length} L=${result.length}] took ${Date.now() - now}ms`);
        return result;
    }

    function logToScreen(str : string) {

        if (log) {
            if (log.innerHTML.length > 500) log.innerHTML = '';
            log.innerHTML += `<br>${str}`
        }
    }

})();


