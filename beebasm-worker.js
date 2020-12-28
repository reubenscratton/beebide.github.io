var is_initialized = false;
var pending = [];

var Module = {
    locateFile: function(s) {
      return 'beebasm/' + s;
    },
    onRuntimeInitialized: function() {
        is_initialized = true;
        for (var pendingEvent in pending) {
            onmessage(pendingEvent);
        }
    }
  };
  
importScripts('./beebasm/beebasm.js');



function hexToBytes(hexString) {
    var result = new Uint8Array(hexString.length/2);
    for (var i = 0; i < hexString.length; i += 2) {
        result[i/2] = parseInt(hexString.substr(i, 2), 16);
    }
    return result;
}

function registerFS(module, files, dir) {
    //dir += "/";
    for (var fileName in files) {
        var val = files[fileName];
        if (Object.prototype.toString.call(val) === '[object String]') {
            var isBinary = fileName.endsWith(".bmp") || fileName.endsWith(".bin");
            var rawVal = isBinary ? hexToBytes(val) : val;
            Module.FS_createDataFile(dir, fileName, rawVal, true, false, true);
        }
        else {
            Module.FS_createPath(dir, fileName);
            var newdir = dir.length ? (dir + '/' + fileName) : fileName;
            registerFS(module, val, newdir);
        }            
    }
}


onmessage = function (event) {
    if (!is_initialized) {
        pending.push(event);
        return;
    }
    var stdout = [];
    var stderr = [];
    var status = -1;
    Module.print = function (line) {
        stdout.push(line);
    };
    Module.printErr = function (line) {
        stderr.push(line);
    }

    event = event.data;
    //try {

        registerFS(Module, event.project.files, "");
    
        var before = Date.now();        

        
        compileFn = Module.cwrap('beebide_compile', 'number', ['string', 'string', 'string']);
        status = compileFn(event.project.mainFilename, event.project.bootFilename, 'output.ssd');

        var after = Date.now();
        var result = null;
        if (Module.FS.stat(event.output))
            result = Module.FS.readFile(event.output);
        postMessage({
            id: event.id,
            stdout: stdout,
            stderr: stderr,
            result: result,
            status: status,
            timeTaken: after - before
        });
    /*} catch (e) {
        console.log(e);
        console.log(stderr);
        postMessage({
            id: event.id,
            exception: e.toString()
        });
    }*/
};
