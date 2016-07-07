/*jshint scripturl: true */
(function(f, define){
    define([
        "../util/undoredostack",
        "../kendo.combobox",
        "../kendo.dropdownlist",
        "../kendo.window",
        "../kendo.colorpicker"
    ], f);
})(function(){

(function($,undefined) {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        Widget = kendo.ui.Widget,
        os = kendo.support.mobileOS,
        browser = kendo.support.browser,
        extend = $.extend,
        proxy = $.proxy,
        deepExtend = kendo.deepExtend,
        keys = kendo.keys;

    var rtlEnabled = false;
    var MOUSE_ENTER = "mouseenter";
    var MOUSE_LEAVE = "mouseleave";
    var NS = ".kendoEditor";
    var TABLE = "table";

    // options can be: template (as string), cssClass, title, defaultValue
    var ToolTemplate = Class.extend({
        init: function(options) {
            this.options = options;
        },

        getHtml: function() {
            var options = this.options;
            return kendo.template(options.template, {useWithBlock:false})(options);
        }
    });

    var EditorUtils = {
        editorWrapperTemplate:
            '<table cellspacing="4" cellpadding="0" class="k-widget k-editor k-header" role="presentation"><tbody>' +
                '<tr role="presentation"><td class="k-editor-toolbar-wrap" role="presentation"><ul class="k-editor-toolbar" role="toolbar" /></td></tr>' +
                '<tr><td class="k-editable-area" /></tr>' +
            '</tbody></table>',

        buttonTemplate:
            '<a href="" role="button" class="k-tool"' +
            '#= data.popup ? " data-popup" : "" #' +
            ' unselectable="on" title="#= data.title #"><span unselectable="on" class="k-tool-icon #= data.cssClass #"></span><span class="k-tool-text">#= data.title #</span></a>',

        colorPickerTemplate:
            '<div class="k-colorpicker #= data.cssClass #" />',

        comboBoxTemplate:
            '<select title="#= data.title #" class="#= data.cssClass #" />',

        dropDownListTemplate:
            '<span class="k-editor-dropdown"><select title="#= data.title #" class="#= data.cssClass #" /></span>',

        separatorTemplate:
            '<span class="k-separator" />',

        overflowAnchorTemplate:
            '<a href="" role="button" class="k-tool k-overflow-anchor" data-popup' +
            ' unselectable="on"><span unselectable="on" class="k-icon k-i-more"></span></a>',

        formatByName: function(name, format) {
            for (var i = 0; i < format.length; i++) {
                if ($.inArray(name, format[i].tags) >= 0) {
                    return format[i];
                }
            }
        },

        registerTool: function(toolName, tool) {
            var toolOptions = tool.options;

            if (toolOptions && toolOptions.template) {
                toolOptions.template.options.cssClass = "k-" + toolName;
            }

            if (!tool.name) {
                tool.options.name = toolName;
                tool.name = toolName.toLowerCase();
            }

            Editor.defaultTools[toolName] = tool;
        },

        registerFormat: function(formatName, format) {
            Editor.fn.options.formats[formatName] = format;
        }
    };

    var messages = {
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
        strikethrough: "Strikethrough",
        superscript: "Superscript",
        subscript: "Subscript",
        justifyCenter: "Center text",
        justifyLeft: "Align text left",
        justifyRight: "Align text right",
        justifyFull: "Justify",
        insertUnorderedList: "Insert unordered list",
        insertOrderedList: "Insert ordered list",
        indent: "Indent",
        outdent: "Outdent",
        createLink: "Insert hyperlink",
        unlink: "Remove hyperlink",
        insertImage: "Insert image",
        insertFile: "Insert file",
        insertHtml: "Insert HTML",
        viewHtml: "View HTML",
        fontName: "Select font family",
        fontNameInherit: "(inherited font)",
        fontSize: "Select font size",
        fontSizeInherit: "(inherited size)",
        formatBlock: "Format",
        formatting: "Format",
        foreColor: "Color",
        backColor: "Background color",
        style: "Styles",
        emptyFolder: "Empty Folder",
        editAreaTitle: "Editable area. Press F10 for toolbar.",
        uploadFile: "Upload",
        orderBy: "Arrange by:",
        orderBySize: "Size",
        orderByName: "Name",
        invalidFileType: "The selected file \"{0}\" is not valid. Supported file types are {1}.",
        deleteFile: 'Are you sure you want to delete "{0}"?',
        overwriteFile: 'A file with name "{0}" already exists in the current directory. Do you want to overwrite it?',
        directoryNotFound: "A directory with this name was not found.",
        imageWebAddress: "Web address",
        imageAltText: "Alternate text",
        imageWidth: "Width (px)",
        imageHeight: "Height (px)",
        fileWebAddress: "Web address",
        fileTitle: "Title",
        linkWebAddress: "Web address",
        linkText: "Text",
        linkToolTip: "ToolTip",
        linkOpenInNewWindow: "Open link in new window",
        dialogUpdate: "Update",
        dialogInsert: "Insert",
        dialogCancel: "Cancel",
        createTable: "Create table",
        createTableHint: "Create a {0} x {1} table",
        addColumnLeft: "Add column on the left",
        addColumnRight: "Add column on the right",
        addRowAbove: "Add row above",
        addRowBelow: "Add row below",
        deleteRow: "Delete row",
        deleteColumn: "Delete column"
    };

    var supportedBrowser = !os || (os.ios && os.flatVersion >= 500) || (!os.ios && typeof(document.documentElement.contentEditable) != 'undefined');

    var toolGroups = {
        basic: [ "bold", "italic", "underline" ],
        alignment: [ "justifyLeft", "justifyCenter", "justifyRight" ],
        lists: [ "insertUnorderedList", "insertOrderedList" ],
        indenting: [ "indent", "outdent" ],
        links: [ "createLink", "unlink" ],
        tables: [ "createTable", "addColumnLeft", "addColumnRight", "addRowAbove", "addRowBelow", "deleteRow", "deleteColumn" ]
    };

    var Editor = Widget.extend({
        init: function (element, options) {
            var that = this,
                value,
                editorNS = kendo.ui.editor,
                toolbarContainer,
                toolbarOptions,
                type;
            var domElement;
            var dom = editorNS.Dom;

            /* suppress initialization in mobile webkit devices (w/o proper contenteditable support) */
            if (!supportedBrowser) {
                return;
            }

            Widget.fn.init.call(that, element, options);

            that.options = deepExtend({}, that.options, options);
            that.options.tools = that.options.tools.slice();

            rtlEnabled = kendo.support.isRtl(element);

            element = that.element;
            domElement = element[0];

            type = dom.name(domElement);

            this._registerHandler(
                element.closest("form"), "submit", proxy(that.update, that, undefined)
            );

            toolbarOptions = extend({}, that.options);
            toolbarOptions.editor = that;

            if (type == "textarea") {
                that._wrapTextarea();

                toolbarContainer = that.wrapper.find(".k-editor-toolbar");

                if (domElement.id) {
                    toolbarContainer.attr("aria-controls", domElement.id);
                }
            } else {
                that.element.attr("contenteditable", true).addClass("k-widget k-editor k-editor-inline");

                toolbarOptions.popup = true;

                toolbarContainer = $('<ul class="k-editor-toolbar" role="toolbar" />').insertBefore(element);
            }

            that.toolbar = new editorNS.Toolbar(toolbarContainer[0], toolbarOptions);

            that.toolbar.bindTo(that);

            if (type == "textarea") {
                setTimeout(function () {
                    var heightStyle = that.wrapper[0].style.height;
                    var expectedHeight = parseInt(heightStyle, 10);
                    var actualHeight = that.wrapper.height();
                    if (heightStyle.indexOf("px") > 0 && !isNaN(expectedHeight) && actualHeight > expectedHeight) {
                        that.wrapper.height(expectedHeight - (actualHeight - expectedHeight));
                    }
                });
            }

            that._resizable();
            that._initializeContentElement(that);
            that._initializeTableResizing();

            that.keyboard = new editorNS.Keyboard([
                new editorNS.BackspaceHandler(that),
                new editorNS.TypingHandler(that),
                new editorNS.SystemHandler(that),
                new editorNS.SelectAllHandler(that)
            ]);

            that.clipboard = new editorNS.Clipboard(this);

            that.undoRedoStack = new kendo.util.UndoRedoStack();

            if (options && options.value) {
                value = options.value;
            } else if (that.textarea) {
                // indented HTML introduces problematic ranges in IE
                value = domElement.value;

                // revert encoding of value when content is fetched from cache
                if (that.options.encoded && $.trim(domElement.defaultValue).length) {
                    value = domElement.defaultValue;
                }

                value = value.replace(/[\r\n\v\f\t ]+/ig, " ");
            } else {
                value = domElement.innerHTML;
            }

            that.value(value || kendo.ui.editor.emptyElementContent);

            // using $.proxy here will break #5337
            this._registerHandler(document, {
                "mousedown": function() { that._endTyping(); },
                "mouseup": function() { that._mouseup(); }
            });

            that._initializeImmutables();

            that.toolbar.resize();

            kendo.notify(that);
        },

        setOptions: function(options) {
            var editor = this;

            Widget.fn.setOptions.call(editor, options);
            if (options.tools) {
                editor.toolbar.bindTo(editor);
            }
        },

        _endTyping: function() {
            var keyboard = this.keyboard;

            try {
                if (keyboard.isTypingInProgress()) {
                    keyboard.endTyping(true);

                    this.saveSelection();
                }
            } catch (e) { }
        },

        _selectionChange: function() {
            this._selectionStarted = false;
            this.saveSelection();
            this.trigger("select", {});
        },

        _resizable: function() {
            var resizable = this.options.resizable;
            var isResizable = $.isPlainObject(resizable) ? (resizable.content === undefined || resizable.content === true) : resizable;
            if (isResizable && this.textarea) {
                $("<div class='k-resize-handle'><span class='k-icon k-resize-se' /></div>")
                    .insertAfter(this.textarea);

                this.wrapper.kendoResizable(extend({}, this.options.resizable, {
                    start: function(e) {
                        var editor = this.editor = $(e.currentTarget).closest(".k-editor");
                        this.initialSize = editor.height();
                        editor.find("td:last").append("<div class='k-overlay' />");
                    },
                    resize: function(e) {
                        var delta = e.y.initialDelta;
                        var newSize = this.initialSize + delta;
                        var min = this.options.min || 0;
                        var max = this.options.max || Infinity;

                        newSize = Math.min(max, Math.max(min, newSize));

                        this.editor.height(newSize);
                    },
                    resizeend: function() {
                        this.editor.find(".k-overlay").remove();
                        this.editor = null;
                    }
                }));
            }
        },

        _initializeTableResizing: function() {
            var editor = this;

            function initTableResizing(editorWidget, tableElement) {
                editorWidget.tableResizing = new kendo.ui.editor.TableResizing(tableElement, {
                    rtl: rtlEnabled,
                    rootElement: editorWidget.body
                });
            }

            $(editor.body)
                .on(MOUSE_ENTER + NS, TABLE, function(e) {
                    var table = e.currentTarget;

                    e.stopPropagation();

                    if (editor.tableResizing) {
                        if (editor.tableResizing.element !== table) {
                            editor.tableResizing.destroy();
                            initTableResizing(editor, table);
                        }
                    }
                    else {
                        initTableResizing(editor, table);
                    }
                })
                .on(MOUSE_LEAVE + NS, TABLE, function(e) {
                    var parentTable;

                    e.stopPropagation();

                    if (editor.tableResizing && !editor.tableResizing.resizingInProgress()) {
                        parentTable = $(editor.tableResizing.element).parents(TABLE)[0];
                        
                        editor.tableResizing.destroy();
                        editor.tableResizing = null;

                        if (parentTable) {
                            initTableResizing(editor, parentTable);
                        }
                    }
                });
        },

        _wrapTextarea: function() {
            var that = this,
                textarea = that.element,
                w = textarea[0].style.width,
                h = textarea[0].style.height,
                template = EditorUtils.editorWrapperTemplate,
                editorWrap = $(template).insertBefore(textarea).width(w).height(h),
                editArea = editorWrap.find(".k-editable-area");

            textarea.attr("autocomplete", "off")
                .appendTo(editArea).addClass("k-content k-raw-content").css("display", "none");

            that.textarea = textarea;
            that.wrapper = editorWrap;
        },

        _createContentElement: function(stylesheets) {
            var editor = this;
            var iframe, wnd, doc;
            var textarea = editor.textarea;
            var specifiedDomain = editor.options.domain;
            var domain = specifiedDomain || document.domain;
            var domainScript = "";
            var src = 'javascript:""';

            // automatically relax same-origin policy if document.domain != location.hostname,
            // or forcefully relax if options.domain is specified (for document.domain = document.domain scenario)
            if (specifiedDomain || domain != location.hostname) {
                // relax same-origin policy
                domainScript = "<script>document.domain=\"" + domain + "\"</script>";
                src = "javascript:document.write('" + domainScript + "')";
            }

            textarea.hide();

            iframe = $("<iframe />", { title: editor.options.messages.editAreaTitle, frameBorder: "0" })[0];

            $(iframe)
                .css("display", "")
                .addClass("k-content")
                .attr("tabindex", textarea[0].tabIndex)
                .insertBefore(textarea);

            iframe.src = src;

            wnd = iframe.contentWindow || iframe;
            doc = wnd.document || iframe.contentDocument;

            $(iframe).one("load", function() {
                editor.toolbar.decorateFrom(doc.body);
            });

            doc.open();
            doc.write(
                "<!DOCTYPE html><html><head>" +
                "<meta charset='utf-8' />" +
                "<style>" +
                    "html,body{padding:0;margin:0;height:100%;min-height:100%;}" +
                    "body{font-size:12px;font-family:Verdana,Geneva,sans-serif;margin-top:-1px;padding:1px .2em 0;" +
                    "word-wrap: break-word;-webkit-nbsp-mode: space;-webkit-line-break: after-white-space;" +
                    (kendo.support.isRtl(textarea) ? "direction:rtl;" : "") +
                    (browser.msie || browser.edge ? "height:auto;" : "") +
                    "}" +
                    "h1{font-size:2em;margin:.67em 0}h2{font-size:1.5em}h3{font-size:1.16em}h4{font-size:1em}h5{font-size:.83em}h6{font-size:.7em}" +
                    "p{margin:0 0 1em;}.k-marker{display:none;}.k-paste-container,.Apple-style-span{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}" +
                    "ul,ol{padding-left:2.5em}" +
                    "span{-ms-high-contrast-adjust:none;}" +
                    "a{color:#00a}" +
                    "code{font-size:1.23em}" +
                    "telerik\\3Ascript{display: none;}" +
                    ".k-table{width:100%;border-spacing:0;margin: 0 0 1em;}" +
                    ".k-table td{min-width:1px;padding:.2em .3em;}" +
                    ".k-table,.k-table td{outline:0;border: 1px dotted #ccc;}" +
                    ".k-table p{margin:0;padding:0;}" +
                    ".k-table td >.k-resize-handle{position:absolute;height: 14px;width:10px;cursor:col-resize;z-index:2;}" +
                    ".k-table td > .k-resize-handle > .k-resize-hint-marker{width:2px;height:100%;margin:0 auto;background-color:#00b0ff;display:none;opacity:0.8;}" +
                    "k\\:script{display:none;}" +
                "</style>" +
                domainScript +
                "<script>(function(d,c){d[c]('header'),d[c]('article'),d[c]('nav'),d[c]('section'),d[c]('footer');})(document, 'createElement');</script>" +
                $.map(stylesheets, function(href){
                    return "<link rel='stylesheet' href='" + href + "'>";
                }).join("") +
                "</head><body autocorrect='off' contenteditable='true'></body></html>"
            );

            doc.close();

            return wnd;
        },

        _blur: function() {
            var textarea = this.textarea;
            var old = textarea ? textarea.val() : this._oldValue;
            var value = this.options.encoded ? this.encodedValue() : this.value();

            this.update();

            if (textarea) {
                textarea.trigger("blur");
            }

            if (value != old) {
                this.trigger("change");
            }
        },

        _spellCorrect: function(editor) {
            var beforeCorrection;
            var falseTrigger = false;

            this._registerHandler(editor.body, {
                "contextmenu": function() {
                    editor.one("select", function() {
                        beforeCorrection = null;
                    });

                    editor._spellCorrectTimeout = setTimeout(function() {
                        beforeCorrection = new kendo.ui.editor.RestorePoint(editor.getRange());
                        falseTrigger = false;
                    }, 10);
                },
                "input": function() {
                    if (!beforeCorrection) {
                        return;
                    }

                    if (kendo.support.browser.mozilla && !falseTrigger) {
                        falseTrigger = true;
                        return;
                    }

                    kendo.ui.editor._finishUpdate(editor, beforeCorrection);
                }
            });
        },

        _registerHandler: function(element, type, handler) {
            var NS = ".kendoEditor";

            element = $(element);

            if (!this._handlers) {
                this._handlers = [];
            }

            if (element.length) {
                if ($.isPlainObject(type)) {
                    for (var t in type) {
                        if (type.hasOwnProperty(t)) {
                            this._registerHandler(element, t, type[t]);
                        }
                    }
                } else {
                    type = type.split(" ").join(NS + " ")  + NS;

                    this._handlers.push({ element: element, type: type, handler: handler });

                    element.on(type, handler);
                }
            }
        },

        _deregisterHandlers: function() {
            var editor = this;

            var handlers = this._handlers;

            for (var i = 0; i < handlers.length; i++) {
                var h = handlers[i];
                h.element.off(h.type, h.handler);
            }

            this._handlers = [];

            $(editor.body)
                .off(MOUSE_ENTER + NS)
                .off(MOUSE_LEAVE + NS);
        },

        _initializeContentElement: function() {
            var editor = this;
            var doc;
            var blurTrigger;
            var mousedownTrigger;

            if (editor.textarea) {
                editor.window = editor._createContentElement(editor.options.stylesheets);
                doc = editor.document = editor.window.contentDocument || editor.window.document;
                editor.body = doc.body;

                blurTrigger = editor.window;
                mousedownTrigger = doc;

                this._registerHandler(doc, "mouseup", proxy(this._mouseup, this));
            } else {
                editor.window = window;
                doc = editor.document = document;
                editor.body = editor.element[0];

                blurTrigger = editor.body;
                mousedownTrigger = editor.body;

                editor.toolbar.decorateFrom(editor.body);
            }

            this._registerHandler(blurTrigger, "blur", proxy(this._blur, this));
            this._registerHandler(mousedownTrigger, "mousedown ", proxy(this._mousedown, this));

            try {
                doc.execCommand("enableInlineTableEditing", null, false);
            } catch(e) { }

            if (kendo.support.touch) {
                this._registerHandler(doc, {
                    "selectionchange": proxy(this._selectionChange, this),
                    "keydown": function() {
                        // necessary in iOS when touch events are bound to the page
                        if (kendo._activeElement() != doc.body) {
                            editor.window.focus();
                        }
                    }
                });
            }

            this._spellCorrect(editor);

            this._registerHandler(editor.body, {
                "dragstart": function(e) {
                    e.preventDefault();
                },
                "keydown": function (e) {
                    var range;

                    if ((e.keyCode === keys.BACKSPACE || e.keyCode === keys.DELETE) && editor.body.getAttribute("contenteditable") !== "true") {
                        return false;
                    }

                    if (e.keyCode === keys.F10) {
                        // Handling with timeout to avoid the default IE menu
                        setTimeout(proxy(editor.toolbar.focus, editor.toolbar), 100);

                        e.preventDefault();
                        return;
                    } else if (e.keyCode == keys.LEFT || e.keyCode == keys.RIGHT) {
                        // skip bom nodes when navigating with arrows
                        range = editor.getRange();
                        var left = e.keyCode == keys.LEFT;
                        var container = range[left ? "startContainer" : "endContainer"];
                        var offset = range[left ? "startOffset" : "endOffset"];
                        var direction = left ? -1 : 1;

                        if (left) {
                            offset -= 1;
                        }

                        if (offset + direction > 0 && container.nodeType == 3 && container.nodeValue[offset] == "\ufeff") {
                            range.setStart(container, offset + direction);
                            range.collapse(true);
                            editor.selectRange(range);
                        }
                    }

                    var tools = editor.toolbar.tools;
                    var toolName = editor.keyboard.toolFromShortcut(tools, e);
                    var toolOptions = toolName ? tools[toolName].options : {};
                    if (toolName && !toolOptions.keyPressCommand) {
                        e.preventDefault();

                        if (!/^(undo|redo)$/.test(toolName)) {
                            editor.keyboard.endTyping(true);
                        }

                        editor.trigger("keydown", e);
                        editor.exec(toolName);
                        editor._runPostContentKeyCommands(e);

                        return false;
                    }

                    editor.keyboard.clearTimeout();

                    editor.keyboard.keydown(e);
                },
                "keypress": function(e) {
                    setTimeout(function () {
                        editor._runPostContentKeyCommands(e);
                    }, 0);
                },
                "keyup": function (e) {
                    var selectionCodes = [8, 9, 33, 34, 35, 36, 37, 38, 39, 40, 40, 45, 46];

                    if ($.inArray(e.keyCode, selectionCodes) > -1 || (e.keyCode == 65 && e.ctrlKey && !e.altKey && !e.shiftKey)) {
                        editor._selectionChange();
                    }

                    editor.keyboard.keyup(e);
                },
                "click": function(e) {
                    var dom = kendo.ui.editor.Dom, range;

                    if (dom.name(e.target) === "img") {
                        range = editor.createRange();
                        range.selectNode(e.target);
                        editor.selectRange(range);
                    }
                },
                "cut copy paste": function (e) {
                    editor.clipboard["on" + e.type](e);
                },
                "focusin": function () {
                    if (editor.body.hasAttribute("contenteditable")) {
                        $(this).addClass("k-state-active");
                        editor.toolbar.show();
                    }
                },
                "focusout": function() {
                    setTimeout(function() {
                        var active = kendo._activeElement();
                        var body = editor.body;
                        var toolbar = editor.toolbar;

                        if (active != body && !$.contains(body, active) && !$(active).is(".k-editortoolbar-dragHandle") && !toolbar.focused()) {
                            $(body).removeClass("k-state-active");
                            toolbar.hide();
                        }
                    }, 10);
                }
            });
        },

        _initializeImmutables: function(){
            var that = this,
                editorNS = kendo.ui.editor;

            if (that.options.immutables){
                that.immutables = new editorNS.Immutables(that);
            }
        },
        
        _mousedown: function (e) {
            var editor = this;
            editor._selectionStarted = true;

            // handle middle-click and ctrl-click on links
            if (browser.gecko) {
                return;
            }

            var target = $(e.target);
            
            if ((e.which == 2 || (e.which == 1 && e.ctrlKey)) &&
                target.is("a[href]")) {
                window.open(target.attr("href"), "_new");
            }
        },

        _mouseup: function() {
            var that = this;

            if (that._selectionStarted) {
                setTimeout(function() {
                    that._selectionChange();
                }, 1);
            }
        },

        _runPostContentKeyCommands: function (e) {
            var range = this.getRange();
            var tools = this.keyboard.toolsFromShortcut(this.toolbar.tools, e);

            for (var i = 0; i < tools.length; i++) {
                var tool = tools[i];
                var o = tool.options;
                if (!o.keyPressCommand) {
                    continue;
                }

                var cmd = new o.command({range: range});
                if (cmd.changesContent()) {
                    this.keyboard.endTyping(true);
                    this.exec(tool.name);
                }
            }
        },

        refresh: function() {
            var that = this;

            if (that.textarea) {
                // preserve updated value before re-initializing
                // don't use update() to prevent the editor from encoding the content too early
                that.textarea.val(that.value());
                that.wrapper.find("iframe").remove();
                that._initializeContentElement(that);
                that.value(that.textarea.val());
            }
        },

        events: [
            "select",
            "change",
            "execute",
            "error",
            "paste",
            "keydown",
            "keyup"
        ],

        options: {
            name: "Editor",
            messages: messages,
            formats: {},
            encoded: true,
            domain: null,
            resizable: false,
            deserialization: {
                custom: null
            },
            serialization: {
                entities: true,
                semantic: true,
                scripts: false
            },
            pasteCleanup: {
                all: false,
                css: false,
                custom: null,
                keepNewLines: false,
                msAllFormatting: false,
                msConvertLists: true,
                msTags: true,
                none: false,
                span: false
            },
            stylesheets: [],
            dialogOptions: {
                modal: true, resizable: false, draggable: true,
                animation: false
            },
            imageBrowser: null,
            fileBrowser: null,
            fontName: [
                { text: "Arial", value: "Arial,Helvetica,sans-serif" },
                { text: "Courier New", value: "'Courier New',Courier,monospace" },
                { text: "Georgia", value: "Georgia,serif" },
                { text: "Impact", value: "Impact,Charcoal,sans-serif" },
                { text: "Lucida Console", value: "'Lucida Console',Monaco,monospace" },
                { text: "Tahoma", value: "Tahoma,Geneva,sans-serif" },
                { text: "Times New Roman", value: "'Times New Roman',Times,serif" },
                { text: "Trebuchet MS", value: "'Trebuchet MS',Helvetica,sans-serif" },
                { text: "Verdana", value: "Verdana,Geneva,sans-serif" }
            ],
            fontSize: [
                { text: "1 (8pt)",  value: "xx-small" },
                { text: "2 (10pt)", value: "x-small" },
                { text: "3 (12pt)", value: "small" },
                { text: "4 (14pt)", value: "medium" },
                { text: "5 (18pt)", value: "large" },
                { text: "6 (24pt)", value: "x-large" },
                { text: "7 (36pt)", value: "xx-large" }
            ],
            formatBlock: [
                { text: "Paragraph", value: "p" },
                { text: "Quotation", value: "blockquote" },
                { text: "Heading 1", value: "h1" },
                { text: "Heading 2", value: "h2" },
                { text: "Heading 3", value: "h3" },
                { text: "Heading 4", value: "h4" },
                { text: "Heading 5", value: "h5" },
                { text: "Heading 6", value: "h6" }
            ],
            tools: [].concat.call(
                ["formatting"],
                toolGroups.basic,
                toolGroups.alignment,
                toolGroups.lists,
                toolGroups.indenting,
                toolGroups.links,
                ["insertImage"],
                toolGroups.tables
            )
        },

        destroy: function() {
            var editor = this;

            Widget.fn.destroy.call(this);

            this._endTyping(true);

            this._deregisterHandlers();

            clearTimeout(this._spellCorrectTimeout);

            this._focusOutside();

            this.toolbar.destroy();

            if (editor.tableResizing) {
                editor.tableResizing.destroy();
            }

            kendo.destroy(this.wrapper);
        },

        _focusOutside: function () {
            // move focus outside the Editor, see https://github.com/telerik/kendo/issues/3673
            if (kendo.support.browser.msie && this.textarea) {
                var tempInput = $("<input style='position:fixed;left:1px;top:1px;width:1px;height:1px;font-size:0;border:0;opacity:0' />").appendTo(document.body).focus();
                tempInput.blur().remove();
            }
        },

        state: function(toolName) {
            var tool = Editor.defaultTools[toolName];
            var finder = tool && (tool.options.finder || tool.finder);
            var RangeUtils = kendo.ui.editor.RangeUtils;
            var range, textNodes;

            if (finder) {
                range = this.getRange();

                textNodes = RangeUtils.textNodes(range);

                if (!textNodes.length && range.collapsed) {
                    textNodes = [range.startContainer];
                }

                return finder.getFormat ? finder.getFormat(textNodes) : finder.isFormatted(textNodes);
            }

            return false;
        },

        value: function (html) {
            var body = this.body,
                editorNS = kendo.ui.editor,
                options = this.options,
                currentHtml = editorNS.Serializer.domToXhtml(body, options.serialization);

            if (html === undefined) {
                return currentHtml;
            }

            if (html == currentHtml) {
                return;
            }

            editorNS.Serializer.htmlToDom(html, body, options.deserialization);

            this.selectionRestorePoint = null;
            this.update();

            this.toolbar.refreshTools();
        },

        saveSelection: function(range) {
            range = range || this.getRange();
            var container = range.commonAncestorContainer,
                body = this.body;

            if (container == body || $.contains(body, container)) {
                this.selectionRestorePoint = new kendo.ui.editor.RestorePoint(range);
            }
        },

        _focusBody: function() {
            var body = this.body;
            var iframe = this.wrapper && this.wrapper.find("iframe")[0];
            var documentElement = this.document.documentElement;
            var activeElement = kendo._activeElement();

            if (activeElement != body && activeElement != iframe) {
                var scrollTop = documentElement.scrollTop;
                body.focus();
                documentElement.scrollTop = scrollTop;
            }
        },

        restoreSelection: function() {
            this._focusBody();

            if (this.selectionRestorePoint) {
                this.selectRange(this.selectionRestorePoint.toRange());
            }
        },

        focus: function () {
            this.restoreSelection();
        },

        update: function (value) {
            value = value || this.options.encoded ? this.encodedValue() : this.value();

            if (this.textarea) {
                this.textarea.val(value);
            } else {
                this._oldValue = value;
            }
        },

        encodedValue: function () {
            return kendo.ui.editor.Dom.encode(this.value());
        },

        createRange: function (document) {
            return kendo.ui.editor.RangeUtils.createRange(document || this.document);
        },

        getSelection: function () {
            return kendo.ui.editor.SelectionUtils.selectionFromDocument(this.document);
        },

        selectRange: function(range) {
            this._focusBody();
            var selection = this.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            this.saveSelection(range);
        },

        getRange: function () {
            var selection = this.getSelection(),
                range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : this.createRange(),
                doc = this.document;

            if (range.startContainer == doc && range.endContainer == doc && !range.startOffset && !range.endOffset) {
                range.setStart(this.body, 0);
                range.collapse(true);
            }

            return range;
        },

        selectedHtml: function() {
            return kendo.ui.editor.Serializer.domToXhtml(this.getRange().cloneContents());
        },

        paste: function (html, options) {
            this.focus();

            var command = new kendo.ui.editor.InsertHtmlCommand($.extend({
                range: this.getRange(),
                html: html
            }, options));

            command.editor = this;

            command.exec();
        },

        exec: function (name, params) {
            var that = this;
            var command = null;
            var range, tool, prevented;

            if (!name) {
                throw new Error("kendoEditor.exec(): `name` parameter cannot be empty");
            }

            if (that.body.getAttribute("contenteditable") !== "true" && name !== "print" && name !== "pdf") {
                return false;
            }

            name = name.toLowerCase();

            // restore selection
            if (!that.keyboard.isTypingInProgress()) {
                that.restoreSelection();
            }

            tool = that.toolbar.toolById(name);

            if (!tool) {
                // execute non-toolbar tool
                for (var id in Editor.defaultTools) {
                    if (id.toLowerCase() == name) {
                        tool = Editor.defaultTools[id];
                        break;
                    }
                }
            }

            if (tool) {
                range = that.getRange();

                if (tool.command) {
                    command = tool.command(extend({ range: range }, params));
                }

                prevented = that.trigger("execute", { name: name, command: command });

                if (prevented) {
                    return;
                }

                if (/^(undo|redo)$/i.test(name)) {
                    that.undoRedoStack[name]();
                } else if (command) {
                    if (!command.managesUndoRedo) {
                        that.undoRedoStack.push(command);
                    }

                    command.editor = that;
                    command.exec();

                    if (command.async) {
                        command.change = proxy(that._selectionChange, that);
                        return;
                    }
                }

                that._selectionChange();
            }
        }
    });

    Editor.defaultTools = {
        undo: { options: { key: "Z", ctrl: true } },
        redo: { options: { key: "Y", ctrl: true } }
    };

    kendo.ui.plugin(Editor);

    var Tool = Class.extend({
        init: function(options) {
            this.options = options;
        },

        initialize: function(ui, options) {
            ui.attr({ unselectable: "on", title: options.title });
            ui.children(".k-tool-text").html(options.title);
        },

        command: function (commandArguments) {
            return new this.options.command(commandArguments);
        },

        update: $.noop
    });

    Tool.exec = function (editor, name, value) {
        editor.exec(name, { value: value });
    };

    var FormatTool = Tool.extend({
        init: function (options) {
            Tool.fn.init.call(this, options);
        },

        command: function (commandArguments) {
            var that = this;
            return new kendo.ui.editor.FormatCommand(extend(commandArguments, {
                    formatter: that.options.formatter
                }));
        },

        update: function(ui, nodes) {
            var isFormatted = this.options.finder.isFormatted(nodes);

            ui.toggleClass("k-state-selected", isFormatted);
            ui.attr("aria-pressed", isFormatted);
        }
    });

    EditorUtils.registerTool("separator", new Tool({ template: new ToolTemplate({template: EditorUtils.separatorTemplate})}));

    // Exports ================================================================

    var bomFill = browser.msie && browser.version < 9 ? '\ufeff' : '';
    var emptyElementContent = '\ufeff';

    if (browser.msie && browser.version == 10) {
        emptyElementContent = ' '; // allow up/down arrows to focus empty rows
    }

    extend(kendo.ui, {
        editor: {
            ToolTemplate: ToolTemplate,
            EditorUtils: EditorUtils,
            Tool: Tool,
            FormatTool: FormatTool,
            _bomFill: bomFill,
            emptyElementContent: emptyElementContent
        }
    });

    if (kendo.PDFMixin) {
        kendo.PDFMixin.extend(Editor.prototype);
        Editor.prototype._drawPDF = function() {
            return kendo.drawing.drawDOM(this.body, this.options.pdf);
        };
        Editor.prototype.saveAsPDF = function() {
            var progress = new $.Deferred();
            var promise = progress.promise();
            var args = { promise: promise };

            if (this.trigger("pdfExport", args)) {
                return;
            }

            var options = this.options.pdf;

            this._drawPDF(progress)
            .then(function(root) {
                return kendo.drawing.exportPDF(root, options);
            })
            .done(function(dataURI) {
                kendo.saveAs({
                    dataURI: dataURI,
                    fileName: options.fileName,
                    proxyURL: options.proxyURL,
                    forceProxy: options.forceProxy
                });
                progress.resolve();
            })
            .fail(function(err) {
                progress.reject(err);
            });

            return promise;
        };
    }

})(window.jQuery || window.kendo.jQuery);

}, typeof define == 'function' && define.amd ? define : function(a1, a2, a3){ (a3 || a2)(); });
