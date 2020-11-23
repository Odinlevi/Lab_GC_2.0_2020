"use strict";

class Main {
    static construct() {
        Main.canvas = document.querySelector(".canvas");
        Main.gl = Main.canvas.getContext("webgl");
        Main.programInfo = webglUtils.createProgramInfo(Main.gl, ["vertex-shader-3d", "fragment-shader-3d"]);

        Main.objects = [];
        Main.lightSourceObjects = [];

        Main.firstLight = {
            position: [-15, 0, 0],
            color: [1, 1, 1],

            shininess: 10,
            attenuation: .1,
        }

        Main.secondLight = {
            position: [15, 0, 0],
            color: [1, 1, 1],

            shininess: 10,
            attenuation: .1,
        }

        Main.lightSourceObjects.push(Main.firstLight.object, Main.secondLight.object);

        if (!Main.gl) {
            return;
        }

        Main.camera = new camera();

        requestAnimationFrame(Main.DrawScene);
    }

    static BuffersInfo(name, objText) {
        switch (name) {
            case "cube":
                return primitives.createCubeWithVertexColorsBufferInfo(Main.gl, 20);
            case "cone":
                return primitives.createTruncatedConeWithVertexColorsBufferInfo(Main.gl, 10, 0, 20, 120, 1, true, false);
            case "sphere":
                return primitives.createSphereWithVertexColorsBufferInfo(Main.gl, 10, 120, 60);
            case "obj":
                return objInfo.createObj(Main.gl, objText)[0];
        }
    }

    static degToRad(d) {
        return d * Math.PI / 180;
    }

    static CalculateCamera(gl, camera, degToRad) {
        const fov = camera.fov * degToRad;
        const cPosition = new v3(camera.position[0], camera.position[1], camera.position[2]);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fov, aspect, camera.zNear, camera.zFar);

        const cTarget = new v3(
            cPosition.x + camera.targetSub[0],
            cPosition.y + camera.targetSub[1],
            cPosition.z + camera.targetSub[2]
        );

        const up = v3.copy(camera.up);

        cTarget.xRotateAround(camera.rotation[0] * degToRad, cPosition);
        cTarget.yRotateAround(camera.rotation[1] * degToRad, cPosition);
        up.zRotateAround(camera.rotation[2] * degToRad, v3.zero());

        let cameraProperties = {
            cameraPosition: camera.position,
            target: cTarget.toArray(),
            up: up.toArray(),
            projectionMatrix: projectionMatrix
        }

