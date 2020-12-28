define(function (require) {
    var $ = require('jquery');
    require('vs/editor/editor.main');

    function Console(container, state) {
        this.container = container;
        this.hub = container.layoutManager.eventHub;
        var root = container.getElement().html($('#console').html());
        this.editor = monaco.editor.create(root.find(".console")[0], {
            value: '',
            language: 'plaintext',
            readOnly: true,
            lineNumbers: 'off',
            glyphMargin: true,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            minimap: {
               enabled: false
           }
        });

        this.container.on('resize', function () {
            this.editor.layout();
        }, this);

        this.container.on('shown', function () {
            this.editor.layout();
        }, this);

        this.container.on('destroy', function () {
            this.editor.dispose();
        }, this);

        this.hub.on('compiled', this.onCompiled, this);

    }
    Console.prototype.onCompiled = function (e) {
        this.editor.getModel().setValue('' + e.stderr);
    };

    return Console;
});