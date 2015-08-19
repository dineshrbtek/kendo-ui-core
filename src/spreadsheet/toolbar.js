(function(f, define){
    define([ "../kendo.toolbar", "../kendo.colorpicker", "../kendo.combobox", "../kendo.dropdownlist", "../kendo.popup" ], f);
})(function(){

(function(kendo) {
    var $ = kendo.jQuery;

    var ToolBar = kendo.ui.ToolBar;

    var defaultTools = [
        [ "bold", "italic", "underline" ],
        [ "alignLeft", "alignCenter", "alignRight" ],
        [ "alignTop", "alignMiddle", "alignBottom" ],
        [ "formatCurrency", "formatPercentage", "formatDecreaseDecimal", "formatIncreaseDecimal" ],
        "format", "mergeCells", "borders",
        "fontFamily", "fontSize",
        "backgroundColor", "textColor", "textWrap",
        [ "paste" ]
    ];

    var toolDefaults = {
        bold:                  { type: "button", togglable: true, property: "bold", value: true, iconClass: "bold" },
        italic:                { type: "button", togglable: true, property: "italic", value: true, iconClass: "italic" },
        underline:             { type: "button", togglable: true, property: "underline", value: true, iconClass: "underline" },
        alignLeft:             { type: "button", togglable: true, property: "textAlign", value: "left", iconClass: "justify-left" },
        alignCenter:           { type: "button", togglable: true, property: "textAlign", value: "center", iconClass: "justify-center" },
        alignRight:            { type: "button", togglable: true, property: "textAlign", value: "right", iconClass: "justify-right" },
        alignTop:              { type: "button", togglable: true, property: "verticalAlign", value: "top", iconClass: "align-top" },
        alignMiddle:           { type: "button", togglable: true, property: "verticalAlign", value: "middle", iconClass: "align-middle" },
        alignBottom:           { type: "button", togglable: true, property: "verticalAlign", value: "bottom", iconClass: "align-bottom" },
        formatCurrency:        { property: "format", value: "$?" },
        formatPercentage:      { property: "format", value: "?.00%" },
        formatDecreaseDecimal: { command: "AdjustDecimalsCommand", value: -1, iconClass: "decrease-decimal" },
        formatIncreaseDecimal: { command: "AdjustDecimalsCommand", value: +1, iconClass: "increase-decimal" },
        format:                { type: "format", property: "format", width: 100, overflow: "never" },
        backgroundColor:       { type: "colorPicker", property: "background", iconClass: "background" },
        textColor:             { type: "colorPicker", property: "color", iconClass: "text" },
        mergeCells:            { type: "splitButton", command: "MergeCellCommand", value: "cells", showText: "overflow", iconClass: "merge-cells",
                                 menuButtons: [
                                    { iconClass: "merge-cells", command: "MergeCellCommand", name: "mergeCells", value: "cells" },
                                    { iconClass: "merge-horizontally", command: "MergeCellCommand", name: "mergeHorizontally", value: "horizontally" },
                                    { iconClass: "merge-vertically", command: "MergeCellCommand", name: "mergeVertically", value: "vertically" },
                                    { iconClass: "normal-layout", command: "MergeCellCommand", name: "unmerge", value: "unmerge" }
                                 ] },
        borders:               { type: "borders", overflow: "never" },
        fontFamily:            { type: "fontFamily", property: "fontFamily", width: 130, overflow: "never" },
        fontSize:              { type: "fontSize", property: "fontSize", width: 60, overflow: "never" },
        textWrap:              { type: "button", togglable: true, property: "wrap", command: "TextWrapCommand", value: true, iconClass: "text-wrap" },
        paste:                 { command: "PasteCommand", iconClass: "paste" }
    };

    var SpreadsheetToolBar = ToolBar.extend({
        init: function(element, options) {
            options.items = this._expandTools(options.tools || SpreadsheetToolBar.prototype.options.tools);

            ToolBar.fn.init.call(this, element, options);
            var handleClick = this._click.bind(this);

            this.bind({
                click: handleClick,
                toggle: handleClick
            });
        },
        _expandTools: function(tools) {
            var messages = this.options.messages;

            function expandTool(toolName) {
                // expand string to object, add missing tool properties
                var options = $.isPlainObject(toolName) ? toolName : toolDefaults[toolName] || {};
                var spriteCssClass = "k-icon k-font-icon k-i-" + options.iconClass;
                var type = options.type;
                var typeDefaults = {
                    splitButton: { spriteCssClass: spriteCssClass },
                    button: {
                        showText: "overflow"
                    },
                    colorPicker: {
                        toolIcon: spriteCssClass,
                        overflow: "never"
                    }
                };

                var tool = $.extend({
                    name: options.name || toolName,
                    text: messages[options.name || toolName],
                    spriteCssClass: spriteCssClass,
                    attributes: {}
                }, typeDefaults[type], options);

                if (type == "splitButton") {
                    tool.menuButtons = tool.menuButtons.map(expandTool);
                }

                if (options.property) {
                    tool.attributes["data-command"] = options.command || "PropertyChangeCommand";
                    tool.attributes["data-property"] = options.property;
                } else if (options.command) {
                    tool.attributes["data-command"] = options.command;
                }

                if (options.value) {
                    tool.attributes["data-value"] = options.value;
                }

                return tool;
            }

            return tools.reduce(function(tools, tool) {
                if ($.isArray(tool)) {
                    tools.push({ type: "buttonGroup", buttons: tool.map(expandTool) });
                } else {
                    tools.push(expandTool.call(this, tool));
                }

                return tools;
            }, []);
        },
        _click: function(e) {
            var target = e.target;
            var commandType = target.attr("data-command");
            var args = {
                commandType: commandType
            };

            if (!commandType) {
                return;
            }

            if (commandType == "PropertyChangeCommand" || commandType == "TextWrapCommand") {
                args.value = null;
                args.property = target.attr("data-property");

                if (e.checked !== false) {
                    args.value = !!target.attr("data-value");
                }
            } else if (commandType == "AdjustDecimalsCommand") {
                args.decimals = parseInt(target.attr("data-value"), 10);
            }

            this.trigger("execute", args);
        },
        events: ToolBar.fn.events.concat([ "execute" ]),
        options: {
            name: "SpreadsheetToolBar",
            resizable: false,
            tools: defaultTools,
            messages: {
                bold: "Bold",
                italic: "Italic",
                underline: "Underline",
                alignLeft: "Align left",
                alignCenter: "Align center",
                alignRight: "Align right",
                alignTop: "Align top",
                alignMiddle: "Align middle",
                alignBottom: "Align bottom",
                mergeCells: "Merge cells",
                mergeHorizontally: "Merge horizontally",
                mergeVertically: "Merge vertically",
                unmerge: "Unmerge"
            }
        },
        range: function() {
            var sheet = this.workbook().activeSheet();
            return sheet.range(sheet.activeCell());
        },
        workbook: function() {
            return this.options.workbook();
        },
        refresh: function() {
            var range = this.range();
            var tools = this._tools();

            function setToggle(tool, toggle) {
                var toolbar = tool.toolbar;
                var overflow = tool.overflow;
                var togglable = (toolbar && toolbar.options.togglable) ||
                                 (overflow && overflow.options.togglable);

                if (!togglable) {
                    return;
                }

                if (toolbar) {
                    toolbar.toggle(toggle);
                }

                if (overflow) {
                    overflow.toggle(toggle);
                }
            }

            function update(tool, value) {
                var toolbar = tool.toolbar;
                var overflow = tool.overflow;

                if (toolbar && toolbar.update) {
                    toolbar.update(value);
                }

                if (overflow && overflow.update) {
                    overflow.update(value);
                }
            }

            for (var i = 0; i < tools.length; i++) {
                var property = tools[i].property;
                var tool = tools[i].tool;
                var value = range[property]();

                if (tool.type === "button") {
                    setToggle(tool, !!value);
                } else {
                    update(tool, value);
                }
            }
        },
        _tools: function() {
            return this.element.find("[data-property]").toArray().reduce(function(tools, element) {
                element = $(element);
                var property = element.attr("data-property");

                tools.push({
                    property: property,
                    tool: this._getItem(element)
                });

                return tools;
            }.bind(this), []);
        },
        destroy: function() {
            // TODO: move to ToolBar.destroy to take care of these
            this.element.find("[data-command],.k-button").each(function() {
                var element = $(this);
                var instance = element.data("instance");
                if (instance && instance.destroy) {
                    instance.destroy();
                }
            });

            ToolBar.fn.destroy.call(this);
        }
    });

    var colorPicker = kendo.toolbar.Item.extend({
        init: function(options, toolbar) {
            var colorPicker = $("<input />").kendoColorPicker({
                palette: [ //metro palette
                    "#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
                    "#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
                    "#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
                    "#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
                    "#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
                    "#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
                ],
                toolIcon: options.toolIcon,
                change: function(e) {
                    toolbar.trigger("execute", {
                        commandType: "PropertyChangeCommand",
                        property: options.property,
                        value: this.value()
                    });
                }
            }).data("kendoColorPicker");

            this.colorPicker = colorPicker;
            this.element = colorPicker.wrapper;
            this.options = options;
            this.toolbar = toolbar;

            this.element.attr({
                "data-command": "PropertyChangeCommand",
                "data-property": options.property
            });

            this.element.data({
                type: "colorPicker",
                colorPicker: this
            });
        },

        update: function(value) {
            this.value(value);
        },

        value: function(value) {
            if (value !== undefined) {
                this.colorPicker.value(value);
            } else {
                return this.colorPicker.value();
            }
        }
    });

    kendo.toolbar.registerComponent("colorPicker", colorPicker);

    var FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    var DEFAULT_FONT_SIZE = 12;

    var fontSize = kendo.toolbar.Item.extend({
        init: function(options, toolbar) {
            var comboBox = $("<input />").kendoComboBox({
                change: function(e) {
                    toolbar.trigger("execute", {
                        commandType: "PropertyChangeCommand",
                        property: options.property,
                        value: kendo.parseInt(this.value()) + "px"
                    });
                },
                dataSource: options.fontSizes || FONT_SIZES,
                value: DEFAULT_FONT_SIZE
            }).data("kendoComboBox");

            this.comboBox = comboBox;
            this.element = comboBox.wrapper;
            this.options = options;
            this.toolbar = toolbar;

            this.element.width(options.width).attr({
                "data-command": "PropertyChangeCommand",
                "data-property": options.property
            });

            this.element.data({
                type: "fontSize",
                fontSize: this
            });
        },

        update: function(value) {
            this.value(kendo.parseInt(value) || DEFAULT_FONT_SIZE);
        },

        value: function(value) {
            if (value !== undefined) {
                this.comboBox.value(value);
            } else {
                return this.comboBox.value();
            }
        }
    });

    kendo.toolbar.registerComponent("fontSize", fontSize);

    var DropDownTool = kendo.toolbar.Item.extend({
        init: function(options, toolbar) {
            var dropDownList = $("<select />").kendoDropDownList({
                height: "auto"
            }).data("kendoDropDownList");

            this.dropDownList = dropDownList;
            this.element = dropDownList.wrapper;
            this.options = options;
            this.toolbar = toolbar;

            dropDownList.bind("open", this._open.bind(this));
            dropDownList.bind("change", this._change.bind(this));

            this.element.width(options.width).attr({
                "data-command": "PropertyChangeCommand",
                "data-property": options.property
            });
        },
        _open: function() {
            var ddl = this.dropDownList;
            var list = ddl.list;
            var listWidth;

            list.css({
                whiteSpace: "nowrap",
                width: "auto"
            });

            listWidth = list.width();

            if (listWidth) {
                listWidth += 20;
            } else {
                listWidth = ddl._listWidth;
            }

            list.css("width", listWidth + kendo.support.scrollbar());

            ddl._listWidth = listWidth;
        },
        _change: function(e) {
            var value = e.sender.value();
            this.toolbar.trigger("execute", {
                commandType: "PropertyChangeCommand",
                property: this.options.property,
                value: value == "null" ? null : value
            });
        },
        value: function(value) {
            if (value !== undefined) {
                this.dropDownList.value(value);
            } else {
                return this.dropDownList.value();
            }
        }
    });

    var FONT_FAMILIES = ["Arial", "Courier New", "Georgia", "Times New Roman", "Trebuchet MS", "Verdana"];
    var DEFAULT_FONT_FAMILY = "Arial";

    kendo.toolbar.registerComponent("fontFamily", DropDownTool.extend({
        init: function(options, toolbar) {
            DropDownTool.fn.init.call(this, options, toolbar);

            var ddl = this.dropDownList;
            ddl.setDataSource(options.fontFamilies || FONT_FAMILIES);
            ddl.value(DEFAULT_FONT_FAMILY);

            this.element.data({
                type: "fontFamily",
                fontFamily: this
            });
        },
        update: function(value) {
            this.value(value || DEFAULT_FONT_FAMILY);
        }
    }));

    kendo.toolbar.registerComponent("format", DropDownTool.extend({
        _revertTitle: function(e) {
            e.sender.value("");
            e.sender.wrapper.width("auto");
        },
        init: function(options, toolbar) {
            DropDownTool.fn.init.call(this, options, toolbar);

            var ddl = this.dropDownList;
            ddl.bind("change", this._revertTitle.bind(this));
            ddl.bind("dataBound", this._revertTitle.bind(this));
            ddl.setOptions({
                dataValueField: "format",
                dataValuePrimitive: true,
                valueTemplate: "123",
                template:
                    "# if (data.sample) { #" +
                        "<span class='k-spreadsheet-sample'>#: data.sample #</span>" +
                    "# } #" +
                    "#: data.name #"
            });
            ddl.setDataSource([
                { format: null, name: "Automatic" },
                { format: "?.00", name: "Number", sample: "1,499.99" },
                { format: "?.00%", name: "Percent", sample: "14.50%" },
                { format: '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)', name: "Financial", sample: "(1,000.12)" },
                { format: "$?", name: "Currency", sample: "$1,499.99" },
                { format: "m/d/yyyy", name: "Date", sample: "4/21/2012" },
                { format: "h:mm:ss AM/PM", name: "Time", sample: "5:49:00 PM" },
                { format: "m/d/yyyy h:mm", name: "Date time", sample: "4/21/2012 5:49:00" },
                { format: "[h]:mm:ss", name: "Duration", sample: "168:05:00" }
            ]);

            this.element.data({
                type: "format",
                format: this
            });
        }
    }));

    kendo.toolbar.registerComponent("dialog", kendo.toolbar.ToolBarButton.extend({
        init: function(options, toolbar) {
            kendo.toolbar.ToolBarButton.fn.init.call(this, options, toolbar);

            this._dialogName = options.dialogName;

            this.element.bind("click", this.open.bind(this))
                        .data("instance", this);
        },
        open: function() {
            kendo.spreadsheet.dialogs.open(this._dialogName, this.toolbar.range());
        }
    }));

    var BorderChangeTool = kendo.toolbar.Item.extend({
        init: function(options, toolbar) {
            this.element = $("<a href='#' data-command='BorderChangeCommand' class='k-button k-button-icon'>" +
                                "<span class='k-sprite k-font-icon k-icon k-i-all-borders'>" +
                                "</span><span class='k-font-icon k-icon k-i-arrow-s'></span>" +
                            "</a>");

            this.element.on("click", this.open.bind(this));

            this.options = options;
            this.toolbar = toolbar;

            this._popupElement();
            this._popup();
            this._colorPicker();

            this.popupElement.on("click", ".k-spreadsheet-border-type-palette .k-button", this._click.bind(this));

            this.element.data({
                type: "borders",
                instance: this
            });
        },

        open: function() {
            this.popup.toggle();
        },

        destroy: function() {
            this.popupElement.off("click");
            this.popup.destroy();
            this.popupElement.remove();
        },

        _popupElement: function() {
            var types = [
                "allBorders",
                "insideBorders",
                "insideHorizontalBorders",
                "insideVerticalBorders",
                "outsideBorders",
                "leftBorder",
                "topBorder",
                "rightBorder",
                "bottomBorder",
                "noBorders"
            ];

            var buttons = types.map(function(type) {
                return '<a href="#" data-border-type="' + type + '" class="k-button k-button-icon">' +
                            '<span class="k-sprite k-font-icon k-icon k-i-' + kendo.toHyphens(type) + '">' + type.replace(/([A-Z])/g, ' $1').toLowerCase() + '</span>' +
                       '</a>';
            }).join("");

            var popupElement = $("<div>", {
                "class": "k-spreadsheet-popup k-spreadsheet-border-palette",
                "html": "<div class='k-spreadsheet-border-type-palette'>" + buttons + "</div><div class='k-spreadsheet-border-style-palette'></div>"
            });

            this.popupElement = popupElement;
        },

        _popup: function() {
            var element = this.element;

            this.popup = this.popupElement.kendoPopup({
                anchor: element
            }).data("kendoPopup");
        },

        _colorPicker: function() {
            this.color = "#000";
            this.colorPalette = $("<div />").kendoColorPalette({
                palette: [ //metro palette
                    "#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
                    "#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
                    "#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
                    "#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
                    "#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
                    "#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
                ],
                value: this.color,
                change: this._colorChange.bind(this)
            }).data("kendoColorPalette");

            this.popupElement.find(".k-spreadsheet-border-style-palette").append(this.colorPalette.wrapper);
        },

        _colorChange: function(e) {
            this.color = e.value;
            if (this.type) {
                this._execute();
            }
        },

        _click: function(e) {
            this.type = $(e.currentTarget).data("borderType");
            this._execute();
        },

        _execute: function() {
            this.toolbar.trigger("execute", {
                commandType: "BorderChangeCommand",
                border: this.type,
                style: { size: "1px", color: this.color }
            });
        }
    });

    kendo.toolbar.registerComponent("borders", BorderChangeTool);

    kendo.spreadsheet.ToolBar = SpreadsheetToolBar;

})(window.kendo);

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
