/**
 * Source code editor.
 *
 * @asset(kisside/*)
 */
qx.Class.define("kisside.Editor",
{
  extend : qx.ui.container.Composite,

  construct : function()
  {
    this.base(arguments);

    this.setBackgroundColor("white");

    // layout stuff
    var layout = new qx.ui.layout.VBox();
    this.setLayout(layout);
//    this.setDecorator("main");

    this.__editor = new qx.ui.core.Widget();
    this.__editor.addListenerOnce("appear", function() 
    {
      this.__onEditorAppear();
    }, this);
    this.add(this.__editor, { flex : 1 });

    this.__posLabel = new qx.ui.basic.Label("").set({ allowGrowX : true });
    this.__posLabel.setTextColor("white");
    this.__posLabel.setBackgroundColor("black"); 
//    this.__posLabel.getContentElement().addClass("ace-monokai ace-cursor");
    this.add(this.__posLabel);
    this.__setPosLabel(0, 0, 0);
  },

  destruct : function()
  {
    if(this.__posInterval)
      clearInterval(this.__posInterval);
    this.__ace = null;
  },

  events:
   {
     "blur" : "qx.event.type.Data",
     "change" : "qx.event.type.Data",
     "changeSelectionStyle" : "qx.event.type.Data",
     "changeSession" : "qx.event.type.Data",
     "copy" : "qx.event.type.Data",
     "focus" : "qx.event.type.Data",
     "paste" : "qx.event.type.Data"
   },   
   
  members :
  {
    __editor : null,
    __ace : null,
    __startText : null,
    __startOptions : null,
    __posInterval : null,

    __setPosLabel : function(row, col, lines)
    {
      this.__posLabel.setValue("Ln: " + row + ", Col: " + col + ", Lines: " + lines);
    },

    __onPosTimeout : function()
    {
      var pos = this.__ace.getCursorPosition();
      var lines = this.__ace.getSession().getDocument().getLength();
      this.__setPosLabel(pos.row, pos.column, lines);
    },

    /**
     * @lint ignoreUndefined(ace.edit)
     */
    __onEditorAppear : function() 
    {
      // timout needed for chrome to not get the ACE layout wrong and show the
      // text on top of the gutter
      qx.event.Timer.once(function() 
      {
        var container = this.__editor.getContentElement().getDomElement();
        window.editor = this.__ace = ace.edit(container);
//        this.__ace.setTheme("ace/theme/monokai");
        this.__ace.setOptions({ fontSize: "14px" });
//        this.__ace.setFontSize(14);
        this.__ace.getSession().setMode("ace/mode/javascript");
        if(this.__startText)
        {
          this.__setText(this.__startText);
          this.__startText = null;
        }
        if(this.__startOptions)
        {
          this.__setOptions(this.__startOptions);
          this.__startOptions = null;
        }

        var self = this;
        // append resize listener
        this.__editor.addListener("resize", function() {
            // use a timeout to let the layout queue apply its changes to the dom
            window.setTimeout(function() {
            self.__ace.resize();
            }, 0);
          });

        this.__ace.getSession().getSelection().on("changeCursor", function() { self.__onPosTimeout(); }); 
//        this.__posInterval = window.setInterval(function() 
//        {
//          self.__onPosTimeout();
//        }, 1000);

        this.__ace.on("blur", function() { self.fireDataEvent("blur", null); });
        this.__ace.on("change", function() { self.fireDataEvent("change", null); });
        this.__ace.on("changeSelectionStyle", function() { self.fireDataEvent("changeSelectionStyle", null); });
        this.__ace.on("changeSession", function() { self.fireDataEvent("changeSession", null); });
        this.__ace.on("copy", function() { self.fireDataEvent("copy", null); });
        this.__ace.on("focus", function() { self.fireDataEvent("focus", null); });
        this.__ace.on("paste", function() { self.fireDataEvent("paste", null); });
      }, this, 500);
    },

    getOptions : function()
    {
      var options = {};
      options['ace'] = this.__ace.getOptions();
      options['session'] = this.__ace.getSession().getOptions();
      return options;
    },

    setOptions : function(options)
    {
      if(this.__ace)
      {
        if('ace' in options)
          this.__ace.setOptions(options.ace);
        if('session' in options)
          this.__ace.getSession().setOptions(options.session);
      }
      else
        this.__startOptions = options;
    },

    getText : function()
    {
      return this.__ace.getSession().getValue();
    },

    setText : function(text)
    {
      if(this.__ace)
        this.__setText(text);
      else
        this.__startText = text;
    },

    __setText : function(text)
    {
      this.__ace.getSession().setValue(text);

      // move cursor to start to prevent scrolling to the bottom
      this.__ace.renderer.scrollToX(0);
      this.__ace.renderer.scrollToY(0);
      this.__ace.selection.moveCursorFileStart();
    },

    find : function()
    {
      this.__ace.execCommand("find");
    },

    findNext : function()
    {
      this.__ace.execCommand("findnext");
    },

    findPrev : function()
    {
      this.__ace.execCommand("findprevious");
    }
  }
});
