/**
 * Tabview page with text editor.
 *
 * @asset(kisside/*)
 * @asset(qx/icon/${qx.icontheme}/16/emblems/emblem-important.png)
 */
qx.Class.define("kisside.PageEditor",
{
  extend : qx.ui.tabview.Page,

  construct : function(filename, basedir, path, stat, contents, options)
  {
    this.base(arguments, filename);
    this.setFilename(filename);
    this.setBasedir(basedir);
    this.setPath(path);
    this.setStat(stat);
    this.setLayout(new qx.ui.layout.VBox());
    this.getChildControl("button").setToolTipText(basedir + "/" + path); 
    this.getChildControl("button").getChildControl("close-button").addListener("execute", this.__onClose, this); 
    this.setShowCloseButton(true);
    var editor = new kisside.Editor();
    this.setEditor(editor);
//        editor.addListener("change", function() { self.debug("changed"); if(self.__curPage.getLabel()[0] != '*') self.__curPage.setLabel('*' + self.__curPage.getLabel()); });
    editor.addListener("change", function(e) { this.debug("changed event"); this.setChanged(true); }, this);
    editor.setText(contents);
    var mode = kisside.Editor.getModeForPath(this.getLabel());
    if(mode)
      editor.setMode(mode.mode);
    if(options)
      editor.setOptions(options);
    this.add(editor, { flex: 1 });
    this.addListener("focus", function() { this.debug("page focus"); this.__editor.focus(); }, this);
  },

  destruct : function()
  {
  },
  
  properties :
  {
    "changed" : { init : false, apply : "__applyChanged" },
    "filename" : { nullable : true, init : null, apply : "__applyFilename" },
    "basedir" : { nullable : true, init : null },
    "path" : { nullable : true, init : null },
    "stat" : { nullable : true, init : null },
    "editor" : { nullable : true, init : null }
  },
  
  members : 
  {
    __linkCount : 0,
    
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
    }, 
    
    __applyFilename : function(value)
    {
      if(this.getPath())
      {
        var parts = this.getPath().split('/');
        parts[parts.length - 1] = value;
        var path = parts.join('/');
        this.setPath(path);
        this.getChildControl("button").setToolTipText(this.getBasedir() + "/" + path); 
      }
      this.setLabel(value);
    },
    
    __onClose : function(e)
    {
//      this.debug("PageEditor.__onClose");
    },
    
    link : function()
    {
      this.__linkCount++;
    },

    unlink : function()
    {
      if(this.__linkCount)
        this.__linkCount--;
    },

    canClose : function()
    {
      return this.__linkCount === 0;
    },
    
    close : function()
    {
      this.fireEvent('close');
    }
  }
});

