"use strict";

class object {
    constructor(programInfo, bufferInfo, uniforms) {
        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];

        this.programInfo = programInfo;
        this.bufferInfo  = bufferInfo;

        this.uniforms = uniforms;

    }
}