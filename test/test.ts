

import { data } from '../src/data/data';
import { FVMesh, FVMeshData, PointGraphEdgeData } from './../src/lib/mesh';

console.warn('\x1b[33m', `

#########################################
########### running tests.... ###########
#########################################

`);

data.forEach((pointGraphEdgeData, i) => {
    describe(`testing ${pointGraphEdgeData.name || `test ${i}`}`, () => {

        let mesh: any = null;
        let meshData: any = null;

        it('should create a mesh from point data', () => {
            mesh = FVMesh.fromPointGraphEdgeData(pointGraphEdgeData);
        });

        it('should be able to serialize the mesh', () => {
            meshData = mesh.toJSON();
        });

        it('should be able to deserialize the mesh', () => {
            mesh = new FVMesh(meshData);
        });

        const faceHashes = meshData.faces.map((face: any) => {
            return [...face].sort().join('-');
        });

        if (pointGraphEdgeData.__faces) {

            it('should find the correct number of faces', () => {
                assert(pointGraphEdgeData.__faces.length === meshData.faces.length, () => {
                    console.log(`wrong face count - should be ${pointGraphEdgeData.__faces.length} but got ${meshData.faces.length}`);
                });
            });

            it('should be able to find every correct face', () => {
                pointGraphEdgeData.__faces.forEach((expectedFace: any) => {
                    assert(faceHashes.includes(expectedFace), () => {
                        console.log("missing", expectedFace);
                    });
                });
            });

            it('should not find any incorrect faces', () => {
                faceHashes.forEach((foundFace: any) => {
                    assert(pointGraphEdgeData.__faces.includes(foundFace), () => {
                        console.log('incorrect', foundFace);
                    });
                });
            });
        }

        if (pointGraphEdgeData.__faceAdjacencies) {

            it('should find the correct adjacent faces for each face', () => {

                faceHashes.forEach((foundFace : any, faceIndex : number) => {
                    
                    const foundAdjacencies = (meshData.faceAdjacencies[faceIndex] || []).map((fi : number) => faceHashes[fi]);
                    const foundAdjacencyHash = [...foundAdjacencies].sort().join('--');

                    const expectedAdjacencies = pointGraphEdgeData.__faceAdjacencies[foundFace] || [];
                    const expectedAdjacenciesHash = [...expectedAdjacencies].sort().join('--');

                    assert(foundAdjacencyHash == expectedAdjacenciesHash, () => {
                        console.log(`wrong adjacencies for ${foundFace}`);
                        console.log('found', foundAdjacencies);
                        console.log('expected', expectedAdjacencies);
                    });
                });
            });
        }

        if (pointGraphEdgeData.__faceLevels) {

            it ('should extract the correct adjacency levels @TODO', () => {
                // TODO
            });
        };

        if (pointGraphEdgeData.__facePoints) {

            it ('should find the correct enclosing face points', () => {

                pointGraphEdgeData.__facePoints.forEach((testPoint : [number, number, number]) => {

                    const face = (mesh as FVMesh).findEnclosingFace([testPoint[0], testPoint[1]]);
                    
                    assert(face === testPoint[2], () => {
                        console.log(`could not find face for [${testPoint[0]}, ${testPoint[1]}] expected ${testPoint[2]}. got ${face}`);
                    });
                });
            });
        }
    });
});

function describe(test: string, fn: Function) {
    console.log('\x1b[33m', test);
    fn();
    console.log();
}

function it(desc: string, fn: Function) {
    try {
        fn();
        console.log('   \x1b[32m%s\x1b[0m', '\u2714 ' + desc);
    } catch (error) {
        // console.log('\n');
        console.log('   \x1b[31m%s\x1b[0m', '\u2718 ' + desc);
        console.error(error.message);
    }
}

function assert(isTrue: boolean, onFalsy: Function) {
    if (!isTrue) {
        onFalsy();
        throw new Error();
    }
}