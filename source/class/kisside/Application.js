/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 * This is the main application class of your custom application "kisside"
 *
 * @asset(kisside/*)
 * @asset(qx/icon/${qx.icontheme}/16/actions/*)
 * @asset(qx/icon/${qx.icontheme}/16/places/*)
 * @asset(qx/icon/${qx.icontheme}/16/emblems/*)
 * @asset(qx/icon/${qx.icontheme}/16/categories/*)
 * @asset(qx/icon/${qx.icontheme}/16/apps/*)
 * @asset(qx/icon/${qx.icontheme}/16/apps/utilities-help.png)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.Application",
{
  extend : qx.application.Standalone,

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  statics : 
  {
    VERSION : "0.1"
  },

  properties :
  {
    "authToken" : { nullable : true, init : null, apply : "__applyAuthToken" },
    "user" : { nullable : true, init : null },
    "userRpc" : { nullable : true, init : null }
  },

  members :
  {
    __main : null,
    __menuBar : null,
    __toolBar : null,
    __tabView : null,
    __curPage : null,

    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      window.app = this;

      // setup RPC
      this.setUserRpc(new kisside.UserRpc(this));

      // get the authtoken cookie value
      this.setAuthToken(qx.bom.Cookie.get("kiss_authtoken"));

      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      this.__makeMain();
      this.__checkSignedIn();
    },

    __applyAuthToken : function(value)
    {
      qx.bom.Cookie.set("kiss_authtoken", value);
      this.debug("authtoken = " + this.getAuthToken());
    },

    __onCheckSignedIn : function(result, exc)
    {
      if(exc == null) 
      {
//        alert("Result of async call: " + result);
        if(result !== false)
        {
          this.setUser(result);
          this._signoutCommand.setEnabled(true);
        }
        else
          this.__signIn();
      } 
      else 
      {
        window.exc = exc;
        alert("Exception during async call: " + exc);
      }
    },

    __checkSignedIn : function()
    {
      this.debug("__checkSignedIn");
      var self = this;
      this.getUserRpc().isSignedIn(function(result, exc) { self.__onCheckSignedIn(result, exc); });
    },

    __onSignIn : function(result, exc)
    {
      if(exc == null) 
      {
        alert("Result of async call: " + JSON.stringify(result));
        if(result !== false)
        {
          this.setUser(result.user);
          this.setAuthToken(result.authtoken);
          this._signoutCommand.setEnabled(true);
        }
      } 
      else 
      {
        if(exc.code == kisside.UserRpc.ERR_INVALID_USER)
        {
          var self = this;
          var mb = new kisside.MessageBox(this, "Error", "Invalid username or password!", 
                                           kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK, 
                                           function(resp) { self.__signIn(); });
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
        }
        else
          alert("Exception during async call: " + exc);
      }
    }, 

    doSignIn : function(username, password)
    {
      this.debug("doSignIn");
      this._signoutCommand.setEnabled(false);
      var self = this;
      this.getUserRpc().signIn(username, password, function(result, exc) { self.__onSignIn(result, exc); });
    },

    __signIn : function()
    {
      this.debug("__signIn");
      var dialog = new kisside.SignInDialog(this);
      this.getRoot().add(dialog, {left:20, top:20});
      dialog.center();
    },

    __onSignOut : function()
    {
      this.setAuthToken("");
      this.__checkSignedIn();
    },

    __signOut : function()
    {
      this.debug("doSignIn");
      this._signoutCommand.setEnabled(false);
      var self = this;
      this.getUserRpc().signOut(function(result, exc) { self.__onSignOut(result, exc); });
    },

    __makeMain : function()
    {
      this.__createCommands();

      this.__main = new qx.ui.container.Composite(new qx.ui.layout.VBox);
      this.__main.getLayout().setSpacing(0);
      this.__menuBar = this.__createMenuBar();
      this.__main.add(this.__menuBar);

      this.__toolBar = this.__createToolBar();
      this.__main.add(this.__toolBar);

      var fsPane = new qx.ui.container.Composite(new qx.ui.layout.Grow).set({
        width : 200,
//        height: 100,
        decorator : "main"
      });
      var tree = this.__createDummyTree();
      fsPane.add(tree);

      var editorPane = new qx.ui.container.Composite(new qx.ui.layout.Grow).set({
//        padding : 10,
//        maxWidth : 450,
        decorator : "main"
      });
      this.__tabView = new qx.ui.tabview.TabView();
      var self = this;
      this.__tabView.addListener("changeSelection", function() {
        self.__curPage = self.__getSelectedPage();
      });

      this.__tabView.setContentPadding(0, 0, 0, 0);
      for (var i=1; i<=20; i++)
      {
        var page = new qx.ui.tabview.Page("File #" + i);
        page.setLayout(new qx.ui.layout.VBox());
        page.getChildControl("button").setToolTipText("Hi there!"); 
        page.setShowCloseButton(true);
        var editor = new kisside.Editor();
//        editor.addListener("change", function() { self.debug("changed"); if(self.__curPage.getLabel()[0] != '*') self.__curPage.setLabel('*' + self.__curPage.getLabel()); });
        editor.addListener("change", function() { self.debug("changed"); if(self.__curPage.getIcon() == '') self.__curPage.setIcon("icon/16/emblems/emblem-important.png"); });
        editor.setText("// This is file" + i + ".\n");
//        page.add(new qx.ui.basic.Label("File #" + i + " with close button."));
        page.add(editor, { flex: 1 });
        this.__tabView.add(page);
      }
      editorPane.add(this.__tabView);

      var pane = new qx.ui.splitpane.Pane("horizontal");
      pane.add(fsPane, 0);
      pane.add(editorPane, 1);
      this.__main.add(pane, { flex: 1 });

      this.getRoot().add(this.__main, {edge : 0});

/*
      var rpc = new qx.io.remote.Rpc("api/index.php", "user");
      
      // asynchronous call
      var handler = function(result, exc) {
        if (exc == null) 
        {
          alert("Result of async call: " + result);
        } 
        else 
        {
          alert("Exception during async call: " + exc);
        }
      };
      rpc.callAsync(handler, "issignedin", { "authtoken" : "" });
*/      
    },

    __getSelectedPage : function()
    {
      var sel = this.__tabView.getSelection();
      if(sel)
        return sel[0];
      return null;
    },

    __getPageEditor : function(page)
    {
      if(page)
        return page.getChildren()[0];
      return null;
    },

    __createCommands : function()
    {
      var self = this;

      this._newFileCommand = new qx.ui.command.Command("Ctrl+N");
      this._newFileCommand.addListener("execute", this.__debugCommand);
      this._newFileCommand.setToolTipText("New File");

      this._newFolderCommand = new qx.ui.command.Command("Alt+N");
      this._newFolderCommand.addListener("execute", this.__debugCommand);
      this._newFolderCommand.setToolTipText("New Folder");

      this._openCommand = new qx.ui.command.Command("Ctrl+O");
      this._openCommand.addListener("execute", this.__debugCommand);
      this._openCommand.setToolTipText("Open File");

      this._saveCommand = new qx.ui.command.Command("Ctrl+S");
      this._saveCommand.addListener("execute", this.__debugCommand);
      this._saveCommand.setToolTipText("Save File");

      this._undoCommand = new qx.ui.command.Command("Ctrl+Z");
      this._undoCommand.addListener("execute", this.__debugCommand);
      this._undoCommand.setToolTipText("Undo Edit");

      this._redoCommand = new qx.ui.command.Command("Ctrl+R");
      this._redoCommand.addListener("execute", this.__debugCommand);
      this._redoCommand.setToolTipText("Redo Edit");

      this._cutCommand = new qx.ui.command.Command("Ctrl+X");
      this._cutCommand.addListener("execute", this.__debugCommand);
      this._cutCommand.setToolTipText("Cut");
      this._cutCommand.setEnabled(false);

      this._copyCommand = new qx.ui.command.Command("Ctrl+S");
      this._copyCommand.addListener("execute", this.__debugCommand);
      this._copyCommand.setToolTipText("Copy");
      this._copyCommand.setEnabled(false);

      this._pasteCommand = new qx.ui.command.Command("Ctrl+V");
      this._pasteCommand.addListener("execute", this.__debugCommand);
      this._pasteCommand.setToolTipText("Paste");
      this._pasteCommand.setEnabled(false);

      this._signoutCommand = new qx.ui.command.Command();
      this._signoutCommand.addListener("execute", function() { self.__signOut(); });
      this._signoutCommand.setToolTipText("Sign Out");
      this._signoutCommand.setEnabled(false);

      this._aboutCommand = new qx.ui.command.Command();
      this._aboutCommand.addListener("execute", function() { self.__about(); });
      this._aboutCommand.setToolTipText("About...");
    },

    __debugButton : function(e) {
      this.debug("Execute button: " + this.getLabel());
    },

    __debugCommand : function(e) {
      this.debug("Execute command: " + this.getLabel());
    },

    __about : function()
    {
      var mb = new kisside.MessageBox(this, "About", "KISS Edit, Version " + kisside.Application.VERSION, kisside.MessageBox.FLAG_INFO | kisside.MessageBox.FLAG_OK);
      this.getRoot().add(mb, {left:20, top:20});
      mb.center();
    },

    __createMenuBar : function()
    {
      var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);
      var menuFrame = new qx.ui.container.Composite(new qx.ui.layout.HBox());

      var menubar = new qx.ui.menubar.MenuBar;
      menubar.setWidth(600);
      menuFrame.add(menubar, { flex: 1 });

      var fileMenu = new qx.ui.menubar.Button("File", null, this.__createFileMenu());
      var editMenu = new qx.ui.menubar.Button("Edit", null, this.__createEditMenu());
      var searchMenu = new qx.ui.menubar.Button("Search", null, this.__createSearchMenu());
      var gotoMenu = new qx.ui.menubar.Button("Goto", null, this.__createGotoMenu());
      var viewMenu = new qx.ui.menubar.Button("View", null, this.__createViewMenu());
      var settingsMenu = new qx.ui.menubar.Button("Settings", null, this.__createSettingsMenu());
      var helpMenu = new qx.ui.menubar.Button("Help", null, this.__createHelpMenu());

      menubar.add(fileMenu);
      menubar.add(editMenu);
      menubar.add(searchMenu);
      menubar.add(gotoMenu);
      menubar.add(viewMenu);
      menubar.add(settingsMenu);
      menubar.add(helpMenu);

      var logoutButton = new qx.ui.form.Button();
      logoutButton.setCommand(this._signoutCommand);
      logoutButton.setIcon("icon/16/actions/system-log-out.png");
      logoutButton.setToolTipText("Sign Out");
      menuFrame.add(logoutButton, { flex : 0 });

      frame.add(menuFrame);

      return frame;
    },

    __createFileMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      var newButton = new qx.ui.menu.Button("New", "icon/16/actions/document-new.png", this._newFileCommand);
      var openButton = new qx.ui.menu.Button("Open", "icon/16/actions/document-open.png", this._openCommand);
      var closeButton = new qx.ui.menu.Button("Close");
      var closeAllButton = new qx.ui.menu.Button("Close All");
      var saveButton = new qx.ui.menu.Button("Save", "icon/16/actions/document-save.png", this._saveCommand);
      var saveAsButton = new qx.ui.menu.Button("Save as...", "icon/16/actions/document-save-as.png");
