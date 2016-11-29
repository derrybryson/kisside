/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * A wrapper for Cookie handling.
 */
qx.Bootstrap.define("qx.bom.Cookie",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      USER APPLICATION METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the string value of a cookie.
     *
     * @param key {String} The key for the saved string value.
     * @return {null | String} Returns the saved string value, if the cookie
     *    contains a value for the key, <code>null</code> otherwise.
     */
    get : function(key)
    {
      var start = document.cookie.indexOf(key + "=");
      var len = start + key.length + 1;

      if ((!start) && (key != document.cookie.substring(0, key.length))) {
        return null;
      }

      if (start == -1) {
        return null;
      }

      var end = document.cookie.indexOf(";", len);

      if (end == -1) {
        end = document.cookie.length;
      }

      return unescape(document.cookie.substring(len, end));
    },


    /**
     * Sets the string value of a cookie.
     *
     * @param key {String} The key for the string value.
     * @param value {String} The string value.
     * @param expires {Number?null} The expires in days starting from now,
     *    or <code>null</code> if the cookie should deleted after browser close.
     * @param path {String?null} Path value.
     * @param domain {String?null} Domain value.
     * @param secure {Boolean?null} Secure flag.
     */
    set : function(key, value, expires, path, domain, secure)
    {
      // Generate cookie
      var cookie = [ key, "=", escape(value) ];

      if (expires)
      {
        var today = new Date();
        today.setTime(today.getTime());

        cookie.push(";expires=", new Date(today.getTime() + (expires * 1000 * 60 * 60 * 24)).toGMTString());
      }

      if (path) {
        cookie.push(";path=", path);
      }

      if (domain) {
        cookie.push(";domain=", domain);
      }

      if (secure) {
        cookie.push(";secure");
      }

      // Store cookie
      document.cookie = cookie.join("");
    },


    /**
     * Deletes the string value of a cookie.
     *
     * @param key {String} The key for the string value.
     * @param path {String?null} Path value.
     * @param domain {String?null} Domain value.
     */
    del : function(key, path, domain)
    {
      if (!qx.bom.Cookie.get(key)) {
        return;
      }

      // Generate cookie
      var cookie = [ key, "=" ];

      if (path) {
        cookie.push(";path=", path);
      }

      if (domain) {
        cookie.push(";domain=", domain);
      }

      cookie.push(";expires=Thu, 01-Jan-1970 00:00:01 GMT");

      // Store cookie
      document.cookie = cookie.join("");
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Contains some common methods available to all log appenders.
 */
qx.Bootstrap.define("qx.log.appender.Util",
{
  statics :
  {
    /**
     * Converts a single log entry to HTML
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    toHtml : function(entry)
    {
      var output = [];
      var item, msg, sub, list;

      output.push("<span class='offset'>", this.formatOffset(entry.offset, 6), "</span> ");

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push("<span class='object' title='Object instance with hash code: " + obj.$$hash + "'>", obj.classname, "[" , obj.$$hash, "]</span>: ");
        }
      }
      else if (entry.clazz)
      {
        output.push("<span class='object'>" + entry.clazz.classname, "</span>: ");
      }

      var items = entry.items;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (msg instanceof Array)
        {
          var list = [];

          for (var j=0, jl=msg.length; j<jl; j++)
          {
            sub = msg[j];
            if (typeof sub === "string") {
              list.push("<span>" + this.escapeHTML(sub) + "</span>");
            } else if (sub.key) {
              list.push("<span class='type-key'>" + sub.key + "</span>:<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            } else {
              list.push("<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            }
          }

          output.push("<span class='type-" + item.type + "'>");

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }

          output.push("</span>");
        }
        else
        {
          output.push("<span class='type-" + item.type + "'>" + this.escapeHTML(msg) + "</span> ");
        }
      }

      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = output.join("");
      wrapper.className = "level-" + entry.level;

      return wrapper;
    },


    /**
     * Formats a numeric time offset to 6 characters.
     *
     * @param offset {Integer} Current offset value
     * @param length {Integer?6} Refine the length
     * @return {String} Padded string
     */
    formatOffset : function(offset, length)
    {
      var str = offset.toString();
      var diff = (length||6) - str.length;
      var pad = "";

      for (var i=0; i<diff; i++) {
        pad += "0";
      }

      return pad+str;
    },


    /**
     * Escapes the HTML in the given value
     *
     * @param value {String} value to escape
     * @return {String} escaped value
     */
    escapeHTML : function(value) {
      return String(value).replace(/[<>&"']/g, this.__escapeHTMLReplace);
    },


    /**
     * Internal replacement helper for HTML escape.
     *
     * @param ch {String} Single item to replace.
     * @return {String} Replaced item
     */
    __escapeHTMLReplace : function(ch)
    {
      var map =
      {
        "<" : "&lt;",
        ">" : "&gt;",
        "&" : "&amp;",
        "'" : "&#39;",
        '"' : "&quot;"
      };

      return map[ch] || "?";
    },


    /**
     * Converts a single log entry to plain text
     *
     * @param entry {Map} The entry to process
     * @return {String} the formatted log entry
     */
    toText : function(entry) {
      return this.toTextArray(entry).join(" ");
    },


    /**
     * Converts a single log entry to an array of plain text
     *
     * @param entry {Map} The entry to process
     * @return {Array} Argument list ready message array.
     */
    toTextArray : function(entry)
    {
      var output = [];

      output.push(this.formatOffset(entry.offset, 6));

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push(obj.classname + "[" + obj.$$hash + "]:");
        }
      }
      else if (entry.clazz) {
        output.push(entry.clazz.classname + ":");
      }

      var items = entry.items;
      var item, msg;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (item.trace && item.trace.length > 0) {
          if (typeof(this.FORMAT_STACK) == "function") {
            qx.log.Logger.deprecatedConstantWarning(qx.log.appender.Util,
              "FORMAT_STACK",
              "Use qx.dev.StackTrace.FORMAT_STACKTRACE instead");
            msg += "\n" + this.FORMAT_STACK(item.trace);
          } else {
            msg += "\n" + item.trace;
          }
        }

        if (msg instanceof Array)
        {
          var list = [];
          for (var j=0, jl=msg.length; j<jl; j++) {
            list.push(msg[j].text);
          }

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }
        }
        else
        {
          output.push(msg);
        }
      }

      return output;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Processes the incoming log entry and displays it by means of the native
 * logging capabilities of the client.
 *
 * Supported browsers:
 * * Firefox <4 using FireBug (if available).
 * * Firefox >=4 using the Web Console.
 * * WebKit browsers using the Web Inspector/Developer Tools.
 * * Internet Explorer 8+ using the F12 Developer Tools.
 * * Opera >=10.60 using either the Error Console or Dragonfly
 *
 * Currently unsupported browsers:
 * * Opera <10.60
 *
 * @require(qx.log.appender.Util)
 * @require(qx.bom.client.Html)
 */
qx.Bootstrap.define("qx.log.appender.Native",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      if (qx.core.Environment.get("html.console")) {
        // Firefox 4's Web Console doesn't support "debug"
        var level = console[entry.level] ? entry.level : "log";
        if (console[level]) {
          var args = qx.log.appender.Util.toText(entry);
          console[level](args);
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.log.Logger.register(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Feature-rich console appender for the qooxdoo logging system.
 *
 * Creates a small inline element which is placed in the top-right corner
 * of the window. Prints all messages with a nice color highlighting.
 *
 * * Allows user command inputs.
 * * Command history enabled by default (Keyboard up/down arrows).
 * * Lazy creation on first open.
 * * Clearing the console using a button.
 * * Display of offset (time after loading) of each message
 * * Supports keyboard shortcuts F7 or Ctrl+D to toggle the visibility
 *
 * @require(qx.event.handler.Window)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Gesture)
 */
qx.Class.define("qx.log.appender.Console",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
      INITIALIZATION AND SHUTDOWN
    ---------------------------------------------------------------------------
    */

   __main : null,

   __log : null,

   __cmd : null,

   __lastCommand : null,

    /**
     * Initializes the console, building HTML and pushing last
     * log messages to the output window.
     *
     */
    init : function()
    {
      // Build style sheet content
      var style =
      [
        '.qxconsole{z-index:10000;width:600px;height:300px;top:0px;right:0px;position:absolute;border-left:1px solid black;color:black;border-bottom:1px solid black;color:black;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',

        '.qxconsole .control{background:#cdcdcd;border-bottom:1px solid black;padding:4px 8px;}',
        '.qxconsole .control a{text-decoration:none;color:black;}',

        '.qxconsole .messages{background:white;height:100%;width:100%;overflow:auto;}',
        '.qxconsole .messages div{padding:0px 4px;}',

        '.qxconsole .messages .user-command{color:blue}',
        '.qxconsole .messages .user-result{background:white}',
        '.qxconsole .messages .user-error{background:#FFE2D5}',
        '.qxconsole .messages .level-debug{background:white}',
        '.qxconsole .messages .level-info{background:#DEEDFA}',
        '.qxconsole .messages .level-warn{background:#FFF7D5}',
        '.qxconsole .messages .level-error{background:#FFE2D5}',
        '.qxconsole .messages .level-user{background:#E3EFE9}',
        '.qxconsole .messages .type-string{color:black;font-weight:normal;}',
        '.qxconsole .messages .type-number{color:#155791;font-weight:normal;}',
        '.qxconsole .messages .type-boolean{color:#15BC91;font-weight:normal;}',
        '.qxconsole .messages .type-array{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-map{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-key{color:#565656;font-style:italic}',
        '.qxconsole .messages .type-class{color:#5F3E8A;font-weight:bold}',
        '.qxconsole .messages .type-instance{color:#565656;font-weight:bold}',
        '.qxconsole .messages .type-stringify{color:#565656;font-weight:bold}',

        '.qxconsole .command{background:white;padding:2px 4px;border-top:1px solid black;}',
        '.qxconsole .command input{width:100%;border:0 none;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',
        '.qxconsole .command input:focus{outline:none;}'
      ];

      // Include stylesheet
      qx.bom.Stylesheet.createElement(style.join(""));

      // Build markup
      var markup =
      [
        '<div class="qxconsole">',
        '<div class="control"><a href="javascript:qx.log.appender.Console.clear()">Clear</a> | <a href="javascript:qx.log.appender.Console.toggle()">Hide</a></div>',
        '<div class="messages">',
        '</div>',
        '<div class="command">',
        '<input type="text"/>',
        '</div>',
        '</div>'
      ];

      // Insert HTML to access DOM node
      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = markup.join("");
      var main = wrapper.firstChild;
      document.body.appendChild(wrapper.firstChild);

      // Make important DOM nodes available
      this.__main = main;
      this.__log = main.childNodes[1];
      this.__cmd = main.childNodes[2].firstChild;

      // Correct height of messages frame
      this.__onResize();

      // Finally register to log engine
      qx.log.Logger.register(this);

      // Register to object manager
      qx.core.ObjectRegistry.register(this);
    },


    /**
     * Used by the object registry to dispose this instance e.g. remove listeners etc.
     *
     */
    dispose : function()
    {
      qx.event.Registration.removeListener(document.documentElement, "keypress", this.__onKeyPress, this);
      qx.log.Logger.unregister(this);
    },





    /*
    ---------------------------------------------------------------------------
      INSERT & CLEAR
    ---------------------------------------------------------------------------
    */

    /**
     * Clears the current console output.
     *
     */
    clear : function()
    {
      // Remove all messages
      this.__log.innerHTML = "";
    },


    /**
     * Processes a single log entry
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      // Append new content
      this.__log.appendChild(qx.log.appender.Util.toHtml(entry));

      // Scroll down
      this.__scrollDown();
    },


    /**
     * Automatically scroll down to the last line
     */
    __scrollDown : function() {
      this.__log.scrollTop = this.__log.scrollHeight;
    },





    /*
    ---------------------------------------------------------------------------
      VISIBILITY TOGGLING
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Flag to store last visibility status */
    __visible : true,


    /**
     * Toggles the visibility of the console between visible and hidden.
     *
     */
    toggle : function()
    {
      if (!this.__main)
      {
        this.init();
      }
      else if (this.__main.style.display == "none")
      {
        this.show();
      }
      else
      {
        this.__main.style.display = "none";
      }
    },


    /**
     * Shows the console.
     *
     */
    show : function()
    {
      if (!this.__main) {
        this.init();
      } else {
        this.__main.style.display = "block";
        this.__log.scrollTop = this.__log.scrollHeight;
      }
    },


    /*
    ---------------------------------------------------------------------------
      COMMAND LINE SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Array} List of all previous commands. */
    __history : [],


    /**
     * Executes the currently given command
     *
     */
    execute : function()
    {
      var value = this.__cmd.value;
      if (value == "") {
        return;
      }

      if (value == "clear") {
        this.clear();
        return;
      }

      var command = document.createElement("div");
      command.innerHTML = qx.log.appender.Util.escapeHTML(">>> " + value);
      command.className = "user-command";

      this.__history.push(value);
      this.__lastCommand = this.__history.length;
      this.__log.appendChild(command);
      this.__scrollDown();

      try {
        var ret = window.eval(value);
      }
      catch (ex) {
        qx.log.Logger.error(ex);
      }

      if (ret !== undefined) {
        qx.log.Logger.debug(ret);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for resize listener
     *
     * @param e {Event} Event object
     */
    __onResize : function(e) {
      this.__log.style.height = (this.__main.clientHeight - this.__main.firstChild.offsetHeight - this.__main.lastChild.offsetHeight) + "px";
    },


    /**
     * Event handler for keydown listener
     *
     * @param e {Event} Event object
     */
    __onKeyPress : function(e)
    {
      if (e instanceof qx.event.type.Tap || e instanceof qx.event.type.Pointer) {
        var target = e.getTarget();
        if (target && target.className && target.className.indexOf && target.className.indexOf("navigationbar") != -1) {
          this.toggle();
        }
        return;
      }

      var iden = e.getKeyIdentifier();

      // Console toggling
      if ((iden == "F7") || (iden == "D" && e.isCtrlPressed()))
      {
        this.toggle();
        e.preventDefault();
      }

      // Not yet created
      if (!this.__main) {
        return;
      }

      // Active element not in console
      if (!qx.dom.Hierarchy.contains(this.__main, e.getTarget())) {
        return;
      }

      // Command execution
      if (iden == "Enter" && this.__cmd.value != "")
      {
        this.execute();
        this.__cmd.value = "";
      }

      // History managment
      if (iden == "Up" || iden == "Down")
      {
        this.__lastCommand += iden == "Up" ? -1 : 1;
        this.__lastCommand = Math.min(Math.max(0, this.__lastCommand), this.__history.length);

        var entry = this.__history[this.__lastCommand];
        this.__cmd.value = entry || "";
        this.__cmd.select();
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addListener(document.documentElement, "keypress", statics.__onKeyPress, statics);
    qx.event.Registration.addListener(document.documentElement, "longtap", statics.__onKeyPress, statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin redirects all children handling methods to a child widget of the
 * including class. This is e.g. used in {@link qx.ui.window.Window} to add
 * child widgets directly to the window pane.
 *
 * The including class must implement the method <code>getChildrenContainer</code>,
 * which has to return the widget, to which the child widgets should be added.
 */
qx.Mixin.define("qx.ui.core.MRemoteChildrenHandling",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Forward the call with the given function name to the children container
     *
     * @param functionName {String} name of the method to forward
     * @param a1 {var} first argument of the method to call
     * @param a2 {var} second argument of the method to call
     * @param a3 {var} third argument of the method to call
     * @return {var} The return value of the forward method
     */
    __forward : function(functionName, a1, a2, a3)
    {
      var container = this.getChildrenContainer();
      if (container === this) {
        functionName = "_" + functionName;
      }
      return (container[functionName])(a1, a2, a3);
    },


    /**
     * Returns the children list
     *
     * @return {LayoutItem[]} The children array (Arrays are
     *   reference types, please do not modify them in-place)
     */
    getChildren : function() {
      return this.__forward("getChildren");
    },


    /**
     * Whether the widget contains children.
     *
     * @return {Boolean} Returns <code>true</code> when the widget has children.
     */
    hasChildren : function() {
      return this.__forward("hasChildren");
    },


    /**
     * Adds a new child widget.
     *
     * The supported keys of the layout options map depend on the layout manager
     * used to position the widget. The options are documented in the class
     * documentation of each layout manager {@link qx.ui.layout}.
     *
     * @param child {LayoutItem} the item to add.
     * @param options {Map?null} Optional layout data for item.
     * @return {Widget} This object (for chaining support)
     */
    add : function(child, options) {
      return this.__forward("add", child, options);
    },


    /**
     * Remove the given child item.
     *
     * @param child {LayoutItem} the item to remove
     * @return {Widget} This object (for chaining support)
     */
    remove : function(child) {
      return this.__forward("remove", child);
    },


    /**
     * Remove all children.
     * @return {Array} An array containing the removed children.
     */
    removeAll : function() {
      return this.__forward("removeAll");
    },


    /**
     * Returns the index position of the given item if it is
     * a child item. Otherwise it returns <code>-1</code>.
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} the item to query for
     * @return {Integer} The index position or <code>-1</code> when
     *   the given item is no child of this layout.
     */
    indexOf : function(child) {
      return this.__forward("indexOf", child);
    },


    /**
     * Add a child at the specified index
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param index {Integer} Index, at which the item will be inserted
     * @param options {Map?null} Optional layout data for item.
     */
    addAt : function(child, index, options) {
      this.__forward("addAt", child, index, options);
    },


    /**
     * Add an item before another already inserted item
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param before {LayoutItem} item before the new item will be inserted.
     * @param options {Map?null} Optional layout data for item.
     */
    addBefore : function(child, before, options) {
      this.__forward("addBefore", child, before, options);
    },


    /**
     * Add an item after another already inserted item
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param after {LayoutItem} item, after which the new item will be inserted
     * @param options {Map?null} Optional layout data for item.
     */
    addAfter : function(child, after, options) {
      this.__forward("addAfter", child, after, options);
    },


    /**
     * Remove the item at the specified index.
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param index {Integer} Index of the item to remove.
     * @return {qx.ui.core.LayoutItem} The removed item
     */
    removeAt : function(index) {
      return this.__forward("removeAt", index);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin redirects the layout manager to a child widget of the
 * including class. This is e.g. used in {@link qx.ui.window.Window} to configure
 * the layout manager of the window pane instead of the window directly.
 *
 * The including class must implement the method <code>getChildrenContainer</code>,
 * which has to return the widget, to which the layout should be set.
 */

qx.Mixin.define("qx.ui.core.MRemoteLayoutHandling",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set a layout manager for the widget. A a layout manager can only be connected
     * with one widget. Reset the connection with a previous widget first, if you
     * like to use it in another widget instead.
     *
     * @param layout {qx.ui.layout.Abstract} The new layout or
     *     <code>null</code> to reset the layout.
     */
    setLayout : function(layout) {
      this.getChildrenContainer().setLayout(layout);
    },


    /**
     * Get the widget's layout manager.
     *
     * @return {qx.ui.layout.Abstract} The widget's layout manager
     */
    getLayout : function() {
      return this.getChildrenContainer().getLayout();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Required interface for all window manager.
 *
 * Window manager handle the z-order and modality blocking of windows managed
 * by the connected desktop {@link IDesktop}.
 */
qx.Interface.define("qx.ui.window.IWindowManager",
{
  members :
  {
    /**
     * Connect the window manager to the window desktop
     *
     * @param desktop {IDesktop} The connected desktop
     */
    setDesktop : function(desktop) {
      this.assertInterface(desktop, qx.ui.window.IDesktop);
    },

    /**
     * Inform the window manager about a new active window
     *
     * @param active {Window} new active window
     * @param oldActive {Window} old active window
     */
    changeActiveWindow : function(active, oldActive) {},

    /**
     * Update the window order and modality blocker
     */
    updateStack : function() {},

    /**
     * Ask the manager to bring a window to the front.
     *
     * @param win {Window} window to bring to front
     */
    bringToFront : function(win) {
      this.assertInstance(win, qx.ui.window.Window);
    },

    /**
     * Ask the manager to send a window to the back.
     *
     * @param win {Window} window to sent to back
     */
    sendToBack : function(win) {
      this.assertInstance(win, qx.ui.window.Window);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * All parent widgets of windows must implement this interface.
 */
qx.Interface.define("qx.ui.window.IDesktop",
{
  members :
  {
    /**
     * Sets the desktop's window manager
     *
     * @param manager {qx.ui.window.IWindowManager} The window manager
     */
    setWindowManager : function(manager) {
      this.assertInterface(manager, qx.ui.window.IWindowManager);
    },

    /**
     * Get a list of all windows added to the desktop (including hidden windows)
     *
     * @return {qx.ui.window.Window[]} Array of managed windows
     */
    getWindows : function() {},

    /**
     * Whether the configured layout supports a maximized window
     * e.g. is a Canvas.
     *
     * @return {Boolean} Whether the layout supports maximized windows
     */
    supportsMaximize : function() {},

    /**
     * Block direct child widgets with a zIndex below <code>zIndex</code>
     *
     * @param zIndex {Integer} All child widgets with a zIndex below this value
     *     will be blocked
     */
    blockContent : function(zIndex) {
      this.assertInteger(zIndex);
    },

    /**
     * Remove the blocker.
     */
    unblock : function() {},

    /**
     * Whether the widget is currently blocked
     *
     * @return {Boolean} whether the widget is blocked.
     */
    isBlocked : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The default window manager implementation
 */
qx.Class.define("qx.ui.window.Manager",
{
  extend : qx.core.Object,
  implement : qx.ui.window.IWindowManager,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __desktop : null,


    // interface implementation
    setDesktop : function(desktop)
    {
      this.__desktop = desktop;
      this.updateStack();
    },


    /**
     * Returns the connected desktop
     *
     * @return {qx.ui.window.IDesktop} The desktop
     */
    getDesktop : function() {
      return this.__desktop;
    },


    // interface implementation
    changeActiveWindow : function(active, oldActive) {
      if (active) {
        this.bringToFront(active);
        active.setActive(true);
      }
      if (oldActive) {
        oldActive.resetActive();
      }
    },


    /** @type {Integer} Minimum zIndex to start with for windows */
    _minZIndex : 1e5,


    // interface implementation
    updateStack : function()
    {
      // we use the widget queue to do the sorting one before the queues are
      // flushed. The queue will call "syncWidget"
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * This method is called during the flush of the
     * {@link qx.ui.core.queue.Widget widget queue}.
     */
    syncWidget : function()
    {
      this.__desktop.forceUnblock();

      var windows = this.__desktop.getWindows();
      // z-index for all three window kinds
      var zIndex = this._minZIndex;
      var zIndexOnTop = zIndex + windows.length * 2;
      var zIndexModal = zIndex + windows.length * 4;
      // marker if there is an active window
      var active = null;

      for (var i = 0, l = windows.length; i < l; i++)
      {
        var win = windows[i];
        // ignore invisible windows
        if (!win.isVisible()) {
          continue;
        }
        // take the first window as active window
        active = active || win;

        // We use only every second z index to easily insert a blocker between
        // two windows
        // Modal Windows stays on top of AlwaysOnTop Windows, which stays on
        // top of Normal Windows.
        if (win.isModal()) {
          win.setZIndex(zIndexModal);
          this.__desktop.blockContent(zIndexModal - 1);
          zIndexModal +=2;
          //just activate it if it's modal
          active = win;

        } else if (win.isAlwaysOnTop()) {
          win.setZIndex(zIndexOnTop);
          zIndexOnTop +=2;

        } else {
          win.setZIndex(zIndex);
          zIndex +=2;
        }

        // store the active window
        if (!active.isModal() &&
            win.isActive() ||
            win.getZIndex() > active.getZIndex()) {
          active = win;
        }
      }

      //set active window or null otherwise
      this.__desktop.setActiveWindow(active);
    },


    // interface implementation
    bringToFront : function(win)
    {
      var windows = this.__desktop.getWindows();

      var removed = qx.lang.Array.remove(windows, win);
      if (removed)
      {
        windows.push(win);
        this.updateStack();
      }
    },


    // interface implementation
    sendToBack : function(win)
    {
      var windows = this.__desktop.getWindows();

      var removed = qx.lang.Array.remove(windows, win);
      if (removed)
      {
        windows.unshift(win);
        this.updateStack();
      }
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeObjects("__desktop");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Provides move behavior to any widget.
 *
 * The widget using the mixin must register a widget as move handle so that
 * the pointer events needed for moving it are attached to this widget).
 * <pre class='javascript'>this._activateMoveHandle(widget);</pre>
 */
qx.Mixin.define("qx.ui.core.MMovable",
{
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Whether the widget is movable */
    movable :
    {
      check : "Boolean",
      init : true
    },

    /** Whether to use a frame instead of the original widget during move sequences */
    useMoveFrame :
    {
      check : "Boolean",
      init : false
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __moveHandle : null,
    __moveFrame : null,
    __dragRange : null,
    __dragLeft : null,
    __dragTop : null,
    __parentLeft : null,
    __parentTop : null,

    __blockerAdded : false,
    __oldBlockerColor : null,
    __oldBlockerOpacity : 0,

    /*
    ---------------------------------------------------------------------------
      CORE FEATURES
    ---------------------------------------------------------------------------
    */

    /**
     * Configures the given widget as a move handle
     *
     * @param widget {qx.ui.core.Widget} Widget to activate as move handle
     */
    _activateMoveHandle : function(widget)
    {
      if (this.__moveHandle) {
        throw new Error("The move handle could not be redefined!");
      }

      this.__moveHandle = widget;
      widget.addListener("pointerdown", this._onMovePointerDown, this);
      widget.addListener("pointerup", this._onMovePointerUp, this);
      widget.addListener("pointermove", this._onMovePointerMove, this);
      widget.addListener("losecapture", this.__onMoveLoseCapture, this);
    },


    /**
     * Get the widget, which draws the resize/move frame.
     *
     * @return {qx.ui.core.Widget} The resize frame
     */
    __getMoveFrame : function()
    {
      var frame = this.__moveFrame;
      if (!frame)
      {
        frame = this.__moveFrame = new qx.ui.core.Widget();
        frame.setAppearance("move-frame");
        frame.exclude();

        qx.core.Init.getApplication().getRoot().add(frame);
      }

      return frame;
    },


    /**
     * Creates, shows and syncs the frame with the widget.
     */
    __showMoveFrame : function()
    {
      var location = this.getContentLocation();
      var bounds = this.getBounds();
      var frame = this.__getMoveFrame();
      frame.setUserBounds(location.left, location.top, bounds.width, bounds.height);
      frame.show();
      frame.setZIndex(this.getZIndex()+1);
    },




    /*
    ---------------------------------------------------------------------------
      MOVE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Computes the new drag coordinates
     *
     * @param e {qx.event.type.Pointer} Pointer event
     * @return {Map} A map with the computed drag coordinates
     */
    __computeMoveCoordinates : function(e)
    {
      var range = this.__dragRange;
      var pointerLeft = Math.max(range.left, Math.min(range.right, e.getDocumentLeft()));
      var pointerTop = Math.max(range.top, Math.min(range.bottom, e.getDocumentTop()));

      var viewportLeft = this.__dragLeft + pointerLeft;
      var viewportTop = this.__dragTop + pointerTop;

      return {
        viewportLeft : parseInt(viewportLeft, 10),
        viewportTop : parseInt(viewportTop, 10),

        parentLeft : parseInt(viewportLeft - this.__parentLeft, 10),
        parentTop : parseInt(viewportTop - this.__parentTop, 10)
      };
    },




    /*
    ---------------------------------------------------------------------------
      MOVE EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Roll handler which prevents the scrolling via tap & move on parent widgets
     * during the move of the widget.
     * @param e {qx.event.type.Roll} The roll event
     */
    _onMoveRoll : function(e) {
      e.stop();
    },


    /**
     * Enables the capturing of the caption bar and prepares the drag session and the
     * appearance (translucent, frame or opaque) for the moving of the window.
     *
     * @param e {qx.event.type.Pointer} pointer down event
     */
    _onMovePointerDown : function(e)
    {
      if (!this.getMovable() || this.hasState("maximized")) {
        return;
      }

      this.addListener("roll", this._onMoveRoll, this);

      // Compute drag range
      var parent = this.getLayoutParent();
      var parentLocation = parent.getContentLocation();
      var parentBounds = parent.getBounds();

      // Added a blocker, this solves the issue described in [BUG #1462]
      if (qx.Class.implementsInterface(parent, qx.ui.window.IDesktop)) {
        if (!parent.isBlocked()) {
          this.__oldBlockerColor = parent.getBlockerColor();
          this.__oldBlockerOpacity = parent.getBlockerOpacity();
          parent.setBlockerColor(null);
          parent.setBlockerOpacity(1);

          parent.blockContent(this.getZIndex() - 1);

          this.__blockerAdded = true;
        }
      }

      this.__dragRange =
      {
        left : parentLocation.left,
        top : parentLocation.top,
        right : parentLocation.left + parentBounds.width,
        bottom : parentLocation.top + parentBounds.height
      };

      // Compute drag positions
      var widgetLocation = this.getContentLocation();
      this.__parentLeft = parentLocation.left;
      this.__parentTop = parentLocation.top;

      this.__dragLeft = widgetLocation.left - e.getDocumentLeft();
      this.__dragTop = widgetLocation.top - e.getDocumentTop();

      // Add state
      this.addState("move");

      // Enable capturing
      this.__moveHandle.capture();

      // Enable drag frame
      if (this.getUseMoveFrame()) {
        this.__showMoveFrame();
      }

      // Stop event
      e.stop();
    },


    /**
     * Does the moving of the window by rendering the position
     * of the window (or frame) at runtime using direct dom methods.
     *
     * @param e {qx.event.type.Pointer} pointer move event
     */
    _onMovePointerMove : function(e)
    {
      // Only react when dragging is active
      if (!this.hasState("move")) {
        return;
      }

      // Apply new coordinates using DOM
      var coords = this.__computeMoveCoordinates(e);
      if (this.getUseMoveFrame()) {
        this.__getMoveFrame().setDomPosition(coords.viewportLeft, coords.viewportTop);
      } else {
        var insets = this.getLayoutParent().getInsets();
        this.setDomPosition(coords.parentLeft - (insets.left || 0),
          coords.parentTop - (insets.top || 0));
      }

      e.stopPropagation();
    },


    /**
     * Disables the capturing of the caption bar and moves the window
     * to the last position of the drag session. Also restores the appearance
     * of the window.
     *
     * @param e {qx.event.type.Pointer} pointer up event
     */
    _onMovePointerUp : function(e)
    {
      if (this.hasListener("roll", this._onMoveRoll, this)) {
        this.removeListener("roll", this._onMoveRoll, this);
      }

      // Only react when dragging is active
      if (!this.hasState("move")) {
        return;
      }

      // Remove drag state
      this.removeState("move");

      // Removed blocker, this solves the issue described in [BUG #1462]
      var parent = this.getLayoutParent();
      if (qx.Class.implementsInterface(parent, qx.ui.window.IDesktop)) {
        if (this.__blockerAdded) {
          parent.unblock();

          parent.setBlockerColor(this.__oldBlockerColor);
          parent.setBlockerOpacity(this.__oldBlockerOpacity);
          this.__oldBlockerColor = null;
          this.__oldBlockerOpacity = 0;

          this.__blockerAdded = false;
        }
      }

      // Disable capturing
      this.__moveHandle.releaseCapture();

      // Apply them to the layout
      var coords = this.__computeMoveCoordinates(e);
      var insets = this.getLayoutParent().getInsets();
      this.setLayoutProperties({
        left: coords.parentLeft - (insets.left || 0),
        top: coords.parentTop - (insets.top || 0)
      });

      // Hide frame afterwards
      if (this.getUseMoveFrame()) {
        this.__getMoveFrame().exclude();
      }

      e.stopPropagation();
    },


    /**
     * Event listener for <code>losecapture</code> event.
     *
     * @param e {qx.event.type.Event} Lose capture event
     */
    __onMoveLoseCapture : function(e)
    {
      // Check for active move
      if (!this.hasState("move")) {
        return;
      }

      // Remove drag state
      this.removeState("move");

      // Hide frame afterwards
      if (this.getUseMoveFrame()) {
        this.__getMoveFrame().exclude();
      }
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeObjects("__moveFrame", "__moveHandle");
    this.__dragRange = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin defines the <code>contentPadding</code> property, which is used
 * by widgets like the window or group box, which must have a property, which
 * defines the padding of an inner pane.
 *
 * The including class must implement the method
 * <code>_getContentPaddingTarget</code>, which must return the widget on which
 * the padding should be applied.
 */
qx.Mixin.define("qx.ui.core.MContentPadding",
{
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Top padding of the content pane */
    contentPaddingTop :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Right padding of the content pane */
    contentPaddingRight :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Bottom padding of the content pane */
    contentPaddingBottom :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Left padding of the content pane */
    contentPaddingLeft :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /**
     * The 'contentPadding' property is a shorthand property for setting 'contentPaddingTop',
     * 'contentPaddingRight', 'contentPaddingBottom' and 'contentPaddingLeft'
     * at the same time.
     *
     * If four values are specified they apply to top, right, bottom and left respectively.
     * If there is only one value, it applies to all sides, if there are two or three,
     * the missing values are taken from the opposite side.
     */
    contentPadding :
    {
      group : [
        "contentPaddingTop", "contentPaddingRight",
        "contentPaddingBottom", "contentPaddingLeft"
      ],
      mode  : "shorthand",
      themeable : true
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * @type {Map} Maps property names of content padding to the setter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingSetter)
     */
    __contentPaddingSetter :
    {
      contentPaddingTop : "setPaddingTop",
      contentPaddingRight : "setPaddingRight",
      contentPaddingBottom : "setPaddingBottom",
      contentPaddingLeft : "setPaddingLeft"
    },


    /**
     * @type {Map} Maps property names of content padding to the themed setter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingThemedSetter)
     */
    __contentPaddingThemedSetter :
    {
      contentPaddingTop : "setThemedPaddingTop",
      contentPaddingRight : "setThemedPaddingRight",
      contentPaddingBottom : "setThemedPaddingBottom",
      contentPaddingLeft : "setThemedPaddingLeft"
    },


    /**
     * @type {Map} Maps property names of content padding to the resetter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingResetter)
     */
    __contentPaddingResetter :
    {
      contentPaddingTop : "resetPaddingTop",
      contentPaddingRight : "resetPaddingRight",
      contentPaddingBottom : "resetPaddingBottom",
      contentPaddingLeft : "resetPaddingLeft"
    },


    // property apply
    _applyContentPadding : function(value, old, name, variant)
    {
      var target = this._getContentPaddingTarget();

      if (value == null)
      {
        var resetter = this.__contentPaddingResetter[name];
        target[resetter]();
      }
      else
      {
        // forward the themed sates if case the apply was invoked by a theme
        if (variant == "setThemed" || variant == "resetThemed") {
          var setter = this.__contentPaddingThemedSetter[name];
          target[setter](value);
        } else {
          var setter = this.__contentPaddingSetter[name];
          target[setter](value);
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007 David Pérez Carmona
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * David Perez Carmona (david-perez)
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Provides resizing behavior to any widget.
 */
qx.Mixin.define("qx.ui.core.MResizable",
{
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    // Register listeners to the content
    var content = this.getContentElement();
    content.addListener("pointerdown", this.__onResizePointerDown, this, true);
    content.addListener("pointerup", this.__onResizePointerUp, this);
    content.addListener("pointermove", this.__onResizePointerMove, this);
    content.addListener("pointerout", this.__onResizePointerOut, this);
    content.addListener("losecapture", this.__onResizeLoseCapture, this);

    // Get a reference of the drag and drop handler
    var domElement = content.getDomElement();
    if (domElement == null) {
      domElement = window;
    }

    this.__dragDropHandler = qx.event.Registration.getManager(domElement).getHandler(qx.event.handler.DragDrop);
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Whether the top edge is resizable */
    resizableTop :
    {
      check : "Boolean",
      init : true
    },

    /** Whether the right edge is resizable */
    resizableRight :
    {
      check : "Boolean",
      init : true
    },

    /** Whether the bottom edge is resizable */
    resizableBottom :
    {
      check : "Boolean",
      init : true
    },

    /** Whether the left edge is resizable */
    resizableLeft :
    {
      check : "Boolean",
      init : true
    },

    /**
     * Property group to configure the resize behaviour for all edges at once
     */
    resizable :
    {
      group : [ "resizableTop", "resizableRight", "resizableBottom", "resizableLeft" ],
      mode  : "shorthand"
    },

    /** The tolerance to activate resizing */
    resizeSensitivity :
    {
      check : "Integer",
      init : 5
    },

    /** Whether a frame replacement should be used during the resize sequence */
    useResizeFrame :
    {
      check : "Boolean",
      init : true
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __dragDropHandler : null,
    __resizeFrame : null,
    __resizeActive : null,
    __resizeLeft : null,
    __resizeTop : null,
    __resizeStart : null,
    __resizeRange : null,


    RESIZE_TOP : 1,
    RESIZE_BOTTOM : 2,
    RESIZE_LEFT : 4,
    RESIZE_RIGHT : 8,


    /*
    ---------------------------------------------------------------------------
      CORE FEATURES
    ---------------------------------------------------------------------------
    */

    /**
     * Get the widget, which draws the resize/move frame. The resize frame is
     * shared by all widgets and is added to the root widget.
     *
     * @return {qx.ui.core.Widget} The resize frame
     */
    _getResizeFrame : function()
    {
      var frame = this.__resizeFrame;
      if (!frame)
      {
        frame = this.__resizeFrame = new qx.ui.core.Widget();
        frame.setAppearance("resize-frame");
        frame.exclude();

        qx.core.Init.getApplication().getRoot().add(frame);
      }

      return frame;
    },


    /**
     * Creates, shows and syncs the frame with the widget.
     */
    __showResizeFrame : function()
    {
      var location = this.getContentLocation();
      var frame = this._getResizeFrame();
      frame.setUserBounds(
        location.left,
        location.top,
        location.right - location.left,
        location.bottom - location.top
      );
      frame.show();
      frame.setZIndex(this.getZIndex()+1);
    },




    /*
    ---------------------------------------------------------------------------
      RESIZE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Computes the new boundaries at each interval
     * of the resize sequence.
     *
     * @param e {qx.event.type.Pointer} Last pointer event
     * @return {Map} A map with the computed boundaries
     */
    __computeResizeResult : function(e)
    {
      // Detect mode
      var resizeActive = this.__resizeActive;

      // Read size hint
      var hint = this.getSizeHint();
      var range = this.__resizeRange;

      // Read original values
      var start = this.__resizeStart;
      var width = start.width;
      var height = start.height;
      var left = start.left;
      var top = start.top;
      var diff;

      if (
        (resizeActive & this.RESIZE_TOP) ||
        (resizeActive & this.RESIZE_BOTTOM)
      )
      {
        diff = Math.max(range.top, Math.min(range.bottom, e.getDocumentTop())) - this.__resizeTop;

        if (resizeActive & this.RESIZE_TOP) {
          height -= diff;
        } else {
          height += diff;
        }

        if (height < hint.minHeight) {
          height = hint.minHeight;
        } else if (height > hint.maxHeight) {
          height = hint.maxHeight;
        }

        if (resizeActive & this.RESIZE_TOP) {
          top += start.height - height;
        }
      }

      if (
        (resizeActive & this.RESIZE_LEFT) ||
        (resizeActive & this.RESIZE_RIGHT)
      )
      {
        diff = Math.max(range.left, Math.min(range.right, e.getDocumentLeft())) - this.__resizeLeft;

        if (resizeActive & this.RESIZE_LEFT) {
          width -= diff;
        } else {
          width += diff;
        }

        if (width < hint.minWidth) {
          width = hint.minWidth;
        } else if (width > hint.maxWidth) {
          width = hint.maxWidth;
        }

        if (resizeActive & this.RESIZE_LEFT) {
          left += start.width - width;
        }
      }

      return {
        // left and top of the visible widget
        viewportLeft : left,
        viewportTop : top,

        parentLeft : start.bounds.left + left - start.left,
        parentTop : start.bounds.top + top - start.top,

        // dimensions of the visible widget
        width : width,
        height : height
      };
    },


    /**
     * @type {Map} Maps internal states to cursor symbols to use
     *
     * @lint ignoreReferenceField(__resizeCursors)
     */
    __resizeCursors :
    {
      1  : "n-resize",
      2  : "s-resize",
      4  : "w-resize",
      8  : "e-resize",

      5  : "nw-resize",
      6  : "sw-resize",
      9  : "ne-resize",
      10 : "se-resize"
    },


    /**
     * Updates the internally stored resize mode
     *
     * @param e {qx.event.type.Pointer} Last pointer event
     */
    __computeResizeMode : function(e)
    {
      var location = this.getContentLocation();
      var pointerTolerance = this.getResizeSensitivity();

      var pointerLeft = e.getDocumentLeft();
      var pointerTop = e.getDocumentTop();

      var resizeActive = this.__computeResizeActive(
        location, pointerLeft, pointerTop, pointerTolerance
      );

      // check again in case we have a corner [BUG #1200]
      if (resizeActive > 0) {
        // this is really a | (or)!
        resizeActive = resizeActive | this.__computeResizeActive(
          location, pointerLeft, pointerTop, pointerTolerance * 2
        );
      }

      this.__resizeActive = resizeActive;
    },


    /**
     * Internal helper for computing the proper resize action based on the
     * given parameters.
     *
     * @param location {Map} The current location of the widget.
     * @param pointerLeft {Integer} The left position of the pointer.
     * @param pointerTop {Integer} The top position of the pointer.
     * @param pointerTolerance {Integer} The desired distance to the edge.
     * @return {Integer} The resize active number.
     */
    __computeResizeActive : function(location, pointerLeft, pointerTop, pointerTolerance) {
      var resizeActive = 0;

      // TOP
      if (
        this.getResizableTop() &&
        Math.abs(location.top - pointerTop) < pointerTolerance &&
        pointerLeft > location.left - pointerTolerance &&
        pointerLeft < location.right + pointerTolerance
      ) {
        resizeActive += this.RESIZE_TOP;

      // BOTTOM
      } else if (
        this.getResizableBottom() &&
        Math.abs(location.bottom - pointerTop) < pointerTolerance &&
        pointerLeft > location.left - pointerTolerance &&
        pointerLeft < location.right + pointerTolerance
      ) {
        resizeActive += this.RESIZE_BOTTOM;
      }

      // LEFT
      if (
        this.getResizableLeft() &&
        Math.abs(location.left - pointerLeft) < pointerTolerance &&
        pointerTop > location.top - pointerTolerance &&
        pointerTop < location.bottom + pointerTolerance
      ) {
        resizeActive += this.RESIZE_LEFT;

      // RIGHT
      } else if (
        this.getResizableRight() &&
        Math.abs(location.right - pointerLeft) < pointerTolerance &&
        pointerTop > location.top - pointerTolerance &&
        pointerTop < location.bottom + pointerTolerance
      ) {
        resizeActive += this.RESIZE_RIGHT;
      }
      return resizeActive;
    },


    /*
    ---------------------------------------------------------------------------
      RESIZE EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for the pointer down event
     *
     * @param e {qx.event.type.Pointer} The pointer event instance
     */
    __onResizePointerDown : function(e)
    {
      // Check for active resize
      if (!this.__resizeActive || !this.getEnabled() || e.getPointerType() == "touch") {
        return;
      }

      // Add resize state
      this.addState("resize");

      // Store pointer coordinates
      this.__resizeLeft = e.getDocumentLeft();
      this.__resizeTop = e.getDocumentTop();

      // Cache bounds
      var location = this.getContentLocation();
      var bounds   = this.getBounds();

      this.__resizeStart = {
        top : location.top,
        left : location.left,
        width : location.right - location.left,
        height : location.bottom - location.top,
        bounds : qx.lang.Object.clone(bounds)
      };

      // Compute range
      var parent = this.getLayoutParent();
      var parentLocation = parent.getContentLocation();
      var parentBounds = parent.getBounds();

      this.__resizeRange = {
        left : parentLocation.left,
        top : parentLocation.top,
        right : parentLocation.left + parentBounds.width,
        bottom : parentLocation.top + parentBounds.height
      };

      // Show frame if configured this way
      if (this.getUseResizeFrame()) {
        this.__showResizeFrame();
      }

      // Enable capturing
      this.capture();

      // Stop event
      e.stop();
    },


    /**
     * Event handler for the pointer up event
     *
     * @param e {qx.event.type.Pointer} The pointer event instance
     */
    __onResizePointerUp : function(e)
    {
      // Check for active resize
      if (!this.hasState("resize") || !this.getEnabled() || e.getPointerType() == "touch") {
        return;
      }

      // Hide frame afterwards
      if (this.getUseResizeFrame()) {
        this._getResizeFrame().exclude();
      }

      // Compute bounds
      var bounds = this.__computeResizeResult(e);

      // Sync with widget
      this.setWidth(bounds.width);
      this.setHeight(bounds.height);

      // Update coordinate in canvas
      if (this.getResizableLeft() || this.getResizableTop())
      {
        this.setLayoutProperties({
          left : bounds.parentLeft,
          top : bounds.parentTop
        });
      }

      // Clear mode
      this.__resizeActive = 0;

      // Remove resize state
      this.removeState("resize");

      // Reset cursor
      this.resetCursor();
      this.getApplicationRoot().resetGlobalCursor();

      // Disable capturing
      this.releaseCapture();

      e.stopPropagation();
    },


    /**
     * Event listener for <code>losecapture</code> event.
     *
     * @param e {qx.event.type.Event} Lose capture event
     */
    __onResizeLoseCapture : function(e)
    {
      // Check for active resize
      if (!this.__resizeActive) {
        return;
      }

      // Reset cursor
      this.resetCursor();
      this.getApplicationRoot().resetGlobalCursor();

      // Remove drag state
      this.removeState("move");

      // Hide frame afterwards
      if (this.getUseResizeFrame()) {
        this._getResizeFrame().exclude();
      }
    },


    /**
     * Event handler for the pointer move event
     *
     * @param e {qx.event.type.Pointer} The pointer event instance
     */
    __onResizePointerMove : function(e)
    {
      if (!this.getEnabled() || e.getPointerType() == "touch") {
        return;
      }

      if (this.hasState("resize"))
      {
        var bounds = this.__computeResizeResult(e);

        // Update widget
        if (this.getUseResizeFrame())
        {
          // Sync new bounds to frame
          var frame = this._getResizeFrame();
          frame.setUserBounds(bounds.viewportLeft, bounds.viewportTop, bounds.width, bounds.height);
        }
        else
        {
          // Update size
          this.setWidth(bounds.width);
          this.setHeight(bounds.height);

          // Update coordinate in canvas
          if (this.getResizableLeft() || this.getResizableTop())
          {
            this.setLayoutProperties({
              left : bounds.parentLeft,
              top : bounds.parentTop
            });
          }
        }

        // Full stop for event
        e.stopPropagation();
      }
      else if (!this.hasState("maximized") && !this.__dragDropHandler.isSessionActive())
      {
        this.__computeResizeMode(e);

        var resizeActive = this.__resizeActive;
        var root = this.getApplicationRoot();

        if (resizeActive)
        {
          var cursor = this.__resizeCursors[resizeActive];
          this.setCursor(cursor);
          root.setGlobalCursor(cursor);
        }
        else if (this.getCursor())
        {
          this.resetCursor();
          root.resetGlobalCursor();
        }
      }
    },


    /**
     * Event handler for the pointer out event
     *
     * @param e {qx.event.type.Pointer} The pointer event instance
     */
    __onResizePointerOut : function(e)
    {
      if (e.getPointerType() == "touch") {
        return;
      }
      // When the pointer left the window and resizing is not yet
      // active we must be sure to (especially) reset the global
      // cursor.
      if (this.getCursor() && !this.hasState("resize"))
      {
        this.resetCursor();
        this.getApplicationRoot().resetGlobalCursor();
      }
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__resizeFrame != null && !qx.core.ObjectRegistry.inShutDown)
    {
      this.__resizeFrame.destroy();
      this.__resizeFrame = null;
    }

    this.__dragDropHandler = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * A window widget
 *
 * More information can be found in the package description {@link qx.ui.window}.
 *
 * @childControl statusbar {qx.ui.container.Composite} statusbar container which shows the statusbar text
 * @childControl statusbar-text {qx.ui.basic.Label} text of the statusbar
 * @childControl pane {qx.ui.container.Composite} window pane which holds the content
 * @childControl captionbar {qx.ui.container.Composite} Container for all widgets inside the captionbar
 * @childControl icon {qx.ui.basic.Image} icon at the left of the captionbar
 * @childControl title {qx.ui.basic.Label} caption of the window
 * @childControl minimize-button {qx.ui.form.Button} button to minimize the window
 * @childControl restore-button {qx.ui.form.Button} button to restore the window
 * @childControl maximize-button {qx.ui.form.Button} button to maximize the window
 * @childControl close-button {qx.ui.form.Button} button to close the window
 */
qx.Class.define("qx.ui.window.Window",
{
  extend : qx.ui.core.Widget,

  include :
  [
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.core.MRemoteLayoutHandling,
    qx.ui.core.MResizable,
    qx.ui.core.MMovable,
    qx.ui.core.MContentPadding
  ],





  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param caption {String} The caption text
   * @param icon {String} The URL of the caption bar icon
   */
  construct : function(caption, icon)
  {
    this.base(arguments);

    // configure internal layout
    this._setLayout(new qx.ui.layout.VBox());

    // force creation of captionbar
    this._createChildControl("captionbar");
    this._createChildControl("pane");

    // apply constructor parameters
    if (icon != null) {
      this.setIcon(icon);
    }

    if (caption != null) {
      this.setCaption(caption);
    }

    // Update captionbar
    this._updateCaptionBar();

    // Activation listener
    this.addListener("pointerdown", this._onWindowPointerDown, this, true);

    // Focusout listener
    this.addListener("focusout", this._onWindowFocusOut, this);

    // Automatically add to application root.
    qx.core.Init.getApplication().getRoot().add(this);

    // Initialize visibiltiy
    this.initVisibility();

    // Register as root for the focus handler
    qx.ui.core.FocusHandler.getInstance().addRoot(this);

    // change the reszie frames appearance
    this._getResizeFrame().setAppearance("window-resize-frame");
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Class} The default window manager class. */
    DEFAULT_MANAGER_CLASS : qx.ui.window.Manager
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired before the window is closed.
     *
     * The close action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeClose" : "qx.event.type.Event",

    /** Fired if the window is closed */
    "close" : "qx.event.type.Event",

    /**
     * Fired before the window is minimize.
     *
     * The minimize action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeMinimize" : "qx.event.type.Event",

    /** Fired if the window is minimized */
    "minimize" : "qx.event.type.Event",

    /**
     * Fired before the window is maximize.
     *
     * The maximize action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeMaximize" : "qx.event.type.Event",

    /** Fired if the window is maximized */
    "maximize" : "qx.event.type.Event",

    /**
     * Fired before the window is restored from a minimized or maximized state.
     *
     * The restored action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeRestore" : "qx.event.type.Event",

    /** Fired if the window is restored from a minimized or maximized state */
    "restore" : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      INTERNAL OPTIONS
    ---------------------------------------------------------------------------
    */

    // overridden
    appearance :
    {
      refine : true,
      init : "window"
    },


    // overridden
    visibility :
    {
      refine : true,
      init : "excluded"
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },


    /**
     * If the window is active, only one window in a single qx.ui.window.Manager could
     *  have set this to true at the same time.
     */
    active :
    {
      check : "Boolean",
      init : false,
      apply : "_applyActive",
      event : "changeActive"
    },



    /*
    ---------------------------------------------------------------------------
      BASIC OPTIONS
    ---------------------------------------------------------------------------
    */

    /** Should the window be always on top */
    alwaysOnTop :
    {
      check : "Boolean",
      init : false,
      event : "changeAlwaysOnTop"
    },

    /** Should the window be modal (this disables minimize and maximize buttons) */
    modal :
    {
      check : "Boolean",
      init : false,
      event : "changeModal",
      apply : "_applyModal"
    },


    /** The text of the caption */
    caption :
    {
      apply : "_applyCaptionBarChange",
      event : "changeCaption",
      nullable : true
    },


    /** The icon of the caption */
    icon :
    {
      check : "String",
      nullable : true,
      apply : "_applyCaptionBarChange",
      event : "changeIcon",
      themeable : true
    },


    /** The text of the statusbar */
    status :
    {
      check : "String",
      nullable : true,
      apply : "_applyStatus",
      event :"changeStatus"
    },




    /*
    ---------------------------------------------------------------------------
      HIDE CAPTIONBAR FEATURES
    ---------------------------------------------------------------------------
    */

    /** Should the close button be shown */
    showClose :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },


    /** Should the maximize button be shown */
    showMaximize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },


    /** Should the minimize button be shown */
    showMinimize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },




    /*
    ---------------------------------------------------------------------------
      DISABLE CAPTIONBAR FEATURES
    ---------------------------------------------------------------------------
    */

    /** Should the user have the ability to close the window */
    allowClose :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },


    /** Should the user have the ability to maximize the window */
    allowMaximize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },


    /** Should the user have the ability to minimize the window */
    allowMinimize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },




    /*
    ---------------------------------------------------------------------------
      STATUSBAR CONFIG
    ---------------------------------------------------------------------------
    */

    /** Should the statusbar be shown */
    showStatusbar :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowStatusbar"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** @type {Integer} Original top value before maximation had occoured */
    __restoredTop : null,

    /** @type {Integer} Original left value before maximation had occoured */
    __restoredLeft : null,



    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    /**
     * The children container needed by the {@link qx.ui.core.MRemoteChildrenHandling}
     * mixin
     *
     * @return {qx.ui.container.Composite} pane sub widget
     */
    getChildrenContainer : function() {
      return this.getChildControl("pane");
    },


    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      active : true,
      maximized : true,
      showStatusbar : true,
      modal : true
    },


    // overridden
    setLayoutParent : function(parent)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        parent && this.assertInterface(
          parent, qx.ui.window.IDesktop,
          "Windows can only be added to widgets, which implement the interface "+
          "qx.ui.window.IDesktop. All root widgets implement this interface."
        );
      }
      this.base(arguments, parent);
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "statusbar":
          control = new qx.ui.container.Composite(new qx.ui.layout.HBox());
          this._add(control);
          control.add(this.getChildControl("statusbar-text"));
          break;

        case "statusbar-text":
          control = new qx.ui.basic.Label();
          control.setValue(this.getStatus());
          break;

        case "pane":
          control = new qx.ui.container.Composite();
          this._add(control, {flex: 1});
          break;

        case "captionbar":
          // captionbar
          var layout = new qx.ui.layout.Grid();
          layout.setRowFlex(0, 1);
          layout.setColumnFlex(1, 1);
          control = new qx.ui.container.Composite(layout);
          this._add(control);

          // captionbar events
          control.addListener("dbltap", this._onCaptionPointerDblTap, this);

          // register as move handle
          this._activateMoveHandle(control);
          break;

        case "icon":
          control = new qx.ui.basic.Image(this.getIcon());
          this.getChildControl("captionbar").add(control, {row: 0, column:0});
          break;

        case "title":
          control = new qx.ui.basic.Label(this.getCaption());
          control.setWidth(0);
          control.setAllowGrowX(true);

          var captionBar = this.getChildControl("captionbar");
          captionBar.add(control, {row: 0, column:1});
          break;

        case "minimize-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onMinimizeButtonTap, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:2});
          break;

        case "restore-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onRestoreButtonTap, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:3});
          break;

        case "maximize-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onMaximizeButtonTap, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:4});
          break;

        case "close-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onCloseButtonTap, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:6});
          break;
      }

      return control || this.base(arguments, id);
    },





    /*
    ---------------------------------------------------------------------------
      CAPTIONBAR INTERNALS
    ---------------------------------------------------------------------------
    */

    /**
     * Updates the status and the visibility of each element of the captionbar.
     */
    _updateCaptionBar : function()
    {
      var btn;

      var icon = this.getIcon();
      if (icon) {
        this.getChildControl("icon").setSource(icon);
        this._showChildControl("icon");
      } else {
        this._excludeChildControl("icon");
      }

      var caption = this.getCaption()
      if (caption) {
        this.getChildControl("title").setValue(caption);
        this._showChildControl("title");
      } else {
        this._excludeChildControl("title");
      }

      if (this.getShowMinimize())
      {
        this._showChildControl("minimize-button");

        btn = this.getChildControl("minimize-button");
        this.getAllowMinimize() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("minimize-button");
      }

      if (this.getShowMaximize())
      {
        if (this.isMaximized())
        {
          this._showChildControl("restore-button");
          this._excludeChildControl("maximize-button");
        }
        else
        {
          this._showChildControl("maximize-button");
          this._excludeChildControl("restore-button");
        }

        btn = this.getChildControl("maximize-button");
        this.getAllowMaximize() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("maximize-button");
        this._excludeChildControl("restore-button");
      }

      if (this.getShowClose())
      {
        this._showChildControl("close-button");

        btn = this.getChildControl("close-button");
        this.getAllowClose() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("close-button");
      }
    },





    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Closes the current window instance.
     * Technically calls the {@link qx.ui.core.Widget#hide} method.
     */
    close : function()
    {
      if (!this.isVisible()) {
        return;
      }

      if (this.fireNonBubblingEvent("beforeClose", qx.event.type.Event, [false, true]))
      {
        this.hide();
        this.fireEvent("close");
      }
    },


    /**
     * Opens the window.
     */
    open : function()
    {
      this.show();
      this.setActive(true);
      this.focus();
    },


    /**
     * Centers the window to the parent.
     *
     * This call works with the size of the parent widget and the size of
     * the window as calculated in the last layout flush. It is best to call
     * this method just after rendering the window in the "resize" event:
     * <pre class='javascript'>
     *   win.addListenerOnce("resize", this.center, this);
     * </pre>
     */
    center : function()
    {
      var parent = this.getLayoutParent();
      if (parent)
      {
        var bounds = parent.getBounds();
        if (bounds)
        {
          var hint = this.getSizeHint();

          var left = Math.round((bounds.width - hint.width) / 2);
          var top = Math.round((bounds.height - hint.height) / 2);

          if (top < 0) {
            top = 0;
          }

          this.moveTo(left, top);

          return;
        }
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        this.warn("Centering depends on parent bounds!");
      }
    },


    /**
     * Maximize the window.
     */
    maximize : function()
    {
      // If the window is already maximized -> return
      if (this.isMaximized()) {
        return;
      }

      // First check if the parent uses a canvas layout
      // Otherwise maximize() is not possible
      var parent = this.getLayoutParent();
      if (parent != null && parent.supportsMaximize())
      {
        if (this.fireNonBubblingEvent("beforeMaximize", qx.event.type.Event, [false, true]))
        {
          if (!this.isVisible()) {
            this.open();
          }

          // store current dimension and location
          var props = this.getLayoutProperties();
          this.__restoredLeft = props.left === undefined ? 0 : props.left;
          this.__restoredTop = props.top === undefined ? 0 : props.top;

          // Update layout properties
          this.setLayoutProperties({
            left: null,
            top: null,
            edge: 0
          });

          // Add state
          this.addState("maximized");

          // Update captionbar
          this._updateCaptionBar();

          // Fire user event
          this.fireEvent("maximize");
        }
      }
    },


    /**
     * Minimized the window.
     */
    minimize : function()
    {
      if (!this.isVisible()) {
        return;
      }

      if (this.fireNonBubblingEvent("beforeMinimize", qx.event.type.Event, [false, true]))
      {
        // store current dimension and location
        var props = this.getLayoutProperties();
        this.__restoredLeft = props.left === undefined ? 0 : props.left;
        this.__restoredTop = props.top === undefined ? 0 : props.top;

        this.removeState("maximized");
        this.hide();
        this.fireEvent("minimize");
      }
    },


    /**
     * Restore the window to <code>"normal"</code>, if it is
     * <code>"maximized"</code> or <code>"minimized"</code>.
     */
    restore : function()
    {
      if (this.getMode() === "normal") {
        return;
      }

      if (this.fireNonBubblingEvent("beforeRestore", qx.event.type.Event, [false, true]))
      {
        if (!this.isVisible()) {
          this.open();
        }

        // Restore old properties
        var left = this.__restoredLeft;
        var top = this.__restoredTop;

        this.setLayoutProperties({
          edge : null,
          left : left,
          top : top
        });

        // Remove maximized state
        this.removeState("maximized");

        // Update captionbar
        this._updateCaptionBar();

        // Fire user event
        this.fireEvent("restore");
      }
    },


    /**
     * Set the window's position relative to its parent
     *
     * @param left {Integer} The left position
     * @param top {Integer} The top position
     */
    moveTo : function(left, top)
    {
      if (this.isMaximized()) {
        return;
      }

      this.setLayoutProperties({
        left : left,
        top : top
      });
    },

    /**
     * Return <code>true</code> if the window is in maximized state,
     * but note that the window in maximized state could also be invisible, this
     * is equivalent to minimized. So use the {@link qx.ui.window.Window#getMode}
     * to get the window mode.
     *
     * @return {Boolean} <code>true</code> if the window is maximized,
     *   <code>false</code> otherwise.
     */
    isMaximized : function()
    {
      return this.hasState("maximized");
    },

    /**
     * Return the window mode as <code>String</code>:
     * <code>"maximized"</code>, <code>"normal"</code> or <code>"minimized"</code>.
     *
     * @return {String} The window mode as <code>String</code> value.
     */
    getMode : function()
    {
      if(!this.isVisible()) {
        return "minimized";
      } else {
        if(this.isMaximized()) {
          return "maximized";
        } else {
          return "normal";
        }
      }
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyActive : function(value, old)
    {
      if (old) {
        this.removeState("active");
      } else {
        this.addState("active");
      }
    },


    // property apply
    _applyModal : function(value, old)
    {
      if (old) {
        this.removeState("modal");
      } else {
        this.addState("modal");
      }
    },


    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("pane");
    },


    // property apply
    _applyShowStatusbar : function(value, old)
    {
      // store the state if the status bar is shown
      var resizeFrame = this._getResizeFrame();
      if (value) {
        this.addState("showStatusbar");
        resizeFrame.addState("showStatusbar");
      } else {
        this.removeState("showStatusbar");
        resizeFrame.removeState("showStatusbar");
      }

      if (value) {
        this._showChildControl("statusbar");
      } else {
        this._excludeChildControl("statusbar");
      }
    },


    // property apply
    _applyCaptionBarChange : function(value, old) {
      this._updateCaptionBar();
    },


    // property apply
    _applyStatus : function(value, old)
    {
      var label = this.getChildControl("statusbar-text", true);
      if (label) {
        label.setValue(value);
      }
    },


    // overridden
    _applyFocusable : function(value, old)
    {
      // Workaround for bug #7581: Don't set the tabIndex
      // to prevent native scrolling on focus in IE
      if (qx.core.Environment.get("engine.name") !== "mshtml") {
        this.base(arguments, value, old);
      }
    },


    /*
    ---------------------------------------------------------------------------
      BASIC EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Stops every event
     *
     * @param e {qx.event.type.Event} any event
     */
    _onWindowEventStop : function(e) {
      e.stopPropagation();
    },


    /**
     * Focuses the window instance.
     *
     * @param e {qx.event.type.Pointer} pointer down event
     */
    _onWindowPointerDown : function(e) {
      this.setActive(true);
    },


    /**
     * Listens to the "focusout" event to deactivate the window (if the
     * currently focused widget is not a child of the window)
     *
     * @param e {qx.event.type.Focus} focus event
     */
    _onWindowFocusOut : function(e) {
      // only needed for non-modal windows
      if (this.getModal())
      {
        return;
      }

      // get the current focused widget and check if it is a child
      var current = e.getRelatedTarget();
      if (current != null && !qx.ui.core.Widget.contains(this, current))
      {
        this.setActive(false);
      }
    },


    /**
     * Maximizes the window or restores it if it is already
     * maximized.
     *
     * @param e {qx.event.type.Pointer} double tap event
     */
    _onCaptionPointerDblTap : function(e)
    {
      if (this.getAllowMaximize()) {
        this.isMaximized() ? this.restore() : this.maximize();
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENTS FOR CAPTIONBAR BUTTONS
    ---------------------------------------------------------------------------
    */

    /**
     * Minimizes the window, removes all states from the minimize button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Pointer} pointer tap event
     */
    _onMinimizeButtonTap : function(e)
    {
      this.minimize();
      this.getChildControl("minimize-button").reset();
    },


    /**
     * Restores the window, removes all states from the restore button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Pointer} pointer pointer event
     */
    _onRestoreButtonTap : function(e)
    {
      this.restore();
      this.getChildControl("restore-button").reset();
    },


    /**
     * Maximizes the window, removes all states from the maximize button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Pointer} pointer pointer event
     */
    _onMaximizeButtonTap : function(e)
    {
      this.maximize();
      this.getChildControl("maximize-button").reset();
    },


    /**
     * Closes the window, removes all states from the close button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Pointer} pointer pointer event
     */
    _onCloseButtonTap : function(e)
    {
      this.close();
      this.getChildControl("close-button").reset();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A vertical box layout.
 *
 * The vertical box layout lays out widgets in a vertical column, from top
 * to bottom.
 *
 * *Features*
 *
 * * Minimum and maximum dimensions
 * * Prioritized growing/shrinking (flex)
 * * Margins (with vertical collapsing)
 * * Auto sizing (ignoring percent values)
 * * Percent heights (not relevant for size hint)
 * * Alignment (child property {@link qx.ui.core.LayoutItem#alignY} is ignored)
 * * Vertical spacing (collapsed with margins)
 * * Reversed children layout (from last to first)
 * * Horizontal children stretching (respecting size hints)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>flex</strong> <em>(Integer)</em>: The flexibility of a layout item determines how the container
 *   distributes remaining empty space among its children. If items are made
 *   flexible, they can grow or shrink accordingly. Their relative flex values
 *   determine how the items are being resized, i.e. the larger the flex ratio
 *   of two items, the larger the resizing of the first item compared to the
 *   second.
 *
 *   If there is only one flex item in a layout container, its actual flex
 *   value is not relevant. To disallow items to become flexible, set the
 *   flex value to zero.
 * </li>
 * <li><strong>height</strong> <em>(String)</em>: Allows to define a percent
 *   height for the item. The height in percent, if specified, is used instead
 *   of the height defined by the size hint. The minimum and maximum height still
 *   takes care of the element's limits. It has no influence on the layout's
 *   size hint. Percent values are mostly useful for widgets which are sized by
 *   the outer hierarchy.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the vertical box layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.VBox();
 * layout.setSpacing(4); // apply spacing
 *
 * var container = new qx.ui.container.Composite(layout);
 *
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * *External Documentation*
 *
 * See <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/box.html'>extended documentation</a>
 * and links to demos for this layout.
 *
 */
qx.Class.define("qx.ui.layout.VBox",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacing {Integer?0} The spacing between child widgets {@link #spacing}.
   * @param alignY {String?"top"} Vertical alignment of the whole children
   *     block {@link #alignY}.
   * @param separator {String|qx.ui.decoration.IDecorator} A separator to render between the items
   */
  construct : function(spacing, alignY, separator)
  {
    this.base(arguments);

    if (spacing) {
      this.setSpacing(spacing);
    }

    if (alignY) {
      this.setAlignY(alignY);
    }

    if (separator) {
      this.setSeparator(separator);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Vertical alignment of the whole children block. The vertical
     * alignment of the child is completely ignored in VBoxes (
     * {@link qx.ui.core.LayoutItem#alignY}).
     */
    alignY :
    {
      check : [ "top", "middle", "bottom" ],
      init : "top",
      apply : "_applyLayoutChange"
    },


    /**
     * Horizontal alignment of each child. Can be overridden through
     * {@link qx.ui.core.LayoutItem#alignX}.
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      init : "left",
      apply : "_applyLayoutChange"
    },


    /** Vertical spacing between two children */
    spacing :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /** Separator lines to use between the objects */
    separator :
    {
      check : "Decorator",
      nullable : true,
      apply : "_applyLayoutChange"
    },


    /** Whether the actual children list should be laid out in reversed order. */
    reversed :
    {
      check : "Boolean",
      init : false,
      apply : "_applyReversed"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __heights : null,
    __flexs : null,
    __enableFlex : null,
    __children : null,


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyReversed : function()
    {
      // easiest way is to invalidate the cache
      this._invalidChildrenCache = true;

      // call normal layout change
      this._applyLayoutChange();
    },


    /**
     * Rebuilds caches for flex and percent layout properties
     */
    __rebuildCache : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var enableFlex = false;
      var reuse = this.__heights && this.__heights.length != length && this.__flexs && this.__heights;
      var props;

      // Sparse array (keep old one if lengths has not been modified)
      var heights = reuse ? this.__heights : new Array(length);
      var flexs = reuse ? this.__flexs : new Array(length);

      // Reverse support
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Loop through children to preparse values
      for (var i=0; i<length; i++)
      {
        props = children[i].getLayoutProperties();

        if (props.height != null) {
          heights[i] = parseFloat(props.height) / 100;
        }

        if (props.flex != null)
        {
          flexs[i] = props.flex;
          enableFlex = true;
        } else {
          // reset (in case the index of the children changed: BUG #3131)
          flexs[i] = 0;
        }
      }

      // Store data
      if (!reuse)
      {
        this.__heights = heights;
        this.__flexs = flexs;
      }

      this.__enableFlex = enableFlex
      this.__children = children;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "flex" || name === "height", "The property '"+name+"' is not supported by the VBox layout!");

        if (name =="height")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          // flex
          this.assertNumber(value);
          this.assert(value >= 0);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      // Cache children
      var children = this.__children;
      var length = children.length;
      var util = qx.ui.layout.Util;


      // Compute gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }


      // First run to cache children data and compute allocated height
      var i, child, height, percent;
      var heights = [];
      var allocatedHeight = gaps;

      for (i=0; i<length; i+=1)
      {
        percent = this.__heights[i];

        height = percent != null ?
          Math.floor((availHeight - gaps) * percent) :
          children[i].getSizeHint().height;

        heights.push(height);
        allocatedHeight += height;
      }


      // Flex support (growing/shrinking)
      if (this.__enableFlex && allocatedHeight != availHeight)
      {
        var flexibles = {};
        var flex, offset;

        for (i=0; i<length; i+=1)
        {
          flex = this.__flexs[i];

          if (flex > 0)
          {
            hint = children[i].getSizeHint();

            flexibles[i]=
            {
              min : hint.minHeight,
              value : heights[i],
              max : hint.maxHeight,
              flex : flex
            };
          }
        }

        var result = util.computeFlexOffsets(flexibles, availHeight, allocatedHeight);

        for (i in result)
        {
          offset = result[i].offset;

          heights[i] += offset;
          allocatedHeight += offset;
        }
      }


      // Start with top coordinate
      var top = children[0].getMarginTop();

      // Alignment support
      if (allocatedHeight < availHeight && this.getAlignY() != "top")
      {
        top = availHeight - allocatedHeight;

        if (this.getAlignY() === "middle") {
          top = Math.round(top / 2);
        }
      }


      // Layouting children
      var hint, left, width, height, marginBottom, marginLeft, marginRight;

      // Pre configure separators
      this._clearSeparators();

      // Compute separator height
      if (separator)
      {
        var separatorInsets = qx.theme.manager.Decoration.getInstance().resolve(separator).getInsets();
        var separatorHeight = separatorInsets.top + separatorInsets.bottom;
      }

      // Render children and separators
      for (i=0; i<length; i+=1)
      {
        child = children[i];
        height = heights[i];
        hint = child.getSizeHint();

        marginLeft = child.getMarginLeft();
        marginRight = child.getMarginRight();

        // Find usable width
        width = Math.max(hint.minWidth, Math.min(availWidth-marginLeft-marginRight, hint.maxWidth));

        // Respect horizontal alignment
        left = util.computeHorizontalAlignOffset(child.getAlignX()||this.getAlignX(), width, availWidth, marginLeft, marginRight);

        // Add collapsed margin
        if (i > 0)
        {
          // Whether a separator has been configured
          if (separator)
          {
            // add margin of last child and spacing
            top += marginBottom + spacing;

            // then render the separator at this position
            this._renderSeparator(separator, {
              top : top + padding.top,
              left : padding.left,
              height : separatorHeight,
              width : availWidth
            });

            // and finally add the size of the separator, the spacing (again) and the top margin
            top += separatorHeight + spacing + child.getMarginTop();
          }
          else
          {
            // Support margin collapsing when no separator is defined
            top += util.collapseMargins(spacing, marginBottom, child.getMarginTop());
          }
        }

        // Layout child
        child.renderLayout(left + padding.left, top + padding.top, width, height);

        // Add height
        top += height;

        // Remember bottom margin (for collapsing)
        marginBottom = child.getMarginBottom();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      var util = qx.ui.layout.Util;
      var children = this.__children;

      // Initialize
      var minHeight=0, height=0, percentMinHeight=0;
      var minWidth=0, width=0;
      var child, hint, margin;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i+=1)
      {
        child = children[i];
        hint = child.getSizeHint();

        // Sum up heights
        height += hint.height;

        // Detect if child is shrinkable or has percent height and update minHeight
        var flex = this.__flexs[i];
        var percent = this.__heights[i];
        if (flex) {
          minHeight += hint.minHeight;
        } else if (percent) {
          percentMinHeight = Math.max(percentMinHeight, Math.round(hint.minHeight/percent));
        } else {
          minHeight += hint.height;
        }

        // Build horizontal margin sum
        margin = child.getMarginLeft() + child.getMarginRight();

        // Find biggest width
        if ((hint.width+margin) > width) {
          width = hint.width + margin;
        }

        // Find biggest minWidth
        if ((hint.minWidth+margin) > minWidth) {
          minWidth = hint.minWidth + margin;
        }
      }

      minHeight += percentMinHeight;

      // Respect gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }

      // Return hint
      return {
        minHeight : minHeight + gaps,
        height : height + gaps,
        minWidth : minWidth,
        width : width
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__heights = this.__flexs = this.__children = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The grid layout manager arranges the items in a two dimensional
 * grid. Widgets can be placed into the grid's cells and may span multiple rows
 * and columns.
 *
 * *Features*
 *
 * * Flex values for rows and columns
 * * Minimal and maximal column and row sizes
 * * Manually setting of column and row sizes
 * * Horizontal and vertical alignment
 * * Horizontal and vertical spacing
 * * Column and row spans
 * * Auto-sizing
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>row</strong> <em>(Integer)</em>: The row of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>column</strong> <em>(Integer)</em>: The column of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>rowSpan</strong> <em>(Integer)</em>: The number of rows, the
 *   widget should span, starting from the row specified in the <code>row</code>
 *   property. The cells in the spanned rows must be empty as well.
 * </li>
 * <li><strong>colSpan</strong> <em>(Integer)</em>: The number of columns, the
 *   widget should span, starting from the column specified in the <code>column</code>
 *   property. The cells in the spanned columns must be empty as well.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the grid layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grid();
 * layout.setRowFlex(0, 1); // make row 0 flexible
 * layout.setColumnWidth(1, 200); // set with of column 1 to 200 pixel
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 0});
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 1});
 * container.add(new qx.ui.core.Widget(), {row: 1, column: 0, rowSpan: 2});
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grid.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grid",
{
  extend : qx.ui.layout.Abstract,






  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacingX {Integer?0} The horizontal spacing between grid cells.
   *     Sets {@link #spacingX}.
   * @param spacingY {Integer?0} The vertical spacing between grid cells.
   *     Sets {@link #spacingY}.
   */
  construct : function(spacingX, spacingY)
  {
    this.base(arguments);

    this.__rowData = [];
    this.__colData = [];

    if (spacingX) {
      this.setSpacingX(spacingX);
    }

    if (spacingY) {
      this.setSpacingY(spacingY);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * The horizontal spacing between grid cells.
     */
    spacingX :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /**
     * The vertical spacing between grid cells.
     */
    spacingY :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** @type {Array} 2D array of grid cell data */
    __grid : null,
    __rowData : null,
    __colData : null,

    __colSpans : null,
    __rowSpans : null,
    __maxRowIndex : null,
    __maxColIndex : null,

    /** @type {Array} cached row heights */
    __rowHeights : null,

    /** @type {Array} cached column widths */
    __colWidths : null,



    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        var layoutProperties = {
          "row" : 1,
          "column" : 1,
          "rowSpan" : 1,
          "colSpan" : 1
        }
        this.assert(layoutProperties[name] == 1, "The property '"+name+"' is not supported by the Grid layout!");
        this.assertInteger(value);
        this.assert(value >= 0, "Value must be positive");
      },

      "false" : null
    }),


    /**
     * Rebuild the internal representation of the grid
     */
    __buildGrid : function()
    {
      var grid = [];
      var colSpans = [];
      var rowSpans = [];

      var maxRowIndex = -1;
      var maxColIndex = -1;

      var children = this._getLayoutChildren();

      for (var i=0,l=children.length; i<l; i++)
      {
        var child = children[i];
        var props = child.getLayoutProperties();

        var row = props.row;
        var column = props.column;

        props.colSpan = props.colSpan || 1;
        props.rowSpan = props.rowSpan || 1;

        // validate arguments
        if (row == null || column == null) {
          throw new Error(
            "The layout properties 'row' and 'column' of the child widget '" +
            child + "' must be defined!"
          );
        }

        if (grid[row] && grid[row][column]) {
          throw new Error(
            "Cannot add widget '" + child + "'!. " +
            "There is already a widget '" + grid[row][column] +
            "' in this cell (" + row + ", " + column + ") for '" + this + "'"
          );
        }

        for (var x=column; x<column+props.colSpan; x++)
        {
          for (var y=row; y<row+props.rowSpan; y++)
          {
            if (grid[y] == undefined) {
               grid[y] = [];
            }

            grid[y][x] = child;

            maxColIndex = Math.max(maxColIndex, x);
            maxRowIndex = Math.max(maxRowIndex, y);
          }
        }

        if (props.rowSpan > 1) {
          rowSpans.push(child);
        }

        if (props.colSpan > 1) {
          colSpans.push(child);
        }
      }

      // make sure all columns are defined so that accessing the grid using
      // this.__grid[column][row] will never raise an exception
      for (var y=0; y<=maxRowIndex; y++) {
        if (grid[y] == undefined) {
           grid[y] = [];
        }
      }

      this.__grid = grid;

      this.__colSpans = colSpans;
      this.__rowSpans = rowSpans;

      this.__maxRowIndex = maxRowIndex;
      this.__maxColIndex = maxColIndex;

      this.__rowHeights = null;
      this.__colWidths = null;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },


    /**
     * Stores data for a grid row
     *
     * @param row {Integer} The row index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setRowData : function(row, key, value)
    {
      var rowData = this.__rowData[row];

      if (!rowData)
      {
        this.__rowData[row] = {};
        this.__rowData[row][key] = value;
      }
      else
      {
        rowData[key] = value;
      }
    },


    /**
     * Stores data for a grid column
     *
     * @param column {Integer} The column index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setColumnData : function(column, key, value)
    {
      var colData = this.__colData[column];

      if (!colData)
      {
        this.__colData[column] = {};
        this.__colData[column][key] = value;
      }
      else
      {
        colData[key] = value;
      }
    },


    /**
     * Shortcut to set both horizontal and vertical spacing between grid cells
     * to the same value.
     *
     * @param spacing {Integer} new horizontal and vertical spacing
     * @return {qx.ui.layout.Grid} This object (for chaining support).
     */
    setSpacing : function(spacing)
    {
      this.setSpacingY(spacing);
      this.setSpacingX(spacing);
      return this;
    },


    /**
     * Set the default cell alignment for a column. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param column {Integer} Column index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnAlign : function(column, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(column, "Invalid parameter 'column'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setColumnData(column, "hAlign", hAlign);
      this._setColumnData(column, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the column's alignment.
     *
     * @param column {Integer} The column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal column alignment.
     */
    getColumnAlign : function(column)
    {
      var colData = this.__colData[column] || {};

      return {
        vAlign : colData.vAlign || "top",
        hAlign : colData.hAlign || "left"
      };
    },


    /**
     * Set the default cell alignment for a row. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param row {Integer} Row index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowAlign : function(row, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(row, "Invalid parameter 'row'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setRowData(row, "hAlign", hAlign);
      this._setRowData(row, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the row's alignment.
     *
     * @param row {Integer} The Row index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal row alignment.
     */
    getRowAlign : function(row)
    {
      var rowData = this.__rowData[row] || {};

      return {
        vAlign : rowData.vAlign || "top",
        hAlign : rowData.hAlign || "left"
      };
    },


    /**
     * Get the widget located in the cell. If a the cell is empty or the widget
     * has a {@link qx.ui.core.Widget#visibility} value of <code>exclude</code>,
     * <code>null</code> is returned.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {qx.ui.core.Widget|null}The cell's widget. The value may be null.
     */
    getCellWidget : function(row, column)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var row = this.__grid[row] || {};
      return row[column] ||  null;
    },


    /**
     * Get the number of rows in the grid layout.
     *
     * @return {Integer} The number of rows in the layout
     */
    getRowCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxRowIndex + 1;
    },


    /**
     * Get the number of columns in the grid layout.
     *
     * @return {Integer} The number of columns in the layout
     */
    getColumnCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxColIndex + 1;
    },


    /**
     * Get a map of the cell's alignment. For vertical alignment the row alignment
     * takes precedence over the column alignment. For horizontal alignment it is
     * the over way round. If an alignment is set on the cell widget using
     * {@link qx.ui.core.LayoutItem#setLayoutProperties}, this alignment takes
     * always precedence over row or column alignment.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal cell alignment.
     */
    getCellAlign : function(row, column)
    {
      var vAlign = "top";
      var hAlign = "left";

      var rowData = this.__rowData[row];
      var colData = this.__colData[column];

      var widget = this.__grid[row][column];
      if (widget)
      {
        var widgetProps = {
          vAlign : widget.getAlignY(),
          hAlign : widget.getAlignX()
        }
      }
      else
      {
        widgetProps = {};
      }

      // compute vAlign
      // precedence : widget -> row -> column
      if (widgetProps.vAlign) {
        vAlign = widgetProps.vAlign;
      } else if (rowData && rowData.vAlign) {
        vAlign = rowData.vAlign;
      } else if (colData && colData.vAlign) {
        vAlign = colData.vAlign;
      }

      // compute hAlign
      // precedence : widget -> column -> row
      if (widgetProps.hAlign) {
        hAlign = widgetProps.hAlign;
      } else if (colData && colData.hAlign) {
        hAlign = colData.hAlign;
      } else if (rowData && rowData.hAlign) {
        hAlign = rowData.hAlign;
      }

      return {
        vAlign : vAlign,
        hAlign : hAlign
      }
    },


    /**
     * Set the flex value for a grid column.
     * By default the column flex value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param flex {Integer} The column's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnFlex : function(column, flex)
    {
      this._setColumnData(column, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's flex value
     */
    getColumnFlex : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.flex !== undefined ? colData.flex : 0;
    },


    /**
     * Set the flex value for a grid row.
     * By default the row flex value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param flex {Integer} The row's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowFlex : function(row, flex)
    {
      this._setRowData(row, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's flex value
     */
    getRowFlex : function(row)
    {
      var rowData = this.__rowData[row] || {};
      var rowFlex = rowData.flex !== undefined ? rowData.flex : 0
      return rowFlex;
    },


    /**
     * Set the maximum width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param maxWidth {Integer} The column's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMaxWidth : function(column, maxWidth)
    {
      this._setColumnData(column, "maxWidth", maxWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's maximum width
     */
    getColumnMaxWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.maxWidth !== undefined ? colData.maxWidth : Infinity;
    },


    /**
     * Set the preferred width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param width {Integer} The column's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnWidth : function(column, width)
    {
      this._setColumnData(column, "width", width);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's width
     */
    getColumnWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.width !== undefined ? colData.width : null;
    },


    /**
     * Set the minimum width of a grid column.
     * The default value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param minWidth {Integer} The column's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMinWidth : function(column, minWidth)
    {
      this._setColumnData(column, "minWidth", minWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's minimum width
     */
    getColumnMinWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.minWidth || 0;
    },


    /**
     * Set the maximum height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param maxHeight {Integer} The row's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMaxHeight : function(row, maxHeight)
    {
      this._setRowData(row, "maxHeight", maxHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's maximum width
     */
    getRowMaxHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.maxHeight || Infinity;
    },


    /**
     * Set the preferred height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param height {Integer} The row's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowHeight : function(row, height)
    {
      this._setRowData(row, "height", height);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's width
     */
    getRowHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.height !== undefined ? rowData.height : null;
    },


    /**
     * Set the minimum height of a grid row.
     * The default value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param minHeight {Integer} The row's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMinHeight : function(row, minHeight)
    {
      this._setRowData(row, "minHeight", minHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's minimum width
     */
    getRowMinHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.minHeight || 0;
    },


    /**
     * Computes the widget's size hint including the widget's margins
     *
     * @param widget {qx.ui.core.LayoutItem} The widget to get the size for
     * @return {Map} a size hint map
     */
    __getOuterSize : function(widget)
    {
      var hint = widget.getSizeHint();
      var hMargins = widget.getMarginLeft() + widget.getMarginRight();
      var vMargins = widget.getMarginTop() + widget.getMarginBottom();

      var outerSize = {
        height: hint.height + vMargins,
        width: hint.width + hMargins,
        minHeight: hint.minHeight + vMargins,
        minWidth: hint.minWidth + hMargins,
        maxHeight: hint.maxHeight + vMargins,
        maxWidth: hint.maxWidth + hMargins
      }

      return outerSize;
    },


    /**
     * Check whether all row spans fit with their preferred height into the
     * preferred row heights. If there is not enough space, the preferred
     * row sizes are increased. The distribution respects the flex and max
     * values of the rows.
     *
     *  The same is true for the min sizes.
     *
     *  The height array is modified in place.
     *
     * @param rowHeights {Map[]} The current row height array as computed by
     *     {@link #_getRowHeights}.
     */
    _fixHeightsRowSpan : function(rowHeights)
    {
      var vSpacing = this.getSpacingY();

      for (var i=0, l=this.__rowSpans.length; i<l; i++)
      {
        var widget = this.__rowSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetRow = widgetProps.row;

        var prefSpanHeight = vSpacing * (widgetProps.rowSpan - 1);
        var minSpanHeight = prefSpanHeight;

        var rowFlexes = {};

        for (var j=0; j<widgetProps.rowSpan; j++)
        {
          var row = widgetProps.row+j;
          var rowHeight = rowHeights[row];
          var rowFlex = this.getRowFlex(row);

          if (rowFlex > 0)
          {
            // compute flex array for the preferred height
            rowFlexes[row] =
            {
              min : rowHeight.minHeight,
              value : rowHeight.height,
              max : rowHeight.maxHeight,
              flex: rowFlex
            };
          }

          prefSpanHeight += rowHeight.height;
          minSpanHeight += rowHeight.minHeight;
        }

        // If there is not enough space for the preferred size
        // increment the preferred row sizes.
        if (prefSpanHeight < hint.height)
        {
          if (!qx.lang.Object.isEmpty(rowFlexes)) {
            var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
              rowFlexes, hint.height, prefSpanHeight
            );

            for (var k=0; k<widgetProps.rowSpan; k++)
            {
              var offset = rowIncrements[widgetRow+k] ? rowIncrements[widgetRow+k].offset : 0;
              rowHeights[widgetRow+k].height += offset;
            }
          // row is too small and we have no flex value set
          } else {
            var totalSpacing = vSpacing * (widgetProps.rowSpan - 1);
            var availableHeight = hint.height - totalSpacing;

            // get the row height which every child would need to share the
            // available hight equally
            var avgRowHeight =
              Math.floor(availableHeight / widgetProps.rowSpan);

            // get the hight already used and the number of children which do
            // not have at least that avg row height
            var usedHeight = 0;
            var rowsNeedAddition = 0;
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              var currentHeight = rowHeights[widgetRow + k].height;
              usedHeight += currentHeight;
              if (currentHeight < avgRowHeight) {
                rowsNeedAddition++;
              }
            }

            // the difference of available and used needs to be shared among
            // those not having the min size
            var additionalRowHeight =
              Math.floor((availableHeight - usedHeight) / rowsNeedAddition);

            // add the extra height to the too small children
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              if (rowHeights[widgetRow + k].height < avgRowHeight) {
                rowHeights[widgetRow + k].height += additionalRowHeight;
              }
            }
          }
        }

        // If there is not enough space for the min size
        // increment the min row sizes.
        if (minSpanHeight < hint.minHeight)
        {
          var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
            rowFlexes, hint.minHeight, minSpanHeight
          );

          for (var j=0; j<widgetProps.rowSpan; j++)
          {
            var offset = rowIncrements[widgetRow+j] ? rowIncrements[widgetRow+j].offset : 0;
            rowHeights[widgetRow+j].minHeight += offset;
          }
        }
      }
    },


    /**
     * Check whether all col spans fit with their preferred width into the
     * preferred column widths. If there is not enough space the preferred
     * column sizes are increased. The distribution respects the flex and max
     * values of the columns.
     *
     *  The same is true for the min sizes.
     *
     *  The width array is modified in place.
     *
     * @param colWidths {Map[]} The current column width array as computed by
     *     {@link #_getColWidths}.
     */
    _fixWidthsColSpan : function(colWidths)
    {
      var hSpacing = this.getSpacingX();

      for (var i=0, l=this.__colSpans.length; i<l; i++)
      {
        var widget = this.__colSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetColumn = widgetProps.column;

        var prefSpanWidth = hSpacing * (widgetProps.colSpan - 1);
        var minSpanWidth = prefSpanWidth;

        var colFlexes = {};

        var offset;

        for (var j=0; j<widgetProps.colSpan; j++)
        {
          var col = widgetProps.column+j;
          var colWidth = colWidths[col];
          var colFlex = this.getColumnFlex(col);

          // compute flex array for the preferred width
          if (colFlex > 0)
          {
            colFlexes[col] =
            {
              min : colWidth.minWidth,
              value : colWidth.width,
              max : colWidth.maxWidth,
              flex: colFlex
            };
          }

          prefSpanWidth += colWidth.width;
          minSpanWidth += colWidth.minWidth;
        }

        // If there is not enought space for the preferred size
        // increment the preferred column sizes.
        if (prefSpanWidth < hint.width)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.width, prefSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].width += offset;
          }
        }

        // If there is not enought space for the min size
        // increment the min column sizes.
        if (minSpanWidth < hint.minWidth)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.minWidth, minSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].minWidth += offset;
          }
        }
      }
    },


    /**
     * Compute the min/pref/max row heights.
     *
     * @return {Map[]} An array containg height information for each row. The
     *     entries have the keys <code>minHeight</code>, <code>maxHeight</code> and
     *     <code>height</code>.
     */
    _getRowHeights : function()
    {
      if (this.__rowHeights != null) {
        return this.__rowHeights;
      }

      var rowHeights = [];

      var maxRowIndex = this.__maxRowIndex;
      var maxColIndex = this.__maxColIndex;

      for (var row=0; row<=maxRowIndex; row++)
      {
        var minHeight = 0;
        var height = 0;
        var maxHeight = 0;

        for (var col=0; col<=maxColIndex; col++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore rows with row spans at this place
          // these rows will be taken into account later
          var widgetRowSpan = widget.getLayoutProperties().rowSpan || 0;
          if (widgetRowSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getRowFlex(row) > 0) {
            minHeight = Math.max(minHeight, cellSize.minHeight);
          } else {
            minHeight = Math.max(minHeight, cellSize.height);
          }

          height = Math.max(height, cellSize.height);
        }

        var minHeight = Math.max(minHeight, this.getRowMinHeight(row));
        var maxHeight = this.getRowMaxHeight(row);

        if (this.getRowHeight(row) !== null) {
          var height = this.getRowHeight(row);
        } else {
          var height = Math.max(minHeight, Math.min(height, maxHeight));
        }

        rowHeights[row] = {
          minHeight : minHeight,
          height : height,
          maxHeight : maxHeight
        };
      }

      if (this.__rowSpans.length > 0) {
        this._fixHeightsRowSpan(rowHeights);
      }

      this.__rowHeights = rowHeights;
      return rowHeights;
    },


    /**
     * Compute the min/pref/max column widths.
     *
     * @return {Map[]} An array containg width information for each column. The
     *     entries have the keys <code>minWidth</code>, <code>maxWidth</code> and
     *     <code>width</code>.
     */
    _getColWidths : function()
    {
      if (this.__colWidths != null) {
        return this.__colWidths;
      }

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      for (var col=0; col<=maxColIndex; col++)
      {
        var width = 0;
        var minWidth = 0;
        var maxWidth = Infinity;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore columns with col spans at this place
          // these columns will be taken into account later
          var widgetColSpan = widget.getLayoutProperties().colSpan || 0;
          if (widgetColSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getColumnFlex(col) > 0) {
            minWidth = Math.max(minWidth, cellSize.minWidth);
          } else {
            minWidth = Math.max(minWidth, cellSize.width);
          }

          width = Math.max(width, cellSize.width);
        }

        minWidth = Math.max(minWidth, this.getColumnMinWidth(col));
        maxWidth = this.getColumnMaxWidth(col);

        if (this.getColumnWidth(col) !== null) {
          var width = this.getColumnWidth(col);
        } else {
          var width = Math.max(minWidth, Math.min(width, maxWidth));
        }

        colWidths[col] = {
          minWidth: minWidth,
          width : width,
          maxWidth : maxWidth
        };
      }

      if (this.__colSpans.length > 0) {
        this._fixWidthsColSpan(colWidths);
      }

      this.__colWidths = colWidths;
      return colWidths;
    },


    /**
     * Computes for each column by how many pixels it must grow or shrink, taking
     * the column flex values and min/max widths into account.
     *
     * @param width {Integer} The grid width
     * @return {Integer[]} Sparse array of offsets to add to each column width. If
     *     an array entry is empty nothing should be added to the column.
     */
    _getColumnFlexOffsets : function(width)
    {
      var hint = this.getSizeHint();
      var diff = width - hint.width;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var colWidths = this._getColWidths();
      var flexibles = {};

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        var colFlex = this.getColumnFlex(i);

        if (
          (colFlex <= 0) ||
          (col.width == col.maxWidth && diff > 0) ||
          (col.width == col.minWidth && diff < 0)
        ) {
          continue;
        }

        flexibles[i] ={
          min : col.minWidth,
          value : col.width,
          max : col.maxWidth,
          flex : colFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, width, hint.width);
    },


    /**
     * Computes for each row by how many pixels it must grow or shrink, taking
     * the row flex values and min/max heights into account.
     *
     * @param height {Integer} The grid height
     * @return {Integer[]} Sparse array of offsets to add to each row height. If
     *     an array entry is empty nothing should be added to the row.
     */
    _getRowFlexOffsets : function(height)
    {
      var hint = this.getSizeHint();
      var diff = height - hint.height;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var rowHeights = this._getRowHeights();
      var flexibles = {};

      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];
        var rowFlex = this.getRowFlex(i);

        if (
          (rowFlex <= 0) ||
          (row.height == row.maxHeight && diff > 0) ||
          (row.height == row.minHeight && diff < 0)
        ) {
          continue;
        }

        flexibles[i] = {
          min : row.minHeight,
          value : row.height,
          max : row.maxHeight,
          flex : rowFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, height, hint.height);
    },


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var Util = qx.ui.layout.Util;
      var hSpacing = this.getSpacingX();
      var vSpacing = this.getSpacingY();

      // calculate column widths
      var prefWidths = this._getColWidths();
      var colStretchOffsets = this._getColumnFlexOffsets(availWidth);

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      var offset;

      for (var col=0; col<=maxColIndex; col++)
      {
        offset = colStretchOffsets[col] ? colStretchOffsets[col].offset : 0;
        colWidths[col] = prefWidths[col].width + offset;
      }

      // calculate row heights
      var prefHeights = this._getRowHeights();
      var rowStretchOffsets = this._getRowFlexOffsets(availHeight);

      var rowHeights = [];

      for (var row=0; row<=maxRowIndex; row++)
      {
        offset = rowStretchOffsets[row] ? rowStretchOffsets[row].offset : 0;
        rowHeights[row] = prefHeights[row].height + offset;
      }

      // do the layout
      var left = 0;
      for (var col=0; col<=maxColIndex; col++)
      {
        var top = 0;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];

          // ignore empty cells
          if (!widget)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          var widgetProps = widget.getLayoutProperties();

          // ignore cells, which have cell spanning but are not the origin
          // of the widget
          if(widgetProps.row !== row || widgetProps.column !== col)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          // compute sizes width including cell spanning
          var spanWidth = hSpacing * (widgetProps.colSpan - 1);
          for (var i=0; i<widgetProps.colSpan; i++) {
            spanWidth += colWidths[col+i];
          }

          var spanHeight = vSpacing * (widgetProps.rowSpan - 1);
          for (var i=0; i<widgetProps.rowSpan; i++) {
            spanHeight += rowHeights[row+i];
          }

          var cellHint = widget.getSizeHint();
          var marginTop = widget.getMarginTop();
          var marginLeft = widget.getMarginLeft();
          var marginBottom = widget.getMarginBottom();
          var marginRight = widget.getMarginRight();

          var cellWidth = Math.max(cellHint.minWidth, Math.min(spanWidth-marginLeft-marginRight, cellHint.maxWidth));
          var cellHeight = Math.max(cellHint.minHeight, Math.min(spanHeight-marginTop-marginBottom, cellHint.maxHeight));

          var cellAlign = this.getCellAlign(row, col);
          var cellLeft = left + Util.computeHorizontalAlignOffset(cellAlign.hAlign, cellWidth, spanWidth, marginLeft, marginRight);
          var cellTop = top + Util.computeVerticalAlignOffset(cellAlign.vAlign, cellHeight, spanHeight, marginTop, marginBottom);

          widget.renderLayout(
            cellLeft + padding.left,
            cellTop + padding.top,
            cellWidth,
            cellHeight
          );

          top += rowHeights[row] + vSpacing;
        }

        left += colWidths[col] + hSpacing;
      }
    },


    // overridden
    invalidateLayoutCache : function()
    {
      this.base(arguments);

      this.__colWidths = null;
      this.__rowHeights = null;
    },


    // overridden
    _computeSizeHint : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      // calculate col widths
      var colWidths = this._getColWidths();

      var minWidth=0, width=0;

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        if (this.getColumnFlex(i) > 0) {
          minWidth += col.minWidth;
        } else {
          minWidth += col.width;
        }

        width += col.width;
      }

      // calculate row heights
      var rowHeights = this._getRowHeights();

      var minHeight=0, height=0;
      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];

        if (this.getRowFlex(i) > 0) {
          minHeight += row.minHeight;
        } else {
          minHeight += row.height;
        }

        height += row.height;
      }

      var spacingX = this.getSpacingX() * (colWidths.length - 1);
      var spacingY = this.getSpacingY() * (rowHeights.length - 1);

      var hint = {
        minWidth : minWidth + spacingX,
        width : width + spacingX,
        minHeight : minHeight + spacingY,
        height : height + spacingY
      };

      return hint;
    }
  },




  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {
    this.__grid = this.__rowData = this.__colData = this.__colSpans =
      this.__rowSpans = this.__colWidths = this.__rowHeights = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This mixin is included by all widgets, which support an 'execute' like
 * buttons or menu entries.
 */
qx.Mixin.define("qx.ui.core.MExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired if the {@link #execute} method is invoked.*/
    "execute" : "qx.event.type.Event"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * A command called if the {@link #execute} method is called, e.g. on a
     * button tap.
     */
    command :
    {
      check : "qx.ui.command.Command",
      apply : "_applyCommand",
      event : "changeCommand",
      nullable : true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __executableBindingIds : null,
    __semaphore : false,
    __executeListenerId : null,


    /**
     * @type {Map} Set of properties, which will by synced from the command to the
     *    including widget
     *
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "icon",
      "toolTipText",
      "value",
      "menu"
    ],


    /**
     * Initiate the execute action.
     */
    execute : function()
    {
      var cmd = this.getCommand();

      if (cmd) {
        if (this.__semaphore) {
          this.__semaphore = false;
        } else {
          this.__semaphore = true;
          cmd.execute(this);
        }
      }

      this.fireEvent("execute");
    },


    /**
     * Handler for the execute event of the command.
     *
     * @param e {qx.event.type.Event} The execute event of the command.
     */
    __onCommandExecute : function(e) {
      if (this.__semaphore) {
        this.__semaphore = false;
        return;
      }
      if (this.isEnabled()) {
        this.__semaphore = true;
        this.execute();
      }
    },


    // property apply
    _applyCommand : function(value, old)
    {
      // execute forwarding
      if (old != null) {
        old.removeListenerById(this.__executeListenerId);
      }
      if (value != null) {
        this.__executeListenerId = value.addListener(
          "execute", this.__onCommandExecute, this
        );
      }

      // binding stuff
      var ids = this.__executableBindingIds;
      if (ids == null) {
        this.__executableBindingIds = ids = {};
      }

      var selfPropertyValue;
      for (var i = 0; i < this._bindableProperties.length; i++) {
        var property = this._bindableProperties[i];

        // remove the old binding
        if (old != null && !old.isDisposed() && ids[property] != null)
        {
          old.removeBinding(ids[property]);
          ids[property] = null;
        }

        // add the new binding
        if (value != null && qx.Class.hasProperty(this.constructor, property)) {
          // handle the init value (dont sync the initial null)
          var cmdPropertyValue = value.get(property);
          if (cmdPropertyValue == null) {
            selfPropertyValue = this.get(property);
            // check also for themed values [BUG #5906]
            if (selfPropertyValue == null) {
              // update the appearance to make sure every themed property is up to date
              this.syncAppearance();
              selfPropertyValue = qx.util.PropertyUtil.getThemeValue(
                this, property
              );
            }
          } else {
            // Reset the self property value [BUG #4534]
            selfPropertyValue = null;
          }
          // set up the binding
          ids[property] = value.bind(property, this, property);
          // reapply the former value
          if (selfPropertyValue) {
            this.set(property, selfPropertyValue);
          }
        }
      }
    }
  },


  destruct : function() {
    this._applyCommand(null, this.getCommand());
    this.__executableBindingIds = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which are executable in some way. This
 * could be a button for example.
 */
qx.Interface.define("qx.ui.form.IExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the widget is executed. Sets the "data" property of the
     * event to the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      COMMAND PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the command of this executable.
     *
     * @param command {qx.ui.command.Command} The command.
     */
    setCommand : function(command) {
      return arguments.length == 1;
    },


    /**
     * Return the current set command of this executable.
     *
     * @return {qx.ui.command.Command} The current set command.
     */
    getCommand : function() {},


    /**
     * Fire the "execute" event on the command.
     */
    execute: function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Button widget which supports various states and allows it to be used
 * via the mouse, touch, pen and the keyboard.
 *
 * If the user presses the button by clicking on it, or the <code>Enter</code> or
 * <code>Space</code> keys, the button fires an {@link qx.ui.core.MExecutable#execute} event.
 *
 * If the {@link qx.ui.core.MExecutable#command} property is set, the
 * command is executed as well.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.Button("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button was clicked");
 *   }, this);
 *
 *   this.getRoot().add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/button.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.Button",
{
  extend : qx.ui.basic.Atom,
  include : [qx.ui.core.MExecutable],
  implement : [qx.ui.form.IExecutable],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} label of the atom
   * @param icon {String?null} Icon URL of the atom
   * @param command {qx.ui.command.Command?null} Command instance to connect with
   */
  construct : function(label, icon, command)
  {
    this.base(arguments, label, icon);

    if (command != null) {
      this.setCommand(command);
    }

    // Add listeners
    this.addListener("pointerover", this._onPointerOver);
    this.addListener("pointerout", this._onPointerOut);
    this.addListener("pointerdown", this._onPointerDown);
    this.addListener("pointerup", this._onPointerUp);
    this.addListener("tap", this._onTap);

    this.addListener("keydown", this._onKeyDown);
    this.addListener("keyup", this._onKeyUp);

    // Stop events
    this.addListener("dblclick", function(e) {
      e.stopPropagation();
    });
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "button"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      hovered : true,
      pressed : true,
      disabled : true
    },


    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Manually press the button
     */
    press : function()
    {
      if (this.hasState("abandoned")) {
        return;
      }

      this.addState("pressed");
    },


    /**
     * Manually release the button
     */
    release : function()
    {
      if (this.hasState("pressed")) {
        this.removeState("pressed");
      }
    },


    /**
     * Completely reset the button (remove all states)
     */
    reset : function()
    {
      this.removeState("pressed");
      this.removeState("abandoned");
      this.removeState("hovered");
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
      }
    },


    /**
     * Listener method for "pointerdown" event
     * <ul>
     * <li>Removes "abandoned" state</li>
     * <li>Adds "pressed" state</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      e.stopPropagation();

      // Activate capturing if the button get a pointerout while
      // the button is pressed.
      this.capture();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Listener method for "pointerup" event
     * <ul>
     * <li>Removes "pressed" state (if set)</li>
     * <li>Removes "abandoned" state (if set)</li>
     * <li>Adds "hovered" state (if "abandoned" state is not set)</li>
     *</ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerUp : function(e)
    {
      this.releaseCapture();

      // We must remove the states before executing the command
      // because in cases were the window lost the focus while
      // executing we get the capture phase back (mouseout).
      var hasPressed = this.hasState("pressed");
      var hasAbandoned = this.hasState("abandoned");

      if (hasPressed) {
        this.removeState("pressed");
      }

      if (hasAbandoned) {
        this.removeState("abandoned");
      }

      e.stopPropagation();
    },


    /**
     * Listener method for "tap" event which stops the propagation.
     *
     * @param e {qx.event.type.Pointer} Pointer event
     */
    _onTap : function(e) {
      // "execute" is fired here so that the button can be dragged
      // without executing it (e.g. in a TabBar with overflow)
      this.execute();
      e.stopPropagation();
    },


    /**
     * Listener method for "keydown" event.<br/>
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
      }
    },


    /**
     * Listener method for "keyup" event.<br/>
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            this.removeState("abandoned");
            this.removeState("pressed");
            this.execute();
            e.stopPropagation();
          }
      }
    }
  }
});
