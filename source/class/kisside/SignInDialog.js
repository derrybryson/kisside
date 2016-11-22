/**
 * User sign in dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.SignInDialog",
{
  extend: qx.ui.window.Window,

  construct : function(app)
  {
    this.base(arguments, "Sign In");
    this.__app = app;

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
    form.addGroupHeader("User Credentials");

    // add usernamne
    var userName = new qx.ui.form.TextField();
    userName.setRequired(true);
    userName.setMaxLength(30);
    userName.setWidth(125);
    form.add(userName, "Username");
    // add password
    var password = new qx.ui.form.PasswordField();
    password.setRequired(true);
    password.setMaxLength(30);
    password.setWidth(125);
    form.add(password, "Password");

    // buttons
    var signInButton = new qx.ui.form.Button("Sign In", "icon/16/actions/dialog-apply.png");
//    signInButton.setWidth(70);
    form.addButton(signInButton);
//    var cancelButton = new qx.ui.form.Button("Cancel", "icon/16/actions/dialog-cancel.png");
//    cancelButton.setWidth(70);
//    form.addButton(cancelButton);

    this.add(new qx.ui.form.renderer.Single(form), { edge: 20 });

    // binding /////////////////////////
    var controller = new qx.data.controller.Form(null, form);
    var model = controller.createModel();
    window.model = model;

    // serialization and reset /////////
    signInButton.addListener("execute", function() {
      if (form.validate()) {
        this.debug("password = " + password.getValue());
        alert("You are saving: " + qx.util.Serializer.toJson(model));
        this.close();
        this.__app.doSignIn(model.getUsername(), model.getPassword());
      }
    }, this);
//    cancelButton.addListener("execute", form.reset, form);
    this.addListener("appear",function() { userName.focus(); }, this);

    var self = this;
    this.addListener("keypress", function(e) { 
      if(e.getKeyIdentifier() == "Enter") 
      {
/*        
        children = self.getChildren();
        for(var i = 0; i < children.length; i++)
          if(children[i].isFocusable())
            children[i].blur();
*/    
//        userName.blur();
//        password.blur();       
        signInButton.focus();     
        signInButton.execute();
      } 
    }, this);

    this.open();
  },

  destruct : function()
  {
  },

  members :
  {
    __app : null
  }
});