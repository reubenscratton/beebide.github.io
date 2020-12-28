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
    };

 


});