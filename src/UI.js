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

        reader.onload = function(e) {
            objText = e.target.result;
            //UI();
            Main.CreateObj(name, objText);
        }
        reader.readAsText(document.getElementById('inputObj').files[0]);
    }
    else {
        //UI();
        Main.CreateObj(name, objText);
    }
}

function DeleteElement() {
    if (chosenElement === null) {
        return;
    }
    objectNames.splice(chosenElement.id, 1);
    chosenElement.parentNode.removeChild(chosenElement);
    chosenElement = null;

    Main.DeleteObject(objectId);
}

function ChooseObject() {
    Array.from(document.getElementsByClassName("active"))
        .forEach(element => element.classList.remove("active"));
    chosenElement = this;
    this.classList.add("active");

    // UPDATE
}

// endregion

function ExternalVectorValue(item) {
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
    return [i_x.value, i_y.value, i_z.value];
}

function ExternalTranslationObjectValue() {
    ExternalVectorValue('object translation');
    if (chosenElement === null)
        return;

    Main.objects[chosenElement.id].position = ExternalVectorValue('object translation');
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


function UI() {


}

document.addEventListener("DOMContentLoaded", function() {
    // this function runs when the DOM is ready, i.e. when the document has been parsed
    UI();
});


