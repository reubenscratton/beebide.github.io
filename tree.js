define(function (require) {
    var $ = require('jquery');
    require('jstree');
    var _ = require('underscore');
    var primaryNode;

    function Tree(container, state) {
        this.container = container;
        this.hub = container.layoutManager.eventHub;
        this.root = container.getElement().html($('#tree').html());
        var node = this.root.find('.tree').jstree();
        this.tree = node.jstree(true);
        this.hub.on('projectChange', this.onProjectChange, this);
        node.on('activate_node.jstree', function (e, data) {
            if (data == undefined || data.node == undefined)
                return;
            if (data.node.children.length == 0) {
                container.layoutManager.eventHub.emit('fileSelected', data.node);
            }
       });
    }

    function compareNodes( a, b ) {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        const aIsDir = a.children.length > 0;
        const bIsDir = b.children.length > 0;
        if (!aIsDir && bIsDir) {
          return -1;
        }
        if (aIsDir && !bIsDir) {
            return 1;
        }
        const aIsAsm = a.text.endsWith(".asm");
        const bIsAsm = b.text.endsWith(".asm");
        if (aIsAsm && !bIsAsm) {
            return -1;
        }
        if (!aIsAsm && bIsAsm) {
            return 1;
        }
        return a.text < b.text;
    }

    function addToTree(parent, projectObj) {
        for (var fileName in projectObj) {
            var val = projectObj[fileName];
            var node = {
                id: parent.id + "/" + fileName,
                text: fileName,
                children: []
            };
            parent.children.push(node);
            if (Object.prototype.toString.call(val) === '[object String]') {
                node.data = val;
                node.isPrimary = fileName == "starquake.asm"; // todo: make this a project property
                if (fileName.endsWith(".bmp")) node.icon = "images/ic_bmp.png";
                else if (fileName.endsWith(".bin")) node.icon = "images/ic_bin.png";
                else node.icon = node.isPrimary ? "images/ic_asm_main.png" : "images/ic_asm.png";
                if (node.isPrimary) {
                    primaryNode = node;
                }
            } else {
                node.state =  {
                    opened : true
                };
                addToTree(node, val);
            }
        }
        parent.children.sort(compareNodes);
    }
    Tree.prototype.onProjectChange = function (project) {
        var root = {
            id: "",
            children: []
        };
        addToTree(root, project.files);
        this.tree.settings.core.data = root.children;
        this.tree.refresh();

        this.container.layoutManager.eventHub.emit('fileSelected', primaryNode);

    };

    return Tree;
});