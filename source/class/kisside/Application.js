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
 * @asset(qx/icon/${qx.icontheme}/16/places/folder.png)
 * @asset(qx/icon/${qx.icontheme}/16/mimetypes/office-document.png)
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
    "userRpc" : { nullable : true, init : null },
    "fsRpc" : { nullable : true, init : null }
  },

  members :
  {
    __main : null,
    __menuBar : null,
    __toolBar : null,
    __tabView : null,
    __curPage : null,
    __fsPane : null,
    __fsTree : null,
    __fsClipboard : null,
    __uploadDialog : null,

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
      this.setFsRpc(new kisside.FSRpc(this));

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

      this.__fsClipboard = [];
      
      this.__makeMain();
      this.__checkSignedIn();
    },

    debugRpc : function(result, exc)
    {
      if(exc == null) 
      {
        alert("Result of async call: " + JSON.stringify(result));
      } 
      else 
      {
        alert("Exception during async call: " + exc);
      }
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
//        alert("Result of async call: " + JSON.stringify(result));
        if(result !== false)
        {
          this.setUser(result);
          this.__signoutCmd.setEnabled(true);
          this.__setFSTree();
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
          this.__signoutCmd.setEnabled(true);
          this.__setFSTree();
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
      this.__signoutCmd.setEnabled(false);
      var self = this;
      this.getUserRpc().signIn(username, password, this.__onSignIn, this);
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
      this.__signoutCmd.setEnabled(false);
      var self = this;
      this.getUserRpc().signOut(this.__onSignOut, this);
    },
    
    __onDoNewCmd : function(result, exc, filename, basedir, path)
    {
      if(exc === null)
      {
        window.result = result;
        var page = new kisside.PageEditor(filename, basedir, path + "/" + filename, result.stat, result.contents);
        this.__tabView.add(page);
        this.__tabView.setSelection([page]);
        this.__refreshFSTreeSelected();
      }
      else
      {
        var mb = new kisside.MessageBox(this, "Error", "Unable to create new file: " + exc, 
                                         kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
        this.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    },
    
    __onDoNewCmdPrompt : function(basedir, path, filename)
    {
      this.getFsRpc().write(basedir, path + "/" + filename, "", 0, 0, function(result, exc) { this.__onDoNewCmd(result, exc, filename, basedir, path); }, this);
    },
    
    __doNewCmd : function()
    {
      var selection = this.__fsTree.getSelection(); 
      if(selection && selection.length > 0)
      {
        var items = selection.toArray();
        var item = items[0];
        if(item.getStat().getMode() & kisside.FSRpc.S_IFDIR)
        {
          var d = new kisside.PromptDialog("New File Name", "Enter name for new file:", '', 1024, 200, function(text) { this.__onDoNewCmdPrompt(item.getBasedir(), item.getPath(), text); }, this);
          this.getRoot().add(d, {left:20, top:20});
          d.center();
        }
      }
    },
    
    __onDoNewFolderCmd : function(result, exc, filename, basedir, path)
    {
      this.debug("__onDoNewFolderCmd: result = " + JSON.stringify(result) + ", exc = " + JSON.stringify(exc));
      if(exc === null)
      {
        window.result = result;
        this.__refreshFSTreeSelected();
      }
      else
      {
        var mb = new kisside.MessageBox(this, "Error", "Unable to create new folder: " + exc, 
                                         kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
        this.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    },
    
    __onDoNewFolderCmdPrompt : function(basedir, path, filename)
    {
      this.debug("1");
      this.getFsRpc().mkdir(basedir, path + "/" + filename, function(result, exc) { this.debug("2"); this.__onDoNewFolderCmd(result, exc, filename, basedir, path); }, this);
    },
    
    __doNewFolderCmd : function()
    {
      var selection = this.__fsTree.getSelection(); 
      if(selection && selection.length > 0)
      {
        var items = selection.toArray();
        var item = items[0];
        if(item.getStat().getMode() & kisside.FSRpc.S_IFDIR)
        {
          var d = new kisside.PromptDialog("New Folder Name", "Enter name for new folder:", '', 1024, 200, function(text) { this.__onDoNewFolderCmdPrompt(item.getBasedir(), item.getPath(), text); }, this);
          this.getRoot().add(d, {left:20, top:20});
          d.center();
        }
      }
    },
    
    __onDoOpenCmd : function(result, exc, filename, path, basedir)
    {
      if(exc === null)
      {
        window.result = result;
/*        
//        this.debug("result = " + JSON.stringify(result));
        var page = new qx.ui.tabview.Page(filename);
        page.setLayout(new qx.ui.layout.VBox());
        page.getChildControl("button").setToolTipText(basedir + "/" + path); 
        page.setShowCloseButton(true);
        var editor = new kisside.Editor();
  //        editor.addListener("change", function() { self.debug("changed"); if(self.__curPage.getLabel()[0] != '*') self.__curPage.setLabel('*' + self.__curPage.getLabel()); });
        editor.addListener("change", function(e) { this.debug("changed"); if(this.__curPage.getIcon() === '') this.__curPage.setIcon("icon/16/emblems/emblem-important.png"); }, this);
        editor.setText(result.contents);
        var mode = kisside.Editor.getModeForPath(filename);
        if(mode)
          editor.setMode(mode.mode);
  //        page.add(new qx.ui.basic.Label("File #" + i + " with close button."));
        page.add(editor, { flex: 1 });
        page.addListener("focus", function() { this.debug("page focus"); editor.focus(); });
*/
        var page = new kisside.PageEditor(filename, basedir, path, result.stat, result.contents);
        this.__tabView.add(page);
        this.__tabView.setSelection([page]);
      }
      else
      {
        var mb = new kisside.MessageBox(this, "Error", "Unable to open file: " + exc, 
                                         kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
        this.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    },
    
    __doOpenCmd : function()
    {
      var selection = this.__fsTree.getSelection(); 
      if(selection && selection.length > 0)
      {
        var items = selection.toArray();
        var item = items[0];
        if(item.getStat().getMode() & kisside.FSRpc.S_IFREG)
        {
          var page = this.__getPageForPath(item.getBasedir(), item.getPath());
          if(page)
            this.__tabView.setSelection([page]);
          else
            this.getFsRpc().read(item.getBasedir(), item.getPath(), function(result, exc) { this.__onDoOpenCmd(result, exc, item.getLabel(), item.getPath(), item.getBasedir()); }, this);
        }
      }
    },
    
    __onDoSaveMod : function(resp)
    {
      if(resp == kisside.MessageBox.RESP_YES)
      {
        var page = this.__getSelectedPage();
        if(page && page.getChanged())
        {
          var editor = page.getEditor();
          if(editor)
          {
            this.getFsRpc().write(page.getBasedir(), page.getPath(), editor.getText(), page.getStat().mtime, kisside.FSRpc.WRITE_FLAG_OVERWRITE | kisside.FSRpc.WRITE_FLAG_OVERWRITE_MOD, function(result, exc) { this.__onDoSaveCmd(result, exc, page); }, this);
          }
        }
      }
    },
    
    __onDoSaveCmd : function(result, exc, page, newFilename)
    {
      if(exc === null)
      {
        window.result = result;
        page.setChanged(false);
        if(newFilename)
        {
          page.setFilename(newFilename);
        }
        page.setStat(result.stat);
      }
      else
      {
        if(exc.code == kisside.FSRpc.ERR_FILE_EXISTS_MOD)
        {
          var mb = new kisside.MessageBox(this, "Warning", "This file has been modified on disk, overwrite anyway?", 
                                           kisside.MessageBox.FLAG_WARNING | kisside.MessageBox.FLAG_YES_NO, this.__onDoSaveMod, this);
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
        }
        else
        {
          this.debug("code = " + JSON.stringify(exc));
          var mb = new kisside.MessageBox(this, "Error", "Unable to save file: " + exc, 
                                           kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
        }
      }
    },
    
    __doSaveCmd : function()
    {
      var page = this.__getSelectedPage();
      if(page && page.getChanged())
      {
        var editor = page.getEditor();
        if(editor)
        {
          this.getFsRpc().write(page.getBasedir(), page.getPath(), editor.getText(), page.getStat().mtime, kisside.FSRpc.WRITE_FLAG_OVERWRITE, function(result, exc) { this.__onDoSaveCmd(result, exc, page); }, this);
        }
      }
    },
    
    __onDoSaveAsCmd : function(filename, page)
    {
      if(page)
      {
        var editor = page.getEditor();
        if(editor)
        {
          var parts = page.getPath().split('/');
          parts[parts.length - 1] = filename;
          var path = parts.join('/');
          this.debug("new path = " + path);
          this.getFsRpc().write(page.getBasedir(), path, editor.getText(), page.getStat().mtime, kisside.FSRpc.WRITE_FLAG_OVERWRITE, function(result, exc) { this.__onDoSaveCmd(result, exc, page, filename); }, this);
        }
      }
    },
    
    __doSaveAsCmd : function()
    {
      var page = this.__getSelectedPage();
      if(page)
      {
        var editor = page.getEditor();
        if(editor)
        {
          var d = new kisside.PromptDialog("Save File As", "Enter new name for file:", page.getFilename(), 1024, 200, function(text) { this.__onDoSaveAsCmd(text, page); }, this);
          this.getRoot().add(d, {left:20, top:20});
          d.center();
        }
      }
    },
    
    __doCopy : function()
    {
      var selection = this.__fsTree.getSelection().toArray();
      if(selection.length > 0)
      {
        var item = selection[0];
        this.__fsClipboard = [ { basedir : item.getBasedir(), path : item.getPath(), filename : item.getFilename() }];
      }
    },
    
    __doPaste : function()
    {
      
    },
    
    closeUploadDialog : function()
    {
      if(this.__uploadDialog)
      {
        this.__uploadDialog.close();
        this.__uploadDialog = null;
        this.__refreshFSTreeSelected();
      }
    },
    
    __doUpload : function()
    {
      var selection = this.__fsTree.getSelection().toArray();
      if(selection.length > 0)
      {
        var item = selection[0];
        this.__uploadDialog = new kisside.UploadDialog(this, this.getAuthToken(), item.getBasedir(), item.getPath());
        this.getRoot().add(this.__uploadDialog, {left:20, top:20});
        this.__uploadDialog.center();
      }
    },
    
    __onDelete : function(result, exc)
    {
      if(exc === null)
      {
        window.result = result;
        var selection = this.__fsTree.getSelection().toArray();
        if(selection.length > 0)
        {
          var item = selection[0];
          var x = this.__getItemParentForPath(item.getBasedir(), item.getPath());
          this.debug("x = " + JSON.stringify(x));
          if(x)
            this.__refreshFSTreeItem(x.parent);
        }
      }
      else
      {
        var mb = new kisside.MessageBox(this, "Error", "Unable to delete file/folder: " + exc, 
                                         kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
        this.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    },
    
    __onDeleteConfirm : function(resp)
    {
      this.debug("__onDeleteConfirm: resp = " + resp + ", kisside.FSRpc.RESP_OK = " + kisside.FSRpc.RESP_OK);
      if(resp == kisside.MessageBox.RESP_OK)
      {
        var selection = this.__fsTree.getSelection().toArray();
        this.debug("got OK");
        if(selection.length > 0)
        {
          var item = selection[0];
          this.debug("deleting " + item.getLabel());
          if(item.getStat().getMode() & kisside.FSRpc.S_IFREG)
          {
            this.debug("delete file " + item.getPath());
            this.getFsRpc().unlink(item.getBasedir(), item.getPath(), this.__onDelete, this);
          }
          else if(item.getStat().getMode() & kisside.FSRpc.S_IFDIR)
          {
            this.debug("delete folder " + item.getPath());
            this.getFsRpc().rmdir(item.getBasedir(), item.getPath(), this.__onDelete, this);
          }
        }
      }
    },
    
    __doDeleteCmd : function()
    {
      var selection = this.__fsTree.getSelection().toArray();
      if(selection.length > 0)
      {
        var item = selection[0];
        if(item.getStat().getMode() & kisside.FSRpc.S_IFREG)
        {
          var mb = new kisside.MessageBox(this, "Confirm", "Delete file " + item.getLabel() + "?", 
                                           kisside.MessageBox.FLAG_QUESTION | kisside.MessageBox.FLAG_OK_CANCEL, this.__onDeleteConfirm, this);
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
        }
        else if(item.getStat().getMode() & kisside.FSRpc.S_IFDIR)
        {
          var mb = new kisside.MessageBox(this, "Confirm", "Delete folder " + item.getLabel() + "?", 
                                           kisside.MessageBox.FLAG_QUESTION | kisside.MessageBox.FLAG_OK_CANCEL, this.__onDeleteConfirm, this);
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
        }
      }
    },
    
    __onFSTreeChangeSelection : function(e)
    {
      var selection = this.__fsTree.getSelection(); 
      window.selection = selection;
      this.debug("fsTree change selection, selection = " + JSON.stringify(selection));
      
      this.__newFileCmd.setEnabled(false);
      this.__newFolderCmd.setEnabled(false);
      this.__openCmd.setEnabled(false);
      this.__uploadCmd.setEnabled(false);
      this.__cloneCmd.setEnabled(false);
      this.__copyCmd.setEnabled(this.__fsTree.getSelection().length > 0);
      this.__pasteCmd.setEnabled(false);
      this.__deleteCmd.setEnabled(false);
      
      if(selection && selection.length > 0)
      {
        var items = selection.toArray();
        var item = items[0];
        this.debug("got selection");
        if(item.getStat().getMode() & kisside.FSRpc.S_IFREG)
        {
          this.__openCmd.setEnabled(true);
          this.__cloneCmd.setEnabled(true);
          this.__deleteCmd.setEnabled(true);
        }
        else
        {
          this.__newFileCmd.setEnabled(true);
          this.__newFolderCmd.setEnabled(true);
          this.__pasteCmd.setEnabled(this.__fsClipboard.length > 0);
          this.__uploadCmd.setEnabled(true);
          this.__deleteCmd.setEnabled(true);
        }
      }
    },

    __onGetBaseDirs : function(result, exc)
    {
      this.debug("result = " + JSON.stringify(result) + ", exc = " + JSON.stringify(exc));
      if(exc === null)
      {
        this.debug("Response: " + JSON.stringify(result));
        this.__fsTree = this.__createTree(result);
//        this.__fsTree.addListener("changeSelection", this.__onFSTreeChangeSelection, this);
        this.__fsTree.getSelection().addListener("change", this.__onFSTreeChangeSelection, this);
        this.__fsPane.add(this.__fsTree);
      }
      else
        alert("Error getting base dirs: " + exc);
    },
    
    __setFSTree : function()
    {
      this.debug("setFSTree");
      if(this.__fsTree)
      {
        this.__fsPane.remove(this.__fsTree);
        this.__fsTree = null;
      }
      this.getFsRpc().listdir("", "", false, this.__onGetBaseDirs, this);
    },
    
    __refreshFSTreeSelected : function()
    {
      this.debug("__refreshFSTreeSelected");
      var selection = this.__fsTree.getSelection(); 
      if(selection && selection.length > 0)
      {
        var items = selection.toArray();
        var item = items[0];
        this.__refreshFSTreeItem(item);
      }
    },
    
    __refreshFSTreeItem : function(item)
    {
      this.debug("__refreshFSTreeItem");
      this.debug("filename = " + item.getLabel() + ", mode = " + item.getStat().getMode());
      if(item.getStat().getMode() & kisside.FSRpc.S_IFDIR)
      {
        this.debug("is a folder");
        item.setLoaded(false);
        var node = [{
          label: "Loading",
          icon: "loading"
        }];
        var model = qx.data.marshal.Json.createModel(node, true);
        item.setChildren(model);
        this.__fsTree.closeNode(item);
        this.__fsTree.openNode(item);
      }
      else
        this.debug("not a folder");
    },
    
    __getItemParentForPath : function(basedir, path, curnode)
    {
      if(!curnode)
      {
        curnode = this.__fsTree.getModel();
        if(curnode && curnode.getChildren().length)
        {
          var children = curnode.getChildren().toArray();
          for(var i = 0; i < children.length; i++)
            if(children[i].getBasedir() == basedir)
            {
              this.debug("got basedir " + children[i].getBasedir());
              return this.__getItemParentForPath(basedir, path, curnode);
            }
        }
      }
      else
      {
        var children = curnode.getChildren().toArray();
        window.children = children;
        for(var i = 0; i < children.length; i++)
        {
          if("getPath" in children[i])
            this.debug("checking path " + children[i].getPath() + " against " + path);
          else
            this.debug("checking " + children[i].getLabel() + " against " + path);
          if("getPath" in children[i] && children[i].getPath() == path)
            return { parent : curnode, item : children[i] };
          else if("getChildren" in children[i] && children[i].getChildren().length && path.startsWith(children[i].getPath()))
          {
            var retval = this.__getItemParentForPath(basedir, path, children[i]);
            if(retval)
              return retval;
          }
        }
      }
      return null;
    },
    
    __onTabViewSelect : function(e)
    {
      this.__curPage = this.__getSelectedPage(); 
      if(this.__curPage && this.__curPage.getChildren() && this.__curPage.getChildren()[0]) 
      {
        this.__saveCmd.setEnabled(true);
        this.__saveAsCmd.setEnabled(true);
        this.__curPage.getChildren()[0].focus(); 
      }
      else
      {
        this.__saveCmd.setEnabled(false);
        this.__saveAsCmd.setEnabled(false);
      }
    },
    
    __onPageClose : function(e)
    {
//      this.debug("__onPageClose");
//      window.e = e;
      var page = e.getData();
      if(page.canClose())
      {
        if(page.getChanged())
        {
          var mb = new kisside.MessageBox(this, "Confirm", "Document has been modified, close without saving?", 
                                           kisside.MessageBox.FLAG_WARNING | kisside.MessageBox.FLAG_OK_CANCEL, function(resp) {
            if(resp == kisside.MessageBox.RESP_OK)
              this.__tabView.remove(page);
          }, this);
          this.getRoot().add(mb, {left:20, top:20});
          mb.center();
          mb.focus();
          
        }
        else
          this.__tabView.remove(page);
      }
    },
    
    __makeMain : function()
    {
      this.__createCommands();

      this.__main = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      this.__main.getLayout().setSpacing(0);
      this.__menuBar = this.__createMenuBar();
      this.__main.add(this.__menuBar);

      this.__toolBar = this.__createToolBar();
      this.__main.add(this.__toolBar);

      this.__fsPane = new qx.ui.container.Composite(new qx.ui.layout.Grow()).set({
        width : 300,
//        height: 100,
        decorator : "main"
      });
//      var tree = this.__createVDummyTree();
//      this.__fsPane.add(tree);

      var editorPane = new qx.ui.container.Composite(new qx.ui.layout.Grow()).set({
//        padding : 10,
//        maxWidth : 450,
        decorator : "main"
      });
      this.__tabView = new kisside.EditorTabView();
      this.__tabView.addListener("page-close", this.__onPageClose, this);
      this.__tabView.addListener("changeSelection", this.__onTabViewSelect, this);

      this.__tabView.setContentPadding(0, 0, 0, 0);
      editorPane.add(this.__tabView);

      var pane = new qx.ui.splitpane.Pane("horizontal");
      pane.add(this.__fsPane, 0);
      pane.add(editorPane, 1);
      this.__main.add(pane, { flex: 1 });

      this.getRoot().add(this.__main, {edge : 0});
    },

    __getSelectedPage : function()
    {
      var sel = this.__tabView.getSelection();
      if(sel)
      {
        return sel[0];
      }
      return null;
    },
    
    __getPageForPath : function(basedir, path)
    {
      var matches = this.__tabView.getChildren().filter(function(item, index, array) { return item.getBasedir() == basedir && item.getPath() == path; }, this);
      if(matches.length > 0)
        return matches[0];
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

      this.__newFileCmd = new qx.ui.command.Command("Ctrl+N");
      this.__newFileCmd.setLabel("New File");
      this.__newFileCmd.setIcon("icon/16/actions/document-new.png")
      this.__newFileCmd.addListener("execute", this.__doNewCmd, this);
      this.__newFileCmd.setToolTipText("New File");
      this.__newFileCmd.setEnabled(false);

      this.__newFolderCmd = new qx.ui.command.Command("Alt+N");
      this.__newFolderCmd.setLabel("New Folder");
      this.__newFolderCmd.setIcon("icon/16/actions/folder-new.png")
      this.__newFolderCmd.addListener("execute", this.__doNewFolderCmd, this);
      this.__newFolderCmd.setToolTipText("New Folder");
      this.__newFolderCmd.setEnabled(false);

      this.__deleteCmd = new qx.ui.command.Command("");
      this.__deleteCmd.setLabel("Delete");
      this.__deleteCmd.setIcon("icon/16/places/user-trash.png")
      this.__deleteCmd.addListener("execute", this.__doDeleteCmd, this);
      this.__deleteCmd.setToolTipText("Delete File or Folder");
      this.__deleteCmd.setEnabled(false);

      this.__openCmd = new qx.ui.command.Command("Ctrl+O");
      this.__openCmd.setLabel("Open File");
      this.__openCmd.setIcon("icon/16/actions/document-open.png");
      this.__openCmd.addListener("execute", this.__doOpenCmd, this);
      this.__openCmd.setToolTipText("Open File");
      this.__openCmd.setEnabled(false);

      this.__closeCmd = new qx.ui.command.Command("Ctrl+W");
      this.__closeCmd.setLabel("Close File");
//      this.__closeCmd.setIcon("icon/16/actions/document-open.png");
      this.__closeCmd.addListener("execute", this.__debugCommand);
      this.__closeCmd.setToolTipText("Close File");
      this.__closeCmd.setEnabled(false);

      this.__closeAllCmd = new qx.ui.command.Command("");
      this.__closeAllCmd.setLabel("Close All Files");
//      this.__closeAllCmd.setIcon("icon/16/actions/document-open.png");
      this.__closeAllCmd.addListener("execute", this.__debugCommand);
      this.__closeAllCmd.setToolTipText("Close All Files");
      this.__closeAllCmd.setEnabled(false);

      this.__saveCmd = new qx.ui.command.Command("Ctrl+S");
      this.__saveCmd.setLabel("Save File");
      this.__saveCmd.setIcon("icon/16/actions/document-save.png");
      this.__saveCmd.addListener("execute", this.__doSaveCmd, this);
      this.__saveCmd.setToolTipText("Save File");
      this.__saveCmd.setEnabled(false);

      this.__saveAsCmd = new qx.ui.command.Command("Ctrl+Alt+S");
      this.__saveAsCmd.setLabel("Save File As");
      this.__saveAsCmd.setIcon("icon/16/actions/document-save-as.png");
      this.__saveAsCmd.addListener("execute", this.__doSaveAsCmd, this);
      this.__saveAsCmd.setToolTipText("Save File As");
      this.__saveAsCmd.setEnabled(false);

      this.__uploadCmd = new qx.ui.command.Command("Ctrl+U");
      this.__uploadCmd.setLabel("Upload File");
      this.__uploadCmd.setIcon("icon/16/actions/go-up.png");
      this.__uploadCmd.addListener("execute", this.__doUpload, this);
      this.__uploadCmd.setToolTipText("Upload File");
      this.__uploadCmd.setEnabled(false);

      this.__renameCmd = new qx.ui.command.Command("");
      this.__renameCmd.setLabel("Rename...");
//      this.__renameCmd.setIcon("icon/16/actions/go-up.png");
      this.__renameCmd.addListener("execute", this.__debugCommand);
      this.__renameCmd.setToolTipText("Rename...");

      this.__cloneCmd = new qx.ui.command.Command("");
      this.__cloneCmd.setLabel("Clone");
//      this.__cloneCmd.setIcon("icon/16/actions/go-up.png");
      this.__cloneCmd.addListener("execute", this.__debugCommand);
      this.__cloneCmd.setToolTipText("Clone");

      this.__copyCmd = new qx.ui.command.Command("");
      this.__copyCmd.setLabel("Copy");
//      this.__cloneCmd.setIcon("icon/16/actions/go-up.png");
      this.__copyCmd.addListener("execute", this.__doCopy, this);
      this.__copyCmd.setToolTipText("Copy");

      this.__pasteCmd = new qx.ui.command.Command("");
      this.__pasteCmd.setLabel("Paste");
//      this.__cloneCmd.setIcon("icon/16/actions/go-up.png");
      this.__pasteCmd.addListener("execute", this.__doPaste, this);
      this.__pasteCmd.setToolTipText("Paste");

      this.__undoCmd = new qx.ui.command.Command("Ctrl+Z");
      this.__undoCmd.setLabel("Undo Edit");
      this.__undoCmd.setIcon("icon/16/actions/edit-undo.png")
      this.__undoCmd.addListener("execute", function() 
      {       
        var page = this.__getSelectedPage();
        if(page)
        {
          var editor = page.getEditor();
          if(editor)
            editor.undo()
        }
      }, this);
      this.__undoCmd.setToolTipText("Undo Edit");

      this.__redoCmd = new qx.ui.command.Command("Ctrl+Y");
      this.__redoCmd.setLabel("Redo Edit");
      this.__redoCmd.setIcon("icon/16/actions/edit-redo.png")
      this.__redoCmd.addListener("execute", function() 
      {       
        var page = this.__getSelectedPage();
        if(page)
        {
          var editor = page.getEditor();
          if(editor)
            editor.redo()
        }
      }, this);
      this.__redoCmd.setToolTipText("Redo Edit");

      this.__findCmd = new qx.ui.command.Command("Ctrl+F");
      this.__findCmd.setLabel("Find...");
      this.__findCmd.setIcon("icon/16/actions/edit-find.png")
      this.__findCmd.addListener("execute", function() { if(self.__curPage) self.__getPageEditor(self.__curPage).find(); });
      this.__findCmd.setToolTipText("Find");

      this.__findNextCmd = new qx.ui.command.Command("F3");
      this.__findNextCmd.setLabel("Find Next");
//      this.__searchNextCmd.setIcon("icon/16/actions/system-search.png")
      this.__findNextCmd.addListener("execute", function() { if(self.__curPage) self.__getPageEditor(self.__curPage).findNext(); });
      this.__findNextCmd.setToolTipText("Find Next");

      this.__findPrevCmd = new qx.ui.command.Command("Shift+F3");
      this.__findPrevCmd.setLabel("Find Previous");
//      this.__searchPrevCmd.setIcon("icon/16/actions/system-search.png")
      this.__findPrevCmd.addListener("execute", function() { if(self.__curPage) self.__getPageEditor(self.__curPage).findPrev(); });
      this.__findPrevCmd.setToolTipText("Find Previous");

      this.__replaceCmd = new qx.ui.command.Command("Ctrl+H");
      this.__replaceCmd.setLabel("Replace...");
//      this.__searchNextCmd.setIcon("icon/16/actions/system-search.png")
      this.__replaceCmd.addListener("execute", function() { if(self.__curPage) self.__getPageEditor(self.__curPage).replace(); });
      this.__replaceCmd.setToolTipText("Replace...");
      
      this.__gotoCmd = new qx.ui.command.Command("Ctrl+G");
      this.__gotoCmd.setLabel("Goto...");
//      this.__searchNextCmd.setIcon("icon/16/actions/system-search.png")
      this.__gotoCmd.addListener("execute", this.__debugCommand);
      this.__gotoCmd.setToolTipText("Goto Line");
      
      this.__acctCmd = new qx.ui.command.Command("");
      this.__acctCmd.setLabel("Account...");
      this.__acctCmd.setIcon("icon/16/categories/system.png")
      this.__acctCmd.addListener("execute", this.__debugCommand);
      this.__acctCmd.setToolTipText("Account Settings");

      this.__editorCmd = new qx.ui.command.Command("");
      this.__editorCmd.setLabel("Editor...");
      this.__editorCmd.setIcon("icon/16/apps/preferences-users.png")
      this.__editorCmd.addListener("execute", this.__debugCommand);
      this.__editorCmd.setToolTipText("User Administration");

      this.__usersCmd = new qx.ui.command.Command("");
      this.__usersCmd.setLabel("Users...");
      this.__usersCmd.setIcon("icon/16/apps/utilities-text-editor.png")
      this.__usersCmd.addListener("execute", this.__debugCommand);
      this.__usersCmd.setToolTipText("Editor Settings");

      this.__refreshCmd = new qx.ui.command.Command("Ctrl+R");
      this.__refreshCmd.setLabel("Refresh");
      this.__refreshCmd.setIcon("icon/16/actions/view-refresh.png")
      this.__refreshCmd.addListener("execute", this.__refreshFSTreeSelected, this);
      this.__refreshCmd.setToolTipText("Redo Edit");

      this.__signoutCmd = new qx.ui.command.Command();
      this.__signoutCmd.setLabel("Sign Out");
//      this.__signoutCmd.setIcon("icon/16/actions/view-refresh.png")
      this.__signoutCmd.addListener("execute", function() { self.__signOut(); });
      this.__signoutCmd.setToolTipText("Sign Out");
      this.__signoutCmd.setEnabled(false);

      this.__helpCmd = new qx.ui.command.Command("F1");
      this.__helpCmd.setLabel("Help");
      this.__helpCmd.setIcon("icon/16/apps/utilities-help.png")
      this.__helpCmd.addListener("execute", this.__debugCommand);
      this.__helpCmd.setToolTipText("Help");

      this.__aboutCmd = new qx.ui.command.Command();
      this.__aboutCmd.setLabel("About");
//      this.__aboutCmd.setIcon("icon/16/actions/view-refresh.png")
      this.__aboutCmd.addListener("execute", this.__about, this);
      this.__aboutCmd.setToolTipText("About KISSIDE");
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
      var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow());
      var menuFrame = new qx.ui.container.Composite(new qx.ui.layout.HBox());

      var menubar = new qx.ui.menubar.MenuBar();
      menubar.setWidth(600);
      menuFrame.add(menubar, { flex: 1 });

      var fileMenu = new qx.ui.menubar.Button("File", null, this.__createFileMenu());
      var editMenu = new qx.ui.menubar.Button("Edit", null, this.__createEditMenu());
      var findMenu = new qx.ui.menubar.Button("Find", null, this.__createFindMenu());
      var gotoMenu = new qx.ui.menubar.Button("Goto", null, this.__createGotoMenu());
      var viewMenu = new qx.ui.menubar.Button("View", null, this.__createViewMenu());
      var settingsMenu = new qx.ui.menubar.Button("Settings", null, this.__createSettingsMenu());
      var helpMenu = new qx.ui.menubar.Button("Help", null, this.__createHelpMenu());

      menubar.add(fileMenu);
      menubar.add(editMenu);
      menubar.add(findMenu);
      menubar.add(gotoMenu);
      menubar.add(viewMenu);
      menubar.add(settingsMenu);
      menubar.add(helpMenu);

      var logoutButton = new qx.ui.form.Button();
      logoutButton.setCommand(this.__signoutCmd);
      logoutButton.setIcon("icon/16/actions/system-log-out.png");
      logoutButton.setLabel(null);
      logoutButton.setToolTipText("Sign Out");
      menuFrame.add(logoutButton, { flex : 0 });

      frame.add(menuFrame);

      return frame;
    },

    __createFileMenu : function()
    {
      var menu = new qx.ui.menu.Menu();

      var newFileButton = new qx.ui.menu.Button("", "", this.__newFileCmd);
      var newFolderButton = new qx.ui.menu.Button("", "", this.__newFolderCmd);
      var openButton = new qx.ui.menu.Button("", "", this.__openCmd);
      var closeButton = new qx.ui.menu.Button("", "", this.__closeCmd);
      var closeAllButton = new qx.ui.menu.Button("", "", this.__closeAllCmd);
      var saveButton = new qx.ui.menu.Button("", "", this.__saveCmd);
      var saveAsButton = new qx.ui.menu.Button("", "", this.__saveAsCmd);
      var uploadButton = new qx.ui.menu.Button("", "", this.__uploadCmd);
//      var printButton = new qx.ui.menu.Button("Print", "icon/16/actions/document-print.png");

      menu.add(newFileButton);
      menu.add(newFolderButton);
      menu.add(openButton);
      menu.add(closeButton);
      menu.add(closeAllButton);
      menu.add(saveButton);
      menu.add(saveAsButton);
      menu.add(uploadButton);
//      menu.add(printButton);

      return menu;
    },

    __createEditMenu : function()
    {
      var menu = new qx.ui.menu.Menu();

      var undoButton = new qx.ui.menu.Button("", "", this.__undoCmd);
      var redoButton = new qx.ui.menu.Button("", "", this.__redoCmd);

      menu.add(undoButton);
      menu.add(redoButton);

      return menu;
    },

    __createFindMenu : function()
    {
      var menu = new qx.ui.menu.Menu();

      var findButton = new qx.ui.menu.Button("", "", this.__findCmd);
      var nextButton = new qx.ui.menu.Button("", "", this.__findNextCmd);
      var previousButton = new qx.ui.menu.Button("", "", this.__findPrevCmd);
      var replaceButton = new qx.ui.menu.Button("", "", this.__replaceCmd);

      menu.add(findButton);
      menu.add(nextButton);
      menu.add(previousButton);
      menu.addSeparator();
      menu.add(replaceButton);

      return menu;
    },

    __createViewMenu : function()
    {
      var menu = new qx.ui.menu.Menu();

      return menu;
    },

    __createGotoMenu : function()
    {
      var menu = new qx.ui.menu.Menu();
      
      var gotoButton = new qx.ui.menu.Button("", "", this.__gotoCmd);
      
      menu.add(gotoButton);

      return menu;
    },

    __createSettingsMenu : function()
    {
      var menu = new qx.ui.menu.Menu();
      
      var acctButton = new qx.ui.menu.Button("", "", this.__acctCmd);
      var editorButton = new qx.ui.menu.Button("", "", this.__editorCmd);
      var adminButton = new qx.ui.menu.Button("", "", this.__usersCmd);

      menu.add(acctButton);
      menu.add(editorButton);
      menu.add(adminButton);

      return menu;
    },

    __createHelpMenu : function()
    {
      var menu = new qx.ui.menu.Menu();

      var helpButton = new qx.ui.menu.Button("", "", this.__helpCmd);
      var aboutButton = new qx.ui.menu.Button("", "", this.__aboutCmd);

      menu.add(helpButton);
      menu.addSeparator();
      menu.add(aboutButton);

      return menu;
    },

    __createToolBar : function()
    {
      // create the toolbar
      var toolbar = new qx.ui.toolbar.ToolBar();
      toolbar.setPadding(0);

      // create and add Part 1 to the toolbar
      var part1 = new qx.ui.toolbar.Part();
      part1.setPadding(0);
      var newFileButton = new qx.ui.toolbar.Button("", "", this.__newFileCmd);
      newFileButton.setLabel(null);
      var newFolderButton = new qx.ui.toolbar.Button("", "", this.__newFolderCmd);
      newFolderButton.setLabel(null);
      var openButton = new qx.ui.toolbar.Button("", "", this.__openCmd);
      openButton.setLabel(null);
      var deleteButton = new qx.ui.toolbar.Button("", "", this.__deleteCmd);
      deleteButton.setLabel(null);
      var uploadButton = new qx.ui.toolbar.Button("", "", this.__uploadCmd);
      uploadButton.setLabel(null);

      var undoButton = new qx.ui.toolbar.Button("", "", this.__undoCmd);
      undoButton.setLabel(null);
      var redoButton = new qx.ui.toolbar.Button("", "", this.__redoCmd);
      redoButton.setLabel(null);

      var refreshButton = new qx.ui.toolbar.Button("", "", this.__refreshCmd);
      refreshButton.setLabel(null);

      part1.add(newFileButton);
      part1.add(newFolderButton);
      part1.add(openButton);
      part1.add(deleteButton);
      part1.add(uploadButton);
      part1.add(new qx.ui.toolbar.Separator());
      part1.add(undoButton);
      part1.add(redoButton);
      part1.add(new qx.ui.toolbar.Separator());
      part1.add(refreshButton);
      toolbar.add(part1);    

      return toolbar;  
    },
    
      //right click handler 
    __onFSContextMenu : function(e) 
    { 
      var item = e.getTarget(); 
      var selection = this.__fsTree.getSelection(); 
      selection.setItem(0, item.getModel()); 

      var contextMenu = new qx.ui.menu.Menu(); 
      contextMenu.setMinWidth(120); 
      var newFileButton = new qx.ui.menu.Button("", "", this.__newFileCmd);
      var newFolderButton = new qx.ui.menu.Button("", "", this.__newFolderCmd);
      var openButton = new qx.ui.menu.Button("", "", this.__openCmd);
      var deleteButton = new qx.ui.menu.Button("", "", this.__deleteCmd);
      var uploadButton = new qx.ui.menu.Button("", "", this.__uploadCmd);
      var refreshButton = new qx.ui.menu.Button("", "", this.__refreshCmd); 
      var renameButton = new qx.ui.menu.Button("", "", this.__renameCmd); 
      var copyButton = new qx.ui.menu.Button("", "", this.__copyCmd); 
      var pasteButton = new qx.ui.menu.Button("", "", this.__pasteCmd); 
      var cloneButton = new qx.ui.menu.Button("", "", this.__cloneCmd); 

      contextMenu.add(newFileButton); 
      contextMenu.add(newFolderButton); 
      contextMenu.add(openButton); 
      contextMenu.add(deleteButton); 
      contextMenu.add(uploadButton); 
      contextMenu.add(renameButton); 
      contextMenu.add(cloneButton); 
      contextMenu.addSeparator(); 
      contextMenu.add(copyButton); 
      contextMenu.add(pasteButton); 
      contextMenu.addSeparator(); 
      contextMenu.add(refreshButton); 

      contextMenu.openAtPointer(e); 

      contextMenu.addListenerOnce("disappear", function(e) { 
         contextMenu.getChildren().forEach(function(w) { 
           w.dispose(); 
         }); 
         contextMenu.dispose(); 
      }); 
    },
    
    __onDblClickFSItem : function(e) 
    { 
      var item = e.getTarget(); 
      this.debug(item.getModel().getPath() + '/' + item.getModel().getLabel()); 
      this.__doOpenCmd();
    }, 

    __createTree : function(basedirs)
    {
      var root = {
        label: "Root",
        children: [],
        icon: "folder",
        loaded: true,
        basedir: "",
        path: "",
        stat: null
      };
      root = qx.data.marshal.Json.createModel(root, true)
      this.__addTreeChildren(root, basedirs, "");

      var tree = new qx.ui.tree.VirtualTree(root, "label", "children");
      this.getRoot().add(tree, {edge: 20});

      tree.setIconPath("icon");
      tree.setIconOptions({
        converter : function(value, model)
        {
          if (value == "default") {
            if (model.getChildren != null) {
              return "icon/16/places/folder.png";
            } else {
              return "icon/16/mimetypes/text-plain.png";
            }
          } else {
            return "resource/kisside/loading22.gif";
          }
        }
      });
      
/*      
      //right click handler 
      function _onContextMenu(e) { 
         var item = e.getTarget(); 
         var selection = tree.getSelection(); 
         selection.setItem(0, item.getModel()); 

         var contextMenu = new qx.ui.menu.Menu(); 
         contextMenu.setMinWidth(120); 
         var newButton = new qx.ui.menu.Button("New"); 
         var editButton = new qx.ui.menu.Button("Edit"); 

         contextMenu.add(editButton); 
         contextMenu.add(newButton); 

         contextMenu.openAtPointer(e); 

         contextMenu.addListenerOnce("disappear", function(e) { 
           contextMenu.getChildren().forEach(function(w) { 
             w.dispose(); 
           }); 
           contextMenu.dispose(); 
         }); 
      } 
*/      
      var self = this;
      var delegate = {
        configureItem : function(item) 
        {
          item.addListener("dblclick", function(e) { self.__onDblClickFSItem(e); }); 
          item.addListener("contextmenu", function(e) { self.__onFSContextMenu(e); });
        },
        bindItem : function(controller, item, index)
        {
          controller.bindDefaultProperties(item, index);

          controller.bindProperty("", "open",
          {
            converter : function(value, model, source, target)
            {
              self.debug("open - converter");
              var isOpen = target.isOpen();
              if (isOpen && !value.getLoaded())
              {
                value.setLoaded(true);
                self.debug("value = " + JSON.stringify(value));
//                var path = value.getLabel() == value.getBasedir() ? "" : value.getLabel();
                self.getFsRpc().listdir(value.getBasedir(), value.getPath(), false, function(result, exc)
                {
                  if(exc === null)
                  {
                    tree.setAutoScrollIntoView(false);
                    value.getChildren().removeAll();
                    self.__addTreeChildren(value, result);
                    tree.setAutoScrollIntoView(true);
                  }
                  else
                    alert("Error retrieving directory: " + exc);
                });
              }
//              else
//                self.debug("dbl clicked " + value.getLabel());

              return isOpen;
            }
          }, item, index);
        }
      };
      tree.setDelegate(delegate);
      
      tree.setHideRoot(true);
      tree.setDroppable(true);
      tree.setDraggable(true);
      
/*      
      var menu = new qx.ui.menu.Menu;
      var refreshButton = new qx.ui.menu.Button("New", "icon/16/actions/document-new.png", this._newFileCommand);
//      var openButton = new qx.ui.menu.Button("Open", "icon/16/actions/document-open.png", this._openCommand);
//      var closeButton = new qx.ui.menu.Button("Close");
      refreshButton.addListener("execute", this.__debugButton);
      menu.add(refreshButton);
      tree.setContextMenu(menu);
*/      
/*      
      // Add a context menu to the tree 
      var tree_context = new qx.ui.menu.Menu; 
      var cmd3 = new qx.event.Command(); 
      cmd3.addListener('execute', function(){alert("Tree Context 1")}, this ); 
      tree_context.add( new qx.ui.menu.Button("Tree Context 1", null, cmd3) ); 
      var cmd4 = new qx.event.Command(); 
      cmd4.addListener('execute', function(){alert("Tree Context 2")}, this ); 
      tree_context.add( new qx.ui.menu.Button("Tree Context 2", null, cmd4) ); 
      tree.setContextMenu( tree_context ); 
*/      
      
      return tree;
    },
    
    __addTreeChildren : function(parent, dirs, basedir)
    {
      for(var i = 0; i < dirs.length; i++) 
      {
        var node = {
          label: dirs[i].name,
          icon: "default",
          loaded: true,
          basedir: (basedir === "") ? dirs[i].name : parent.getBasedir(),
          path: (basedir === "") ? "" : parent.getPath() + ((parent.getPath() !== "") ? "/" + dirs[i].name : dirs[i].name),
          stat: dirs[i].stat
        }

        this.debug(dirs[i].name + ": mode = " + dirs[i].stat.mode);
        if(dirs[i].stat.mode & kisside.FSRpc.S_IFDIR)
        {
          node.loaded = false;
          node.children = [{
            label: "Loading",
            icon: "loading"
          }];
        }
        
        var model = qx.data.marshal.Json.createModel(node, true);
        parent.getChildren().push(model);
        if(dirs[i].entries)
          this.__addTreeChildren(model, dirs[i].entries, model.getBasedir());
      }
    }, 
    
    count : 0,
    __createVDummyTree : function()
    {
      var root = {
        label: "Root",
        children: [],
        icon: "default",
        loaded: true
      };
      root = qx.data.marshal.Json.createModel(root, true)
      this.createRandomData(root);

      var tree = new qx.ui.tree.VirtualTree(root, "label", "children");
      this.getRoot().add(tree, {edge: 20});

      tree.setIconPath("icon");
      tree.setIconOptions({
        converter : function(value, model)
        {
          if(value == "default") 
          {
            if(model.getChildren != null) 
            {
              return "icon/16/places/folder.png";
            } 
            else 
            {
              return "icon/16/mimetypes/office-document.png";
            }
          } 
          else 
          {
            return "resource/kisside/loading22.gif";
          }
        }
      });

      var that = this;
      var delegate = {
        bindItem : function(controller, item, index)
        {
          controller.bindDefaultProperties(item, index);

          controller.bindProperty("", "open",
          {
            converter : function(value, model, source, target)
            {
              var isOpen = target.isOpen();
              if(isOpen && !value.getLoaded())
              {
                value.setLoaded(true);

                qx.event.Timer.once(function()
                {
                  tree.setAutoScrollIntoView(false);
                  value.getChildren().removeAll();
                  this.createRandomData(value);
                  tree.setAutoScrollIntoView(true);
                }, that, 1000);
              }

              return isOpen;
            }
          }, item, index);
        }
      };
      tree.setDelegate(delegate);
      
      tree.setHideRoot(true);
      
      return tree;
    },

    createRandomData : function(parent)
    {
      var items = parseInt(Math.random() * 50);

      for (var i = 0; i < items; i++) {
        var node = {
          label: "Item " + this.count++,
          icon: "default",
          loaded: true
        }

        if (Math.random() > 0.3)
        {
          node["loaded"] = false;
          node["children"] = [{
            label: "Loading",
            icon: "loading"
          }];
        }

        parent.getChildren().push(qx.data.marshal.Json.createModel(node, true));
      }
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
