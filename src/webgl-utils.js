'use strict';

class webglUtils {

    static topWindow = this;

    static error(msg) {
        if (webglUtils.topWindow.console) {
            if (webglUtils.topWindow.console.error) {
                webglUtils.topWindow.console.error(msg);
            } else if (webglUtils.topWindow.console.log) {
                webglUtils.topWindow.console.log(msg);
            }
        }
    }

    static loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
        const errFn = opt_errorCallback || webglUtils.error;
        // Create the shader object
        const shader = gl.createShader(shaderType);

        // Load the shader source
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check the compile status
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            // Something went wrong during compilation; get the error
            const lastError = gl.getShaderInfoLog(shader);
            errFn('*** Error compiling shader \'' + shader + '\':' + lastError);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    static createProgram(
        gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
        const errFn = opt_errorCallback || webglUtils.error;
        const program = gl.createProgram();
        shaders.forEach(function (shader) {
            gl.attachShader(program, shader);
        });
        if (opt_attribs) {
            opt_attribs.forEach(function (attrib, ndx) {
                gl.bindAttribLocation(
                    program,
                    opt_locations ? opt_locations[ndx] : ndx,
                    attrib);
            });
        }
        gl.linkProgram(program);

        // Check the link status
        const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            // something went wrong with the link
            const lastError = gl.getProgramInfoLog(program);
            errFn('Error in program linking:' + lastError);

            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    static defaultShaderType = [
        'VERTEX_SHADER',
        'FRAGMENT_SHADER',
    ];

    static createProgramFromSources(
        gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
        const shaders = [];
        for (let ii = 0; ii < shaderSources.length; ++ii) {
            shaders.push(webglUtils.loadShader(
                gl, shaderSources[ii], gl[webglUtils.defaultShaderType[ii]], opt_errorCallback));
        }
        return webglUtils.createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
    }

    static getBindPointForSamplerType(gl, type) {
        if (type === gl.SAMPLER_2D) return gl.TEXTURE_2D;        // eslint-disable-line
        if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;  // eslint-disable-line
        return undefined;
    }

    static createUniformSetters(gl, program) {
        let textureUnit = 0;

        function createUniformSetter(program, uniformInfo) {
            const location = gl.getUniformLocation(program, uniformInfo.name);
            const type = uniformInfo.type;
            // Check if this uniform is an array
            const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
            if (type === gl.FLOAT && isArray) {
                return function (v) {
                    gl.uniform1fv(location, v);
                };
            }
            if (type === gl.FLOAT) {
                return function (v) {
                    gl.uniform1f(location, v);
                };
            }
            if (type === gl.FLOAT_VEC2) {
                return function (v) {
                    gl.uniform2fv(location, v);
                };
            }
            if (type === gl.FLOAT_VEC3) {
                return function (v) {
                    gl.uniform3fv(location, v);
                };
            }
            if (type === gl.FLOAT_VEC4) {
                return function (v) {
                    gl.uniform4fv(location, v);
                };
            }
            if (type === gl.INT && isArray) {
                return function (v) {
                    gl.uniform1iv(location, v);
                };
            }
            if (type === gl.INT) {
                return function (v) {
                    gl.uniform1i(location, v);
                };
            }
            if (type === gl.INT_VEC2) {
                return function (v) {
                    gl.uniform2iv(location, v);
                };
            }
            if (type === gl.INT_VEC3) {
                return function (v) {
                    gl.uniform3iv(location, v);
                };
            }
            if (type === gl.INT_VEC4) {
                return function (v) {
                    gl.uniform4iv(location, v);
                };
            }
            if (type === gl.BOOL) {
                return function (v) {
                    gl.uniform1iv(location, v);
                };
            }
            if (type === gl.BOOL_VEC2) {
                return function (v) {
                    gl.uniform2iv(location, v);
                };
            }
            if (type === gl.BOOL_VEC3) {
                return function (v) {
                    gl.uniform3iv(location, v);
                };
            }
            if (type === gl.BOOL_VEC4) {
                return function (v) {
                    gl.uniform4iv(location, v);
                };
            }
            if (type === gl.FLOAT_MAT2) {
                return function (v) {
                    gl.uniformMatrix2fv(location, false, v);
                };
            }
            if (type === gl.FLOAT_MAT3) {
                return function (v) {
                    gl.uniformMatrix3fv(location, false, v);
                };
            }
            if (type === gl.FLOAT_MAT4) {
                return function (v) {
                    gl.uniformMatrix4fv(location, false, v);
                };
            }
            if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
                const units = [];
                for (let ii = 0; ii < webglUtils.info.size; ++ii) {
                    units.push(textureUnit++);
                }
                return function (bindPoint, units) {
                    return function (textures) {
                        gl.uniform1iv(location, units);
                        textures.forEach(function (texture, index) {
                            gl.activeTexture(gl.TEXTURE0 + units[index]);
                            gl.bindTexture(bindPoint, texture);
                        });
                    };
                }(webglUtils.getBindPointForSamplerType(gl, type), units);
            }
            if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
                return function (bindPoint, unit) {
                    return function (texture) {
                        gl.uniform1i(location, unit);
                        gl.activeTexture(gl.TEXTURE0 + unit);
                        gl.bindTexture(bindPoint, texture);
                    };
                }(webglUtils.getBindPointForSamplerType(gl, type), textureUnit++);
            }
            throw ('unknown type: 0x' + type.toString(16)); // we should never get here.
        }

