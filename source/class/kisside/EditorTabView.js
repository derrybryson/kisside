/**
 * Tabview page with text editor.
 *
 * @asset(kisside/*)
 * @asset(qx/icon/${qx.icontheme}/16/emblems/emblem-important.png)
 */
qx.Class.define("kisside.EditorTabView",
{
  extend : qx.ui.tabview.TabView,

  construct : function()
  {
    this.base(arguments);
  },

  destruct : function()
  {
  },
  
  events:
  {
     "page-close" : "qx.event.type.Data"
  },
  
  members : 
  {
    /**
     * Removes the Page widget on which the close button was tapped.
     *
     * @param e {qx.event.type.Pointer} pointer event
     */
    _onPageClose : function(e)
    {
//      this.debug("_onPageClose");
      // reset the old close button states, before remove page
      // see http://bugzilla.qooxdoo.org/show_bug.cgi?id=3763 for details
      var page = e.getTarget();
      var closeButton = page.getButton().getChildControl("close-button");
      closeButton.reset();
      
      this.fireDataEvent("page-close", page);
    }
  }
});

