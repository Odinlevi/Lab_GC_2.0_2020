"use strict";

let objectNames = [];

let objectId = 0;
let chosenElement = null;

const objectsContainer = document.querySelector(".container");

// region Object Initialization

function CreateElement(name) {
    let objText = null;

    const newElementDiv = document.createElement('div');
    const newElement = document.createElement('button');
    newElement.className = "container_button";
    newElement.innerText = name + " " + objectId;
    newElement.onclick = ChooseObject;
    newElement.id = objectId;

    newElementDiv.appendChild(newElement);
    objectsContainer.appendChild(newElementDiv);
    objectNames.push(objectId, name);
    objectId += 1;

    if (name === 'obj') {
        const reader = new FileReader();

        try {
            reader.onload = function(e) {
                objText = e.target.result;

                Main.CreateObj(name, objText);
            }
            reader.readAsText(document.getElementById('inputObj').files[0]);
        }
        catch(err) {
            console.log(err.message);
        }
    }
    else {
        Main.CreateObj(name, objText);
    }
}

function DeleteElement() {
    if (chosenElement === null) {
        return;
    }
    Main.DeleteObject(chosenElement.id);
    objectNames.splice(chosenElement.id, 1);
    chosenElement.parentNode.removeChild(chosenElement);
    chosenElement = null;
}

function ChooseObject() {
    Array.from(document.getElementsByClassName("active"))
        .forEach(element => element.classList.remove("active"));
    chosenElement = this;
    chosenElement.classList.add("active");

    // UPDATE
    UpdateChosenElement(chosenElement);
}

function UpdateChosenElement(chosenElement) {
    const objectId = chosenElement.id;
    const object = Main.objects[objectId];

    InternalTranslationObjectValue(object.position);
    InternalRotationObjectValue(object.rotation);
    InternalScaleObjectValue(object.scale[0]);
}

// endregion

// region Object Update
function ExternalVector3Value(item) {
    var r_x = document.getElementsByClassName(item + " " + "x range")[0];
    var r_y = document.getElementsByClassName(item + " " + "y range")[0];
    var r_z = document.getElementsByClassName(item + " " + "z range")[0];
    var i_x = document.getElementsByClassName(item + " " + "x text")[0];
    var i_y = document.getElementsByClassName(item + " " + "y text")[0];
    var i_z = document.getElementsByClassName(item + " " + "z text")[0];
    i_x.value = r_x.value;
    i_y.value = r_y.value;
    i_z.value = r_z.value;
    //console.log([i_x.value, i_y.value, i_z.value]);
    return [parseFloat(i_x.value), parseFloat(i_y.value), parseFloat(i_z.value)];
}

function ExternalTranslationObjectValue() {
    ExternalVector3Value('object translation');
    if (chosenElement === null)
        return;

    Main.objects[chosenElement.id].position = ExternalVector3Value('object translation');
}

function ExternalRotationObjectValue() {
    ExternalVector3Value('object rotation');
    if (chosenElement === null)
        return;

    Main.objects[chosenElement.id].rotation = ExternalVector3Value('object rotation');
}

function ExternalScaleObjectValue() {
    //ExternalVector3Value('object rotation');
    var r = document.getElementsByClassName("object scale range")[0];
    var i = document.getElementsByClassName("object scale text")[0];

    i.value = r.value;

    if (chosenElement === null)
        return;

    Main.objects[chosenElement.id].scale = [parseFloat(i.value), parseFloat(i.value), parseFloat(i.value)];
}


function InternalVector3Value(item, v3) {
    var r_x = document.getElementsByClassName(item + " " + "x range")[0];
    var r_y = document.getElementsByClassName(item + " " + "y range")[0];
    var r_z = document.getElementsByClassName(item + " " + "z range")[0];
    var i_x = document.getElementsByClassName(item + " " + "x text")[0];
    var i_y = document.getElementsByClassName(item + " " + "y text")[0];
    var i_z = document.getElementsByClassName(item + " " + "z text")[0];

    i_x.value = r_x.value = v3[0];
    i_y.value = r_y.value = v3[1];
    i_z.value = r_z.value = v3[2];
}

function InternalTranslationObjectValue(v3) {
    InternalVector3Value("object translation", v3);
}

function InternalRotationObjectValue(v3) {
    InternalVector3Value("object rotation", v3);
}

function InternalScaleObjectValue(v1) {
    var r = document.getElementsByClassName("object scale range")[0];
    var i = document.getElementsByClassName("object scale text")[0];

    i.value = r.value = v1;
}

// endregion

// region Object Set Texture

function SetTexture() {
    if (chosenElement === null)
        return;

    Main.SetTexture(chosenElement.id, (document.getElementById('inputTex').files[0]));
}

// endregion

// region Camera

function UtilityCameraValue() {
    let vec3 = ExternalVector3Value("camera utility");
    Main.camera.zNear = vec3[0];
    Main.camera.zFar = vec3[1];
    Main.camera.fov = vec3[2];
}

function TranslationCameraValue() {
    Main.camera.position = ExternalVector3Value("camera translation");
}

function RotationCameraValue() {
    Main.camera.rotation = ExternalVector3Value("camera rotation");
}

// endregion

function UI() {
    Main.construct();
}

document.addEventListener("DOMContentLoaded", function() {
    // this function runs when the DOM is ready, i.e. when the document has been parsed
    UI();
});


