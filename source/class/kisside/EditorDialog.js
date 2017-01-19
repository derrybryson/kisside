/**
 * Editor settings dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.EditorDialog",
{
  extend: qx.ui.window.Window,

  construct : function(config, callback, context)
  {
    this.base(arguments, "Editor Settings");

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

    var tabSize = new qx.ui.form.TextField();
    tabSize.setRequired(true);
    tabSize.setMaxLength(2);
    tabSize.setWidth(125);
    tabSize.setLiveUpdate(true);
    form.add(tabSize, "Tab Size", null, "tabSize");
    
    var softTabs = new qx.ui.form.CheckBox("Use Spaces for Tabs");
//    softTabs.setLiveUpdate(true);
    form.add(softTabs, "", null, "softTabs");

    var fontSize = new qx.ui.form.SelectBox();
    fontSize.add(new qx.ui.form.ListItem("6px", "", "6px"));
    fontSize.add(new qx.ui.form.ListItem("8px", "", "8px"));
    fontSize.add(new qx.ui.form.ListItem("10px", "", "10px"));
    fontSize.add(new qx.ui.form.ListItem("12px", "", "12px"));
    fontSize.add(new qx.ui.form.ListItem("14px", "", "14px"));
    fontSize.add(new qx.ui.form.ListItem("16px", "", "16px"));
    fontSize.add(new qx.ui.form.ListItem("18px", "", "18px"));
    fontSize.add(new qx.ui.form.ListItem("20px", "", "20px"));
    fontSize.add(new qx.ui.form.ListItem("22px", "", "22px"));
    fontSize.add(new qx.ui.form.ListItem("24px", "", "24px"));
//    fontSize.setLiveUpdate(true);
    form.add(fontSize, "Font Size", null, "fontSize");
                 
    var theme = new qx.ui.form.SelectBox();
    for(var i = 0; i < kisside.Editor.supportedThemes.length; i++)
    {
      var ti = kisside.Editor.supportedThemes[i];
      theme.add(new qx.ui.form.ListItem(ti[0] + " (" + ti[2] + ")", "", ti[1]));
    }
//    theme.setLiveUpdate(true);
    form.add(theme, "Theme", null, "theme");
    
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
    controller.addBindingOptions("tabSize", {converter : function(data) { 
        // model --> target 
        return data + ""; 
      }}, {converter : function(data) { 
        // target --> model 
        return parseInt(data); 
      }}); 
    controller.setModel(qx.data.marshal.Json.createModel(config, true));
//    var model = controller.createModel();
//    window.model = model;

    // serialization and reset /////////
    saveButton.addListener("execute", function() {
      if (form.validate()) {
//        this.debug("password = " + password.getValue());
        controller.updateModel();
        window.editor_options = controller.getModel();
        this.close();
        alert("You are saving: " + qx.util.Serializer.toJson(controller.getModel()));
        if(callback)
        {
          if(context)
            callback.call(context, qx.util.Serializer.toNativeObject(controller.getModel()));
          else
            callback(controller.getModel());
        }
//        this.__app.doSignIn(model.getUsername(), model.getPassword());
      }
    }, this);
    cancelButton.addListener("execute", function() { this.close(); }, this);
    this.addListener("appear",function() { tabSize.focus(); }, this);

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
    __app : null
  }
});