        const uniformSetters = {};
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let ii = 0; ii < numUniforms; ++ii) {
            const uniformInfo = gl.getActiveUniform(program, ii);
            if (!uniformInfo) {
                break;
            }
            let name = uniformInfo.name;
            // remove the array suffix.
            if (name.substr(-3) === '[0]') {
                name = name.substr(0, name.length - 3);
            }
            const setter = createUniformSetter(program, uniformInfo);
            uniformSetters[name] = setter;
        }
        return uniformSetters;
    }

    static setUniforms(setters, ...values) {
        setters = setters.uniformSetters || setters;
        for (const uniforms of values) {
            Object.keys(uniforms).forEach(function (name) {
                const setter = setters[name];
                if (setter) {
                    setter(uniforms[name]);
                }
            });
        }
    }

    static createAttributeSetters(gl, program) {
        const attribSetters = {};

        function createAttribSetter(index) {
            return function (b) {
                if (b.value) {
                    gl.disableVertexAttribArray(index);
                    switch (b.value.length) {
                        case 4:
                            gl.vertexAttrib4fv(index, b.value);
                            break;
                        case 3:
                            gl.vertexAttrib3fv(index, b.value);
                            break;
                        case 2:
                            gl.vertexAttrib2fv(index, b.value);
                            break;
                        case 1:
                            gl.vertexAttrib1fv(index, b.value);
                            break;
                        default:
                            throw new Error('the length of a float constant value must be between 1 and 4!');
                    }
                } else {
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
                    gl.enableVertexAttribArray(index);
                    gl.vertexAttribPointer(
                        index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
                }
            };
        }

        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let ii = 0; ii < numAttribs; ++ii) {
            const attribInfo = gl.getActiveAttrib(program, ii);
            if (!attribInfo) {
                break;
            }
            const index = gl.getAttribLocation(program, attribInfo.name);
            attribSetters[attribInfo.name] = createAttribSetter(index);
        }

        return attribSetters;
    }

    static setAttributes(setters, attribs) {
        setters = setters.attribSetters || setters;
        Object.keys(attribs).forEach(function (name) {
            const setter = setters[name];
            if (setter) {
                setter(attribs[name]);
            }
        });
    }

    static createProgramInfo(
        gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
        shaderSources = shaderSources.map(function (source) {
            const script = document.getElementById(source);
            return script ? script.text : source;
        });
        const program = webglUtils.createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback);
        if (!program) {
            return null;
        }
        const uniformSetters = webglUtils.createUniformSetters(gl, program);
        const attribSetters = webglUtils.createAttributeSetters(gl, program);
        return {
            program: program,
            uniformSetters: uniformSetters,
            attribSetters: attribSetters,
        };
    }

    static setBuffersAndAttributes(gl, setters, buffers) {
        webglUtils.setAttributes(setters, buffers.attribs);
        if (buffers.indices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        }
    }

    static resizeCanvasToDisplaySize(canvas, multiplier) {
        multiplier = multiplier || 1;
        const width = canvas.clientWidth * multiplier | 0;
        const height = canvas.clientHeight * multiplier | 0;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }

    static augmentTypedArray(typedArray, numComponents) {
        let cursor = 0;
        typedArray.push = function () {
            for (let ii = 0; ii < arguments.length; ++ii) {
                const value = arguments[ii];
                if (value instanceof Array || (value.buffer && value.buffer instanceof ArrayBuffer)) {
                    for (let jj = 0; jj < value.length; ++jj) {
                        typedArray[cursor++] = value[jj];
                    }
                } else {
                    typedArray[cursor++] = value;
                }
            }
        };
        typedArray.reset = function (opt_index) {
            cursor = opt_index || 0;
        };
        typedArray.numComponents = numComponents;
        Object.defineProperty(typedArray, 'numElements', {
            get: function () {
                return this.length / this.numComponents | 0;
            },
        });
        return typedArray;
    }

    static createAugmentedTypedArray(numComponents, numElements, opt_type) {
        const Type = opt_type || Float32Array;
        return webglUtils.augmentTypedArray(new Type(numComponents * numElements), numComponents);
    }

    static createBufferFromTypedArray(gl, array, type, drawType) {
        type = type || gl.ARRAY_BUFFER;
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
        return buffer;
    }

    static allButIndices(name) {
        return name !== 'indices';
    }

    static createMapping(obj) {
        const mapping = {};
        Object.keys(obj).filter(webglUtils.allButIndices).forEach(function (key) {
            mapping['a_' + key] = key;
        });
        return mapping;
    }

    static getGLTypeForTypedArray(gl, typedArray) {
        if (typedArray instanceof Int8Array) {
            return gl.BYTE;
        }            // eslint-disable-line
        if (typedArray instanceof Uint8Array) {
            return gl.UNSIGNED_BYTE;
        }   // eslint-disable-line
        if (typedArray instanceof Int16Array) {
            return gl.SHORT;
        }           // eslint-disable-line
        if (typedArray instanceof Uint16Array) {
            return gl.UNSIGNED_SHORT;
        }  // eslint-disable-line
        if (typedArray instanceof Int32Array) {
            return gl.INT;
        }             // eslint-disable-line
        if (typedArray instanceof Uint32Array) {
            return gl.UNSIGNED_INT;
        }    // eslint-disable-line
        if (typedArray instanceof Float32Array) {
            return gl.FLOAT;
        }           // eslint-disable-line
        throw 'unsupported typed array type';
    }

    static getNormalizationForTypedArray(typedArray) {
        if (typedArray instanceof Int8Array) {
            return true;
        }  // eslint-disable-line
        if (typedArray instanceof Uint8Array) {
            return true;
        }  // eslint-disable-line
        return false;
    }

    static isArrayBuffer(a) {
        return a.buffer && a.buffer instanceof ArrayBuffer;
    }

    static guessNumComponentsFromName(name, length) {
        let numComponents;
        if (name.indexOf('coord') >= 0) {
            numComponents = 2;
        } else if (name.indexOf('color') >= 0) {
            numComponents = 4;
        } else {
            numComponents = 3;  // position, normals, indices ...
        }

        if (length % numComponents > 0) {
            throw 'can not guess numComponents. You should specify it.';
        }

        return numComponents;
    }

    static makeTypedArray(array, name) {
        if (webglUtils.isArrayBuffer(array)) {
            return array;
        }

        if (array.data && webglUtils.isArrayBuffer(array.data)) {
            return array.data;
        }

        if (Array.isArray(array)) {
            array = {
                data: array,
            };
        }

        if (!array.numComponents) {
            array.numComponents = webglUtils.guessNumComponentsFromName(name, array.length);
        }

        let type = array.type;
        if (!type) {
            if (name === 'indices') {
                type = Uint16Array;
            }
        }
        const typedArray = webglUtils.createAugmentedTypedArray(array.numComponents, array.data.length / array.numComponents | 0, type);
        typedArray.push(array.data);
        return typedArray;
    }

    static createAttribsFromArrays(gl, arrays) {
        const mapping = webglUtils.createMapping(arrays);
        const attribs = {};
        Object.keys(mapping).forEach(function (attribName) {
            const bufferName = mapping[attribName];
            const origArray = arrays[bufferName];
            if (origArray.value) {
                attribs[attribName] = {
                    value: origArray.value,
                };
            } else {
                const array = webglUtils.makeTypedArray(origArray, bufferName);
                attribs[attribName] = {
                    buffer: webglUtils.createBufferFromTypedArray(gl, array),
                    numComponents: origArray.numComponents || array.numComponents || webglUtils.guessNumComponentsFromName(bufferName),
                    type: webglUtils.getGLTypeForTypedArray(gl, array),
                    normalize: webglUtils.getNormalizationForTypedArray(array),
                };
            }
        });
        return attribs;
    }

    static getArray(array) {
        return array.length ? array : array.data;
    }

    static texcoordRE = /coord|texture/i;
    static colorRE = /color|colour/i;

    static guessNumComponentsFromName(name, length) {
        let numComponents;
        if (webglUtils.texcoordRE.test(name)) {
            numComponents = 2;
        } else if (webglUtils.colorRE.test(name)) {
            numComponents = 4;
        } else {
            numComponents = 3;  // position, normals, indices ...
        }

        if (length % numComponents > 0) {
            throw new Error(`Can not guess numComponents for attribute '${name}'. Tried ${numComponents} but ${length} values is not evenly divisible by ${numComponents}. You should specify it.`);
        }

        return numComponents;
    }

    static getNumComponents(array, arrayName) {
        return array.numComponents || array.size || webglUtils.guessNumComponentsFromName(arrayName, webglUtils.getArray(array).length);
    }

    static positionKeys = ['position', 'positions', 'a_position'];

    static getNumElementsFromNonIndexedArrays(arrays) {
        let key;
        for (const k of webglUtils.positionKeys) {
            if (k in arrays) {
                key = k;
                break;
            }
        }
        key = key || Object.keys(arrays)[0];
        const array = arrays[key];
        const length = webglUtils.getArray(array).length;
        const numComponents = webglUtils.getNumComponents(array, key);
        const numElements = length / numComponents;
        if (length % numComponents > 0) {
            throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
        }
        return numElements;
    }

    static createBufferInfoFromArrays(gl, arrays) {
        const bufferInfo = {
            attribs: webglUtils.createAttribsFromArrays(gl, arrays),
        };

        bufferInfo.numElements = webglUtils.getNumElementsFromNonIndexedArrays(arrays);
        return bufferInfo;
    }
}
