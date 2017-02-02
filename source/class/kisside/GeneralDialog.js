/**
 * Editor settings dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.GeneralDialog",
{
  extend: qx.ui.window.Window,

  construct : function(config, callback, context)
  {
    this.base(arguments, "General Settings");
    
    if(!('saveSound' in config))
      config.saveSound = kisside.Application.SAVE_SOUNDS[0][1];
      
    
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

    var saveSound = new qx.ui.form.SelectBox();
    saveSound.add(new qx.ui.form.ListItem("None", "", ""));
    for(i = 0; i < kisside.Application.SAVE_SOUNDS.length; i++)
      saveSound.add(new qx.ui.form.ListItem(kisside.Application.SAVE_SOUNDS[i][0], "", kisside.Application.SAVE_SOUNDS[i][1]));
    var nosound = true;
    saveSound.addListener("changeSelection", function(e)
      {
        if(nosound)
        {
          nosound = false;
          return;
        }
        var selection = e.getData();
        if(selection[0])
        {
          window.selection = selection[0];
          var sound = selection[0].getModel();
          if(sound !== '')
          {
            var uri = qx.util.ResourceManager.getInstance().toUri("kisside/sounds/" + sound);
            var audio = new qx.bom.media.Audio(uri);
            audio.addListener("ended", function() { audio.dispose(); }, this);
            audio.play();
          }
        }
      }, this);
    form.add(saveSound, "Save Sound", null, "saveSound");
    
    var saveButton = new qx.ui.form.Button("Save", "icon/16/actions/dialog-apply.png");
//    signInButton.setWidth(70);
    form.addButton(saveButton);
    var cancelButton = new qx.ui.form.Button("Cancel", "icon/16/actions/dialog-cancel.png");
//    cancelButton.setWidth(70);
    form.addButton(cancelButton);
    
    this.add(new qx.ui.form.renderer.Single(form), { edge: 20 });

    // binding /////////////////////////
    var controller = new qx.data.controller.Form(null, form);
    controller.setModel(qx.data.marshal.Json.createModel(config, true));
//    var model = controller.createModel();
//    window.model = model;

    // serialization and reset /////////
    saveButton.addListener("execute", function() {
      if (form.validate()) {
//        this.debug("password = " + password.getValue());
        controller.updateModel();
        window.general_options = controller.getModel();
        this.close();
//        alert("You are saving: " + qx.util.Serializer.toJson(controller.getModel()));
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
    this.addListener("appear",function() { saveSound.focus(); }, this);

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
    __audio : null
  }
});