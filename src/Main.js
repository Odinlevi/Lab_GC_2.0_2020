"use strict";

class Main {
    static construct() {
        Main.canvas = document.querySelector(".canvas");
        Main.gl = Main.canvas.getContext("webgl");
        Main.programInfo = webglUtils.createProgramInfo(Main.gl, ["vertex-shader-3d", "fragment-shader-3d"]);

        Main.objects = [];

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
                return primitives.createTruncatedConeWithVertexColorsBufferInfo(Main.gl, 10, 0, 20, 20, 1, true, false);
            case "sphere":
                return primitives.createSphereWithVertexColorsBufferInfo(Main.gl, 10, 20, 10);
            case "obj":
                return objInfo.createObj(Main.gl, objText); //TODO: return .obj buffer
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

    static computeMatrix(object, viewProjectionMatrix) {
        let matrix = m4.translate(viewProjectionMatrix,
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
                    u_colorMult: [0.5, 1, 0.5, 1],
                    u_matrix: m4.identity()
                },
            )
        );
    }

    static DeleteObject(objectId) {
            Main.objects.splice(objectId, 1);
            //console.log(objectId + " deleted");
    }

    static CheckObjects() {
        console.log(Main.objects);
    }

    static DrawScene() {
        webglUtils.resizeCanvasToDisplaySize(Main.gl.canvas);
        Main.gl.viewport(0, 0, Main.gl.canvas.width, Main.gl.canvas.height);

        Main.gl.enable(Main.gl.CULL_FACE);
        Main.gl.enable(Main.gl.DEPTH_TEST);

        Main.gl.clear(Main.gl.COLOR_BUFFER_BIT | Main.gl.DEPTH_BUFFER_BIT);

        //camera = CameraUpdateValues(camera); TODO camera update

        var cameraProperties = Main.CalculateCamera(Main.gl, Main.camera, Main.degToRad(1));
        var cameraMatrix = m4.lookAt(cameraProperties.cameraPosition, cameraProperties.target, cameraProperties.up);
        var viewMatrix = m4.inverse(cameraMatrix);
        var viewProjectionMatrix = m4.multiply(cameraProperties.projectionMatrix, viewMatrix);


        Main.objects.forEach(function(object) {
                object.uniforms.u_matrix = Main.computeMatrix(object, viewProjectionMatrix);
            }
        )

        let lastUsedProgramInfo = null;
        let lastUsedBufferInfo = null;

        Main.objects.forEach(function(object) {
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

        });


        requestAnimationFrame(Main.DrawScene);
    }
}

