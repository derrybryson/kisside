/**
 * User sign in dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.PromptDialog",
{
  extend: qx.ui.window.Window,

  construct : function(title, prompt, value, maxlen, textwidth, callback, context)
  {
    this.base(arguments, title);

    this.setLayout(new qx.ui.layout.Canvas());
    this.setModal(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(false);

    var dialogPane = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));

    var atom = new qx.ui.basic.Atom(prompt);
    dialogPane.add(atom);

    // add text field
    var text = new qx.ui.form.TextField();
    text.setRequired(true);
    text.setMaxLength(maxlen);
    text.setWidth(textwidth);
    text.setValue(value);
    dialogPane.add(text);

    var buttonPane = new qx.ui.container.Composite();
    var layout = new qx.ui.layout.HBox(10);
    layout.setAlignX("right");
    buttonPane.setLayout(layout);
    var okButton = new qx.ui.form.Button("Ok", "icon/16/actions/dialog-ok.png");
    buttonPane.add(okButton);
    var cancelButton = new qx.ui.form.Button("Cancel", "icon/16/actions/dialog-cancel.png");
    buttonPane.add(okButton);
    dialogPane.add(buttonPane);
    
    this.add(dialogPane, { edge: 20 });

    // serialization and reset /////////
    okButton.addListener("execute", function() {
      this.debug("text = " + text.getValue());
      this.close();
      if(callback)
      {
        if(context)
          callback.call(context, text.getValue());
        else
          callback(text.getValue());
      }
    }, this);
    cancelButton.addListener("execute", this.close, this);
    this.addListener("appear",function() { text.focus(); }, this);

    var self = this;
    this.addListener("keypress", function(e) { 
      if(e.getKeyIdentifier() == "Enter") 
      {
        okButton.focus();     
        okButton.execute();
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