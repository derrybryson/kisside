/**
 * User/account settings dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.UserDialog",
{
  extend: qx.ui.window.Window,

  construct : function(app, user, callback, context)
  {
    this.__app = app;
    this.__user = { userid : 0, username : "", admin : false, password : "" };
    if(user)
    {
      this.__new = false;
      this.base(arguments, "Edit User Account");
      this.__user.userid = user.userid;
      this.__user.username = user.username;
      this.__user.admin = user.admin == 1;
    }
    else
    {
      this.__new = true;
      this.base(arguments, "New User Account");
    }

    this.setLayout(new qx.ui.layout.Canvas());
    this.setModal(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(false);

//    var pane = new qx.ui.container.Composite(new qx.ui.layout.Canvas);
//    this.add(pane, )
//      win.setShowStatusbar(true);
//      win.setStatus("Demo loaded");

    var form = new qx.ui.form.Form();
//    form.addGroupHeader("User Credentials");

    var username = new qx.ui.form.TextField();
    username.setRequired(true);
    username.setMaxLength(30);
    username.setWidth(125);
    username.setLiveUpdate(true);
    form.add(username, "Username", null, "username");
    
    var admin = new qx.ui.form.CheckBox("Admin");
    if(this.__app.getUser().admin != 1 || (!this.__new && this.__app.getUser().userid == user.userid))
      admin.setEnabled(false);
//    admin.setLiveUpdate(true);
    form.add(admin, "", null, "admin");

    var password = new qx.ui.form.PasswordField();
    password.setRequired(this.__new);
    password.setMaxLength(30);
    password.setWidth(125);
    password.setLiveUpdate(true);
    form.add(password, "Password", null, "password");
    
    var password2 = new qx.ui.form.PasswordField();
//    password2.setRequired(true);
    password2.setMaxLength(30);
    password2.setWidth(125);
    password2.setLiveUpdate(true);
    form.add(password2, "Confirm Password", null, "password2");
    
    // buttons
    var saveButton = new qx.ui.form.Button("Save", "icon/16/actions/dialog-apply.png");
//    signInButton.setWidth(70);
    form.addButton(saveButton);
    var cancelButton = new qx.ui.form.Button("Cancel", "icon/16/actions/dialog-cancel.png");
//    cancelButton.setWidth(70);
    form.addButton(cancelButton);

    this.add(new qx.ui.form.renderer.Single(form), { edge: 20 });

    // binding /////////////////////////
    var controller = new qx.data.controller.Form(null, form);
/*    
    controller.addBindingOptions("tabSize", {converter : function(data) { 
        // model --> target 
        return data + ""; 
      }}, {converter : function(data) { 
        // target --> model 
        return parseInt(data); 
      }}); 
*/      
    controller.setModel(qx.data.marshal.Json.createModel(this.__user, true));
//    var model = controller.createModel();
//    window.model = model;
    
    form.getValidationManager().setValidator(function(items) {
        var valid = password.getValue() == "" || password.getValue() == password2.getValue();
        if(!valid) 
        {
          var message = "Passwords must be equal.";
          password.setInvalidMessage(message);
          password2.setInvalidMessage(message);
          password.setValid(false);
          password2.setValid(false);
        }
        return valid;
      });

    // serialization and reset /////////
    saveButton.addListener("execute", function() {
      if (form.validate()) {
//        this.debug("password = " + password.getValue());
        controller.updateModel();
        this.close();
//        alert("You are saving: " + qx.util.Serializer.toJson(controller.getModel()));
        if(callback)
        {
          var user = { userid : this.__user.userid, username : controller.getModel().getUsername(), admin : controller.getModel().getAdmin() ? 1 : 0, password :controller.getModel().getPassword() };
          if(context)
            callback.call(context, user);
          else
            callback(user);
        }
//        this.__app.doSignIn(model.getUsername(), model.getPassword());
      }
    }, this);
    cancelButton.addListener("execute", function() { this.close(); }, this);
    this.addListener("appear",function() { username.focus(); }, this);

    var self = this;
    this.addListener("keypress", function(e) { 
      if(e.getKeyIdentifier() == "Enter") 
      {
        saveButton.focus();     
        saveButton.execute();
      } 
      else if(e.getKeyIdentifier() == "Escape") 
      {
        cancelButton.focus();     
        cancelButton.execute();
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
    __user : null,
    __new : false
  }
});