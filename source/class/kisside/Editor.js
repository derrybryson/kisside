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
    kisside.Editor.__init();
    this.base(arguments);

    this.setBackgroundColor("white");

    // layout stuff
    var layout = new qx.ui.layout.VBox();
    this.setLayout(layout);
//    this.setDecorator("main");

    this.__editor = new qx.ui.core.Widget();
    this.__editor.addListenerOnce("appear", this.__onEditorAppear, this);
    this.add(this.__editor, { flex : 1 });

    this.__posLabel = new qx.ui.basic.Label("").set({ allowGrowX : true });
    this.__posLabel.setTextColor("white");
    this.__posLabel.setBackgroundColor("black"); 
//    this.__posLabel.getContentElement().addClass("ace-monokai ace-cursor");
    this.add(this.__posLabel);
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
  
  statics :
  {
    modes : [],
    
    getModeForPath : function(path) 
    {
      var mode = kisside.Editor.modesByName.text;
      var fileName = path.split(/[\/\\]/).pop();
      for (var i = 0; i < this.modes.length; i++) 
      {
        if (kisside.Editor.modes[i].supportsFile(fileName)) 
        {
          mode = kisside.Editor.modes[i];
          break;
        }
      }
      return mode;
    },

    Mode : function(name, caption, extensions) 
    {
      this.name = name;
      this.caption = caption;
      this.mode = "ace/mode/" + name;
      this.extensions = extensions;
      var re;
      if (/\^/.test(extensions)) 
      {
        re = extensions.replace(/\|(\^)?/g, function(a, b){
            return "$|" + (b ? "^" : "^.*\\.");
        }) + "$";
      } 
      else 
      {
        re = "^.*\\.(" + extensions + ")$";
      }

      this.extRe = new RegExp(re, "gi");
    },
    
    supportedModes : 
    {
      ABAP:        ["abap"],
      ABC:         ["abc"],
      ActionScript:["as"],
      ADA:         ["ada|adb"],
      Apache_Conf: ["^htaccess|^htgroups|^htpasswd|^conf|htaccess|htgroups|htpasswd"],
      AsciiDoc:    ["asciidoc|adoc"],
      Assembly_x86:["asm|a"],
      AutoHotKey:  ["ahk"],
      BatchFile:   ["bat|cmd"],
      C_Cpp:       ["cpp|c|cc|cxx|h|hh|hpp|ino"],
      C9Search:    ["c9search_results"],
      Cirru:       ["cirru|cr"],
      Clojure:     ["clj|cljs"],
      Cobol:       ["CBL|COB"],
      coffee:      ["coffee|cf|cson|^Cakefile"],
      ColdFusion:  ["cfm"],
      CSharp:      ["cs"],
      CSS:         ["css"],
      Curly:       ["curly"],
      D:           ["d|di"],
      Dart:        ["dart"],
      Diff:        ["diff|patch"],
      Dockerfile:  ["^Dockerfile"],
      Dot:         ["dot"],
      Dummy:       ["dummy"],
      DummySyntax: ["dummy"],
      Eiffel:      ["e|ge"],
      EJS:         ["ejs"],
      Elixir:      ["ex|exs"],
      Elm:         ["elm"],
      Erlang:      ["erl|hrl"],
      Forth:       ["frt|fs|ldr"],
      FTL:         ["ftl"],
      Gcode:       ["gcode"],
      Gherkin:     ["feature"],
      Gitignore:   ["^.gitignore"],
      Glsl:        ["glsl|frag|vert"],
      Gobstones:   ["gbs"], 
      golang:      ["go"],
      Groovy:      ["groovy"],
      HAML:        ["haml"],
      Handlebars:  ["hbs|handlebars|tpl|mustache"],
      Haskell:     ["hs"],
      haXe:        ["hx"],
      HTML:        ["html|htm|xhtml"],
      HTML_Elixir: ["eex|html.eex"],
      HTML_Ruby:   ["erb|rhtml|html.erb"],
      INI:         ["ini|conf|cfg|prefs"],
      Io:          ["io"],
      Jack:        ["jack"],
      Jade:        ["jade"],
      Java:        ["java"],
      JavaScript:  ["js|jsm|jsx"],
      JSON:        ["json"],
      JSONiq:      ["jq"],
      JSP:         ["jsp"],
      JSX:         ["jsx"],
      Julia:       ["jl"],
      LaTeX:       ["tex|latex|ltx|bib"],
      Lean:        ["lean|hlean"],
      LESS:        ["less"],
      Liquid:      ["liquid"],
      Lisp:        ["lisp"],
      LiveScript:  ["ls"],
      LogiQL:      ["logic|lql"],
      LSL:         ["lsl"],
      Lua:         ["lua"],
      LuaPage:     ["lp"],
      Lucene:      ["lucene"],
      Makefile:    ["^Makefile|^GNUmakefile|^makefile|^OCamlMakefile|make"],
      Markdown:    ["md|markdown"],
      Mask:        ["mask"],
      MATLAB:      ["matlab"],
      Maze:        ["mz"],
      MEL:         ["mel"],
      MUSHCode:    ["mc|mush"],
      MySQL:       ["mysql"],
      Nix:         ["nix"],
      NSIS:        ["nsi|nsh"],
      ObjectiveC:  ["m|mm"],
      OCaml:       ["ml|mli"],
      Pascal:      ["pas|p"],
      Perl:        ["pl|pm"],
      pgSQL:       ["pgsql"],
      PHP:         ["php|phtml|shtml|php3|php4|php5|phps|phpt|aw|ctp|module"],
      Powershell:  ["ps1"],
      Praat:       ["praat|praatscript|psc|proc"],
      Prolog:      ["plg|prolog"],
      Properties:  ["properties"],
      Protobuf:    ["proto"],
      Python:      ["py"],
      R:           ["r"],
      Razor:       ["cshtml"],
      RDoc:        ["Rd"],
      RHTML:       ["Rhtml"],
      RST:         ["rst"],
      Ruby:        ["rb|ru|gemspec|rake|^Guardfile|^Rakefile|^Gemfile"],
      Rust:        ["rs"],
      SASS:        ["sass"],
      SCAD:        ["scad"],
      Scala:       ["scala"],
      Scheme:      ["scm|sm|rkt|oak|scheme"],
      SCSS:        ["scss"],
      SH:          ["sh|bash|^.bashrc"],
      SJS:         ["sjs"],
      Smarty:      ["smarty|tpl"],
      snippets:    ["snippets"],
      Soy_Template:["soy"],
      Space:       ["space"],
      SQL:         ["sql"],
      SQLServer:   ["sqlserver"],
      Stylus:      ["styl|stylus"],
      SVG:         ["svg"],
      Swift:       ["swift"],
      Tcl:         ["tcl"],
      Tex:         ["tex"],
      Text:        ["txt"],
      Textile:     ["textile"],
      Toml:        ["toml"],
      Twig:        ["twig|swig"],
      Typescript:  ["ts|typescript|str"],
      Vala:        ["vala"],
      VBScript:    ["vbs|vb"],
      Velocity:    ["vm"],
      Verilog:     ["v|vh|sv|svh"],
      VHDL:        ["vhd|vhdl"],
      Wollok:      ["wlk|wpgm|wtest"],
      XML:         ["xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl|xaml"],
      XQuery:      ["xq"],
      YAML:        ["yaml|yml"],
      Django:      ["html"]
    },
    
    nameOverrides : 
    {
      ObjectiveC: "Objective-C",
      CSharp: "C#",
      golang: "Go",
      C_Cpp: "C and C++",
      coffee: "CoffeeScript",
      HTML_Ruby: "HTML (Ruby)",
      HTML_Elixir: "HTML (Elixir)",
      FTL: "FreeMarker"
    },
    
    modesByName : null,
    
    __init : function()
    {
      if(kisside.Editor.modesByName === null)
      {
        kisside.Editor.Mode.prototype.supportsFile = function(filename) {
          return filename.match(this.extRe);
        };
    
        kisside.Editor.modesByName = {};
        for (var name in kisside.Editor.supportedModes) 
        {
          var data = this.supportedModes[name];
          var displayName = (this.nameOverrides[name] || name).replace(/_/g, " ");
          var filename = name.toLowerCase();
          var mode = new this.Mode(filename, displayName, data[0]);
          kisside.Editor.modesByName[filename] = mode;
          this.modes.push(mode);
        }
      }
    }
  },
   
  members :
  {
    __editor : null,
    __ace : null,
    __startText : null,
    __startOptions : null,
    __posInterval : null,
    __setFocus : false,
    __startMode : null,
    __curMode : null,
    
    __setPosLabel : function(row, col, lines, mode)
    {
      this.__posLabel.setValue("Ln: " + row + ", Col: " + col + ", Lines: " + lines + ", Mode: " + mode);
    },

    __onPosTimeout : function()
    {
      var pos = this.__ace.getCursorPosition();
      var lines = this.__ace.getSession().getDocument().getLength();
      var mode = this.getMode();
      this.__setPosLabel(pos.row, pos.column, lines, mode.caption);
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
        if(this.__startMode)
          this.__setMode(this.__startMode);
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
        this.__onPosTimeout();
        if(this.__setFocus)
          this.__ace.focus();
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
    
    setMode : function(mode)
    {
      if(this.__ace)
        this.__setMode(mode);
      else
        this.__startMode = mode;
    },
    
    __setMode : function(mode)
    {
      var name = mode.split("/");
      name = name[name.length - 1];
      this.__curMode = kisside.Editor.modesByName[name];
      this.__ace.getSession().setMode(mode);
    },
    
    getMode : function()
    {
      return this.__curMode;
    },
    
    focus : function()
    {
      this.debug("setting focus");
      if(this.__ace)
        this.__ace.focus();
      else
        this.__setFocus = true;
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
    },

    replace : function()
    {
      this.__ace.execCommand("replace");
    },

    undo : function()
    {
      this.__ace.execCommand("undo");
    },

    redo : function()
    {
      this.__ace.execCommand("redo");
    }
  }
});
