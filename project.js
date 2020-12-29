define(function (require) {

    return class Project {

        constructor(filePath, mainFilename, bootFilename) {
            this.files = require(filePath);
            this.mainFilename = mainFilename;
            this.bootFilename = bootFilename;
        }

        getMainFile() {
            return this.files[this.mainFilename];
        }

        updateFile(id, newVal) {
            var dir = this.files;
            while (id.length > 0) {
                id = id.substring(1);
                var foo = id.split("/");
                if (foo.length > 1) {
                    dir = dir[foo[0]];
                    id = "/" + foo[1];
                    continue;
                }
                dir[foo[0]] = newVal;
                break;
            }
        }
    };

 


});