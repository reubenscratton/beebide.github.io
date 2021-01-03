define(function (require) {
    var $ = require('jquery');
    require('vs/editor/editor.main');
    var v6502 = require('6502');

    monaco.languages.register({'id': '6502'});
    monaco.languages.setMonarchTokensProvider('6502', v6502);
    function Editor(container, state) {
        this.container = container;
        this.hub = container.layoutManager.eventHub;
        var root = container.getElement().html($('#editor').html());
        monaco.editor.defineTheme('myTheme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'number.lit', foreground: 'c020c0'},
                { token: 'number.addr', foreground: '802020'}
            ],
            colors: {
                'editor.lineHighlightBackground': '#0000FF20',
            }
        });
        monaco.editor.setTheme('myTheme');

        this.editor = monaco.editor.create(root.find(".editor")[0], {
            value: '',
            language: '6502',
            wordWrap: 'on',
            glyphMargin: true,
            minimap: {
               enabled: false
           }
        });
        
        this.currentBpDecs = [];
        this.breakpointHint = [];
        this.editor.onMouseMove(this.onMouseMove, this);
        this.editor.onMouseLeave(this.onMouseLeave, this); 
        this.editor.onMouseDown(this.onMouseDown, this);
        this.fileId = state.file.id;
        this.editor.getModel().setValue(project.getFileContents(this.fileId));

/*
        this.editor.addAction({
            id: 'compile',
            label: 'Compile',
            keybindings: [monaco.KeyCode.F5],
            run: _.bind(function () {
                this.compile();
                return monaco.Promise.wrap(true);
            }, this)
        });
*/
        this.container.on('resize', function () {
            this.editor.layout();
        }, this);

        this.container.on('shown', function () {
            this.editor.layout();
            this.onErrorsChanged();
            this.onBreakpointsChanged();
        }, this);

        this.container.on('destroy', function () {
            this.editor.dispose();
        }, this);

        //this.hub.on('projectChange', this.onProjectChange, this);

        //this.hub.on('fileSelected', this.onFileSelected, this);

        this.hub.on('errorsChanged', this.onErrorsChanged, this);
        this.hub.on('breakpointsChanged', this.onBreakpointsChanged, this);
    }

    Editor.prototype.onErrorsChanged = function() {
        var markers = [];
        for (var e of project.errors) {
            if (e.srcfile !== this.container._config.componentState.file.id.substring(1)) {
                continue;
            }
            markers.push({
                startLineNumber: e.lineNum,
                startColumn: 1,
                endLineNumber: e.lineNum,
                endColumn: 1000,
                message: e.message,
                severity: monaco.MarkerSeverity.Error
            });
        }
        monaco.editor.setModelMarkers(this.editor.getModel(), 'test', markers);
    }

    Editor.prototype.onBreakpointsChanged = function() {
        this.editor.deltaDecorations(this.currentBpDecs, []);
        this.currentBpDecs = [];
        for (var breakpoint of breakpoints) {
            if (breakpoint.fileId === this.fileId.substring(1)) {
                this.currentBpDecs.push(this.editor.deltaDecorations([], [{
                    range: new monaco.Range(breakpoint.lineNum, 1, breakpoint.lineNum, 1),
                    options: {
                        isWholeLine: true,
                        glyphMarginClassName: 'bp_gutter active'
                    }
                }]));
            }
        }
    }


    Editor.prototype.onMouseMove = function (e) {
        if (e.target.type === 2) {
            this.showBreakpointHint(e.target.position.lineNumber);
        } else {
            this.showBreakpointHint(-1);
        }
    }
    Editor.prototype.onMouseLeave = function (e) {
        this.showBreakpointHint(-1);
    };
    Editor.prototype.onMouseDown = function (e) {
        if (e.target.type === 2) {
            var lineNum = e.target.position.lineNumber;
            var decs = this.editor.getLineDecorations(lineNum);
            if (decs.length > 0) {
                this.editor.deltaDecorations([decs[0].id], []);
            }
            var breakpoint = {
                fileId: this.fileId.substring(1),
                lineNum: lineNum,
                col: -1
            };
            toggleBreakpoint(breakpoint);
        }
    }
    Editor.prototype.showBreakpointHint = function(lineNum) {
        var newHint = [];
        if (lineNum >= 0) {
            newHint = [{
                range: new monaco.Range(lineNum, 1, lineNum, 1),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: 'bp_gutter hint'
                }
            }];
        }
        this.breakpointHint = this.editor.deltaDecorations(this.breakpointHint, newHint);
    }


    /*Editor.prototype.onProjectChange = function (project) {
        this.project = project;
        this.editor.getModel().setValue(project.getMainFile());
        this.compile();
    };*/

    return Editor;
});