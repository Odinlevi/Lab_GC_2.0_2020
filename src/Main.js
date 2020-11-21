class Main {
    static objects = [];

    static CreateObj(name, objText) {
        this.objects.push(
            new object(
                [0, 0, 0]
            )
        );
    }

    static DeleteObject(objectId) {
        if (objectId > -1) {
            this.objects.splice(objectId, 1);
            console.log(objectId + " deleted");
        }
    }

    static UpdateCanvas() {
        console.log(this.objects);
    }

}

