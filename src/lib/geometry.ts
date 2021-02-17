
/**
 * @NOTE - using simple types for Vector and Point, but they could be classses
 */
export type Vector2D = [number, number];

export type Vector4D = [number, number, number, number];

export type Point2D = Vector2D;

export type Triangle = [Point2D, Point2D, Point2D];

/**
 * 
 * @NOTE -  needed to look this one up actually, it's been a while
 * @link https://bl.ocks.org/shancarter/1034db3e675f2d3814e6006cf31dbfdc
 * 
 */
export function angleTwoVectors(source: Vector2D, compare: Vector2D) {

    var a2 = Math.atan2(source[1], source[0]);
    var a1 = Math.atan2(compare[1], compare[0]);
    var sign = a1 > a2 ? 1 : -1;
    var angle = a1 - a2;
    var K = -sign * Math.PI * 2;
    var angle = (Math.abs(K + angle) < Math.abs(angle)) ? K + angle : angle;
    var degrees = 360 * angle / (Math.PI * 2);

    return degrees
}

export function vectorTwoPoints(start: Point2D, end: Point2D) {
    return [end[0] - start[0], end[1] - start[1]] as Vector2D;
}

export function vectorCrossZ(v1 : Vector2D, v2 : Vector2D) {
    return (v1[0] * v2[1]) - (v1[1] * v2[0]);
}

export function vectorEquality(v1: Vector2D, v2: Vector2D) {
    return v1[0] === v2[0] && v1[1] === v2[1];
}

export function triangleContains(triangle: Triangle, point: Point2D) {

    for (let i = 0; i < triangle.length; i++) {

        let prevIndex = i === 0 ? triangle.length - 1 : i - 1;
        let nextIndex = (i + 1) % triangle.length;

        const prevVec = vectorTwoPoints(triangle[i], triangle[prevIndex])
        const testVec = vectorTwoPoints(triangle[i], point);
        const nextVec = vectorTwoPoints(triangle[i], triangle[nextIndex]);

        if (angleTwoVectors(nextVec, testVec) > angleTwoVectors(nextVec, prevVec)) {
            return false;
        }
    }

    return true;
}

