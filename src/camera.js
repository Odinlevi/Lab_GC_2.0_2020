"use strict";

class camera {
    constructor() {
        this.zNear = 1;
        this.zFar = 2000;
        this.fov = 60;
        this.position = [0, 0, 100];
        this.rotation = [0, 0, 0];
        this.targetSub = [0, 0, -100];
            //target: [0, 0, 0],
        this.up = new v3(0, 1, 0);
        }
}