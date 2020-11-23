'use strict';

const CUBE_FACE_INDICES = [
    [3, 7, 5, 1], // right
    [6, 2, 0, 4], // left
    [6, 7, 3, 2], // ??
    [0, 1, 5, 4], // ??
    [7, 6, 4, 5], // front
    [2, 3, 1, 0], // back
];

class primitives {

    static allButIndices(name) {
        return name !== 'indices';
    }

    static deindexVertices(vertices) {
        const indices = vertices.indices;
        const newVertices = {};
        const numElements = indices.length;

        function expandToUnindexed(channel) {
            const srcBuffer = vertices[channel];
            const numComponents = srcBuffer.numComponents;
            const dstBuffer = webglUtils.createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
            for (let ii = 0; ii < numElements; ++ii) {
                const ndx = indices[ii];
                const offset = ndx * numComponents;
                for (let jj = 0; jj < numComponents; ++jj) {
                    dstBuffer.push(srcBuffer[offset + jj]);
                }
            }
            newVertices[channel] = dstBuffer;
        }

        Object.keys(vertices).filter(primitives.allButIndices).forEach(expandToUnindexed);

        return newVertices;
    }

    static applyFuncToV3Array(array, matrix, fn) {
        const len = array.length;
        const tmp = new Float32Array(3);
        for (let ii = 0; ii < len; ii += 3) {
            fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
            array[ii] = tmp[0];
            array[ii + 1] = tmp[1];
            array[ii + 2] = tmp[2];
        }
    }

    static transformNormal(mi, v, dst) {
        dst = dst || new Float32Array(3);
        const v0 = v[0];
        const v1 = v[1];
        const v2 = v[2];

        dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
        dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
        dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

        return dst;
    }

    static reorientDirections(array, matrix) {
        primitives.applyFuncToV3Array(array, matrix, m4.transformDirection);
        return array;
    }

    static reorientNormals(array, matrix) {
        primitives.applyFuncToV3Array(array, m4.inverse(matrix), primitives.transformNormal);
        return array;
    }

    static reorientPositions(array, matrix) {
        primitives.applyFuncToV3Array(array, matrix, m4.transformPoint);
        return array;
    }

    static reorientVertices(arrays, matrix) {
        Object.keys(arrays).forEach(function (name) {
            const array = arrays[name];
            if (name.indexOf('pos') >= 0) {
                primitives.reorientPositions(array, matrix);
            } else if (name.indexOf('tan') >= 0 || name.indexOf('binorm') >= 0) {
                primitives.reorientDirections(array, matrix);
            } else if (name.indexOf('norm') >= 0) {
                primitives.reorientNormals(array, matrix);
            }
        });
        return arrays;
    }


    static makeDefaultVertexColors(vertices, options) {
        options = options || {};

        const numElements = vertices.position.numElements === undefined
            ? webglUtils.getNumElementsFromNonIndexedArrays(vertices)
            : vertices.position.numElements;

        const vColors = webglUtils.createAugmentedTypedArray(
            4, numElements, Uint8Array
        );

        vertices.color = vColors;

        if (vertices.indices) {
            for (let i = 0; i < numElements; i++) {
                const color = [
                    255, 255, 255, 255
                ];
                vColors.push(color);
            }

            return vertices;
        }

        const numVertsPerColor = options.vertsPerColor || 3;
        const numSets = numElements / numVertsPerColor;
        for (let i = 0; i < numSets; ++i) {
            const color = [
                255, 255, 255, 255
            ];
            for (let j = 0; j < numVertsPerColor; j++) {
                vColors.push(color);
            }
        }

        return vertices;
    }

    static createSphereVertices(
        radius,
        subdivisionsAxis,
        subdivisionsHeight,
        opt_startLatitudeInRadians,
        opt_endLatitudeInRadians,
        opt_startLongitudeInRadians,
        opt_endLongitudeInRadians) {
        if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
            throw Error('subdivisionAxis and subdivisionHeight must be > 0');
        }

        opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
        opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
        opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
        opt_endLongitudeInRadians = opt_endLongitudeInRadians || (Math.PI * 2);

        const latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
        const longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

        const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
        const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
        const normals = webglUtils.createAugmentedTypedArray(3, numVertices);
        const texCoords = webglUtils.createAugmentedTypedArray(2, numVertices);

        // Generate the individual vertices in our vertex buffer.
        for (let y = 0; y <= subdivisionsHeight; y++) {
            for (let x = 0; x <= subdivisionsAxis; x++) {
                // Generate a vertex based on its spherical coordinates
                const u = x / subdivisionsAxis;
                const v = y / subdivisionsHeight;
                const theta = longRange * u;
                const phi = latRange * v;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const ux = cosTheta * sinPhi;
                const uy = cosPhi;
                const uz = sinTheta * sinPhi;
                positions.push(radius * ux, radius * uy, radius * uz);
                normals.push(ux, uy, uz);
                texCoords.push(1 - u, v);
            }
        }

        const numVertsAround = subdivisionsAxis + 1;
        const indices = webglUtils.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
        for (let x = 0; x < subdivisionsAxis; x++) {
            for (let y = 0; y < subdivisionsHeight; y++) {
                // Make triangle 1 of quad.
                indices.push(
                    (y + 0) * numVertsAround + x,
                    (y + 0) * numVertsAround + x + 1,
                    (y + 1) * numVertsAround + x);

                // Make triangle 2 of quad.
                indices.push(
                    (y + 1) * numVertsAround + x,
                    (y + 0) * numVertsAround + x + 1,
                    (y + 1) * numVertsAround + x + 1);
            }
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }

