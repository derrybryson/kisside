/**
 * Message box dialog.
 *
 * @asset(kisside/*)
 * @asset(qx/icon/${qx.icontheme}/32/status/*)
 * @asset(qx/icon/${qx.icontheme}/16/actions/dialog-ok)
 * @asset(qx/icon/${qx.icontheme}/16/actions/dialog-close)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.MessageBox",
{
  extend: qx.ui.window.Window,

  statics :
  {
    // flags
    FLAG_INFO : 1,
    FLAG_WARNING : 2,
    FLAG_ERROR : 4,
    FLAG_OK : 8,
    FLAG_OK_CANCEL : 16,
    FLAG_YES_NO : 32,

    // response result codes
    RESP_CANCEL : 0,
    RESP_OK : 2,
    RESP_NO : 3,
    RESP_YES : 4
  }, 

  construct : function(app, title, msg, flags, callback, context)
  {
    this.base(arguments, title);
    this.__app = app;

    this.setLayout(new qx.ui.layout.Canvas());
    this.setModal(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(false);

    var dialogPane = new qx.ui.container.Composite(new qx.ui.layout.VBox(20));

    var atom = new qx.ui.basic.Atom(msg);
    if(flags & kisside.MessageBox.FLAG_INFO)
      atom.setIcon("icon/32/status/dialog-information.png");
    else if(flags & kisside.MessageBox.FLAG_WARNING)
      atom.setIcon("icon/32/status/dialog-warning.png");
    else if(flags & kisside.MessageBox.FLAG_ERROR)
      atom.setIcon("icon/32/status/dialog-error.png");
    dialogPane.add(atom);

    var buttonPane = new qx.ui.container.Composite();
    var layout = new qx.ui.layout.HBox(10);
    layout.setAlignX("right");
    buttonPane.setLayout(layout);
    if(flags & kisside.MessageBox.FLAG_OK || flags & kisside.MessageBox.FLAG_OK_CANCEL)
    {
      var okButton = new qx.ui.form.Button("Ok", "icon/16/actions/dialog-ok.png");
      okButton.addListener("execute", function() {
        this.close();
        if(callback)
        {
          if(context)
            callback.call(context, kisside.MessageBox.RESP_OK);
          else
            callback(kisside.MessageBox.RESP_OK);
        }
      }, this);
      this.addListener("keypress", function(e) { if(e.getKeyIdentifier() == "Enter") okButton.execute(); }, this);
      buttonPane.add(okButton);
    }
    if(flags & kisside.MessageBox.FLAG_OK_CANCEL)
    {
      var cancelButton = new qx.ui.form.Button("Cancel", "icon/16/actions/dialog-close.png");
      cancelButton.addListener("execute", function() {
        this.close();
        if(callback)
        {
          if(context)
            callback.call(context, kisside.MessageBox.RESP_CANCEL);
          else
            callback(kisside.MessageBox.RESP_CANCEL);
        }
      }, this);
      buttonPane.add(cancelButton);
    }
    if(flags & kisside.MessageBox.FLAG_YES_NO)
    {
      var yesButton = new qx.ui.form.Button("Yes", "icon/16/actions/dialog-ok.png");
      yesButton.addListener("execute", function() {
        this.close();
        if(callback)
        {
          if(context)
            callback.call(context, kisside.MessageBox.RESP_YES);
          else
            callback(kisside.MessageBox.RESP_YES);
        }
      }, this);
      this.addListener("keypress", function(e) { if(e.getKeyIdentifier() == "Enter") yesButton.execute(); }, this);
      buttonPane.add(yesButton);
      var noButton = new qx.ui.form.Button("No", "icon/16/actions/dialog-close.png");
      noButton.addListener("execute", function() {
        this.close();
        if(callback)
        {
          if(context)
            callback.call(context, kisside.MessageBox.RESP_NO);
          else
            callback(kisside.MessageBox.RESP_NO);
        }
      }, this);
      buttonPane.add(noButton);
    }
    dialogPane.add(buttonPane);
    this.add(dialogPane, { edge: 20 });

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