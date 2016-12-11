/**
 * User sign in dialog.
 *
 * @asset(kisside/*)
 * 
 * @lint ignoreDeprecated(alert)
 */
qx.Class.define("kisside.UploadDialog",
{
  extend: qx.ui.window.Window,

  construct : function(app, authtoken, basedir, path)
  {
    this.base(arguments, "Upload File");
    this.__app = app;

    this.setLayout(new qx.ui.layout.Canvas());
    this.setModal(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(true);

//    var pane = new qx.ui.container.Composite(new qx.ui.layout.Canvas);
//    this.add(pane, )
//      win.setShowStatusbar(true);
//      win.setStatus("Demo loaded");

    var iframe = new qx.ui.embed.Iframe("api/upload.php?authtoken=" + encodeURIComponent(authtoken) + "&basedir=" + encodeURIComponent(basedir) + "&path=" + encodeURIComponent(path));
    iframe.setWidth(300);
    iframe.setHeight(100);
    iframe.setDecorator(null);
    this.add(iframe, { edge: 20 });

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