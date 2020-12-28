define(function (require) {
    var worker = new Worker("beebasm-worker.js");
    worker.onmessage = function (event) {
        event = event.data;
        if (event.result) {
            eventHub.emit('start', event);
        }
    };
    return function (project) {
        worker.postMessage({project: project, output: 'output.ssd'});
    };
});
