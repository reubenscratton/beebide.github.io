require.config({
    paths: {
        jquery: 'vendor/jquery/dist/jquery',
        underscore: 'vendor/underscore/underscore',
        goldenlayout: 'vendor/golden-layout/dist/goldenlayout',
        events: 'vendor/eventEmitter/EventEmitter',
        clipboard: 'vendor/clipboard/dist/clipboard',
        promise: 'vendor/es6-promise/es6-promise',
        vs: 'vendor/monaco-editor/dev/vs',
        worker: 'vendor/requirejs-web-workers/src/worker',
        jstree: 'vendor/jstree/dist/jstree',
        jsbeeb: 'jsbeeb',
        'webgl-debug': 'jsbeeb/lib/webgl-debug'
    },
    shim: {
        underscore: {exports: '_'},
        bootstrap: ['jquery']
    }
});

var root;
var layout;
var eventHub;
var emulator;
var project;
var log;
var breakpoints = [];


function navTo(srcfile, lineNum) {
    alert('Navving to ' + srcfile + ' line ' + lineNum);
}

// Beebasm Worker
var beebasm = new Worker("beebasm-worker.js");
beebasm.onmessage = function (event) {

    // Single breakpoint resolved
    if (event.data.action === 'bp') {
        for (var bp of breakpoints) {
            if (bp.addr === event.data.bp.addr) {
                bp.fileId = event.data.bp.fileId;
                bp.lineNum = event.data.bp.lineNum;
                bp.col = event.data.bp.col;
            }
            else if (bp.lineNum === event.data.bp.lineNum &&
                bp.fileId === event.data.bp.fileId) {
                bp.addr = event.data.bp.addr;
            }
        }
        eventHub.emit('breakpointsChanged');
        return;
    }

    // Handle errors
    var stderr = event.data.stderr;
    if (stderr.length) {
        for (var i=0 ; i<stderr.length ; i++) {
            var line = stderr[i];
            var textNode = document.createTextNode(line);
            var errMatch = line.match(/(.*):(\d+)(.*)/);
            if (errMatch) {
                var error = {
                    srcfile: errMatch[1],
                    lineNum: parseInt(errMatch[2]),
                    message: errMatch[3]
                };
                project.errors.push(error);
                var a = document.createElement('a');
                a.appendChild(textNode);
                a.href = "javascript:navTo('" + error.srcfile + "'," + error.lineNum + ");";
                textNode = a;
            }
            log.appendChild(textNode);
        }
        eventHub.emit('errorsChanged');
    }

    // If compilation succeeded, boot the disk
    if (event.data.status === 0) {

        breakpoints = event.data.breakpoints;
        eventHub.emit('breakpointsChanged');

        eventHub.emit('start', event.data);
    }
};

function buildAndBoot() {

    // Autosave changes
    var editorStack = layout.root.getItemsById('editorStack')[0];
    for (let item of editorStack.contentItems) {
        project.updateFile(item.config.componentState.file.id, item.instance.editor.getValue());
    }

    // Clear existing errors
    log.innerHTML = "";
    project.errors = [];
    eventHub.emit('errorsChanged');

    // Unset all source breakpoints
    for (var bp of breakpoints) {
        if (bp.lineNum > 0) {
            bp.addr = -1;
        }
    }

    // Send project to Beebasm worker
    beebasm.postMessage({project: project, breakpoints:breakpoints, output: 'output.ssd'});
};

function toggleBreakpoint(bp) {
    for (var i=0 ; i<breakpoints.length ; i++) {
        if (breakpoints[i].fileId === bp.fileId
            && breakpoints[i].lineNum === bp.lineNum
            && breakpoints[i].col === bp.col) {
            breakpoints.splice(i,1);
            eventHub.emit('breakpointsChanged');
            return false;
        }
    }
    breakpoints.push(bp);
    beebasm.postMessage({ action:'bp', bp: bp });
    return true;
}
function toggleBreakpointOnAddr(addr) {
    for (var i=0 ; i<breakpoints.length ; i++) {
        if (breakpoints[i].addr === addr) {
            breakpoints.splice(i,1);
            eventHub.emit('breakpointsChanged');
            return false;
        }
    }
    var bp = {
        addr: addr,
        fileId: null,
        lineNum: -1,
        col: -1,
    };
    breakpoints.push(bp);
    beebasm.postMessage({ action:'bp', bp: bp });
    return true;
}

