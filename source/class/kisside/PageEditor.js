/**
 * Tabview page with text editor.
 *
 * @asset(kisside/*)
 * @asset(qx/icon/${qx.icontheme}/16/emblems/emblem-important.png)
 */
qx.Class.define("kisside.PageEditor",
{
  extend : qx.ui.tabview.Page,

  construct : function(filename, basedir, path, contents)
  {
    this.base(arguments, filename);
    this.setFilename(filename);
    this.setBasedir(basedir);
    this.setPath(path);
    this.setLayout(new qx.ui.layout.VBox());
    this.getChildControl("button").setToolTipText(basedir + "/" + path); 
    this.setShowCloseButton(true);
    var editor = new kisside.Editor();
    this.setEditor(editor);
//        editor.addListener("change", function() { self.debug("changed"); if(self.__curPage.getLabel()[0] != '*') self.__curPage.setLabel('*' + self.__curPage.getLabel()); });
    editor.addListener("change", function(e) { this.debug("changed event"); this.setChanged(true); }, this);
    editor.setText(contents);
    var mode = kisside.Editor.getModeForPath(this.getLabel());
    if(mode)
      editor.setMode(mode.mode);
    this.add(editor, { flex: 1 });
    this.addListener("focus", function() { this.debug("page focus"); this.__editor.focus(); }, this);
  },

  destruct : function()
  {
  },
  
  properties :
  {
    "changed" : { init : false, apply : "__applyChanged" },
    "filename" : { nullable : true, init : null },
    "basedir" : { nullable : true, init : null },
    "path" : { nullable : true, init : null },
    "editor" : { nullable : true, init : null }
  },
  
  members : 
  {
    __applyChanged : function(value)
    {
      this.debug("__applyChanged, value = " + value);
      if(value)
      {
        this.debug("changed"); 
        if(this.getIcon() === '') 
          this.setIcon("icon/16/emblems/emblem-important.png");
      }
      else if(this.getIcon() !== '')
        this.setIcon('');
    }
  }
});