//      var printButton = new qx.ui.menu.Button("Print", "icon/16/actions/document-print.png");

      newButton.addListener("execute", this.__debugButton);
      openButton.addListener("execute", this.__debugButton);
      closeButton.addListener("execute", this.__debugButton);
      saveButton.addListener("execute", this.__debugButton);
      saveAsButton.addListener("execute", this.__debugButton);
//      printButton.addListener("execute", this.__debugButton);

      menu.add(newButton);
      menu.add(openButton);
      menu.add(closeButton);
      menu.add(closeAllButton);
      menu.add(saveButton);
      menu.add(saveAsButton);
//      menu.add(printButton);

      return menu;
    },

    __createEditMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      var undoButton = new qx.ui.menu.Button("Undo", "icon/16/actions/edit-undo.png", this._undoCommand);
      var redoButton = new qx.ui.menu.Button("Redo", "icon/16/actions/edit-redo.png", this._redoCommand);
      var cutButton = new qx.ui.menu.Button("Cut", "icon/16/actions/edit-cut.png", this._cutCommand);
      var copyButton = new qx.ui.menu.Button("Copy", "icon/16/actions/edit-copy.png", this._copyCommand);
      var pasteButton = new qx.ui.menu.Button("Paste", "icon/16/actions/edit-paste.png", this._pasteCommand);

      menu.add(undoButton);
      menu.add(redoButton);
      menu.addSeparator();
      menu.add(cutButton);
      menu.add(copyButton);
      menu.add(pasteButton);

      return menu;
    },

    __createSearchMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      var searchButton = new qx.ui.menu.Button("Search...", "icon/16/actions/system-search.png");
      var nextButton = new qx.ui.menu.Button("Search next...");
      var previousButton = new qx.ui.menu.Button("Search previous...");
      var replaceButton = new qx.ui.menu.Button("Replace");
      var searchFilesButton = new qx.ui.menu.Button("Search in files", "icon/16/actions/system-search.png");
      var replaceFilesButton = new qx.ui.menu.Button("Replace in files");

      previousButton.setEnabled(false);

      var self = this;
      searchButton.addListener("execute", function() { if(self.__curPage) self.__getPageEditor(self.__curPage).search(); });
      nextButton.addListener("execute", this.__debugButton);
      previousButton.addListener("execute", this.__debugButton);
      replaceButton.addListener("execute", this.__debugButton);
      searchFilesButton.addListener("execute", this.__debugButton);
      replaceFilesButton.addListener("execute", this.__debugButton);

      menu.add(searchButton);
      menu.add(nextButton);
      menu.add(previousButton);
      menu.add(replaceButton);
      menu.addSeparator();
      menu.add(searchFilesButton);
      menu.add(replaceFilesButton);

      return menu;
    },

    __createViewMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      return menu;
    },

    __createGotoMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      return menu;
    },

    __createSettingsMenu : function()
    {
      var menu = new qx.ui.menu.Menu;
      var acctButton = new qx.ui.menu.Button("Account", "icon/16/categories/system.png");
      var editorButton = new qx.ui.menu.Button("Editor", "icon/16/apps/utilities-text-editor.png");
      var adminButton = new qx.ui.menu.Button("Users", "icon/16/apps/preferences-users.png");

      menu.add(acctButton);
      menu.add(editorButton);
      menu.add(adminButton);

      return menu;
    },

    __createHelpMenu : function()
    {
      var menu = new qx.ui.menu.Menu;

      var helpButton = new qx.ui.menu.Button("Help", "icon/16/apps/utilities-help.png");
      var aboutButton = new qx.ui.menu.Button("About...");
      aboutButton.setCommand(this._aboutCommand);

      helpButton.addListener("execute", this.__debugButton);
//      aboutButton.addListener("execute", this.__abo);

      menu.add(helpButton);
      menu.addSeparator();
      menu.add(aboutButton);

      return menu;
    },

    __createToolBar : function()
    {
      // create the toolbar
      toolbar = new qx.ui.toolbar.ToolBar();
      toolbar.setPadding(0);

      // create and add Part 1 to the toolbar
      var part1 = new qx.ui.toolbar.Part();
      part1.setPadding(0);
      var newFileButton = new qx.ui.toolbar.Button();
      newFileButton.setIcon("icon/16/actions/document-new.png");
      newFileButton.setCommand(this._newFileCommand);
      var newFolderButton = new qx.ui.toolbar.Button();
      newFolderButton.setIcon("icon/16/actions/folder-new.png");
      newFolderButton.setCommand(this._newFolderCommand);
      var trashButton = new qx.ui.toolbar.Button();
      trashButton.setIcon("icon/16/places/user-trash.png");

      var undoButton = new qx.ui.toolbar.Button();
      undoButton.setIcon("icon/16/actions/edit-undo.png");
      undoButton.setCommand(this._undoCommand);
      var redoButton = new qx.ui.toolbar.Button();
      redoButton.setIcon("icon/16/actions/edit-redo.png");
      redoButton.setCommand(this._redoCommand);

      var copyButton = new qx.ui.toolbar.Button();
      copyButton.setIcon("icon/16/actions/edit-copy.png");
      copyButton.setCommand(this._copyCommand);
      var cutButton = new qx.ui.toolbar.Button();
      cutButton.setIcon("icon/16/actions/edit-cut.png");
      cutButton.setCommand(this._cutCommand);
      var pasteButton = new qx.ui.toolbar.Button();
      pasteButton.setIcon("icon/16/actions/edit-paste.png");
      pasteButton.setCommand(this._pasteCommand);
      part1.add(newFileButton);
      part1.add(newFolderButton);
      part1.add(trashButton);
      part1.add(new qx.ui.toolbar.Separator());
      part1.add(undoButton);
      part1.add(redoButton);
      part1.add(new qx.ui.toolbar.Separator());
      part1.add(copyButton);
      part1.add(cutButton);
      part1.add(pasteButton);
      toolbar.add(part1);    

      return toolbar;  
    },

    __createDummyTree : function()
    {
      var tree = new qx.ui.tree.Tree();
      tree.setDecorator(null);

      var root = new qx.ui.tree.TreeFolder("/");
      root.setOpen(true);
      tree.setRoot(root);

      var te1 = new qx.ui.tree.TreeFolder("Desktop");
      te1.setOpen(true)
      root.add(te1);

      var te1_1 = new qx.ui.tree.TreeFolder("Files");
      var te1_2 = new qx.ui.tree.TreeFolder("Workspace");
      var te1_3 = new qx.ui.tree.TreeFolder("Network");
      var te1_4 = new qx.ui.tree.TreeFolder("Trash");
      te1.add(te1_1, te1_2, te1_3, te1_4);

      var te1_2_1 = new qx.ui.tree.TreeFile("Windows (C:)");
      var te1_2_2 = new qx.ui.tree.TreeFile("Documents (D:)");
      te1_2.add(te1_2_1, te1_2_2);



      var te2 = new qx.ui.tree.TreeFolder("Inbox");

      var te2_1 = new qx.ui.tree.TreeFolder("Presets");
      var te2_2 = new qx.ui.tree.TreeFolder("Sent");
      var te2_3 = new qx.ui.tree.TreeFolder("Trash");

      for (var i=0; i<100; i++) {
        te2_3.add(new qx.ui.tree.TreeFile("Junk #" + i));
      }

      var te2_4 = new qx.ui.tree.TreeFolder("Data");
      var te2_5 = new qx.ui.tree.TreeFolder("Edit");

      te2.add(te2_1, te2_2, te2_3, te2_4, te2_5);

      root.add(te2);

      return tree;
    }
    
  }
});
