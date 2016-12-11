/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * The grow layout stretches all children to the full available size
 * but still respects limits configured by min/max values.
 *
 * It will place all children over each other with the top and left coordinates
 * set to <code>0</code>. The {@link qx.ui.container.Stack} and the
 * {@link qx.ui.core.scroll.ScrollPane} are using this layout.
 *
 * *Features*
 *
 * * Auto-sizing
 * * Respects minimum and maximum child dimensions
 *
 * *Item Properties*
 *
 * None
 *
 * *Example*
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grow();
 *
 * var w1 = new qx.ui.core.Widget();
 * var w2 = new qx.ui.core.Widget();
 * var w3 = new qx.ui.core.Widget();
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(w1);
 * container.add(w2);
 * container.add(w3);
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grow.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grow",
{
  extend : qx.ui.layout.Abstract,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value) {
        this.assert(false, "The property '"+name+"' is not supported by the Grow layout!");
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();
      var child, size, width, height;

      // Render children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        width = availWidth;
        if (width < size.minWidth) {
          width = size.minWidth;
        } else if (width > size.maxWidth) {
          width = size.maxWidth;
        }

        height = availHeight;
        if (height < size.minHeight) {
          height = size.minHeight;
        } else if (height > size.maxHeight) {
          height = size.maxHeight;
        }

        child.renderLayout(padding.left, padding.top, width, height);
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var children = this._getLayoutChildren();
      var child, size;
      var neededWidth=0, neededHeight=0;
      var minWidth=0, minHeight=0;
      var maxWidth=Infinity, maxHeight=Infinity;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        neededWidth = Math.max(neededWidth, size.width);
        neededHeight = Math.max(neededHeight, size.height);

        minWidth = Math.max(minWidth, size.minWidth);
        minHeight = Math.max(minHeight, size.minHeight);

        maxWidth = Math.min(maxWidth, size.maxWidth);
        maxHeight = Math.min(maxHeight, size.maxHeight);
      }


      // Return hint
      return {
        width : neededWidth,
        height : neededHeight,

        minWidth : minWidth,
        minHeight : minHeight,

        maxWidth : maxWidth,
        maxHeight : maxHeight
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A split panes divides an area into two panes. The ratio between the two
 * panes is configurable by the user using the splitter.
 *
 * @childControl slider {qx.ui.splitpane.Slider} shown during resizing the splitpane
 * @childControl splitter {qx.ui.splitpane.Splitter} splitter to resize the splitpane
 */
qx.Class.define("qx.ui.splitpane.Pane",
{
  extend : qx.ui.core.Widget,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a new instance of a SplitPane. It allows the user to dynamically
   * resize the areas dropping the border between.
   *
   * @param orientation {String} The orientation of the split pane control.
   * Allowed values are "horizontal" (default) and "vertical".
   */
  construct : function(orientation)
  {
    this.base(arguments);

    this.__children = [];

    // Initialize orientation
    if (orientation) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }

    // add all pointer listener to the blocker
    this.__blocker.addListener("pointerdown", this._onPointerDown, this);
    this.__blocker.addListener("pointerup", this._onPointerUp, this);
    this.__blocker.addListener("pointermove", this._onPointerMove, this);
    this.__blocker.addListener("pointerout", this._onPointerOut, this);
    this.__blocker.addListener("losecapture", this._onPointerUp, this);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "splitpane"
    },

    /**
     * Distance between pointer and splitter when the cursor should change
     * and enable resizing.
     */
    offset :
    {
      check : "Integer",
      init : 6,
      apply : "_applyOffset"
    },

    /**
     * The orientation of the splitpane control.
     */
    orientation :
    {
      init  : "horizontal",
      check : [ "horizontal", "vertical" ],
      apply : "_applyOrientation"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __splitterOffset : null,
    __activeDragSession : false,
    __lastPointerX : null,
    __lastPointerY : null,
    __isHorizontal : null,
    __beginSize : null,
    __endSize : null,
    __children : null,
    __blocker : null,


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        // Create and add slider
        case "slider":
          control = new qx.ui.splitpane.Slider(this);
          control.exclude();
          this._add(control, {type : id});
          break;

        // Create splitter
        case "splitter":
          control = new qx.ui.splitpane.Splitter(this);
          this._add(control, {type : id});
          control.addListener("move", this.__onSplitterMove, this);
          break;
      }

      return control || this.base(arguments, id);
    },


    /**
     * Move handler for the spliiter which takes care of the external
     * triggered resize of children.
     *
     * @param e {qx.event.type.Data} The data even of move.
     */
    __onSplitterMove : function(e) {
      this.__setBlockerPosition(e.getData());
    },


    /**
     * Creates a blocker for the splitter which takes all bouse events and
     * also handles the offset and cursor.
     *
     * @param orientation {String} The orientation of the pane.
     */
    __createBlocker : function(orientation) {
      this.__blocker = new qx.ui.splitpane.Blocker(orientation);
      this.getContentElement().add(this.__blocker);

      var splitter = this.getChildControl("splitter");
      var splitterWidth = splitter.getWidth();
      if (!splitterWidth) {
        splitter.addListenerOnce("appear", function() {
          this.__setBlockerPosition();
        }, this);
      }

      // resize listener to remove the blocker in case the splitter
      // is removed.
      splitter.addListener("resize", function(e) {
        var bounds = e.getData();
        if (bounds.height == 0 || bounds.width == 0) {
          this.__blocker.hide();
        } else {
          this.__blocker.show();
        }
      }, this);
    },


    /**
     * Returns the blocker used over the splitter. this could be used for
     * adding event listeners like tap or dbltap.
     *
     * @return {qx.ui.splitpane.Blocker} The used blocker element.
     *
     * @internal
     */
    getBlocker : function() {
      return this.__blocker;
    },



    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Apply routine for the orientation property.
     *
     * Sets the pane's layout to vertical or horizontal split layout.
     *
     * @param value {String} The new value of the orientation property
     * @param old {String} The old value of the orientation property
     */
    _applyOrientation : function(value, old)
    {
      var slider = this.getChildControl("slider");
      var splitter = this.getChildControl("splitter");

      // Store boolean flag for faster access
      this.__isHorizontal = value === "horizontal";

      if (!this.__blocker) {
        this.__createBlocker(value);
      }

      // update the blocker
      this.__blocker.setOrientation(value);

      // Dispose old layout
      var oldLayout = this._getLayout();
      if (oldLayout) {
        oldLayout.dispose();
      }

      // Create new layout
      var newLayout = value === "vertical" ?
        new qx.ui.splitpane.VLayout : new qx.ui.splitpane.HLayout;
      this._setLayout(newLayout);

      // Update states for splitter and slider
      splitter.removeState(old);
      splitter.addState(value);
      splitter.getChildControl("knob").removeState(old);
      splitter.getChildControl("knob").addState(value);
      slider.removeState(old);
      slider.addState(value);

      // flush (needs to be done for the blocker update) and update the blocker
      qx.ui.core.queue.Manager.flush();
      this.__setBlockerPosition();
    },


    // property apply
    _applyOffset : function(value, old) {
      this.__setBlockerPosition();
    },


    /**
     * Helper for setting the blocker to the right position, which depends on
     * the offset, orientation and the current position of the splitter.
     *
     * @param bounds {Map?null} If the bounds of the splitter are known,
     *   they can be added.
     */
    __setBlockerPosition : function(bounds) {
      var splitter = this.getChildControl("splitter");
      var offset = this.getOffset();
      var splitterBounds = splitter.getBounds();
      var splitterElem = splitter.getContentElement().getDomElement();

      // do nothing if the splitter is not ready
      if (!splitterElem) {
        return;
      }

      // recalculate the dimensions of the blocker
      if (this.__isHorizontal) {
        // get the width either of the given bounds or of the read bounds
        var width = null;
        if (bounds) {
          width = bounds.width;
        } else if (splitterBounds) {
          width = splitterBounds.width;
        }
        var left = bounds && bounds.left;

        if (width) {
          if (isNaN(left)) {
            left = qx.bom.element.Location.getPosition(splitterElem).left;
          }
          this.__blocker.setWidth(offset, width);
          this.__blocker.setLeft(offset, left);
        }

      // vertical case
      } else {
        // get the height either of the given bounds or of the read bounds
        var height = null;
        if (bounds) {
          height = bounds.height;
        } else if (splitterBounds) {
          height = splitterBounds.height;
        }
        var top =  bounds && bounds.top;

        if (height) {
          if (isNaN(top)) {
            top = qx.bom.element.Location.getPosition(splitterElem).top;
          }
          this.__blocker.setHeight(offset, height);
          this.__blocker.setTop(offset, top);
        }
      }
    },


    /*
    ---------------------------------------------------------------------------
      PUBLIC METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a widget to the pane.
     *
     * Sets the pane's layout to vertical or horizontal split layout. Depending on the
     * pane's layout the first widget will be the left or top widget, the second one
     * the bottom or right widget. Adding more than two widgets will overwrite the
     * existing ones.
     *
     * @param widget {qx.ui.core.Widget} The widget to be inserted into pane.
     * @param flex {Number} The (optional) layout property for the widget's flex value.
     */
    add : function(widget, flex)
    {
      if (flex == null) {
        this._add(widget);
      } else {
        this._add(widget, {flex : flex});
      }
      this.__children.push(widget);
    },


    /**
     * Removes the given widget from the pane.
     *
     * @param widget {qx.ui.core.Widget} The widget to be removed.
     */
    remove : function(widget)
    {
      this._remove(widget);
      qx.lang.Array.remove(this.__children, widget);
    },


    /**
     * Returns an array containing the pane's content.
     *
     * @return {qx.ui.core.Widget[]} The pane's child widgets
     */
    getChildren : function() {
      return this.__children;
    },


    /*
    ---------------------------------------------------------------------------
      POINTER LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Handler for pointerdown event.
     *
     * Shows slider widget and starts drag session if pointer is near/on splitter widget.
     *
     * @param e {qx.event.type.Pointer} pointerdown event
     */
    _onPointerDown : function(e)
    {
      // Only proceed if left pointer button is pressed and the splitter is active
      if (!e.isLeftPressed()) {
        return;
      }

      var splitter = this.getChildControl("splitter");

      // Store offset between pointer event coordinates and splitter
      var splitterLocation = splitter.getContentLocation();
      var paneLocation = this.getContentLocation();
      this.__splitterOffset = this.__isHorizontal ?
        e.getDocumentLeft() - splitterLocation.left + paneLocation.left :
        e.getDocumentTop() - splitterLocation.top + paneLocation.top ;

      // Synchronize slider to splitter size and show it
      var slider = this.getChildControl("slider");
      var splitterBounds = splitter.getBounds();
      slider.setUserBounds(
        splitterBounds.left, splitterBounds.top,
        splitterBounds.width, splitterBounds.height
      );

      slider.setZIndex(splitter.getZIndex() + 1);
      slider.show();

      // Enable session
      this.__activeDragSession = true;
      this.__blocker.capture();

      e.stop();
    },


    /**
     * Handler for pointermove event.
     *
     * @param e {qx.event.type.Pointer} pointermove event
     */
    _onPointerMove : function(e)
    {
      this._setLastPointerPosition(e.getDocumentLeft(), e.getDocumentTop());

      // Check if slider is already being dragged
      if (this.__activeDragSession)
      {
        // Compute new children sizes
        this.__computeSizes();

        // Update slider position
        var slider = this.getChildControl("slider");
        var pos = this.__beginSize;

        if(this.__isHorizontal) {
          slider.setDomLeft(pos);
          this.__blocker.setStyle("left", (pos - this.getOffset()) + "px");
        } else {
          slider.setDomTop(pos);
          this.__blocker.setStyle("top", (pos - this.getOffset()) + "px");
        }

        e.stop();
      }
    },


    /**
     * Handler for pointerout event
     *
     * @param e {qx.event.type.Pointer} pointerout event
     */
    _onPointerOut : function(e)
    {
      this._setLastPointerPosition(e.getDocumentLeft(), e.getDocumentTop());
    },


    /**
     * Handler for pointerup event
     *
     * Sets widget sizes if dragging session has been active.
     *
     * @param e {qx.event.type.Pointer} pointerup event
     */
    _onPointerUp : function(e)
    {
      if (!this.__activeDragSession) {
        return;
      }

      // Set sizes to both widgets
      this._finalizeSizes();

      // Hide the slider
      var slider = this.getChildControl("slider");
      slider.exclude();

      // Cleanup
      this.__activeDragSession = false;
      this.releaseCapture();

      e.stop();
    },


    /*
    ---------------------------------------------------------------------------
      INTERVAL HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Updates widgets' sizes based on the slider position.
     */
    _finalizeSizes : function()
    {
      var beginSize = this.__beginSize;
      var endSize = this.__endSize;

      if (beginSize == null) {
        return;
      }

      var children = this._getChildren();
      var firstWidget = children[2];
      var secondWidget = children[3];

      // Read widgets' flex values
      var firstFlexValue = firstWidget.getLayoutProperties().flex;
      var secondFlexValue = secondWidget.getLayoutProperties().flex;

      // Both widgets have flex values
      if((firstFlexValue != 0) && (secondFlexValue != 0))
      {
        firstWidget.setLayoutProperties({ flex : beginSize });
        secondWidget.setLayoutProperties({ flex : endSize });
      }

      // Update both sizes
      else
      {
        // Set widths to static widgets
        if (this.__isHorizontal)
        {
          firstWidget.setWidth(beginSize);
          secondWidget.setWidth(endSize);
        }
        else
        {
          firstWidget.setHeight(beginSize);
          secondWidget.setHeight(endSize);
        }
      }
    },


    /**
     * Computes widgets' sizes based on the pointer coordinate.
     */
    __computeSizes : function()
    {
      if (this.__isHorizontal) {
        var min="minWidth", size="width", max="maxWidth", pointer=this.__lastPointerX;
      } else {
        var min="minHeight", size="height", max="maxHeight", pointer=this.__lastPointerY;
      }

      var children = this._getChildren();
      var beginHint = children[2].getSizeHint();
      var endHint = children[3].getSizeHint();

      // Area given to both widgets
      var allocatedSize = children[2].getBounds()[size] + children[3].getBounds()[size];

      // Calculate widget sizes
      var beginSize = pointer - this.__splitterOffset;
      var endSize = allocatedSize - beginSize;

      // Respect minimum limits
      if (beginSize < beginHint[min])
      {
        endSize -= beginHint[min] - beginSize;
        beginSize = beginHint[min];
      }
      else if (endSize < endHint[min])
      {
        beginSize -= endHint[min] - endSize;
        endSize = endHint[min];
      }

      // Respect maximum limits
      if (beginSize > beginHint[max])
      {
        endSize += beginSize - beginHint[max];
        beginSize = beginHint[max];
      }
      else if (endSize > endHint[max])
      {
        beginSize += endSize - endHint[max];
        endSize = endHint[max];
      }

      // Store sizes
      this.__beginSize = beginSize;
      this.__endSize = endSize;
    },


    /**
     * Determines whether this is an active drag session
     *
     * @return {Boolean} True if active drag session, otherwise false.
     */
    _isActiveDragSession : function() {
      return this.__activeDragSession;
    },


    /**
     * Sets the last pointer position.
     *
     * @param x {Integer} the x position of the pointer.
     * @param y {Integer} the y position of the pointer.
     */
     _setLastPointerPosition : function(x, y)
     {
       this.__lastPointerX = x;
       this.__lastPointerY = y;
     }
  },


  destruct : function() {
    this.__children = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * The slider of the SplitPane (used during drag sessions for fast feedback)
 *
 * @internal
 */
qx.Class.define("qx.ui.splitpane.Slider",
{
  extend : qx.ui.core.Widget,



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overrridden
    allowShrinkX :
    {
      refine : true,
      init : false
    },

    // overrridden
    allowShrinkY :
    {
      refine : true,
      init : false
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * The splitter is the element between the two panes.
 *
 * @internal
 *
 * @childControl knob {qx.ui.basic.Image} knob to resize the splitpane
 */
qx.Class.define("qx.ui.splitpane.Splitter",
{
  extend : qx.ui.core.Widget,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param parentWidget {qx.ui.splitpane.Pane} The underlaying split pane.
   */
  construct : function(parentWidget)
  {
    this.base(arguments);

    // set layout
    if (parentWidget.getOrientation() == "vertical")
    {
      this._setLayout(new qx.ui.layout.HBox(0, "center"));
      this._getLayout().setAlignY("middle");
    }
    else
    {
      this._setLayout(new qx.ui.layout.VBox(0, "middle"));
      this._getLayout().setAlignX("center");
    }

    // create knob child control
    this._createChildControl("knob");
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overrridden
    allowShrinkX :
    {
      refine : true,
      init : false
    },

    // overrridden
    allowShrinkY :
    {
      refine : true,
      init : false
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        // Create splitter knob
        case "knob":
          control = new qx.ui.basic.Image;
          this._add(control);
          break;
      }

      return control || this.base(arguments, id);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/* ************************************************************************


************************************************************************ */
/**
 * A special blocker element for the splitpane which is based on
 * {@link qx.html.Element} and takes care of the positioning of the div.
 *
 * @internal
 * @asset(qx/static/blank.gif)
 */
qx.Class.define("qx.ui.splitpane.Blocker",
{
  extend : qx.html.Element,

  /**
   * @param orientation {String} The orientation of the split pane control.
   */
  construct : function(orientation)
  {
    var styles = {
      position: "absolute",
      zIndex: 11
    };

    // IE needs some extra love here to convince it to block events.
    if ((qx.core.Environment.get("engine.name") == "mshtml"))
    {
      styles.backgroundImage = "url(" + qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif") + ")";
      styles.backgroundRepeat = "repeat";
    }

    this.base(arguments, "div", styles);

    // Initialize orientation
    if (orientation) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }
  },


  properties :
  {
    /**
     * The orientation of the blocker which should be the same as the
     * orientation of the splitpane.
     */
    orientation :
    {
      init  : "horizontal",
      check : [ "horizontal", "vertical" ],
      apply : "_applyOrientation"
    }
  },


  members :
  {

    // property apply
    _applyOrientation : function(value, old) {
      if (value == "horizontal") {
        this.setStyle("height", "100%");
        this.setStyle("cursor", "col-resize");
        this.setStyle("top", null);
      } else {
        this.setStyle("width", "100%");
        this.setStyle("left", null);
        this.setStyle("cursor", "row-resize");
      }
    },


    /**
     * Takes the two parameters and set the propper width of the blocker.
     *
     * @param offset {Number} The offset of the splitpane.
     * @param spliterSize {Number} The width of the splitter.
     */
    setWidth : function(offset, spliterSize) {
      var width = spliterSize + 2 * offset;
      this.setStyle("width", width + "px");
    },


    /**
     * Takes the two parameter and sets the propper height of the blocker.
     *
     * @param offset {Number} The offset of the splitpane.
     * @param spliterSize {Number} The height of the splitter.
     */
    setHeight : function(offset, spliterSize) {
      var height = spliterSize + 2 * offset;
      this.setStyle("height", height + "px");
    },


    /**
     * Takes the two parameter and sets the propper left position of
     * the blocker.
     *
     * @param offset {Number} The offset of the splitpane.
     * @param splitterLeft {Number} The left position of the splitter.
     */
    setLeft : function(offset, splitterLeft) {
      var left = splitterLeft - offset;
      this.setStyle("left", left + "px");
    },


    /**
     * Takes the two parameter and sets the propper top position of
     * the blocker.
     *
     * @param offset {Number} The offset of the splitpane.
     * @param splitterTop {Number} The top position of the splitter.
     */
    setTop : function(offset, splitterTop) {
      var top = splitterTop - offset;
      this.setStyle("top", top + "px");
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * Layouter for vertical split panes.
 *
 * @internal
 */
qx.Class.define("qx.ui.splitpane.VLayout",
{
  extend : qx.ui.layout.Abstract,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "type" || name === "flex", "The property '"+name+"' is not supported by the split layout!");

        if (name == "flex") {
          this.assertNumber(value);
        }

        if (name == "type") {
          this.assertString(value);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var child, type;
      var begin, splitter, slider, end;
      var paddingLeft = padding.left || 0;
      var paddingTop = padding.top || 0;

      for (var i=0; i<length; i++)
      {
        child = children[i];
        type = child.getLayoutProperties().type;

        if (type === "splitter") {
          splitter = child;
        } else if (type === "slider") {
          slider = child;
        } else if (!begin) {
          begin = child;
        } else {
          end = child;
        }
      }

      if (begin && end)
      {
        var beginFlex = begin.getLayoutProperties().flex;
        var endFlex = end.getLayoutProperties().flex;

        if (beginFlex == null) {
          beginFlex = 1;
        }

        if (endFlex == null) {
          endFlex = 1;
        }

        var beginHint = begin.getSizeHint();
        var splitterHint = splitter.getSizeHint();
        var endHint = end.getSizeHint();

        var beginHeight = beginHint.height;
        var splitterHeight = splitterHint.height;
        var endHeight = endHint.height;

        if (beginFlex > 0 && endFlex > 0)
        {
          var flexSum = beginFlex + endFlex;
          var flexAvailable = availHeight - splitterHeight;

          var beginHeight = Math.round((flexAvailable / flexSum) * beginFlex);
          var endHeight = flexAvailable - beginHeight;

          var sizes = qx.ui.layout.Util.arrangeIdeals(beginHint.minHeight, beginHeight, beginHint.maxHeight,
            endHint.minHeight, endHeight, endHint.maxHeight);

          beginHeight = sizes.begin;
          endHeight = sizes.end;
        }
        else if (beginFlex > 0)
        {
          beginHeight = availHeight - splitterHeight - endHeight;
          if (beginHeight < beginHint.minHeight) {
            beginHeight = beginHint.minHeight;
          }

          if (beginHeight > beginHint.maxHeight) {
            beginHeight = beginHint.maxHeight;
          }
        }
        else if (endFlex > 0)
        {
          endHeight = availHeight - beginHeight - splitterHeight;
          if (endHeight < endHint.minHeight) {
            endHeight = endHint.minHeight;
          }

          if (endHeight > endHint.maxHeight) {
            endHeight = endHint.maxHeight;
          }
        }

        begin.renderLayout(paddingLeft, paddingTop, availWidth, beginHeight);
        splitter.renderLayout(paddingLeft, beginHeight + paddingTop, availWidth, splitterHeight);
        end.renderLayout(paddingLeft, beginHeight+splitterHeight + paddingTop, availWidth, endHeight);
      }
      else
      {
        // Hide the splitter completely
        splitter.renderLayout(0, 0, 0, 0);

        // Render one child
        if (begin) {
          begin.renderLayout(paddingLeft, paddingTop, availWidth, availHeight);
        } else if (end) {
          end.renderLayout(paddingLeft, paddingTop, availWidth, availHeight);
        }
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var child, hint, props;
      var minHeight=0, height=0, maxHeight=0;
      var minWidth=0, width=0, maxWidth=0;

      for (var i=0; i<length; i++)
      {
        child = children[i];
        props = child.getLayoutProperties();

        // The slider is not relevant for auto sizing
        if (props.type === "slider") {
          continue;
        }

        hint = child.getSizeHint();

        minHeight += hint.minHeight;
        height += hint.height;
        maxHeight += hint.maxHeight;

        if (hint.minWidth > minWidth) {
          minWidth = hint.minWidth;
        }

        if (hint.width > width) {
          width = hint.width;
        }

        if (hint.maxWidth > maxWidth) {
          maxWidth = hint.maxWidth;
        }
      }

      return {
        minHeight : minHeight,
        height : height,
        maxHeight : maxHeight,
        minWidth : minWidth,
        width : width,
        maxWidth : maxWidth
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * Layouter for horizontal split panes.
 *
 * @internal
 */
qx.Class.define("qx.ui.splitpane.HLayout",
{
  extend : qx.ui.layout.Abstract,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "type" || name === "flex", "The property '"+name+"' is not supported by the split layout!");

        if (name == "flex") {
          this.assertNumber(value);
        }

        if (name == "type") {
          this.assertString(value);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var child, type;
      var begin, splitter, slider, end;
      var paddingLeft = padding.left || 0;
      var paddingTop = padding.top || 0;

      for (var i=0; i<length; i++)
      {
        child = children[i];
        type = child.getLayoutProperties().type;

        if (type === "splitter") {
          splitter = child;
        } else if (type === "slider") {
          slider = child;
        } else if (!begin) {
          begin = child;
        } else {
          end = child;
        }
      }

      if (begin && end)
      {
        var beginFlex = begin.getLayoutProperties().flex;
        var endFlex = end.getLayoutProperties().flex;

        if (beginFlex == null) {
          beginFlex = 1;
        }

        if (endFlex == null) {
          endFlex = 1;
        }

        var beginHint = begin.getSizeHint();
        var splitterHint = splitter.getSizeHint();
        var endHint = end.getSizeHint();

        var beginWidth = beginHint.width;
        var splitterWidth = splitterHint.width;
        var endWidth = endHint.width;

        if (beginFlex > 0 && endFlex > 0)
        {
          var flexSum = beginFlex + endFlex;
          var flexAvailable = availWidth - splitterWidth;

          var beginWidth = Math.round((flexAvailable / flexSum) * beginFlex);
          var endWidth = flexAvailable - beginWidth;

          var sizes = qx.ui.layout.Util.arrangeIdeals(beginHint.minWidth, beginWidth, beginHint.maxWidth,
            endHint.minWidth, endWidth, endHint.maxWidth);

          beginWidth = sizes.begin;
          endWidth = sizes.end;
        }
        else if (beginFlex > 0)
        {
          beginWidth = availWidth - splitterWidth - endWidth;
          if (beginWidth < beginHint.minWidth) {
            beginWidth = beginHint.minWidth;
          }

          if (beginWidth > beginHint.maxWidth) {
            beginWidth = beginHint.maxWidth;
          }
        }
        else if (endFlex > 0)
        {
          endWidth = availWidth - beginWidth - splitterWidth;
          if (endWidth < endHint.minWidth) {
            endWidth = endHint.minWidth;
          }

          if (endWidth > endHint.maxWidth) {
            endWidth = endHint.maxWidth;
          }
        }

        begin.renderLayout(paddingLeft, paddingTop, beginWidth, availHeight);
        splitter.renderLayout(beginWidth + paddingLeft, paddingTop, splitterWidth, availHeight);
        end.renderLayout(beginWidth+splitterWidth + paddingLeft, paddingTop, endWidth, availHeight);
      }
      else
      {
        // Hide the splitter completely
        splitter.renderLayout(0, 0, 0, 0);

        // Render one child
        if (begin) {
          begin.renderLayout(paddingLeft, paddingTop, availWidth, availHeight);
        } else if (end) {
          end.renderLayout(paddingLeft, paddingTop, availWidth, availHeight);
        }
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var child, hint, props;
      var minWidth=0, width=0, maxWidth=0;
      var minHeight=0, height=0, maxHeight=0;

      for (var i=0; i<length; i++)
      {
        child = children[i];
        props = child.getLayoutProperties();

        // The slider is not relevant for auto sizing
        if (props.type === "slider") {
          continue;
        }

        hint = child.getSizeHint();

        minWidth += hint.minWidth;
        width += hint.width;
        maxWidth += hint.maxWidth;

        if (hint.minHeight > minHeight) {
          minHeight = hint.minHeight;
        }

        if (hint.height > height) {
          height = hint.height;
        }

        if (hint.maxHeight > maxHeight) {
          maxHeight = hint.maxHeight;
        }
      }

      return {
        minWidth : minWidth,
        width : width,
        maxWidth : maxWidth,
        minHeight : minHeight,
        height : height,
        maxHeight : maxHeight
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)
     * Jonathan Weiß (jonathan_rass)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * A tab view is a multi page view where only one page is visible
 * at each moment. It is possible to switch the pages using the
 * buttons rendered by each page.
 *
 * @childControl bar {qx.ui.container.SlideBar} slidebar for all tab buttons
 * @childControl pane {qx.ui.container.Stack} stack container to show one tab page
 */
qx.Class.define("qx.ui.tabview.TabView",
{
  extend : qx.ui.core.Widget,
  implement : qx.ui.core.ISingleSelection,
  include : [qx.ui.core.MContentPadding],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * @param barPosition {String} Initial bar position ({@link #barPosition})
   */
  construct : function(barPosition)
  {
    this.base(arguments);

    this.__barPositionToState = {
      top : "barTop",
      right : "barRight",
      bottom : "barBottom",
      left : "barLeft"
    };

    this._createChildControl("bar");
    this._createChildControl("pane");

    // Create manager
    var mgr = this.__radioGroup = new qx.ui.form.RadioGroup;
    mgr.setWrap(false);
    mgr.addListener("changeSelection", this._onChangeSelection, this);

    // Initialize bar position
    if (barPosition != null) {
      this.setBarPosition(barPosition);
    } else {
      this.initBarPosition();
    }
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "tabview"
    },

    /**
     * This property defines on which side of the TabView the bar should be positioned.
     */
    barPosition :
    {
      check : ["left", "right", "top", "bottom"],
      init : "top",
      apply : "_applyBarPosition"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.form.RadioGroup} instance containing the radio group */
    __radioGroup : null,


    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "bar":
          control = new qx.ui.container.SlideBar();
          control.setZIndex(10);
          this._add(control);
          break;

        case "pane":
          control = new qx.ui.container.Stack;
          control.setZIndex(5);
          this._add(control, {flex:1});
          break;
      }

      return control || this.base(arguments, id);
    },

    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("pane");
    },


    /*
    ---------------------------------------------------------------------------
      CHILDREN HANDLING
    ---------------------------------------------------------------------------
    */


    /**
     * Adds a page to the tabview including its needed button
     * (contained in the page).
     *
     * @param page {qx.ui.tabview.Page} The page which should be added.
     */
    add : function(page)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!(page instanceof qx.ui.tabview.Page)) {
          throw new Error("Incompatible child for TabView: " + page);
        }
      }

      var button = page.getButton();
      var bar = this.getChildControl("bar");
      var pane = this.getChildControl("pane");

      // Exclude page
      page.exclude();

      // Add button and page
      bar.add(button);
      pane.add(page);

      // Register button
      this.__radioGroup.add(button);

      // Add state to page
      page.addState(this.__barPositionToState[this.getBarPosition()]);

      // Update states
      page.addState("lastTab");
      var children = this.getChildren();
      if (children[0] == page) {
        page.addState("firstTab");
      } else {
        children[children.length-2].removeState("lastTab");
      }

      page.addListener("close", this._onPageClose, this);
    },

    /**
     * Adds a page to the tabview including its needed button
     * (contained in the page).
     *
     * @param page {qx.ui.tabview.Page} The page which should be added.
     * @param index {Integer?null} Optional position where to add the page.
     */
    addAt : function(page, index)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!(page instanceof qx.ui.tabview.Page)) {
          throw new Error("Incompatible child for TabView: " + page);
        }
      }
      var children = this.getChildren();
      if(!(index == null) && index > children.length) {
        throw new Error("Index should be less than : " + children.length);
      }

      if(index == null) {
        index = children.length;
      }

      var button = page.getButton();
      var bar = this.getChildControl("bar");
      var pane = this.getChildControl("pane");

      // Exclude page
      page.exclude();

      // Add button and page
      bar.addAt(button, index);
      pane.addAt(page, index);

      // Register button
      this.__radioGroup.add(button);

      // Add state to page
      page.addState(this.__barPositionToState[this.getBarPosition()]);

      // Update states
      children = this.getChildren();
      if(index == children.length-1) {
        page.addState("lastTab");
      }

      if (children[0] == page) {
        page.addState("firstTab");
      } else {
        children[children.length-2].removeState("lastTab");
      }

      page.addListener("close", this._onPageClose, this);
    },

    /**
     * Removes a page (and its corresponding button) from the TabView.
     *
     * @param page {qx.ui.tabview.Page} The page to be removed.
     */
    remove : function(page)
    {
      var pane = this.getChildControl("pane");
      var bar = this.getChildControl("bar");
      var button = page.getButton();
      var children = pane.getChildren();

      // Try to select next page
      if (this.getSelection()[0] == page)
      {
        var index = children.indexOf(page);
        if (index == 0)
        {
          if (children[1]) {
            this.setSelection([children[1]]);
          } else {
            this.resetSelection();
          }
        }
        else
        {
          this.setSelection([children[index-1]]);
        }
      }

      // Remove the button and page
      bar.remove(button);
      pane.remove(page);

      // Remove the button from the radio group
      this.__radioGroup.remove(button);

      // Remove state from page
      page.removeState(this.__barPositionToState[this.getBarPosition()]);

      // Update states
      if (page.hasState("firstTab"))
      {
        page.removeState("firstTab");
        if (children[0]) {
          children[0].addState("firstTab");
        }
      }

      if (page.hasState("lastTab"))
      {
        page.removeState("lastTab");
        if (children.length > 0) {
          children[children.length-1].addState("lastTab");
        }
      }

      page.removeListener("close", this._onPageClose, this);
    },

    /**
     * Returns TabView's children widgets.
     *
     * @return {qx.ui.tabview.Page[]} List of children.
     */
    getChildren : function() {
      return this.getChildControl("pane").getChildren();
    },

    /**
     * Returns the position of the given page in the TabView.
     *
     * @param page {qx.ui.tabview.Page} The page to query for.
     * @return {Integer} Position of the page in the TabView.
     */
    indexOf : function(page) {
      return this.getChildControl("pane").indexOf(page);
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    /** @type {Map} Maps the bar position to an appearance state */
    __barPositionToState : null,

    /**
     * Apply method for the placeBarOnTop-Property.
     *
     * Passes the desired value to the layout of the tabview so
     * that the layout can handle it.
     * It also sets the states to all buttons so they know the
     * position of the bar.
     *
     * @param value {Boolean} The new value.
     * @param old {Boolean} The old value.
     */
    _applyBarPosition : function(value, old)
    {
      var bar = this.getChildControl("bar");
      var pane = this.getChildControl("pane");

      var horizontal = value == "left" || value == "right";
      var reversed = value == "right" || value == "bottom";

      var layoutClass = horizontal ? qx.ui.layout.HBox : qx.ui.layout.VBox;

      var layout = this._getLayout();
      if (layout && layout instanceof layoutClass) {
        // pass
      } else {
        this._setLayout(layout = new layoutClass);
      }

      // Update reversed
      layout.setReversed(reversed);

      // Sync orientation to bar
      bar.setOrientation(horizontal ? "vertical" : "horizontal");

      // Read children
      var children = this.getChildren();

      var i, l;
      // Toggle state to bar
      if (old)
      {
        var oldState = this.__barPositionToState[old];

        // Update bar
        bar.removeState(oldState);

        // Update pane
        pane.removeState(oldState);

        // Update pages
        for (i=0, l=children.length; i<l; i++) {
          children[i].removeState(oldState);
        }
      }

      if (value)
      {
        var newState = this.__barPositionToState[value];

        // Update bar
        bar.addState(newState);

        // Update pane
        pane.addState(newState);

        // Update pages
        for (i=0, l=children.length; i<l; i++) {
          children[i].addState(newState);
        }
      }
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION API
    ---------------------------------------------------------------------------
    */

    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.tabview.Page[]} List of items.
     */
    getSelection : function() {
      var buttons = this.__radioGroup.getSelection();
      var result = [];

      for (var i = 0; i < buttons.length; i++) {
        result.push(buttons[i].getUserData("page"));
      }

      return result;
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.tabview.Page[]} Items to select.
     * @throws {Error} if one of the items is not a child element and if
     *    items contains more than one elements.
     */
    setSelection : function(items) {
      var buttons = [];

      for (var i = 0; i < items.length; i++) {
        buttons.push(items[i].getChildControl("button"));
      }
      this.__radioGroup.setSelection(buttons);
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      this.__radioGroup.resetSelection();
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.tabview.Page} Any valid selectable item.
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if one of the items is not a child element.
     */
    isSelected : function(item) {
      var button = item.getChildControl("button");
      return this.__radioGroup.isSelected(button);
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return this.__radioGroup.isSelectionEmpty();
    },


    /**
     * Returns all elements which are selectable.
     *
     * @return {qx.ui.tabview.Page[]} The contained items.
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     */
    getSelectables: function(all) {
      var buttons = this.__radioGroup.getSelectables(all);
      var result = [];

      for (var i = 0; i <buttons.length; i++) {
        result.push(buttons[i].getUserData("page"));
      }

      return result;
    },

    /**
     * Event handler for <code>changeSelection</code>.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    _onChangeSelection : function(e)
    {
      var pane = this.getChildControl("pane");
      var button = e.getData()[0];
      var oldButton = e.getOldData()[0];
      var value = [];
      var old = [];

      if (button)
      {
        value = [button.getUserData("page")];
        pane.setSelection(value);
        button.focus();
        this.scrollChildIntoView(button, null, null, false);
      }
      else
      {
        pane.resetSelection();
      }

      if (oldButton) {
        old = [oldButton.getUserData("page")];
      }

      this.fireDataEvent("changeSelection", value, old);
    },

    /**
     * Event handler for <code>beforeChangeSelection</code>.
     *
     * @param e {qx.event.type.Event} Data event.
     */
    _onBeforeChangeSelection : function(e)
    {
      if (!this.fireNonBubblingEvent("beforeChangeSelection",
          qx.event.type.Event, [false, true])) {
        e.preventDefault();
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the change of the selected item of the radio group.
     * @param e {qx.event.type.Data} The data event
     */
    _onRadioChangeSelection : function(e) {
      var element = e.getData()[0];
      if (element) {
        this.setSelection([element.getUserData("page")]);
      } else {
        this.resetSelection();
      }
    },


    /**
     * Removes the Page widget on which the close button was tapped.
     *
     * @param e {qx.event.type.Pointer} pointer event
     */
    _onPageClose : function(e)
    {
      // reset the old close button states, before remove page
      // see http://bugzilla.qooxdoo.org/show_bug.cgi?id=3763 for details
      var page = e.getTarget();
      var closeButton = page.getButton().getChildControl("close-button");
      closeButton.reset();

      this.remove(page);
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeObjects("__radioGroup");
    this.__barPositionToState = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * Container, which provides scrolling in one dimension (vertical or horizontal).
 *
 * @childControl button-forward {qx.ui.form.RepeatButton} button to step forward
 * @childControl button-backward {qx.ui.form.RepeatButton} button to step backward
 * @childControl content {qx.ui.container.Composite} container to hold the content
 * @childControl scrollpane {qx.ui.core.scroll.ScrollPane} the scroll pane holds the content to enable scrolling
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   // create slide bar container
 *   slideBar = new qx.ui.container.SlideBar().set({
 *     width: 300
 *   });
 *
 *   // set layout
 *   slideBar.setLayout(new qx.ui.layout.HBox());
 *
 *   // add some widgets
 *   for (var i=0; i<10; i++)
 *   {
 *     slideBar.add((new qx.ui.core.Widget()).set({
 *       backgroundColor : (i % 2 == 0) ? "red" : "blue",
 *       width : 60
 *     }));
 *   }
 *
 *   this.getRoot().add(slideBar);
 * </pre>
 *
 * This example creates a SlideBar and add some widgets with alternating
 * background colors. Since the content is larger than the container, two
 * scroll buttons at the left and the right edge are shown.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/slidebar.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.container.SlideBar",
{
  extend : qx.ui.core.Widget,

  include :
  [
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.core.MRemoteLayoutHandling
  ],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param orientation {String?"horizontal"} The slide bar orientation
   */
  construct : function(orientation)
  {
    this.base(arguments);

    var scrollPane = this.getChildControl("scrollpane");
    this._add(scrollPane, {flex: 1});

    if (orientation != null) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }

    this.addListener("roll", this._onRoll, this);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "slidebar"
    },

    /** Orientation of the bar */
    orientation :
    {
      check : ["horizontal", "vertical"],
      init : "horizontal",
      apply : "_applyOrientation"
    },

    /** The number of pixels to scroll if the buttons are pressed */
    scrollStep :
    {
      check : "Integer",
      init : 15,
      themeable : true
    }
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired on scroll animation end invoked by 'scroll*' methods. */
    scrollAnimationEnd : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    getChildrenContainer : function() {
      return this.getChildControl("content");
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "button-forward":
          control = new qx.ui.form.RepeatButton;
          control.addListener("execute", this._onExecuteForward, this);
          control.setFocusable(false);
          this._addAt(control, 2);
          break;

        case "button-backward":
          control = new qx.ui.form.RepeatButton;
          control.addListener("execute", this._onExecuteBackward, this);
          control.setFocusable(false);
          this._addAt(control, 0);
          break;

        case "content":
          control = new qx.ui.container.Composite();

          this.getChildControl("scrollpane").add(control);
          break;

        case "scrollpane":
          control = new qx.ui.core.scroll.ScrollPane();
          control.addListener("update", this._onResize, this);
          control.addListener("scrollX", this._onScroll, this);
          control.addListener("scrollY", this._onScroll, this);
          control.addListener("scrollAnimationEnd", this._onScrollAnimationEnd, this);
          break;
      }

      return control || this.base(arguments, id);
    },

    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      barLeft : true,
      barTop : true,
      barRight : true,
      barBottom : true
    },

    /*
    ---------------------------------------------------------------------------
      PUBLIC SCROLL API
    ---------------------------------------------------------------------------
    */

    /**
     * Scrolls the element's content by the given amount.
     *
     * @param offset {Integer?0} Amount to scroll
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollBy : function(offset, duration)
    {
      var pane = this.getChildControl("scrollpane");
      if (this.getOrientation() === "horizontal") {
        pane.scrollByX(offset, duration);
      } else {
        pane.scrollByY(offset, duration);
      }
    },


    /**
     * Scrolls the element's content to the given coordinate
     *
     * @param value {Integer} The position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollTo : function(value, duration)
    {
      var pane = this.getChildControl("scrollpane");
      if (this.getOrientation() === "horizontal") {
        pane.scrollToX(value, duration);
      } else {
        pane.scrollToY(value, duration);
      }
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */
    // overridden
    _applyEnabled : function(value, old, name) {
      this.base(arguments, value, old, name);
      this._updateArrowsEnabled();
    },


    // property apply
    _applyOrientation : function(value, old)
    {
      var oldLayouts = [this.getLayout(), this._getLayout()];
      var buttonForward = this.getChildControl("button-forward");
      var buttonBackward = this.getChildControl("button-backward");

      // old can also be null, so we have to check both explicitly to set
      // the states correctly.
      if (old == "vertical" && value == "horizontal")
      {
        buttonForward.removeState("vertical");
        buttonBackward.removeState("vertical");
        buttonForward.addState("horizontal");
        buttonBackward.addState("horizontal");
      }
      else if (old == "horizontal" && value == "vertical")
      {
        buttonForward.removeState("horizontal");
        buttonBackward.removeState("horizontal");
        buttonForward.addState("vertical");
        buttonBackward.addState("vertical");
      }


      if (value == "horizontal")
      {
        this._setLayout(new qx.ui.layout.HBox());
        this.setLayout(new qx.ui.layout.HBox());
      }
      else
      {
        this._setLayout(new qx.ui.layout.VBox());
        this.setLayout(new qx.ui.layout.VBox());
      }

      if (oldLayouts[0]) {
        oldLayouts[0].dispose();
      }

      if (oldLayouts[1]) {
        oldLayouts[1].dispose();
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Scrolls pane on roll events
     *
     * @param e {qx.event.type.Roll} the roll event
     */
    _onRoll : function(e)
    {
      // only wheel and touch
      if (e.getPointerType() == "mouse") {
        return;
      }

      var delta = 0;
      var pane = this.getChildControl("scrollpane");
      if (this.getOrientation() === "horizontal") {
        delta = e.getDelta().x;

        var position = pane.getScrollX();
        var max = pane.getScrollMaxX();
        var steps = parseInt(delta);

        // pass the event to the parent if both scrollbars are at the end
        if (!(
          steps < 0 && position <= 0 ||
          steps > 0 && position >= max ||
          delta == 0)
        ) {
          e.stop();
        } else {
          e.stopMomentum();
        }
      } else {
        delta = e.getDelta().y;

        var position = pane.getScrollY();
        var max = pane.getScrollMaxY();
        var steps = parseInt(delta);

        // pass the event to the parent if both scrollbars are at the end
        if (!(
          steps < 0 && position <= 0 ||
          steps > 0 && position >= max ||
          delta == 0
        )) {
          e.stop();
        } else {
          e.stopMomentum();
        }
      }
      this.scrollBy(parseInt(delta, 10));

      // block all momentum scrolling
      if (e.getMomentum()) {
        e.stop();
      }
    },


    /**
     * Update arrow enabled state after scrolling
     */
    _onScroll : function() {
      this._updateArrowsEnabled();
    },


    /**
     * Handler to fire the 'scrollAnimationEnd' event.
     */
    _onScrollAnimationEnd : function() {
      this.fireEvent("scrollAnimationEnd");
    },


    /**
     * Listener for resize event. This event is fired after the
     * first flush of the element which leads to another queuing
     * when the changes modify the visibility of the scroll buttons.
     *
     * @param e {Event} Event object
     */
    _onResize : function(e)
    {
      var content = this.getChildControl("scrollpane").getChildren()[0];
      if (!content) {
        return;
      }

      var innerSize = this.getInnerSize();
      var contentSize = content.getBounds();

      var overflow = (this.getOrientation() === "horizontal") ?
        contentSize.width > innerSize.width :
        contentSize.height > innerSize.height;

      if (overflow) {
        this._showArrows()
        this._updateArrowsEnabled();
      } else {
        this._hideArrows();
      }
    },


    /**
     * Scroll handler for left scrolling
     *
     */
    _onExecuteBackward : function() {
      this.scrollBy(-this.getScrollStep());
    },


    /**
     * Scroll handler for right scrolling
     *
     */
    _onExecuteForward : function() {
      this.scrollBy(this.getScrollStep());
    },


    /*
    ---------------------------------------------------------------------------
      UTILITIES
    ---------------------------------------------------------------------------
    */

    /**
     * Update arrow enabled state
     */
    _updateArrowsEnabled : function()
    {
      // set the disables state directly because we are overriding the
      // inheritance
      if (!this.getEnabled()) {
        this.getChildControl("button-backward").setEnabled(false);
        this.getChildControl("button-forward").setEnabled(false);
        return;
      }

      var pane = this.getChildControl("scrollpane");

      if (this.getOrientation() === "horizontal")
      {
        var position = pane.getScrollX();
        var max = pane.getScrollMaxX();
      }
      else
      {
        var position = pane.getScrollY();
        var max = pane.getScrollMaxY();
      }

      this.getChildControl("button-backward").setEnabled(position > 0);
      this.getChildControl("button-forward").setEnabled(position < max);
    },


    /**
     * Show the arrows (Called from resize event)
     *
     */
    _showArrows : function()
    {
      this._showChildControl("button-forward");
      this._showChildControl("button-backward");
    },


    /**
     * Hide the arrows (Called from resize event)
     *
     */
    _hideArrows : function()
    {
      this._excludeChildControl("button-forward");
      this._excludeChildControl("button-backward");

      this.scrollTo(0);
    }
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The RepeatButton is a special button, which fires repeatedly {@link #execute}
 * events, while a button is pressed on the button. The initial delay
 * and the interval time can be set using the properties {@link #firstInterval}
 * and {@link #interval}. The {@link #execute} events will be fired in a shorter
 * amount of time if a button is hold, until the min {@link #minTimer}
 * is reached. The {@link #timerDecrease} property sets the amount of milliseconds
 * which will decreased after every firing.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.RepeatButton("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button is executed");
 *   }, this);
 *
 *   this.getRoot.add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/repeatbutton.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.RepeatButton",
{
  extend : qx.ui.form.Button,


  /**
   * @param label {String} Label to use
   * @param icon {String?null} Icon to use
   */
  construct : function(label, icon)
  {
    this.base(arguments, label, icon);

    // create the timer and add the listener
    this.__timer = new qx.event.AcceleratingTimer();
    this.__timer.addListener("interval", this._onInterval, this);
  },


  events :
  {
    /**
     * This event gets dispatched with every interval. The timer gets executed
     * as long as the user holds down a button.
     */
    "execute" : "qx.event.type.Event",

    /**
     * This event gets dispatched when the button is pressed.
     */
    "press"   : "qx.event.type.Event",

    /**
     * This event gets dispatched when the button is released.
     */
    "release" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * Interval used after the first run of the timer. Usually a smaller value
     * than the "firstInterval" property value to get a faster reaction.
     */
    interval :
    {
      check : "Integer",
      init  : 100
    },

    /**
     * Interval used for the first run of the timer. Usually a greater value
     * than the "interval" property value to a little delayed reaction at the first
     * time.
     */
    firstInterval :
    {
      check : "Integer",
      init  : 500
    },

    /** This configures the minimum value for the timer interval. */
    minTimer :
    {
      check : "Integer",
      init  : 20
    },

    /** Decrease of the timer on each interval (for the next interval) until minTimer reached. */
    timerDecrease :
    {
      check : "Integer",
      init  : 2
    }
  },


  members :
  {
    __executed : null,
    __timer : null,


    /**
     * Calling this function is like a tap from the user on the
     * button with all consequences.
     * <span style='color: red'>Be sure to call the {@link #release} function.</span>
     *
     */
    press : function()
    {
      // only if the button is enabled
      if (this.isEnabled())
      {
        // if the state pressed must be applied (first call)
        if (!this.hasState("pressed"))
        {
          // start the timer
          this.__startInternalTimer();
        }

        // set the states
        this.removeState("abandoned");
        this.addState("pressed");
      }
    },


    /**
     * Calling this function is like a release from the user on the
     * button with all consequences.
     * Usually the {@link #release} function will be called before the call of
     * this function.
     *
     * @param fireExecuteEvent {Boolean?true} flag which signals, if an event should be fired
     */
    release : function(fireExecuteEvent)
    {
      // only if the button is enabled
      if (!this.isEnabled()) {
        return;
      }

      // only if the button is pressed
      if (this.hasState("pressed"))
      {
        // if the button has not been executed
        if (!this.__executed) {
          this.execute();
        }
      }

      // remove button states
      this.removeState("pressed");
      this.removeState("abandoned");

      // stop the repeat timer and therefore the execution
      this.__stopInternalTimer();
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);

      if (!value)
      {
        if (this.isCapturing()) {
          // also release capture because out event is missing on iOS
          this.releaseCapture();
        }

        // remove button states
        this.removeState("pressed");
        this.removeState("abandoned");

        // stop the repeat timer and therefore the execution
        this.__stopInternalTimer();
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Pointer event
     */
    _onPointerOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
        this.__timer.start();
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Pointer event
     */
    _onPointerOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
        this.__timer.stop();
      }
    },


    /**
     * Callback method for the "pointerdown" method.
     *
     * Sets the interval of the timer (value of firstInterval property) and
     * starts the timer. Additionally removes the state "abandoned" and adds the
     * state "pressed".
     *
     * @param e {qx.event.type.Pointer} pointerdown event
     */
    _onPointerDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      // Activate capturing if the button get a pointerout while
      // the button is pressed.
      this.capture();

      this.__startInternalTimer();
      e.stopPropagation();
    },


    /**
     * Callback method for the "pointerup" event.
     *
     * Handles the case that the user is releasing a button
     * before the timer interval method got executed. This way the
     * "execute" method get executed at least one time.
     *
     * @param e {qx.event.type.Pointer} pointerup event
     */
    _onPointerUp : function(e)
    {
      this.releaseCapture();

      if (!this.hasState("abandoned"))
      {
        this.addState("hovered");

        if (this.hasState("pressed") && !this.__executed) {
          this.execute();
        }
      }

      this.__stopInternalTimer();
      e.stopPropagation();
    },


    // Nothing to do, 'execute' is already fired by _onPointerUp.
    _onTap : function(e) {},


    /**
     * Listener method for "keyup" event.
     *
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space" and stops the internal timer
     * (same like pointer up).
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            if (!this.__executed) {
              this.execute();
            }

            this.removeState("pressed");
            this.removeState("abandoned");
            e.stopPropagation();
            this.__stopInternalTimer();
          }
      }
    },


    /**
     * Listener method for "keydown" event.
     *
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space". It also starts
     * the internal timer (same like pointerdown).
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
          this.__startInternalTimer();
      }
    },


    /**
     * Callback for the interval event.
     *
     * Stops the timer and starts it with a new interval
     * (value of the "interval" property - value of the "timerDecrease" property).
     * Dispatches the "execute" event.
     *
     * @param e {qx.event.type.Event} interval event
     */
    _onInterval : function(e)
    {
      this.__executed = true;
      this.fireEvent("execute");
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL TIMER
    ---------------------------------------------------------------------------
    */

    /**
     * Starts the internal timer which causes firing of execution
     * events in an interval. It also presses the button.
     *
     */
    __startInternalTimer : function()
    {
      this.fireEvent("press");

      this.__executed = false;

      this.__timer.set({
        interval: this.getInterval(),
        firstInterval: this.getFirstInterval(),
        minimum: this.getMinTimer(),
        decrease: this.getTimerDecrease()
      }).start();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Stops the internal timer and releases the button.
     *
     */
    __stopInternalTimer : function()
    {
      this.fireEvent("release");

      this.__timer.stop();

      this.removeState("abandoned");
      this.removeState("pressed");
    }
  },




  /*
    *****************************************************************************
       DESTRUCTOR
    *****************************************************************************
    */

  destruct : function() {
    this._disposeObjects("__timer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Timer, which accelerates after each interval. The initial delay and the
 * interval time can be set using the properties {@link #firstInterval}
 * and {@link #interval}. The {@link #interval} events will be fired with
 * decreasing interval times while the timer is running, until the {@link #minimum}
 * is reached. The {@link #decrease} property sets the amount of milliseconds
 * which will decreased after every firing.
 *
 * This class is e.g. used in the {@link qx.ui.form.RepeatButton} and
 * {@link qx.ui.form.HoverButton} widgets.
 */
qx.Class.define("qx.event.AcceleratingTimer",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    this.__timer = new qx.event.Timer(this.getInterval());
    this.__timer.addListener("interval", this._onInterval, this);
  },


  events :
  {
    /** This event if fired each time the interval time has elapsed */
    "interval" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * Interval used after the first run of the timer. Usually a smaller value
     * than the "firstInterval" property value to get a faster reaction.
     */
    interval :
    {
      check : "Integer",
      init  : 100
    },

    /**
     * Interval used for the first run of the timer. Usually a greater value
     * than the "interval" property value to a little delayed reaction at the first
     * time.
     */
    firstInterval :
    {
      check : "Integer",
      init  : 500
    },

    /** This configures the minimum value for the timer interval. */
    minimum :
    {
      check : "Integer",
      init  : 20
    },

    /** Decrease of the timer on each interval (for the next interval) until minTimer reached. */
    decrease :
    {
      check : "Integer",
      init  : 2
    }
  },


  members :
  {
    __timer : null,
    __currentInterval : null,

    /**
     * Reset and start the timer.
     */
    start : function()
    {
      this.__timer.setInterval(this.getFirstInterval());
      this.__timer.start();
    },


    /**
     * Stop the timer
     */
    stop : function()
    {
      this.__timer.stop();
      this.__currentInterval = null;
    },


    /**
     * Interval event handler
     */
    _onInterval : function()
    {
      this.__timer.stop();

      if (this.__currentInterval == null) {
        this.__currentInterval = this.getInterval();
      }

      this.__currentInterval = Math.max(
        this.getMinimum(),
        this.__currentInterval - this.getDecrease()
      );

      this.__timer.setInterval(this.__currentInterval);
      this.__timer.start();

      this.fireEvent("interval");
    }
  },


  destruct : function() {
    this._disposeObjects("__timer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class represents a scroll able pane. This means that this widget
 * may contain content which is bigger than the available (inner)
 * dimensions of this widget. The widget also offer methods to control
 * the scrolling position. It can only have exactly one child.
 */
qx.Class.define("qx.ui.core.scroll.ScrollPane",
{
  extend : qx.ui.core.Widget,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.set({
      minWidth: 0,
      minHeight: 0
    });

    // Automatically configure a "fixed" grow layout.
    this._setLayout(new qx.ui.layout.Grow());

    // Add resize listener to "translate" event
    this.addListener("resize", this._onUpdate);

    var contentEl = this.getContentElement();

    // Synchronizes the DOM scroll position with the properties
    contentEl.addListener("scroll", this._onScroll, this);

    // Fixed some browser quirks e.g. correcting scroll position
    // to the previous value on re-display of a pane
    contentEl.addListener("appear", this._onAppear, this);
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired on resize of both the container or the content. */
    update : "qx.event.type.Event",

    /** Fired on scroll animation end invoked by 'scroll*' methods. */
    scrollAnimationEnd : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The horizontal scroll position */
    scrollX :
    {
      check : "qx.lang.Type.isNumber(value)&&value>=0&&value<=this.getScrollMaxX()",
      apply : "_applyScrollX",
      event : "scrollX",
      init  : 0
    },

    /** The vertical scroll position */
    scrollY :
    {
      check : "qx.lang.Type.isNumber(value)&&value>=0&&value<=this.getScrollMaxY()",
      apply : "_applyScrollY",
      event : "scrollY",
      init  : 0
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __frame : null,


    /*
    ---------------------------------------------------------------------------
      CONTENT MANAGEMENT
    ---------------------------------------------------------------------------
    */

    /**
     * Configures the content of the scroll pane. Replaces any existing child
     * with the newly given one.
     *
     * @param widget {qx.ui.core.Widget?null} The content widget of the pane
     */
    add : function(widget)
    {
      var old = this._getChildren()[0];
      if (old)
      {
        this._remove(old);
        old.removeListener("resize", this._onUpdate, this);
      }

      if (widget)
      {
        this._add(widget);
        widget.addListener("resize", this._onUpdate, this);
      }
    },


    /**
     * Removes the given widget from the content. The pane is empty
     * afterwards as only one child is supported by the pane.
     *
     * @param widget {qx.ui.core.Widget?null} The content widget of the pane
     */
    remove : function(widget)
    {
      if (widget)
      {
        this._remove(widget);
        widget.removeListener("resize", this._onUpdate, this);
      }
    },


    /**
     * Returns an array containing the current content.
     *
     * @return {Object[]} The content array
     */
    getChildren : function() {
      return this._getChildren();
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for resize event of content and container
     *
     * @param e {Event} Resize event object
     */
    _onUpdate : function(e) {
      this.fireEvent("update");
    },


    /**
     * Event listener for scroll event of content
     *
     * @param e {qx.event.type.Event} Scroll event object
     */
    _onScroll : function(e)
    {
      var contentEl = this.getContentElement();

      this.setScrollX(contentEl.getScrollX());
      this.setScrollY(contentEl.getScrollY());
    },


    /**
     * Event listener for appear event of content
     *
     * @param e {qx.event.type.Event} Appear event object
     */
    _onAppear : function(e)
    {
      var contentEl = this.getContentElement();

      var internalX = this.getScrollX();
      var domX = contentEl.getScrollX();

      if (internalX != domX) {
        contentEl.scrollToX(internalX);
      }

      var internalY = this.getScrollY();
      var domY = contentEl.getScrollY();

      if (internalY != domY) {
        contentEl.scrollToY(internalY);
      }
    },





    /*
    ---------------------------------------------------------------------------
      ITEM LOCATION SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the top offset of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemTop : function(item)
    {
      var top = 0;

      do
      {
        top += item.getBounds().top;
        item = item.getLayoutParent();
      }
      while (item && item !== this);

      return top;
    },


    /**
     * Returns the top offset of the end of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemBottom : function(item) {
      return this.getItemTop(item) + item.getBounds().height;
    },


    /**
     * Returns the left offset of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemLeft : function(item)
    {
      var left = 0;
      var parent;

      do
      {
        left += item.getBounds().left;
        parent = item.getLayoutParent();
        if (parent) {
          left += parent.getInsets().left;
        }
        item = parent;
      }
      while (item && item !== this);

      return left;
    },


    /**
     * Returns the left offset of the end of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Right offset
     */
    getItemRight : function(item) {
      return this.getItemLeft(item) + item.getBounds().width;
    },





    /*
    ---------------------------------------------------------------------------
      DIMENSIONS
    ---------------------------------------------------------------------------
    */

    /**
     * The size (identical with the preferred size) of the content.
     *
     * @return {Map} Size of the content (keys: <code>width</code> and <code>height</code>)
     */
    getScrollSize : function() {
      return this.getChildren()[0].getBounds();
    },






    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * The maximum horizontal scroll position.
     *
     * @return {Integer} Maximum horizontal scroll position.
     */
    getScrollMaxX : function()
    {
      var paneSize = this.getInnerSize();
      var scrollSize = this.getScrollSize();

      if (paneSize && scrollSize) {
        return Math.max(0, scrollSize.width - paneSize.width);
      }

      return 0;
    },


    /**
     * The maximum vertical scroll position.
     *
     * @return {Integer} Maximum vertical scroll position.
     */
    getScrollMaxY : function()
    {
      var paneSize = this.getInnerSize();
      var scrollSize = this.getScrollSize();

      if (paneSize && scrollSize) {
        return Math.max(0, scrollSize.height - paneSize.height);
      }

      return 0;
    },


    /**
     * Scrolls the element's content to the given left coordinate
     *
     * @param value {Integer} The vertical position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToX : function(value, duration)
    {
      var max = this.getScrollMaxX();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      this.stopScrollAnimation();

      if (duration) {
        var from = this.getScrollX();
        this.__frame = new qx.bom.AnimationFrame();
        this.__frame.on("end", function() {
          this.setScrollX(value);
          this.__frame = null;
          this.fireEvent("scrollAnimationEnd");
        }, this);
        this.__frame.on("frame", function(timePassed) {
          var newX = parseInt(timePassed/duration * (value - from) + from);
          this.setScrollX(newX);
        }, this);
        this.__frame.startSequence(duration);

      } else {
        this.setScrollX(value);
      }
    },


    /**
     * Scrolls the element's content to the given top coordinate
     *
     * @param value {Integer} The horizontal position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToY : function(value, duration)
    {
      var max = this.getScrollMaxY();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      this.stopScrollAnimation();

      if (duration) {
        var from = this.getScrollY();
        this.__frame = new qx.bom.AnimationFrame();
        this.__frame.on("end", function() {
          this.setScrollY(value);
          this.__frame = null;
          this.fireEvent("scrollAnimationEnd");
        }, this);
        this.__frame.on("frame", function(timePassed) {
          var newY = parseInt(timePassed/duration * (value - from) + from);
          this.setScrollY(newY);
        }, this);
        this.__frame.startSequence(duration);

      } else {
        this.setScrollY(value);
      }
    },


    /**
     * Scrolls the element's content horizontally by the given amount.
     *
     * @param x {Integer?0} Amount to scroll
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByX : function(x, duration) {
      this.scrollToX(this.getScrollX() + x, duration);
    },


    /**
     * Scrolls the element's content vertically by the given amount.
     *
     * @param y {Integer?0} Amount to scroll
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByY : function(y, duration) {
      this.scrollToY(this.getScrollY() + y, duration);
    },


    /**
     * If an scroll animation is running, it will be stopped with that method.
     */
    stopScrollAnimation : function() {
      if (this.__frame) {
        this.__frame.cancelSequence();
        this.__frame = null;
      }
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyScrollX : function(value) {
      this.getContentElement().scrollToX(value);
    },


    // property apply
    _applyScrollY : function(value) {
      this.getContentElement().scrollToY(value);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)
     * Adrian Olaru (adrianolaru)

************************************************************************ */

/**
 * The stack container puts its child widgets on top of each other and only the
 * topmost widget is visible.
 *
 * This is used e.g. in the tab view widget. Which widget is visible can be
 * controlled by using the {@link #getSelection} method.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   // create stack container
 *   var stack = new qx.ui.container.Stack();
 *
 *   // add some children
 *   stack.add(new qx.ui.core.Widget().set({
 *    backgroundColor: "red"
 *   }));
 *   stack.add(new qx.ui.core.Widget().set({
 *    backgroundColor: "green"
 *   }));
 *   stack.add(new qx.ui.core.Widget().set({
 *    backgroundColor: "blue"
 *   }));
 *
 *   // select green widget
 *   stack.setSelection([stack.getChildren()[1]]);
 *
 *   this.getRoot().add(stack);
 * </pre>
 *
 * This example creates an stack with three children. Only the selected "green"
 * widget is visible.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/stack.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.container.Stack",
{
  extend : qx.ui.core.Widget,
  implement : qx.ui.core.ISingleSelection,
  include : [
    qx.ui.core.MSingleSelectionHandling,
    qx.ui.core.MChildrenHandling
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  construct : function()
  {
    this.base(arguments);

    this._setLayout(new qx.ui.layout.Grow);

    this.addListener("changeSelection", this.__onChangeSelection, this);
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Whether the size of the widget depends on the selected child. When
     * disabled (default) the size is configured to the largest child.
     */
    dynamic :
    {
      check : "Boolean",
      init : false,
      apply : "_applyDynamic"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    // property apply
    _applyDynamic : function(value)
    {
      var children = this._getChildren();
      var selected = this.getSelection()[0];
      var child;

      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];

        if (child != selected)
        {
          if (value) {
            children[i].exclude();
          } else {
            children[i].hide();
          }
        }
      }
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS FOR SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the widget for the selection.
     * @return {qx.ui.core.Widget[]} Widgets to select.
     */
    _getItems : function() {
      return this.getChildren();
    },

    /**
     * Returns if the selection could be empty or not.
     *
     * @return {Boolean} <code>true</code> If selection could be empty,
     *    <code>false</code> otherwise.
     */
    _isAllowEmptySelection : function() {
      return true;
    },

    /**
     * Returns whether the given item is selectable.
     *
     * @param item {qx.ui.core.Widget} The item to be checked
     * @return {Boolean} Whether the given item is selectable
     */
    _isItemSelectable : function(item) {
      return true;
    },

    /**
     * Event handler for <code>changeSelection</code>.
     *
     * Shows the new selected widget and hide the old one.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    __onChangeSelection : function(e)
    {
      var old = e.getOldData()[0];
      var value = e.getData()[0];

      if (old)
      {
        if (this.isDynamic()) {
          old.exclude();
        } else {
          old.hide();
        }
      }

      if (value) {
        value.show();
      }
    },


    //overriden
    _afterAddChild : function(child) {
      var selected = this.getSelection()[0];

      if (!selected) {
        this.setSelection([child]);
      } else if (selected !== child) {
        if (this.isDynamic()) {
          child.exclude();
        } else {
          child.hide();
        }
      }
    },


    //overriden
    _afterRemoveChild : function(child) {
      if (this.getSelection()[0] === child) {
        var first = this._getChildren()[0];

        if (first) {
          this.setSelection([first]);
        } else {
          this.resetSelection();
        }
      }
    },


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Go to the previous child in the children list.
     */
    previous : function()
    {
      var selected = this.getSelection()[0];
      var go = this._indexOf(selected)-1;
      var children = this._getChildren();

      if (go < 0) {
        go = children.length - 1;
      }

      var prev = children[go];
      this.setSelection([prev]);
    },

    /**
     * Go to the next child in the children list.
     */
    next : function()
    {
      var selected = this.getSelection()[0];
      var go = this._indexOf(selected)+1;
      var children = this._getChildren();

      var next = children[go] || children[0];

      this.setSelection([next]);
    }
  }
});