define(function (require) {
    "use strict";
    var _ = require('underscore');
    var GoldenLayout = require('goldenlayout');
    var $ = require('jquery');
    var Project = require('./project');
    var Editor = require('./editor');
    var Emulator = require('./emulator');
    var Tree = require('./tree');
    project = new Project('./starquake.json', 'starquake.asm', 'quake');
    //var projfiles = require('./starquake');


    var treeAndEditor = {
        type: 'row',
        height: 80,
        content: [
        {
            type: 'stack', 
            hasHeaders: false, 
            width: 25,  
            content: [
                {type: 'component', width: 100, componentName: 'tree', componentState: {}},
            ]
        }, 
        {
            type: 'stack', 
            id:'editorStack', 
            isClosable: false,
            width: 75, 
            content: []
        }
        ]
    };
    

    var leftCol = {
        type: 'column',
        width: 60, 
        content: [
            treeAndEditor,
            {
            type: 'stack', 
            hasHeaders: false, 
            width: 40,  
            content: [
                {
                type: 'component',
                componentName: 'console', componentState: {}
                }
            ] 
            }
        ]
    }
    var rightCol = {
        type: 'column',
        width: 40, 
        content: 
        [
            {
            type: 'stack', 
            height: 50, 
            hasHeaders: false, 
            content: [
                {type: 'component', componentName: 'emulator', componentState: {}}
            ]
            },
            {
            type: 'stack', 
            hasHeaders: true, 
            content: [
                {type: 'component', componentName: 'dbgDis', title: 'Disassembly', isClosable: false, componentState: {}},
                {type: 'component', componentName: 'dbgMem', title: 'Memory', isClosable: false, componentState: {}},
                {type: 'component', componentName: 'dbgHw', title: 'Hardware', isClosable: false, componentState: {}}
            ]
            },
        ],
    };

    
    var config = {
        settings: {hasHeaders: true, showPopoutIcon: false, showMaximiseIcon: false, showCloseIcon: false},
        content: [
            {
            type: 'row',
            content: [
                leftCol, rightCol
            ]
        }]
    };


    root = $("#root");
    layout = new GoldenLayout(config, root);
    eventHub = layout.eventHub;
    layout.registerComponent('tree', function (container, state) {
        return new Tree(container, state);
    });
    layout.registerComponent('editor', function (container, state) {
        return new Editor(container, state);
    });
    layout.registerComponent('emulator', function (container, state) {
        emulator = new Emulator(container, state);
        return emulator;
    });
    layout.registerComponent('console', function (container, state) {
        var root = container.getElement().html($('#console').html());
        log = root.find(".console")[0];
        return log;
    });
    layout.registerComponent('dbgDis', function( container, state ){
        container.getElement().load('dbg_dis.html'); 
    });
    layout.registerComponent('dbgMem', function( container, state ){
        container.getElement().load('dbg_mem.html'); 
    });
    layout.registerComponent('dbgHw', function( container, state ){
        container.getElement().load('dbg_hw.html'); 
    });
   

    eventHub.on('fileSelected',  function (fileNode) {
        var editorStack = layout.root.getItemsById('editorStack')[0];
        // If stack already has this file open, activate it
        for (let item of editorStack.contentItems) {
            if (item.config.componentState.file.id === fileNode.id) {
                editorStack.setActiveContentItem(item);
                return;
            }
        }
        // Add new editor item
        editorStack.addChild({
            type: 'component', width: 100, componentName: 'editor', 
            title: fileNode.text, componentState: {file: fileNode}
        });
    }, this);

    layout.init();

    function sizeRoot() {
        var height = $(window).height() - root.position().top;
        root.height(height);
        layout.updateSize();
    }

    setTimeout(()=>{
        emulator.init();
        $(window).resize(sizeRoot);
        sizeRoot();
    }, 100);


});