    static createCubeVertices(size) {
        const k = size / 2;

        const cornerVertices = [
            [-k, -k, -k],
            [+k, -k, -k],
            [-k, +k, -k],
            [+k, +k, -k],
            [-k, -k, +k],
            [+k, -k, +k],
            [-k, +k, +k],
            [+k, +k, +k],
        ];

        const faceNormals = [
            [+1, +0, +0],
            [-1, +0, +0],
            [+0, +1, +0],
            [+0, -1, +0],
            [+0, +0, +1],
            [+0, +0, -1],
        ];

        const uvCoords = [
            [1, 0],
            [0, 0],
            [0, 1],
            [1, 1],
        ];

        const numVertices = 6 * 4;
        const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
        const normals = webglUtils.createAugmentedTypedArray(3, numVertices);
        const texCoords = webglUtils.createAugmentedTypedArray(2, numVertices);
        const indices = webglUtils.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

        for (let f = 0; f < 6; ++f) {
            const faceIndices = CUBE_FACE_INDICES[f];
            for (let v = 0; v < 4; ++v) {
                const position = cornerVertices[faceIndices[v]];
                const normal = faceNormals[f];
                const uv = uvCoords[v];

                positions.push(position);
                normals.push(normal);
                texCoords.push(uv);

            }
            // Two triangles make a square face.
            const offset = 4 * f;
            indices.push(offset + 0, offset + 1, offset + 2);
            indices.push(offset + 0, offset + 2, offset + 3);
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }

    static createTruncatedConeVertices(
        bottomRadius,
        topRadius,
        height,
        radialSubdivisions,
        verticalSubdivisions,
        opt_topCap,
        opt_bottomCap) {
        if (radialSubdivisions < 3) {
            throw Error('radialSubdivisions must be 3 or greater');
        }

        if (verticalSubdivisions < 1) {
            throw Error('verticalSubdivisions must be 1 or greater');
        }

        const topCap = (opt_topCap === undefined) ? true : opt_topCap;
        const bottomCap = (opt_bottomCap === undefined) ? true : opt_bottomCap;

        const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

        const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
        const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
        const normals = webglUtils.createAugmentedTypedArray(3, numVertices);
        const texCoords = webglUtils.createAugmentedTypedArray(2, numVertices);
        const indices = webglUtils.createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);

        const vertsAroundEdge = radialSubdivisions + 1;

        // The slant of the cone is constant across its surface
        const slant = Math.atan2(bottomRadius - topRadius, height);
        const cosSlant = Math.cos(slant);
        const sinSlant = Math.sin(slant);

        const start = topCap ? -2 : 0;
        const end = verticalSubdivisions + (bottomCap ? 2 : 0);

        for (let yy = start; yy <= end; ++yy) {
            let v = yy / verticalSubdivisions;
            let y = height * v;
            let ringRadius;
            if (yy < 0) {
                y = 0;
                v = 1;
                ringRadius = bottomRadius;
            } else if (yy > verticalSubdivisions) {
                y = height;
                v = 1;
                ringRadius = topRadius;
            } else {
                ringRadius = bottomRadius +
                    (topRadius - bottomRadius) * (yy / verticalSubdivisions);
            }
            if (yy === -2 || yy === verticalSubdivisions + 2) {
                ringRadius = 0;
                v = 0;
            }
            y -= height / 2;
            for (let ii = 0; ii < vertsAroundEdge; ++ii) {
                const sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
                const cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
                positions.push(sin * ringRadius, y, cos * ringRadius);
                normals.push(
                    (yy < 0 || yy > verticalSubdivisions) ? 0 : (sin * cosSlant),
                    (yy < 0) ? -1 : (yy > verticalSubdivisions ? 1 : sinSlant),
                    (yy < 0 || yy > verticalSubdivisions) ? 0 : (cos * cosSlant));
                texCoords.push((ii / radialSubdivisions), 1 - v);
            }
        }

        for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
            for (let ii = 0; ii < radialSubdivisions; ++ii) {
                indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                    vertsAroundEdge * (yy + 0) + 1 + ii,
                    vertsAroundEdge * (yy + 1) + 1 + ii);
                indices.push(vertsAroundEdge * (yy + 0) + 0 + ii,
                    vertsAroundEdge * (yy + 1) + 1 + ii,
                    vertsAroundEdge * (yy + 1) + 0 + ii);
            }
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }

    static createFlattenedFunc(vertFunc) {
        return function (gl, ...args) {
            let vertices = vertFunc(...args);
            vertices = primitives.deindexVertices(vertices);
            vertices = primitives.makeDefaultVertexColors(vertices, {
                vertsPerColor: 6
            });
            return webglUtils.createBufferInfoFromArrays(gl, vertices);
        };
    }

    static createCubeWithVertexColorsBufferInfo(gl, ...args) {
        let func = primitives.createFlattenedFunc(primitives.createCubeVertices);

        return func(gl, ...args);
    }

    static createSphereWithVertexColorsBufferInfo(gl, ...args) {
        let func = primitives.createFlattenedFunc(primitives.createSphereVertices);

        return func(gl, ...args);
    }

    static createTruncatedConeWithVertexColorsBufferInfo(gl, ...args) {
        let func = primitives.createFlattenedFunc(primitives.createTruncatedConeVertices);

        return func(gl, ...args);
    }

}