        return cameraProperties;
    }

    static computeMatrix(object, matrix) {
        matrix = m4.translate(matrix,
            object.position[0],
            object.position[1],
            object.position[2]);
        matrix = m4.xRotate(matrix, object.rotation[0]);
        matrix = m4.yRotate(matrix, object.rotation[1]);
        matrix = m4.zRotate(matrix, object.rotation[2]);

        matrix = m4.scale(matrix, object.scale[0], object.scale[1], object.scale[2]);

        return matrix;
    }

    static CreateObj(name, objText) {
        Main.objects.push(
            new object(
                Main.programInfo,
                Main.BuffersInfo(name, objText),
                {
                    u_matrix: m4.identity(),
                    u_texture: Main.DefaultTexture(),

                    u_world: m4.one(),
                    u_worldInverse: m4.one(),

                    u_ambientColor: [.2, .2, .2],

                    u_lightMult: 1,

                    u_firstLightPosition: [-15, 0, 0],
                    u_firstLightColor: [1, 1, 1],
                    u_firstLightShininess: 10,
                    u_firstLightAttenuation: .1,

                    u_secondLightPosition: [15, 0, 0],
                    u_secondLightColor: [1, 1, 1],
                    u_secondLightShininess: 10,
                    u_secondLightAttenuation: .1,
                },
                1
            )
        );
    }

    static DeleteObject(objectId) {
        Main.objects[objectId] = null;
    }

    static DefaultTexture() {
        const texture = Main.gl.createTexture();
        Main.gl.bindTexture(Main.gl.TEXTURE_2D, texture);
        Main.gl.texImage2D(Main.gl.TEXTURE_2D, 0, Main.gl.LUMINANCE, 1, 1, 0, Main.gl.LUMINANCE, Main.gl.UNSIGNED_BYTE,
            new Uint8Array([
                0xFF
            ])
        );
        Main.gl.generateMipmap(Main.gl.TEXTURE_2D);
        Main.gl.texParameteri(Main.gl.TEXTURE_2D, Main.gl.TEXTURE_MAG_FILTER, Main.gl.NEAREST);

        return texture;
    }

    static SetTexture(objectId, imageContent) {
        let object = Main.objects[objectId];

        const image = new Image();
        const reader = new FileReader();

        let texture = Main.gl.createTexture();
        Main.gl.bindTexture(Main.gl.TEXTURE_2D, texture);
        Main.gl.texImage2D(Main.gl.TEXTURE_2D, 0, Main.gl.RGBA, 1, 1, 0, Main.gl.RGBA, Main.gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        try {
            reader.onload = function(e) {

                image.src = e.target.result;

                image.onload = function() {
                    Main.gl.bindTexture(Main.gl.TEXTURE_2D, texture);
                    Main.gl.pixelStorei(Main.gl.UNPACK_FLIP_Y_WEBGL, true);
                    Main.gl.texImage2D(Main.gl.TEXTURE_2D, 0, Main.gl.RGBA, Main.gl.RGBA,Main.gl.UNSIGNED_BYTE, image);

                    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                        Main.gl.generateMipmap(Main.gl.TEXTURE_2D);
                    } else {
                        Main.gl.texParameteri(Main.gl.TEXTURE_2D, Main.gl.TEXTURE_WRAP_S, Main.gl.CLAMP_TO_EDGE);
                        Main.gl.texParameteri(Main.gl.TEXTURE_2D, Main.gl.TEXTURE_WRAP_T, Main.gl.CLAMP_TO_EDGE);
                        Main.gl.texParameteri(Main.gl.TEXTURE_2D, Main.gl.TEXTURE_MIN_FILTER, Main.gl.LINEAR);
                    }

                    object.uniforms.u_texture = texture;
                };

                function isPowerOf2(value) {
                    return (value & (value - 1)) === 0;
                }
            }

            reader.readAsDataURL(imageContent);
        }
        catch(err) {
            console.log(err.message);
        }
    }

    static CheckObjects() {
        console.log(Main.objects);
        console.log(Main.firstLight);
        console.log(Main.secondLight);
    }

    static DrawScene() {
        webglUtils.resizeCanvasToDisplaySize(Main.gl.canvas);
        Main.gl.viewport(0, 0, Main.gl.canvas.width, Main.gl.canvas.height);

        Main.gl.enable(Main.gl.CULL_FACE);
        Main.gl.enable(Main.gl.DEPTH_TEST);

        Main.gl.clear(Main.gl.COLOR_BUFFER_BIT | Main.gl.DEPTH_BUFFER_BIT);

        var cameraProperties = Main.CalculateCamera(Main.gl, Main.camera, Main.degToRad(1));
        var cameraMatrix = m4.lookAt(cameraProperties.cameraPosition, cameraProperties.target, cameraProperties.up);
        var viewMatrix = m4.inverse(cameraMatrix);
        var viewProjectionMatrix = m4.multiply(cameraProperties.projectionMatrix, viewMatrix);


        Main.objects.forEach(function(object) {
            if (object != null) {
                object.uniforms.u_world = Main.computeMatrix(object, m4.identity());
                object.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.uniforms.u_world);
                object.uniforms.u_worldInverse = m4.inverse(object.uniforms.u_world);
                object.uniforms.u_worldInverse = m4.transpose(object.uniforms.u_worldInverse);
                object.uniforms.u_ambientColor = [.2, .2, .2];
                object.uniforms.u_lightMult = object.lightMult;

                object.uniforms.u_firstLightPosition = Main.firstLight.position
                object.uniforms.u_firstLightColor = Main.firstLight.color;

                object.uniforms.u_firstLightShininess = Main.firstLight.shininess;
                object.uniforms.u_firstLightAttenuation = Main.firstLight.attenuation;

                object.uniforms.u_secondLightPosition = Main.secondLight.position;
                object.uniforms.u_secondLightColor = Main.secondLight.color;

                object.uniforms.u_secondLightShininess = Main.secondLight.shininess;
                object.uniforms.u_secondLightAttenuation = Main.secondLight.attenuation;
            }
            }
        )

        let lastUsedProgramInfo = null;
        let lastUsedBufferInfo = null;

        Main.objects.forEach(function(object) {
            if (object != null) {
                const programInfo = object.programInfo;
                const bufferInfo = object.bufferInfo;

                let bindBuffers = false;

                if (programInfo !== lastUsedProgramInfo) {
                    lastUsedProgramInfo = programInfo;
                    Main.gl.useProgram(programInfo.program);

                    bindBuffers = true;
                }
                if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
                    lastUsedBufferInfo = bufferInfo;

                    webglUtils.setBuffersAndAttributes(Main.gl, programInfo, bufferInfo);
                }
                webglUtils.setUniforms(programInfo, object.uniforms);
                Main.gl.drawArrays(Main.gl.TRIANGLES, 0, bufferInfo.numElements);
            }
        });


        requestAnimationFrame(Main.DrawScene);
    }
}
