/**
 * Editor settings dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.UsersDialog",
{
  extend: qx.ui.window.Window,

  construct : function(app, users)
  {
    this.__app = app;
    this.__users = users;
    this.base(arguments, "Users");

    var layout = new qx.ui.layout.VBox(5);
    layout.setAlignX("right");
    this.setLayout(layout);
    this.setModal(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(false);

//    var pane = new qx.ui.container.Composite(new qx.ui.layout.Canvas);
//    this.add(pane, )
//      win.setShowStatusbar(true);
//      win.setStatus("Demo loaded");

    this.__userList = new qx.ui.form.List();
    this.__userList.set({ width: 200, height: 200, selectionMode : "one" });
    this.__userList.addListener("dblclick", this.__doEditUser, this);
    this.__fillUserList();
    this.add(this.__userList);

    var actionPane = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
    var editButton = new qx.ui.form.Button("Edit...", "");
    editButton.addListener("execute", this.__doEditUser, this);
    actionPane.add(editButton);
    var addButton = new qx.ui.form.Button("Add...", "icon/16/actions/list-add.png");
    addButton.addListener("execute", this.__doAddUser, this);
    actionPane.add(addButton);
    var delButton = new qx.ui.form.Button("Delete...", "icon/16/actions/list-remove.png");
    delButton.addListener("execute", this.__doDelUser, this);
    actionPane.add(delButton);
    this.add(actionPane);

    var closePane = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    closePane.getLayout().setAlignX("right");
    closePane.setPaddingTop(20);
    var closeButton = new qx.ui.form.Button("Close", "icon/16/actions/dialog-close.png");
    closePane.add(closeButton);
    this.add(closePane);

    closeButton.addListener("execute", function() { this.close(); }, this);
    this.addListener("appear",function() { this.__userList.focus(); }, this);

    this.addListener("keypress", function(e) { 
      if(e.getKeyIdentifier() == "Escape") 
      {
        closeButton.focus();     
        closeButton.execute();
      } 
    }, this);

    this.open();
  },

  destruct : function()
  {
  },

  members :
  {
    __app : null,
    __users : null,
    __userList : null,
    
    __fillUserList : function()
    {
      this.__userList.removeAll();
      for(var item, i = 0; i < this.__users.length; i++)
      {
        item = new qx.ui.form.ListItem(this.__users[i].username, "", this.__users[i]);
        this.__userList.add(item);
      }
    },
    
    __onUpdateUserList : function(result, exc)
    {
      this.debug("__onUpdateUserList");
      if(exc === null)
      {
        this.__users = result;
        this.__fillUserList();
      }
      else
        this.debug("failed to update user list");
    },
    
    __updateUserList : function()
    {
      this.__app.getUserRpc().getAll(this.__onUpdateUserList, this);      
    },
    
    __getSelectedUser : function()
    {
      var user = null;
      var selection = this.__userList.getSelection(); 
      if(selection && selection.length > 0)
      {
        window.selection = selection;
        user = selection[0].getModel();
      } 
      return user;
    },
    
    __doEditUser : function()
    {
      this.debug("__doEditUser");
      var user = this.__getSelectedUser();
      if(user)
      {
        var dialog = new kisside.UserDialog(this.__app, user, function(user) { 
            qx.event.Timer.once(this.__updateUserList, this, 1000); // this is not really a good way to do this
            this.__app.__updateUser(user);
          }, this);
        this.__app.getRoot().add(dialog, {left:20, top:20});
        dialog.center();
      }
    },
    
    __doAddUser : function()
    {
      var dialog = new kisside.UserDialog(this.__app, null, function(user) { 
          qx.event.Timer.once(this.__updateUserList, this, 1000); // this is not really a good way to do this
          this.__app.__updateUser(user);
        }, this);
      this.__app.getRoot().add(dialog, {left:20, top:20});
      dialog.center();
    },
    
    __onDelUser : function(result, exc)
    {
      if(exc === null)
      {
        var user = this.__getSelectedUser();
        if(user)
        {
          for(var i = 0; i < this.__users.length; i++)
            if(this.__users[i].username == user.username)
              this.__users.splice(i, 1);
          this.__fillUserList();
        }
      }
      else
      {
        var mb = new kisside.MessageBox(this, "Error", "Unable to delete user: " + exc, 
                                         kisside.MessageBox.FLAG_ERROR | kisside.MessageBox.FLAG_OK);
        this.__app.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    },
    
    __onConfirmDelUser : function(resp)
    {
      this.debug("__onConfirmDelUser: resp = " + resp + ", kisside.FSRpc.RESP_OK = " + kisside.FSRpc.RESP_OK);
      if(resp == kisside.MessageBox.RESP_OK)
      {
        var user = this.__getSelectedUser();
        if(user)
        {
          this.__app.getUserRpc().remove(user.username, this.__onDelUser, this);
        }
      }
    },
    
    __doDelUser : function()
    {
      this.debug("__doDelUser");
      var user = this.__getSelectedUser();
      if(user)
      {
        var mb = new kisside.MessageBox(this, "Confirm", "Delete user " + user.username + "?", 
                                         kisside.MessageBox.FLAG_QUESTION | kisside.MessageBox.FLAG_OK_CANCEL, this.__onConfirmDelUser, this);
        this.__app.getRoot().add(mb, {left:20, top:20});
        mb.center();
      }
    }
  }
});