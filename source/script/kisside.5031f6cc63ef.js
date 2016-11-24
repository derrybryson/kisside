/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The form object is responsible for managing form items. For that, it takes
 * advantage of two existing qooxdoo classes.
 * The {@link qx.ui.form.Resetter} is used for resetting and the
 * {@link qx.ui.form.validation.Manager} is used for all validation purposes.
 *
 * The view code can be found in the used renderer ({@link qx.ui.form.renderer}).
 */
qx.Class.define("qx.ui.form.Form",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__groups = [];
    this._buttons = [];
    this._buttonOptions = [];
    this._validationManager = this._createValidationManager();
    this._resetter = this._createResetter();
  },


  events : {
    /** Fired as soon as something changes in the form.*/
    "change" : "qx.event.type.Event"
  },


  members :
  {
    __groups : null,
    _validationManager : null,
    _groupCounter : 0,
    _buttons : null,
    _buttonOptions : null,
    _resetter : null,

    /*
    ---------------------------------------------------------------------------
       ADD
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a form item to the form including its internal
     * {@link qx.ui.form.validation.Manager} and {@link qx.ui.form.Resetter}.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param item {qx.ui.form.IForm} A supported form item.
     * @param label {String} The string, which should be used as label.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator ? null}
     *   The validator which is used by the validation
     *   {@link qx.ui.form.validation.Manager}.
     * @param name {String?null} The name which is used by the data binding
     *   controller {@link qx.data.controller.Form}.
     * @param validatorContext {var?null} The context of the validator.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added item.
     */
    add : function(item, label, validator, name, validatorContext, options) {
      if (this.__isFirstAdd()) {
        this.__groups.push({
          title: null, items: [], labels: [], names: [],
          options: [], headerOptions: {}
        });
      }
      // save the given arguments
      this.__groups[this._groupCounter].items.push(item);
      this.__groups[this._groupCounter].labels.push(label);
      this.__groups[this._groupCounter].options.push(options);
      // if no name is given, use the label without not working character
      if (name == null) {
        name = label.replace(
          /\s+|&|-|\+|\*|\/|\||!|\.|,|:|\?|;|~|%|\{|\}|\(|\)|\[|\]|<|>|=|\^|@|\\/g, ""
        );
      }
      this.__groups[this._groupCounter].names.push(name);

      // add the item to the validation manager
      this._validationManager.add(item, validator, validatorContext);
      // add the item to the reset manager
      this._resetter.add(item);
      // fire the change event
      this.fireEvent("change");
    },


    /**
     * Adds a group header to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param title {String} The title of the group header.
     * @param options {Map?null} A special set of custom data which will be
     *   given to the renderer.
     */
    addGroupHeader : function(title, options) {
      if (!this.__isFirstAdd()) {
        this._groupCounter++;
      }
      this.__groups.push({
        title: title, items: [], labels: [], names: [],
        options: [], headerOptions: options
      });
      // fire the change event
      this.fireEvent("change");
    },


    /**
     * Adds a button to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param button {qx.ui.form.Button} The button to add.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added button.
     */
    addButton : function(button, options) {
      this._buttons.push(button);
      this._buttonOptions.push(options || null);
      // fire the change event
      this.fireEvent("change");
    },


    /**
     * Returns whether something has already been added.
     *
     * @return {Boolean} true, if nothing has been added jet.
     */
    __isFirstAdd : function() {
      return this.__groups.length === 0;
    },


    /*
    ---------------------------------------------------------------------------
       REMOVE
    ---------------------------------------------------------------------------
    */


    /**
     * Removes the given item from the form.
     *
     * @param item {qx.ui.form.IForm} A supported form item.
     * @return {Boolean} <code>true</code>, if the item could be removed.
     */
    remove : function(item) {
      for (var i = 0; i < this.__groups.length; i++) {
        var group = this.__groups[i];
        for (var j = 0; j < group.items.length; j++) {
          var storedItem = group.items[j];
          if (storedItem === item) {
            // remove all stored data
            group.items.splice(j, 1);
            group.labels.splice(j, 1);
            group.names.splice(j, 1);
            group.options.splice(j, 1);

            // remove the item to the validation manager
            this._validationManager.remove(item);
            // remove the item to the reset manager
            this._resetter.remove(item);

            // fire the change event
            this.fireEvent("change");
            return true;
          }
        }
      }
      return false;
    },


    /**
     * Removes the given group header from the form. All items in the group will be moved to
     * another group (usually the previous group). If there is more than one group with
     * the same title, only the first group will be removed.
     *
     * @param title {String} The title.
     * @return {Boolean} <code>true</code>, if the header could be removed.
     */
    removeGroupHeader : function(title) {
      for (var i = 0; i < this.__groups.length; i++) {
        var group = this.__groups[i];
        if (group.title === title) {
          var targetGroup;

          // if it's the first group
          if (i == 0) {
            // if it's the only group
            if (this.__groups.length == 1) {
              // remove the title and the header options
              group.title = null;
              group.headerOptions = {};
              // fire the change event
              this.fireEvent("change");
              return true;
            } else {
              // add to the next
              targetGroup = this.__groups[i+1];
            }
          } else {
            // add to the previous group
            targetGroup = this.__groups[i-1];
          }

          // copy the data over
          targetGroup.items = targetGroup.items.concat(group.items);
          targetGroup.labels = targetGroup.labels.concat(group.labels);
          targetGroup.names = targetGroup.names.concat(group.names);
          targetGroup.options = targetGroup.options.concat(group.options);

          // delete the group
          this.__groups.splice(i, 1);

          this._groupCounter--;

          // fire the change event
          this.fireEvent("change");
          return true;
        }
      }
      return false;
    },


    /**
     * Removes the given button from the form.
     *
     * @param button {qx.ui.form.Button} The button to remove.
     * @return {Boolean} <code>true</code>, if the button could be removed.
     */
    removeButton : function(button) {
      for (var i = 0; i < this._buttons.length; i++) {
        var storedButton = this._buttons[i];
        if (storedButton === button) {
          this._buttons.splice(i, 1);
          this._buttonOptions.splice(i, 1);
          // fire the change event
          this.fireEvent("change");
          return true;
        }
      }
      return false;
    },


    /**
     * Returns all added items as a map.
     *
     * @return {Map} A map containing for every item an entry with its name.
     */
    getItems : function() {
      var items = {};
      // go threw all groups
      for (var i = 0; i < this.__groups.length; i++) {
        var group = this.__groups[i];
        // get all items
        for (var j = 0; j < group.names.length; j++) {
          var name = group.names[j];
          items[name] = group.items[j];
        }
      }
      return items;
    },


    /*
    ---------------------------------------------------------------------------
       RESET SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Resets the form. This means reseting all form items and the validation.
     */
    reset : function() {
      this._resetter.reset();
      this._validationManager.reset();
    },


    /**
     * Redefines the values used for resetting. It calls
     * {@link qx.ui.form.Resetter#redefine} to get that.
     */
    redefineResetter : function() {
      this._resetter.redefine();
    },


    /**
     * Redefines the value used for resetting of the given item. It calls
     * {@link qx.ui.form.Resetter#redefineItem} to get that.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineResetterItem : function(item) {
      this._resetter.redefineItem(item);
    },



    /*
    ---------------------------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------------------------
    */

    /**
     * Validates the form using the
     * {@link qx.ui.form.validation.Manager#validate} method.
     *
     * @return {Boolean | null} The validation result.
     */
    validate : function() {
      return this._validationManager.validate();
    },


    /**
     * Returns the internally used validation manager. If you want to do some
     * enhanced validation tasks, you need to use the validation manager.
     *
     * @return {qx.ui.form.validation.Manager} The used manager.
     */
    getValidationManager : function() {
      return this._validationManager;
    },


    /*
    ---------------------------------------------------------------------------
       RENDERER SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Accessor method for the renderer which returns all added items in a
     * array containing a map of all items:
     * {title: title, items: [], labels: [], names: []}
     *
     * @return {Array} An array containing all necessary data for the renderer.
     * @internal
     */
    getGroups : function() {
      return this.__groups;
    },


    /**
     * Accessor method for the renderer which returns all added buttons in an
     * array.
     * @return {Array} An array containing all added buttons.
     * @internal
     */
    getButtons : function() {
      return this._buttons;
    },


    /**
     * Accessor method for the renderer which returns all added options for
     * the buttons in an array.
     * @return {Array} An array containing all added options for the buttons.
     * @internal
     */
    getButtonOptions : function() {
      return this._buttonOptions;
    },



    /*
    ---------------------------------------------------------------------------
       INTERNAL
    ---------------------------------------------------------------------------
    */

    /**
     * Creates and returns the used validation manager.
     *
     * @return {qx.ui.form.validation.Manager} The validation manager.
     */
    _createValidationManager : function() {
      return new qx.ui.form.validation.Manager();
    },


    /**
     * Creates and returns the used resetter.
     *
     * @return {qx.ui.form.Resetter} the resetter class.
     */
    _createResetter : function() {
      return new qx.ui.form.Resetter();
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__groups = this._buttons = this._buttonOptions = null;
    this._validationManager.dispose();
    this._resetter.dispose();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This validation manager is responsible for validation of forms.
 *
 * @ignore(qx.ui.tooltip)
 * @ignore(qx.ui.tooltip.Manager.*)
 */
qx.Class.define("qx.ui.form.validation.Manager",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    // storage for all form items
    this.__formItems = [];
    // storage for all results of async validation calls
    this.__asyncResults = {};
    // set the default required field message
    this.setRequiredFieldMessage(qx.locale.Manager.tr("This field is required"));
  },


  events :
  {
    /**
     * Change event for the valid state.
     */
    "changeValid" : "qx.event.type.Data",

    /**
     * Signals that the validation is done. This is not needed on synchronous
     * validation (validation is done right after the call) but very important
     * in the case an asynchronous validator will be used.
     */
    "complete" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * The validator of the form itself. You can set a function (for
     * synchronous validation) or a {@link qx.ui.form.validation.AsyncValidator}.
     * In both cases, the function can have all added form items as first
     * argument and the manager as a second argument. The manager should be used
     * to set the {@link #invalidMessage}.
     *
     * Keep in mind that the validator is optional if you don't need the
     * validation in the context of the whole form.
     * @type {Function | AsyncValidator}
     */
    validator :
    {
      check : "value instanceof Function || qx.Class.isSubClassOf(value.constructor, qx.ui.form.validation.AsyncValidator)",
      init : null,
      nullable : true
    },

    /**
     * The invalid message should store the message why the form validation
     * failed. It will be added to the array returned by
     * {@link #getInvalidMessages}.
     */
    invalidMessage :
    {
      check : "String",
      init: ""
    },


    /**
     * This message will be shown if a required field is empty and no individual
     * {@link qx.ui.form.MForm#requiredInvalidMessage} is given.
     */
    requiredFieldMessage :
    {
      check : "String",
      init : ""
    },


    /**
     * The context for the form validation.
     */
    context :
    {
      nullable : true
    }
  },


  members :
  {
    __formItems : null,
    __valid : null,
    __asyncResults : null,
    __syncValid : null,


    /**
     * Add a form item to the validation manager.
     *
     * The form item has to implement at least two interfaces:
     * <ol>
     *   <li>The {@link qx.ui.form.IForm} Interface</li>
     *   <li>One of the following interfaces:
     *     <ul>
     *       <li>{@link qx.ui.form.IBooleanForm}</li>
     *       <li>{@link qx.ui.form.IColorForm}</li>
     *       <li>{@link qx.ui.form.IDateForm}</li>
     *       <li>{@link qx.ui.form.INumberForm}</li>
     *       <li>{@link qx.ui.form.IStringForm}</li>
     *     </ul>
     *   </li>
     * </ol>
     * The validator can be a synchronous or asynchronous validator. In
     * both cases the validator can either returns a boolean or fire an
     * {@link qx.core.ValidationError}. For synchronous validation, a plain
     * JavaScript function should be used. For all asynchronous validations,
     * a {@link qx.ui.form.validation.AsyncValidator} is needed to wrap the
     * plain function.
     *
     * @param formItem {qx.ui.core.Widget} The form item to add.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator}
     *   The validator.
     * @param context {var?null} The context of the validator.
     */
    add: function(formItem, validator, context) {
      // check for the form API
      if (!this.__supportsInvalid(formItem)) {
        throw new Error("Added widget not supported.");
      }
      // check for the data type
      if (this.__supportsSingleSelection(formItem) && !formItem.getValue) {
        // check for a validator
        if (validator != null) {
          throw new Error("Widgets supporting selection can only be validated " +
          "in the form validator");
        }
      }
      var dataEntry =
      {
        item : formItem,
        validator : validator,
        valid : null,
        context : context
      };
      this.__formItems.push(dataEntry);
    },


    /**
     * Remove a form item from the validation manager.
     *
     * @param formItem {qx.ui.core.Widget} The form item to remove.
     * @return {qx.ui.core.Widget?null} The removed form item or
     *  <code>null</code> if the item could not be found.
     */
    remove : function(formItem)
    {
      var items = this.__formItems;

      for (var i = 0, len = items.length; i < len; i++)
      {
        if (formItem === items[i].item)
        {
          items.splice(i, 1);
          return formItem;
        }
      }

      return null;
    },


    /**
     * Returns registered form items from the validation manager.
     *
     * @return {Array} The form items which will be validated.
     */
    getItems : function()
    {
      var items = [];
      for (var i=0; i < this.__formItems.length; i++) {
        items.push(this.__formItems[i].item);
      };
      return items;
    },


    /**
     * Invokes the validation. If only synchronous validators are set, the
     * result of the whole validation is available at the end of the method
     * and can be returned. If an asynchronous validator is set, the result
     * is still unknown at the end of this method so nothing will be returned.
     * In both cases, a {@link #complete} event will be fired if the validation
     * has ended. The result of the validation can then be accessed with the
     * {@link #getValid} method.
     *
     * @return {Boolean|undefined} The validation result, if available.
     */
    validate : function() {
      var valid = true;
      this.__syncValid = true; // collaboration of all synchronous validations
      var items = [];

      // check all validators for the added form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        var validator = this.__formItems[i].validator;

        // store the items in case of form validation
        items.push(formItem);

        // ignore all form items without a validator
        if (validator == null) {
          // check for the required property
          var validatorResult = this.__validateRequired(formItem);
          valid = valid && validatorResult;
          this.__syncValid = validatorResult && this.__syncValid;
          continue;
        }

        var validatorResult = this.__validateItem(
          this.__formItems[i], formItem.getValue()
        );
        // keep that order to ensure that null is returned on async cases
        valid = validatorResult && valid;
        if (validatorResult != null) {
          this.__syncValid = validatorResult && this.__syncValid;
        }
      }

      // check the form validator (be sure to invoke it even if the form
      // items are already false, so keep the order!)
      var formValid = this.__validateForm(items);
      if (qx.lang.Type.isBoolean(formValid)) {
        this.__syncValid = formValid && this.__syncValid;
      }
      valid = formValid && valid;

      this._setValid(valid);

      if (qx.lang.Object.isEmpty(this.__asyncResults)) {
        this.fireEvent("complete");
      }
      return valid;
    },


    /**
     * Checks if the form item is required. If so, the value is checked
     * and the result will be returned. If the form item is not required, true
     * will be returned.
     *
     * @param formItem {qx.ui.core.Widget} The form item to check.
     * @return {var} Validation result
     */
    __validateRequired : function(formItem) {
      if (formItem.getRequired()) {
        // if its a widget supporting the selection
        if (this.__supportsSingleSelection(formItem)) {
          var validatorResult = !!formItem.getSelection()[0];
        // otherwise, a value should be supplied
        } else {
          var value = formItem.getValue();
          var validatorResult = !!value || value === 0;
        }
        formItem.setValid(validatorResult);
        var individualMessage = formItem.getRequiredInvalidMessage();
        var message = individualMessage ? individualMessage : this.getRequiredFieldMessage();
        formItem.setInvalidMessage(message);
        return validatorResult;
      }
      return true;
    },


    /**
     * Validates a form item. This method handles the differences of
     * synchronous and asynchronous validation and returns the result of the
     * validation if possible (synchronous cases). If the validation is
     * asynchronous, null will be returned.
     *
     * @param dataEntry {Object} The map stored in {@link #add}
     * @param value {var} The currently set value
     * @return {Boolean|null} Validation result or <code>null</code> for async
     * validation
     */
    __validateItem : function(dataEntry, value) {
      var formItem = dataEntry.item;
      var context = dataEntry.context;
      var validator = dataEntry.validator;

      // check for asynchronous validation
      if (this.__isAsyncValidator(validator)) {
        // used to check if all async validations are done
        this.__asyncResults[formItem.toHashCode()] = null;
        validator.validate(formItem, formItem.getValue(), this, context);
        return null;
      }

      var validatorResult = null;

      try {
        var validatorResult = validator.call(context || this, value, formItem);
        if (validatorResult === undefined) {
          validatorResult = true;
        }

      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          validatorResult = false;
          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          formItem.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }

      formItem.setValid(validatorResult);
      dataEntry.valid = validatorResult;

      return validatorResult;
    },


    /**
     * Validates the form. It checks for asynchronous validation and handles
     * the differences to synchronous validation. If no form validator is given,
     * true will be returned. If a synchronous validator is given, the
     * validation result will be returned. In asynchronous cases, null will be
     * returned cause the result is not available.
     *
     * @param items {qx.ui.core.Widget[]} An array of all form items.
     * @return {Boolean|null} description
     */
    __validateForm: function(items) {
      var formValidator = this.getValidator();
      var context = this.getContext() || this;

      if (formValidator == null) {
        return true;
      }

      // reset the invalidMessage
      this.setInvalidMessage("");

      if (this.__isAsyncValidator(formValidator)) {
        this.__asyncResults[this.toHashCode()] = null;
        formValidator.validateForm(items, this, context);
        return null;
      }

      try {
        var formValid = formValidator.call(context, items, this);
        if (formValid === undefined) {
          formValid = true;
        }
      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          formValid = false;

          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          this.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }
      return formValid;
    },


    /**
     * Helper function which checks, if the given validator is synchronous
     * or asynchronous.
     *
     * @param validator {Function|qx.ui.form.validation.AsyncValidator}
     *   The validator to check.
     * @return {Boolean} True, if the given validator is asynchronous.
     */
    __isAsyncValidator : function(validator) {
      var async = false;
      if (!qx.lang.Type.isFunction(validator)) {
        async = qx.Class.isSubClassOf(
          validator.constructor, qx.ui.form.validation.AsyncValidator
        );
      }
      return async;
    },


    /**
     * Returns true, if the given item implements the {@link qx.ui.form.IForm}
     * interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsInvalid : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.form.IForm);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Sets the valid state of the manager. It generates the event if
     * necessary and stores the new value.
     *
     * @param value {Boolean|null} The new valid state of the manager.
     */
    _setValid: function(value) {
      this._showToolTip(value);
      var oldValue = this.__valid;
      this.__valid = value;
      // check for the change event
      if (oldValue != value) {
        this.fireDataEvent("changeValid", value, oldValue);
      }
    },


    /**
     * Responsible for showing a tooltip in case the validation is done for
     * widgets based on qx.ui.core.Widget.
     * @param valid {Boolean} <code>false</code>, if the tooltip should be shown
     */
    _showToolTip : function(valid) {
      // ignore if we don't have a tooltip manager e.g. mobile apps
      if (!qx.ui.tooltip || !qx.ui.tooltip.Manager) {
        return;
      }
      var tooltip = qx.ui.tooltip.Manager.getInstance().getSharedErrorTooltip();

      if (!valid) {
        var firstInvalid;
        for (var i = 0; i < this.__formItems.length; i++) {
          var item = this.__formItems[i].item;
          if (!item.isValid()) {
            firstInvalid = item;
            // only for desktop widgets
            if (!(item.getContentLocation)) {
              return;
            }
            // only consider items on the screen
            if (item.isSeeable() === false) {
              continue;
            }

            tooltip.setLabel(item.getInvalidMessage());

            if (tooltip.getPlaceMethod() == "mouse") {
              var location = item.getContentLocation();
              var top = location.top - tooltip.getOffsetTop();
              tooltip.placeToPoint({left: location.right, top: top});
            } else {
              tooltip.placeToWidget(item);
            }

            tooltip.show();
            return;
          }
        }
      } else {
        tooltip.exclude();
      }
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    getValid: function() {
      return this.__valid;
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    isValid: function() {
      return this.getValid();
    },


    /**
     * Returns an array of all invalid messages of the invalid form items and
     * the form manager itself.
     *
     * @return {String[]} All invalid messages.
     */
    getInvalidMessages: function() {
      var messages = [];
      // combine the messages of all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          messages.push(formItem.getInvalidMessage());
        }
      }
      // add the forms fail message
      if (this.getInvalidMessage() != "") {
        messages.push(this.getInvalidMessage());
      }

      return messages;
    },


    /**
     * Selects invalid form items
     *
     * @return {Array} invalid form items
     */
    getInvalidFormItems : function() {
      var res = [];
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          res.push(formItem);
        }
      }

      return res;
    },


    /**
     * Resets the validator.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var dataEntry = this.__formItems[i];
        // set the field to valid
        dataEntry.item.setValid(true);
      }
      // set the manager to its initial valid value
      this.__valid = null;
      this._showToolTip(true);
    },


    /**
     * Internal helper method to set the given item to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param formItem {qx.ui.core.Widget} The form item to set the valid state.
     * @param valid {Boolean} The valid state for the form item.
     *
     * @internal
     */
    setItemValid: function(formItem, valid) {
      // store the result
      this.__asyncResults[formItem.toHashCode()] = valid;
      formItem.setValid(valid);
      this.__checkValidationComplete();
    },


    /**
     * Internal helper method to set the form manager to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param valid {Boolean} The valid state for the form manager.
     *
     * @internal
     */
    setFormValid : function(valid) {
      this.__asyncResults[this.toHashCode()] = valid;
      this.__checkValidationComplete();
    },


    /**
     * Checks if all asynchronous validators have validated so the result
     * is final and the {@link #complete} event can be fired. If that's not
     * the case, nothing will happen in the method.
     */
    __checkValidationComplete : function() {
      var valid = this.__syncValid;

      // check if all async validators are done
      for (var hash in this.__asyncResults) {
        var currentResult = this.__asyncResults[hash];
        valid = currentResult && valid;
        // the validation is not done so just do nothing
        if (currentResult == null) {
          return;
        }
      }
      // set the actual valid state of the manager
      this._setValid(valid);
      // reset the results
      this.__asyncResults = {};
      // fire the complete event (no entry in the results with null)
      this.fireEvent("complete");
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.__formItems = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for validation in all asynchronous cases and
 * should always be used with {@link qx.ui.form.validation.Manager}.
 *
 *
 * It acts like a wrapper for asynchronous validation functions. These
 * validation function must be set in the constructor. The form manager will
 * invoke the validation and the validator function will be called with two
 * arguments:
 * <ul>
 *  <li>asyncValidator: A reference to the corresponding validator.</li>
 *  <li>value: The value of the assigned input field.</li>
 * </ul>
 * These two parameters are needed to set the validation status of the current
 * validator. {@link #setValid} is responsible for doing that.
 *
 *
 * *Warning:* Instances of this class can only be used with one input
 * field at a time. Multi usage is not supported!
 *
 * *Warning:* Calling {@link #setValid} synchronously does not work. If you
 * have an synchronous validator, please check
 * {@link qx.ui.form.validation.Manager#add}. If you have both cases, you have
 * to wrap the synchronous call in a timeout to make it asychronous.
 */
qx.Class.define("qx.ui.form.validation.AsyncValidator",
{
  extend : qx.core.Object,

  /**
   * @param validator {Function} The validator function, which has to be
   *   asynchronous.
   */
  construct : function(validator)
  {
    this.base(arguments);
    // save the validator function
    this.__validatorFunction = validator;
  },

  members :
  {
    __validatorFunction : null,
    __item : null,
    __manager : null,
    __usedForForm : null,

    /**
     * The validate function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for form fields only. Validating a
     * form itself will be invokes with {@link #validateForm}.
     *
     * @param item {qx.ui.core.Widget} The form item which should be validated.
     * @param value {var} The value of the form item.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validate: function(item, value, manager, context) {
      // mark as item validator
      this.__usedForForm = false;
      // store the item and the manager
      this.__item = item;
      this.__manager = manager;
      // invoke the user set validator function
      this.__validatorFunction.call(context || this, this, value);
    },


    /**
     * The validateForm function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for forms only. Validating a
     * form item will be invokes with {@link #validate}.
     *
     * @param items {qx.ui.core.Widget[]} All form items of the form manager.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validateForm : function(items, manager, context) {
      this.__usedForForm = true;
      this.__manager = manager;
      this.__validatorFunction.call(context, items, this);
    },


    /**
     * This method should be called within the asynchronous callback to tell the
     * validator the result of the validation.
     *
     * @param valid {Boolean} The boolean state of the validation.
     * @param message {String?} The invalidMessage of the validation.
     */
    setValid: function(valid, message) {
      // valid processing
      if (this.__usedForForm) {
        // message processing
        if (message !== undefined) {
          this.__manager.setInvalidMessage(message);
        }
        this.__manager.setFormValid(valid);
      } else {
        // message processing
        if (message !== undefined) {
          this.__item.setInvalidMessage(message);
        }
        this.__manager.setItemValid(this.__item, valid);
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__manager = this.__item = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object, which should support single selection have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.core.ISingleSelection",
{
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
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      return true;
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if the item is not a child element.
     */
    setSelection : function(items) {
      return arguments.length == 1;
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      return true;
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if the item is not a child element.
     */
    isSelected : function(item) {
      return arguments.length == 1;
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return true;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return arguments.length == 1;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * The resetter is responsible for managing a set of items and resetting these
 * items on a {@link #reset} call. It can handle all form items supplying a
 * value property and all widgets implementing the single selection linked list
 * or select box.
 */
qx.Class.define("qx.ui.form.Resetter",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__items = [];
  },

  members :
  {
    __items : null,

    /**
     * Adding a widget to the reseter will get its current value and store
     * it for resetting. To access the value, the given item needs to specify
     * a value property or implement the {@link qx.ui.core.ISingleSelection}
     * interface.
     *
     * @param item {qx.ui.core.Widget} The widget which should be added.
     */
    add : function(item) {
      // check the init values
      if (this._supportsValue(item)) {
        var init = item.getValue();
      } else if (this.__supportsSingleSelection(item)) {
        var init = item.getSelection();
      } else if (this.__supportsDataBindingSelection(item)) {
        var init = item.getSelection().concat();
      } else {
        throw new Error("Item " + item + " not supported for reseting.");
      }
      // store the item and its init value
      this.__items.push({item: item, init: init});
    },


    /**
     * Removes a widget to the reseter
     *
     * @param item {qx.ui.core.Widget} The widget which should be removed.
     * @return {Boolean} <code>true</code>, if the widget has been removed.
     */
    remove : function(item) {
      for (var i = 0; i < this.__items.length; i++) {
        var storedItem = this.__items[i];
        if (storedItem.item === item) {
          this.__items.splice(i, 1);
          return true;
        }
      }
      return false;
    },


    /**
     * Resets all added form items to their initial value. The initial value
     * is the value in the widget during the {@link #add}.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        // set the init value
        this.__setItem(dataEntry.item, dataEntry.init);
      }
    },


    /**
     * Resets a single given item. The item has to be added to the resetter
     * instance before. Otherwise, an error is thrown.
     *
     * @param item {qx.ui.core.Widget} The widget, which should be resetted.
     */
    resetItem : function(item)
    {
      // get the init value
      var init;
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        if (dataEntry.item === item) {
          init = dataEntry.init;
          break;
        }
      };

      // check for the available init value
      if (init === undefined) {
        throw new Error("The given item has not been added.");
      }

      this.__setItem(item, init);
    },


    /**
     * Internal helper for setting an item to a given init value. It checks
     * for the supported APIs and uses the fitting API.
     *
     * @param item {qx.ui.core.Widget} The item to reset.
     * @param init {var} The value to set.
     */
    __setItem : function(item, init)
    {
      // set the init value
      if (this._supportsValue(item)) {
        item.setValue(init);
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        item.setSelection(init);
      }
    },


    /**
     * Takes the current values of all added items and uses these values as
     * init values for resetting.
     */
    redefine: function() {
      // go threw all added items
      for (var i = 0; i < this.__items.length; i++) {
        var item = this.__items[i].item;
        // set the new init value for the item
        this.__items[i].init = this.__getCurrentValue(item);
      }
    },


    /**
     * Takes the current value of the given item and stores this value as init
     * value for resetting.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineItem : function(item)
    {
      // get the data entry
      var dataEntry;
      for (var i = 0; i < this.__items.length; i++) {
        if (this.__items[i].item === item) {
          dataEntry = this.__items[i];
          break;
        }
      };

      // check for the available init value
      if (dataEntry === undefined) {
        throw new Error("The given item has not been added.");
      }

      // set the new init value for the item
      dataEntry.init = this.__getCurrentValue(dataEntry.item);
    },


    /**
     * Internal helper top access the value of a given item.
     *
     * @param item {qx.ui.core.Widget} The item to access.
     * @return {var} The item's value
     */
    __getCurrentValue : function(item)
    {
      if (this._supportsValue(item)) {
        return item.getValue();
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        return item.getSelection();
      }
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.data.controller.ISelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsDataBindingSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.data.controller.ISelection);
    },


    /**
     * Returns true, if the value property is supplied by the form item.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    _supportsValue : function(formItem) {
      var clazz = formItem.constructor;
      return (
        qx.Class.hasInterface(clazz, qx.ui.form.IBooleanForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IColorForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IDateForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.INumberForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IStringForm)
      );
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__items = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Interface for data binding classes offering a selection.
 */
qx.Interface.define("qx.data.controller.ISelection",
{
  members :
  {
    /**
     * Setter for the selection.
     * @param value {qx.data.IListData} The data of the selection.
     */
    setSelection : function(value) {},


    /**
     * Getter for the selection list.
     * @return {qx.data.IListData} The current selection.
     */
    getSelection : function() {},


    /**
     * Resets the selection to its default value.
     */
    resetSelection : function() {}
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a checkbox.
 */
qx.Interface.define("qx.ui.form.IBooleanForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
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
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Boolean|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Boolean|null} The value.
     */
    getValue : function() {}
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a colorchooser.
 */
qx.Interface.define("qx.ui.form.IColorForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
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
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Color|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Color|null} The value.
     */
    getValue : function() {}
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have date as their primary
 * data type like datechooser's.
 */
qx.Interface.define("qx.ui.form.IDateForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
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
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Date|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Date|null} The value.
     */
    getValue : function() {}
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which use a numeric value as their
 * primary data type like a spinner.
 */
qx.Interface.define("qx.ui.form.INumberForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
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
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Number|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Number|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin handling the valid and required properties for the form widgets.
 */
qx.Mixin.define("qx.ui.form.MForm",
{

  construct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this.__onChangeLocale, this);
    }
  },


  properties : {

    /**
     * Flag signaling if a widget is valid. If a widget is invalid, an invalid
     * state will be set.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },


    /**
     * Flag signaling if a widget is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },


    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  members : {
    // apply method
    _applyValid: function(value, old) {
      value ? this.removeState("invalid") : this.addState("invalid");
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    __onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        // invalid message
        var invalidMessage = this.getInvalidMessage();
        if (invalidMessage && invalidMessage.translate) {
          this.setInvalidMessage(invalidMessage.translate());
        }
        // required invalid message
        var requiredInvalidMessage = this.getRequiredInvalidMessage();
        if (requiredInvalidMessage && requiredInvalidMessage.translate) {
          this.setRequiredInvalidMessage(requiredInvalidMessage.translate());
        }
      },

      "false" : null
    })
  },


  destruct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this.__onChangeLocale, this);
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This is a basic form field with common functionality for
 * {@link TextArea} and {@link TextField}.
 *
 * On every keystroke the value is synchronized with the
 * value of the textfield. Value changes can be monitored by listening to the
 * {@link #input} or {@link #changeValue} events, respectively.
 */
qx.Class.define("qx.ui.form.AbstractField",
{
  extend : qx.ui.core.Widget,
  implement : [
    qx.ui.form.IStringForm,
    qx.ui.form.IForm
  ],
  include : [
    qx.ui.form.MForm
  ],
  type : "abstract",

  statics : {
    /** Stylesheet needed to style the native placeholder element. */
    __stylesheet : null,


    /**
     * Adds the CSS rules needed to style the native placeholder element.
     */
    __addPlaceholderRules : function() {
      var engine = qx.core.Environment.get("engine.name");
      var browser = qx.core.Environment.get("browser.name");
      var colorManager = qx.theme.manager.Color.getInstance();
      var color = colorManager.resolve("text-placeholder");
      var selector;

      if (engine == "gecko") {
        // see https://developer.mozilla.org/de/docs/CSS/:-moz-placeholder for details
       if (parseFloat(qx.core.Environment.get("engine.version")) >= 19) {
          selector = "input::-moz-placeholder, textarea::-moz-placeholder";
        } else {
          selector = "input:-moz-placeholder, textarea:-moz-placeholder";
        }
        qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color + " !important");
      } else if (engine == "webkit" && browser != "edge") {
        selector = "input.qx-placeholder-color::-webkit-input-placeholder, textarea.qx-placeholder-color::-webkit-input-placeholder";
        qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color);
      } else if (engine == "mshtml" || browser == "edge") {
        var separator = browser == "edge" ? "::" : ":";
        selector = ["input.qx-placeholder-color", "-ms-input-placeholder, textarea.qx-placeholder-color", "-ms-input-placeholder"].join(separator);
        qx.ui.style.Stylesheet.getInstance().addRule(selector, "color: " + color + " !important");
      }
    }
  },

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {String} initial text value of the input field ({@link #setValue}).
   */
  construct : function(value)
  {
    this.base(arguments);

    // shortcut for placeholder feature detection
    this.__useQxPlaceholder = !qx.core.Environment.get("css.placeholder");

    if (value != null) {
      this.setValue(value);
    }

    this.getContentElement().addListener(
      "change", this._onChangeContent, this
    );

    // use qooxdoo placeholder if no native placeholder is supported
    if (this.__useQxPlaceholder) {
      // assign the placeholder text after the appearance has been applied
      this.addListener("syncAppearance", this._syncPlaceholder, this);
    } else {
      // add rules for native placeholder color
      qx.ui.form.AbstractField.__addPlaceholderRules();
      // add a class to the input to restict the placeholder color
      this.getContentElement().addClass("qx-placeholder-color");
    }

    // translation support
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener(
        "changeLocale", this._onChangeLocale, this
      );
    }
  },



  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The event is fired on every keystroke modifying the value of the field.
     *
     * The method {@link qx.event.type.Data#getData} returns the
     * current value of the text field.
     */
    "input" : "qx.event.type.Data",


    /**
     * The event is fired each time the text field looses focus and the
     * text field values has changed.
     *
     * If you change {@link #liveUpdate} to true, the changeValue event will
     * be fired after every keystroke and not only after every focus loss. In
     * that mode, the changeValue event is equal to the {@link #input} event.
     *
     * The method {@link qx.event.type.Data#getData} returns the
     * current text value of the field.
     */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Alignment of the text
     */
    textAlign :
    {
      check : [ "left", "center", "right" ],
      nullable : true,
      themeable : true,
      apply : "_applyTextAlign"
    },


    /** Whether the field is read only */
    readOnly :
    {
      check : "Boolean",
      apply : "_applyReadOnly",
      event : "changeReadOnly",
      init : false
    },


    // overridden
    selectable :
    {
      refine : true,
      init : true
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },

    /** Maximal number of characters that can be entered in the TextArea. */
    maxLength :
    {
      apply : "_applyMaxLength",
      check : "PositiveInteger",
      init : Infinity
    },

    /**
     * Whether the {@link #changeValue} event should be fired on every key
     * input. If set to true, the changeValue event is equal to the
     * {@link #input} event.
     */
    liveUpdate :
    {
      check : "Boolean",
      init : false
    },

    /**
     * String value which will be shown as a hint if the field is all of:
     * unset, unfocused and enabled. Set to null to not show a placeholder
     * text.
     */
    placeholder :
    {
      check : "String",
      nullable : true,
      apply : "_applyPlaceholder"
    },


    /**
     * RegExp responsible for filtering the value of the textfield. the RegExp
     * gives the range of valid values.
     * The following example only allows digits in the textfield.
     * <pre class='javascript'>field.setFilter(/[0-9]/);</pre>
     */
    filter :
    {
      check : "RegExp",
      nullable : true,
      init : null
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __nullValue : true,
    _placeholder : null,
    __oldValue : null,
    __oldInputValue : null,
    __useQxPlaceholder : true,
    __font : null,
    __webfontListenerId : null,


    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    getFocusElement : function() {
      var el = this.getContentElement();
      if (el) {
        return el;
      }
    },


    /**
     * Creates the input element. Derived classes may override this
     * method, to create different input elements.
     *
     * @return {qx.html.Input} a new input element.
     */
    _createInputElement : function() {
      return new qx.html.Input("text");
    },


    // overridden
    renderLayout : function(left, top, width, height)
    {
      var updateInsets = this._updateInsets;
      var changes = this.base(arguments, left, top, width, height);

      // Directly return if superclass has detected that no
      // changes needs to be applied
      if (!changes) {
        return;
      }

      var inner = changes.size || updateInsets;
      var pixel = "px";

      if (inner || changes.local || changes.margin) {
        var innerWidth = width;
        var innerHeight = height;
      }

      var input = this.getContentElement();

      // we don't need to update positions on native placeholders
      if (updateInsets && this.__useQxPlaceholder)
      {
        if (this.__useQxPlaceholder) {
          var insets = this.getInsets();
          this._getPlaceholderElement().setStyles({
            paddingTop : insets.top + pixel,
            paddingRight : insets.right + pixel,
            paddingBottom : insets.bottom + pixel,
            paddingLeft : insets.left + pixel
          });
        }
      }

      if (inner || changes.margin)
      {
        // we don't need to update dimensions on native placeholders
        if (this.__useQxPlaceholder) {
          var insets = this.getInsets();
          this._getPlaceholderElement().setStyles({
            "width": (innerWidth - insets.left - insets.right) + pixel,
            "height": (innerHeight - insets.top - insets.bottom) + pixel
          });
        }

        input.setStyles({
          "width": innerWidth + pixel,
          "height": innerHeight + pixel
        });

        this._renderContentElement(innerHeight, input);

      }

      if (changes.position) {
        if (this.__useQxPlaceholder) {
          this._getPlaceholderElement().setStyles({
            "left": left + pixel,
            "top": top + pixel
          });
        }
      }
    },


    /**
     * Hook into {@link qx.ui.form.AbstractField#renderLayout} method.
     * Called after the contentElement has a width and an innerWidth.
     *
     * Note: This was introduced to fix BUG#1585
     *
     * @param innerHeight {Integer} The inner height of the element.
     * @param element {Element} The element.
     */
    _renderContentElement : function(innerHeight, element) {
      //use it in child classes
    },


    // overridden
    _createContentElement : function()
    {
      // create and add the input element
      var el = this._createInputElement();

      // initialize the html input
      el.setSelectable(this.getSelectable());
      el.setEnabled(this.getEnabled());

      // Add listener for input event
      el.addListener("input", this._onHtmlInput, this);

      // Disable HTML5 spell checking
      el.setAttribute("spellcheck", "false");
      el.addClass("qx-abstract-field");

      // IE8 in standard mode needs some extra love here to receive events.
      if ((qx.core.Environment.get("engine.name") == "mshtml") &&
        (qx.core.Environment.get("browser.documentmode") == 8)) {
        el.setStyles({
          backgroundImage: "url(" + qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif") + ")"
        });
      }

      return el;
    },


    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);

      this.getContentElement().setEnabled(value);

      if (this.__useQxPlaceholder) {
        if (value) {
          this._showPlaceholder();
        } else {
          this._removePlaceholder();
        }
      } else {
        var input = this.getContentElement();
        // remove the placeholder on disabled input elements
        input.setAttribute("placeholder", value ? this.getPlaceholder() : "");
      }
    },


    // default text sizes
    /**
     * @lint ignoreReferenceField(__textSize)
     */
    __textSize :
    {
      width : 16,
      height : 16
    },


    // overridden
    _getContentHint : function()
    {
      return {
        width : this.__textSize.width * 10,
        height : this.__textSize.height || 16
      };
    },


    // overridden
    _applyFont : function(value, old)
    {
      if (old && this.__font && this.__webfontListenerId) {
        this.__font.removeListenerById(this.__webfontListenerId);
        this.__webfontListenerId = null;
      }

      // Apply
      var styles;
      if (value)
      {
        this.__font = qx.theme.manager.Font.getInstance().resolve(value);
        if (this.__font instanceof qx.bom.webfonts.WebFont) {
          this.__webfontListenerId = this.__font.addListener("changeStatus", this._onWebFontStatusChange, this);
        }
        styles = this.__font.getStyles();
      }
      else
      {
        styles = qx.bom.Font.getDefaultStyles();
      }

      // check if text color already set - if so this local value has higher priority
      if (this.getTextColor() != null) {
        delete styles["color"];
      }

      // apply the font to the content element
      // IE 8 - 10 (but not 11 Preview) will ignore the lineHeight value
      // unless it's applied directly.
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
        qx.core.Environment.get("browser.documentmode") < 11)
      {
        qx.html.Element.flush();
        this.getContentElement().setStyles(styles, true);
      } else {
        this.getContentElement().setStyles(styles);
      }

      // the font will adjust automatically on native placeholders
      if (this.__useQxPlaceholder) {
        // don't apply the color to the placeholder
        delete styles["color"];
        // apply the font to the placeholder
        this._getPlaceholderElement().setStyles(styles);
      }

      // Compute text size
      if (value) {
        this.__textSize = qx.bom.Label.getTextSize("A", styles);
      } else {
        delete this.__textSize;
      }

      // Update layout
      qx.ui.core.queue.Layout.add(this);
    },


    // overridden
    _applyTextColor : function(value, old)
    {
      if (value) {
        this.getContentElement().setStyle(
          "color", qx.theme.manager.Color.getInstance().resolve(value)
        );
      } else {
        this.getContentElement().removeStyle("color");
      }
    },


    // property apply
    _applyMaxLength : function(value, old) {
      if (value) {
        this.getContentElement().setAttribute("maxLength", value);
      } else {
        this.getContentElement().removeAttribute("maxLength");
      }
    },


    // overridden
    tabFocus : function() {
      this.base(arguments);

      this.selectAllText();
    },

    /**
     * Returns the text size.
     * @return {Map} The text size.
     */
    _getTextSize : function() {
      return this.__textSize;
    },

    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for native input events. Redirects the event
     * to the widget. Also checks for the filter and max length.
     *
     * @param e {qx.event.type.Data} Input event
     */
    _onHtmlInput : function(e)
    {
      var value = e.getData();
      var fireEvents = true;

      this.__nullValue = false;

      // value unchanged; Firefox fires "input" when pressing ESC [BUG #5309]
      if (this.__oldInputValue && this.__oldInputValue === value) {
        fireEvents = false;
      }

      // check for the filter
      if (this.getFilter() != null)
      {
        var filteredValue = "";
        var index = value.search(this.getFilter());
        var processedValue = value;
        while(index >= 0)
        {
          filteredValue = filteredValue + (processedValue.charAt(index));
          processedValue = processedValue.substring(index + 1, processedValue.length);
          index = processedValue.search(this.getFilter());
        }

        if (filteredValue != value)
        {
          fireEvents = false;
          value = filteredValue;
          this.getContentElement().setValue(value);
        }
      }

      // fire the events, if necessary
      if (fireEvents)
      {
        // store the old input value
        this.fireDataEvent("input", value, this.__oldInputValue);
        this.__oldInputValue = value;

        // check for the live change event
        if (this.getLiveUpdate()) {
          this.__fireChangeValueEvent(value);
        }
      }
    },

    /**
     * Triggers text size recalculation after a web font was loaded
     *
     * @param ev {qx.event.type.Data} "changeStatus" event
     */
    _onWebFontStatusChange : function(ev)
    {
      if (ev.getData().valid === true) {
        var styles = this.__font.getStyles();
        this.__textSize = qx.bom.Label.getTextSize("A", styles);
        qx.ui.core.queue.Layout.add(this);
      }
    },


    /**
     * Handles the firing of the changeValue event including the local cache
     * for sending the old value in the event.
     *
     * @param value {String} The new value.
     */
    __fireChangeValueEvent : function(value) {
      var old = this.__oldValue;
      this.__oldValue = value;
      if (old != value) {
        this.fireNonBubblingEvent(
          "changeValue", qx.event.type.Data, [value, old]
        );
      }
    },


    /*
    ---------------------------------------------------------------------------
      TEXTFIELD VALUE API
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value of the textfield to the given value.
     *
     * @param value {String} The new value
     */
    setValue : function(value)
    {
      // handle null values
      if (value === null) {
        // just do nothing if null is already set
        if (this.__nullValue) {
          return value;
        }
        value = "";
        this.__nullValue = true;
      } else {
        this.__nullValue = false;
        // native placeholders will be removed by the browser
        if (this.__useQxPlaceholder) {
          this._removePlaceholder();
        }
      }

      if (qx.lang.Type.isString(value))
      {
        var elem = this.getContentElement();
        if (elem.getValue() != value)
        {
          var oldValue = elem.getValue();
          elem.setValue(value);
          var data = this.__nullValue ? null : value;
          this.__oldValue = oldValue;
          this.__fireChangeValueEvent(data);
          // reset the input value on setValue calls [BUG #6892]
          this.__oldInputValue = this.__oldValue;
        }
        // native placeholders will be shown by the browser
        if (this.__useQxPlaceholder) {
          this._showPlaceholder();
        }
        return value;
      }
      throw new Error("Invalid value type: " + value);
    },


    /**
     * Returns the current value of the textfield.
     *
     * @return {String|null} The current value
     */
    getValue : function() {
      var value = this.getContentElement().getValue();
      return this.__nullValue ? null : value;
    },


    /**
     * Resets the value to the default
     */
    resetValue : function() {
      this.setValue(null);
    },


    /**
     * Event listener for change event of content element
     *
     * @param e {qx.event.type.Data} Incoming change event
     */
    _onChangeContent : function(e)
    {
      this.__nullValue = e.getData() === null;
      this.__fireChangeValueEvent(e.getData());
    },


    /*
    ---------------------------------------------------------------------------
      TEXTFIELD SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the current selection.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @return {String|null}
     */
    getTextSelection : function() {
      return this.getContentElement().getTextSelection();
    },


    /**
     * Returns the current selection length.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @return {Integer|null}
     */
    getTextSelectionLength : function() {
      return this.getContentElement().getTextSelectionLength();
    },


    /**
     * Returns the start of the text selection
     *
     * @return {Integer|null} Start of selection or null if not available
     */
    getTextSelectionStart : function() {
      return this.getContentElement().getTextSelectionStart();
    },


    /**
     * Returns the end of the text selection
     *
     * @return {Integer|null} End of selection or null if not available
     */
    getTextSelectionEnd : function() {
      return this.getContentElement().getTextSelectionEnd();
    },


    /**
     * Set the selection to the given start and end (zero-based).
     * If no end value is given the selection will extend to the
     * end of the textfield's content.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @param start {Integer} start of the selection (zero-based)
     * @param end {Integer} end of the selection
     */
    setTextSelection : function(start, end) {
      this.getContentElement().setTextSelection(start, end);
    },


    /**
     * Clears the current selection.
     * This method only works if the widget is already created and
     * added to the document.
     *
     */
    clearTextSelection : function() {
      this.getContentElement().clearTextSelection();
    },


    /**
     * Selects the whole content
     *
     */
    selectAllText : function() {
      this.setTextSelection(0);
    },


    /*
    ---------------------------------------------------------------------------
      PLACEHOLDER HELPERS
    ---------------------------------------------------------------------------
    */

    // overridden
    setLayoutParent : function(parent)
    {
      this.base(arguments, parent);
      if (this.__useQxPlaceholder) {
        if (parent) {
          this.getLayoutParent().getContentElement().add(this._getPlaceholderElement());
        } else {
          var placeholder = this._getPlaceholderElement();
          placeholder.getParent().remove(placeholder);
        }
      }
    },


    /**
     * Helper to show the placeholder text in the field. It checks for all
     * states and possible conditions and shows the placeholder only if allowed.
     */
    _showPlaceholder : function()
    {
      var fieldValue = this.getValue() || "";
      var placeholder = this.getPlaceholder();
      if (
        placeholder != null &&
        fieldValue == "" &&
        !this.hasState("focused") &&
        !this.hasState("disabled")
      )
      {
        if (this.hasState("showingPlaceholder"))
        {
          this._syncPlaceholder();
        }
        else
        {
          // the placeholder will be set as soon as the appearance is applied
          this.addState("showingPlaceholder");
        }
      }
    },


    /**
     * Remove the fake placeholder
     */
    _onPointerDownPlaceholder : function() {
      window.setTimeout(function() {
        this.focus();
      }.bind(this), 0);
    },


    /**
     * Helper to remove the placeholder. Deletes the placeholder text from the
     * field and removes the state.
     */
    _removePlaceholder: function() {
      if (this.hasState("showingPlaceholder")) {
        if (this.__useQxPlaceholder) {
          this._getPlaceholderElement().setStyle("visibility", "hidden");
        }
        this.removeState("showingPlaceholder");
      }
    },


    /**
     * Updates the placeholder text with the DOM
     */
    _syncPlaceholder : function ()
    {
      if (this.hasState("showingPlaceholder") && this.__useQxPlaceholder) {
        this._getPlaceholderElement().setStyle("visibility", "visible");
      }
    },


    /**
     * Returns the placeholder label and creates it if necessary.
     */
    _getPlaceholderElement : function()
    {
      if (this._placeholder == null) {
        // create the placeholder
        this._placeholder = new qx.html.Label();
        var colorManager = qx.theme.manager.Color.getInstance();
        this._placeholder.setStyles({
          "zIndex" : 11,
          "position" : "absolute",
          "color" : colorManager.resolve("text-placeholder"),
          "whiteSpace": "normal", // enable wrap by default
          "cursor": "text",
          "visibility" : "hidden"
        });

        this._placeholder.addListener("pointerdown", this._onPointerDownPlaceholder, this);
      }
      return this._placeholder;
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        var content = this.getPlaceholder();
        if (content && content.translate) {
          this.setPlaceholder(content.translate());
        }
      },

      "false" : null
    }),


    // overridden
    _onChangeTheme : function() {
      this.base(arguments);
      if (this._placeholder) {
        // delete the placeholder element because it uses a theme dependent color
        this._placeholder.dispose();
        this._placeholder = null;
      }
      if (!this.__useQxPlaceholder && qx.ui.form.AbstractField.__stylesheet) {
        qx.bom.Stylesheet.removeSheet(qx.ui.form.AbstractField.__stylesheet);
        qx.ui.form.AbstractField.__stylesheet = null;
        qx.ui.form.AbstractField.__addPlaceholderRules();
      }
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyPlaceholder : function(value, old)
    {
      if (this.__useQxPlaceholder) {
        this._getPlaceholderElement().setValue(value);
        if (value != null) {
          this.addListener("focusin", this._removePlaceholder, this);
          this.addListener("focusout", this._showPlaceholder, this);
          this._showPlaceholder();
        } else {
          this.removeListener("focusin", this._removePlaceholder, this);
          this.removeListener("focusout", this._showPlaceholder, this);
          this._removePlaceholder();
        }
      } else {
        // only apply if the widget is enabled
        if (this.getEnabled()) {
          this.getContentElement().setAttribute("placeholder", value);

          if (qx.core.Environment.get("browser.name") === "firefox" &&
              parseFloat(qx.core.Environment.get("browser.version")) < 36 &&
              this.getContentElement().getNodeName() === "textarea" &&
              !this.getContentElement().getDomElement())
          {
            /* qx Bug #8870: Firefox 35 will not display a text area's
               placeholder text if the attribute is set before the
               element is added to the DOM. This is fixed in FF 36. */
            this.addListenerOnce("appear", function() {
              this.getContentElement().getDomElement().removeAttribute("placeholder");
              this.getContentElement().getDomElement().setAttribute("placeholder", value);
            }, this);
          }
        }
      }
    },


    // property apply
    _applyTextAlign : function(value, old) {
      this.getContentElement().setStyle("textAlign", value);
    },


    // property apply
    _applyReadOnly : function(value, old)
    {
      var element = this.getContentElement();

      element.setAttribute("readOnly", value);

      if (value)
      {
        this.addState("readonly");
        this.setFocusable(false);
      }
      else
      {
        this.removeState("readonly");
        this.setFocusable(true);
      }
    }

  },


  defer : function(statics) {
    var css = "border: none;" +
      "padding: 0;" +
      "margin: 0;" +
      "display : block;" +
      "background : transparent;" +
      "outline: none;" +
      "appearance: none;" +
      "position: absolute;" +
      "autoComplete: off;" +
      "resize: none;" +
      "border-radius: 0;";

    qx.ui.style.Stylesheet.getInstance().addRule(".qx-abstract-field", css);
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    if (this._placeholder) {
      this._placeholder.removeListener("pointerdown", this._onPointerDownPlaceholder, this);
      var parent = this._placeholder.getParent();
      if (parent) {
        parent.remove(this._placeholder);
      }
      this._placeholder.dispose();
    }

    this._placeholder = this.__font = null;

    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }

    if (this.__font && this.__webfontListenerId) {
      this.__font.removeListenerById(this.__webfontListenerId);
    }

    this.getContentElement().removeListener("input", this._onHtmlInput, this);
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Input wrap any valid HTML input element and make it accessible
 * through the normalized qooxdoo element interface.
 */
qx.Class.define("qx.html.Input",
{
  extend : qx.html.Element,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param type {String} The type of the input field. Valid values are
   *   <code>text</code>, <code>textarea</code>, <code>select</code>,
   *   <code>checkbox</code>, <code>radio</code>, <code>password</code>,
   *   <code>hidden</code>, <code>submit</code>, <code>image</code>,
   *   <code>file</code>, <code>search</code>, <code>reset</code>,
   *   <code>select</code> and <code>textarea</code>.
   * @param styles {Map?null} optional map of CSS styles, where the key is the name
   *    of the style and the value is the value to use.
   * @param attributes {Map?null} optional map of element attributes, where the
   *    key is the name of the attribute and the value is the value to use.
   */
  construct : function(type, styles, attributes)
  {
    // Update node name correctly
    if (type === "select" || type === "textarea") {
      var nodeName = type;
    } else {
      nodeName = "input";
    }

    this.base(arguments, nodeName, styles, attributes);

    this.__type = type;
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __type : null,
    // used for webkit only
    __selectable : null,
    __enabled : null,

    /*
    ---------------------------------------------------------------------------
      ELEMENT API
    ---------------------------------------------------------------------------
    */

    //overridden
    _createDomElement : function() {
      return qx.bom.Input.create(this.__type);
    },


    // overridden
    _applyProperty : function(name, value)
    {
      this.base(arguments, name, value);
      var element = this.getDomElement();

      if (name === "value") {
        qx.bom.Input.setValue(element, value);
      } else if (name === "wrap") {
        qx.bom.Input.setWrap(element, value);

        // qx.bom.Input#setWrap has the side-effect that the CSS property
        // overflow is set via DOM methods, causing queue and DOM to get
        // out of sync. Mirror all overflow properties to handle the case
        // when group and x/y property differ.
        this.setStyle("overflow", element.style.overflow, true);
        this.setStyle("overflowX", element.style.overflowX, true);
        this.setStyle("overflowY", element.style.overflowY, true);
      }
    },


    /**
     * Set the input element enabled / disabled.
     * Webkit needs a special treatment because the set color of the input
     * field changes automatically. Therefore, we use
     * <code>-webkit-user-modify: read-only</code> and
     * <code>-webkit-user-select: none</code>
     * for disabling the fields in webkit. All other browsers use the disabled
     * attribute.
     *
     * @param value {Boolean} true, if the inpout element should be enabled.
     */
    setEnabled : function(value)
    {
      this.__enabled = value;

      this.setAttribute("disabled", value===false);

      if (qx.core.Environment.get("engine.name") == "webkit") {
        if (!value) {
          this.setStyles({
            "userModify": "read-only",
            "userSelect": "none"
          });
        } else {
          this.setStyles({
            "userModify": null,
            "userSelect": this.__selectable ? null : "none"
          });
        }
      }
    },


    /**
     * Set whether the element is selectable. It uses the qooxdoo attribute
     * qxSelectable with the values 'on' or 'off'.
     * In webkit, a special css property will be used and checks for the
     * enabled state.
     *
     * @param value {Boolean} True, if the element should be selectable.
     */
    setSelectable : qx.core.Environment.select("engine.name",
    {
      "webkit" : function(value)
      {
        this.__selectable = value;

        // Only apply the value when it is enabled
        this.base(arguments, this.__enabled && value);
      },

      "default" : function(value)
      {
        this.base(arguments, value);
      }
    }),



    /*
    ---------------------------------------------------------------------------
      INPUT API
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value of the input element.
     *
     * @param value {var} the new value
     * @return {qx.html.Input} This instance for for chaining support.
     */
    setValue : function(value)
    {
      var element = this.getDomElement();

      if (element)
      {
        // Do not overwrite when already correct (on input events)
        // This is needed to keep caret position while typing.
        if (element.value != value) {
          qx.bom.Input.setValue(element, value);
        }
      } else {
        this._setProperty("value", value);
      }

      return this;
    },


    /**
     * Get the current value.
     *
     * @return {String} The element's current value.
     */
    getValue : function()
    {
      var element = this.getDomElement();

      if (element) {
        return qx.bom.Input.getValue(element);
      }

      return this._getProperty("value") || "";
    },


    /**
     * Sets the text wrap behavior of a text area element.
     *
     * This property uses the style property "wrap" (IE) respectively "whiteSpace"
     *
     * @param wrap {Boolean} Whether to turn text wrap on or off.
     * @param direct {Boolean?false} Whether the execution should be made
     *  directly when possible
     * @return {qx.html.Input} This instance for for chaining support.
     */
    setWrap : function(wrap, direct)
    {
      if (this.__type === "textarea") {
        this._setProperty("wrap", wrap, direct);
      } else {
        throw new Error("Text wrapping is only support by textareas!");
      }

      return this;
    },


    /**
     * Gets the text wrap behavior of a text area element.
     *
     * This property uses the style property "wrap" (IE) respectively "whiteSpace"
     *
     * @return {Boolean} Whether wrapping is enabled or disabled.
     */
    getWrap : function()
    {
      if (this.__type === "textarea") {
        return this._getProperty("wrap");
      } else {
        throw new Error("Text wrapping is only support by textareas!");
      }
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

   ======================================================================

   This class contains code based on the following work:

   * jQuery
     http://jquery.com
     Version 1.3.1

     Copyright:
       2009 John Resig

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/**
 * Cross browser abstractions to work with input elements.
 *
 * @require(qx.lang.Array#contains)
 */
qx.Bootstrap.define("qx.bom.Input",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Map} Internal data structures with all supported input types */
    __types :
    {
      text : 1,
      textarea : 1,
      select : 1,
      checkbox : 1,
      radio : 1,
      password : 1,
      hidden : 1,
      submit : 1,
      image : 1,
      file : 1,
      search : 1,
      reset : 1,
      button : 1
    },


    /**
     * Creates an DOM input/textarea/select element.
     *
     * Attributes may be given directly with this call. This is critical
     * for some attributes e.g. name, type, ... in many clients.
     *
     * Note: <code>select</code> and <code>textarea</code> elements are created
     * using the identically named <code>type</code>.
     *
     * @param type {String} Any valid type for HTML, <code>select</code>
     *   and <code>textarea</code>
     * @param attributes {Map} Map of attributes to apply
     * @param win {Window} Window to create the element for
     * @return {Element} The created input node
     */
    create : function(type, attributes, win)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertKeyInMap(type, this.__types, "Unsupported input type.");
      }

      // Work on a copy to not modify given attributes map
      var attributes = attributes ? qx.lang.Object.clone(attributes) : {};

      var tag;

      if (type === "textarea" || type === "select")
      {
        tag = type;
      }
      else
      {
        tag = "input";
        attributes.type = type;
      }

      return qx.dom.Element.create(tag, attributes, win);
    },


    /**
     * Applies the given value to the element.
     *
     * Normally the value is given as a string/number value and applied
     * to the field content (textfield, textarea) or used to
     * detect whether the field is checked (checkbox, radiobutton).
     *
     * Supports array values for selectboxes (multiple-selection)
     * and checkboxes or radiobuttons (for convenience).
     *
     * Please note: To modify the value attribute of a checkbox or
     * radiobutton use {@link qx.bom.element.Attribute#set} instead.
     *
     * @param element {Element} element to update
     * @param value {String|Number|Array} the value to apply
     */
    setValue : function(element, value)
    {
      var tag = element.nodeName.toLowerCase();
      var type = element.type;
      var Array = qx.lang.Array;
      var Type = qx.lang.Type;

      if (typeof value === "number") {
        value += "";
      }

      if ((type === "checkbox" || type === "radio"))
      {
        if (Type.isArray(value)) {
          element.checked = Array.contains(value, element.value);
        } else {
          element.checked = element.value == value;
        }
      }
      else if (tag === "select")
      {
        var isArray = Type.isArray(value);
        var options = element.options;
        var subel, subval;

        for (var i=0, l=options.length; i<l; i++)
        {
          subel = options[i];
          subval = subel.getAttribute("value");
          if (subval == null) {
            subval = subel.text;
          }

          subel.selected = isArray ?
             Array.contains(value, subval) : value == subval;
        }

        if (isArray && value.length == 0) {
          element.selectedIndex = -1;
        }
      }
      else if ((type === "text" || type === "textarea") &&
        (qx.core.Environment.get("engine.name") == "mshtml"))
      {
        // These flags are required to detect self-made property-change
        // events during value modification. They are used by the Input
        // event handler to filter events.
        element.$$inValueSet = true;
        element.value = value;
        element.$$inValueSet = null;
      } else {
        element.value = value;
      }
    },


    /**
     * Returns the currently configured value.
     *
     * Works with simple input fields as well as with
     * select boxes or option elements.
     *
     * Returns an array in cases of multi-selection in
     * select boxes but in all other cases a string.
     *
     * @param element {Element} DOM element to query
     * @return {String|Array} The value of the given element
     */
    getValue : function(element)
    {
      var tag = element.nodeName.toLowerCase();

      if (tag === "option") {
        return (element.attributes.value || {}).specified ? element.value : element.text;
      }

      if (tag === "select")
      {
        var index = element.selectedIndex;

        // Nothing was selected
        if (index < 0) {
          return null;
        }

        var values = [];
        var options = element.options;
        var one = element.type == "select-one";
        var clazz = qx.bom.Input;
        var value;

        // Loop through all the selected options
        for (var i=one ? index : 0, max=one ? index+1 : options.length; i<max; i++)
        {
          var option = options[i];

          if (option.selected)
          {
            // Get the specifc value for the option
            value = clazz.getValue(option);

            // We don't need an array for one selects
            if (one) {
              return value;
            }

            // Multi-Selects return an array
            values.push(value);
          }
        }

        return values;
      }
      else
      {
        return (element.value || "").replace(/\r/g, "");
      }
    },


    /**
     * Sets the text wrap behaviour of a text area element.
     * This property uses the attribute "wrap" respectively
     * the style property "whiteSpace"
     *
     * @signature function(element, wrap)
     * @param element {Element} DOM element to modify
     * @param wrap {Boolean} Whether to turn text wrap on or off.
     */
    setWrap : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, wrap) {
        var wrapValue = wrap ? "soft" : "off";

        // Explicitly set overflow-y CSS property to auto when wrapped,
        // allowing the vertical scroll-bar to appear if necessary
        var styleValue = wrap ? "auto" : "";

        element.wrap = wrapValue;
        element.style.overflowY = styleValue;
      },

      "gecko" : function(element, wrap)
      {
        var wrapValue = wrap ? "soft" : "off";
        var styleValue = wrap ? "" : "auto";

        element.setAttribute("wrap", wrapValue);
        element.style.overflow = styleValue;
      },

      "webkit" : function(element, wrap)
      {
        var wrapValue = wrap ? "soft" : "off";
        var styleValue = wrap ? "" : "auto";

        element.setAttribute("wrap", wrapValue);
        element.style.overflow = styleValue;
      },

      "default" : function(element, wrap) {
        element.style.whiteSpace = wrap ? "normal" : "nowrap";
      }
    })
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
     * Fabian Jakobs (fjakobs)
     * Adrian Olaru (adrianolaru)

************************************************************************ */

/**
 * The TextField is a single-line text input field.
 */
qx.Class.define("qx.ui.form.TextField",
{
  extend : qx.ui.form.AbstractField,


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
      init : "textfield"
    },

    // overridden
    allowGrowY :
    {
      refine : true,
      init : false
    },

    // overridden
    allowShrinkY :
    {
      refine : true,
      init : false
    }
  },

  members : {

    // overridden
    _renderContentElement : function(innerHeight, element) {
     if ((qx.core.Environment.get("engine.name") == "mshtml") &&
         (parseInt(qx.core.Environment.get("engine.version"), 10) < 9
         || qx.core.Environment.get("browser.documentmode") < 9))
     {
       element.setStyles({
         "line-height" : innerHeight + 'px'
       });
     }
    },


    // overridden
    _createContentElement : function() {
      var el = this.base(arguments);
      var deviceType = qx.core.Environment.get("device.type");
      if (deviceType == "tablet" || deviceType == "mobile") {
        el.addListener("keypress", this._onKeyPress, this);
      }

      return el;
    },


    /**
    * Close the virtual keyboard if the Enter key is pressed.
    * @param evt {qx.event.type.KeySequence} the keypress event.
    */
    _onKeyPress : function(evt) {
      // On return
      if (evt.getKeyIdentifier() == "Enter") {
        this.blur();
      }
    }
  },

  destruct : function() {
    this.getContentElement().removeListener("keypress", this._onKeyPress, this);
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

************************************************************************ */

/**
 * A password input field, which hides the entered text.
 */
qx.Class.define("qx.ui.form.PasswordField",
{
  extend : qx.ui.form.TextField,

  members :
  {
    // overridden
    _createInputElement : function() {
      return new qx.html.Input("password");
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This interface defines the necessary features a form renderer should have.
 * Keep in mind that all renderes has to be widgets.
 */
qx.Interface.define("qx.ui.form.renderer.IFormRenderer",
{
  members :
  {
    /**
     * Add a group of form items with the corresponding names. The names should
     * be displayed as hint for the user what to do with the form item.
     * The title is optional and can be used as grouping for the given form
     * items.
     *
     * @param items {qx.ui.core.Widget[]} An array of form items to render.
     * @param names {String[]} An array of names for the form items.
     * @param title {String?} A title of the group you are adding.
     * @param itemsOptions {Array?null} The added additional data.
     * @param headerOptions {Map?null} The options map as defined by the form
     *   for the current group header.
     */
    addItems : function(items, names, title, itemsOptions, headerOptions) {},


    /**
     * Adds a button the form renderer.
     *
     * @param button {qx.ui.form.Button} A button which should be added to
     *   the form.
     * @param options {Map?null} The added additional data.
     */
    addButton : function(button, options) {}

  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Abstract renderer for {@link qx.ui.form.Form}. This abstract renderer should
 * be the superclass of all form renderer. It takes the form, which is
 * supplied as constructor parameter and configures itself. So if you need to
 * set some additional information on your renderer before adding the widgets,
 * be sure to do that before calling this.base(arguments, form).
 */
qx.Class.define("qx.ui.form.renderer.AbstractRenderer",
{
  type : "abstract",
  extend : qx.ui.core.Widget,
  implement : qx.ui.form.renderer.IFormRenderer,

  /**
   * @param form {qx.ui.form.Form} The form to render.
   */
  construct : function(form)
  {
    this.base(arguments);

    this._labels = [];

    // translation support
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener(
        "changeLocale", this._onChangeLocale, this
      );
      this._names = [];
    }
    this._form = form;
    this._render();

    form.addListener("change", this._onFormChange, this);
  },


  members :
  {
    _names : null,
    _form : null,
    _labels : null,


    /**
     * Renders the form: add's the items and buttons.
     */
    _render : function() {
      // add the groups
      var groups = this._form.getGroups();
      for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        this.addItems(
          group.items, group.labels, group.title, group.options, group.headerOptions
        );
      }

      // add the buttons
      var buttons = this._form.getButtons();
      var buttonOptions = this._form.getButtonOptions();
      for (var i = 0; i < buttons.length; i++) {
        this.addButton(buttons[i], buttonOptions[i]);
      }
    },


    /**
     * Handler responsible for updating the rendered widget as soon as the
     * form changes.
     */
    _onFormChange : function() {
      this._removeAll();
      // remove all created labels
      for (var i=0; i < this._labels.length; i++) {
        this._labels[i].dispose();
      }
      this._labels = [];

      this._render();
    },


    /**
     * Helper to bind the item's visibility to the label's visibility.
     * @param item {qx.ui.core.Widget} The form element.
     * @param label {qx.ui.basic.Label} The label for the form element.
     */
    _connectVisibility : function(item, label) {
      // map the items visibility to the label
      item.bind("visibility", label, "visibility");
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e) {
        for (var i = 0; i < this._names.length; i++) {
          var entry = this._names[i];
          if (entry.name && entry.name.translate) {
            entry.name = entry.name.translate();
          }
          var newText = this._createLabelText(entry.name, entry.item);
          entry.label.setValue(newText);
        }
      },

      "false" : null
    }),


    /**
     * Creates the label text for the given form item.
     *
     * @param name {String} The content of the label without the
     *   trailing * and :
     * @param item {qx.ui.form.IForm} The item, which has the required state.
     * @return {String} The text for the given item.
     */
    _createLabelText : function(name, item)
    {
      var required = "";
      if (item.getRequired()) {
       required = " <span style='color:red'>*</span> ";
      }

      // Create the label. Append a colon only if there's text to display.
      var colon = name.length > 0 || item.getRequired() ? " :" : "";
      return name + required + colon;
    },


    // interface implementation
    addItems : function(items, names, title) {
      throw new Error("Abstract method call");
    },


    // interface implementation
    addButton : function(button) {
      throw new Error("Abstract method call");
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }
    this._names = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Single column renderer for {@link qx.ui.form.Form}.
 */
qx.Class.define("qx.ui.form.renderer.Single",
{
  extend : qx.ui.form.renderer.AbstractRenderer,


  construct : function(form)
  {
    var layout = new qx.ui.layout.Grid();
    layout.setSpacing(6);
    layout.setColumnFlex(0, 1);
    layout.setColumnAlign(0, "right", "top");
    this._setLayout(layout);

    this.base(arguments, form);
  },


  members :
  {
    _row : 0,
    _buttonRow : null,


    // overridden
    _onFormChange : function() {
      if (this._buttonRow) {
        this._buttonRow.destroy();
        this._buttonRow = null;
      }
      this._row = 0;
      this.base(arguments);
    },


    /**
     * Add a group of form items with the corresponding names. The names are
     * displayed as label.
     * The title is optional and is used as grouping for the given form
     * items.
     *
     * @param items {qx.ui.core.Widget[]} An array of form items to render.
     * @param names {String[]} An array of names for the form items.
     * @param title {String?} A title of the group you are adding.
     */
    addItems : function(items, names, title) {
      // add the header
      if (title != null) {
        this._add(
          this._createHeader(title), {row: this._row, column: 0, colSpan: 2}
        );
        this._row++;
      }

      // add the items
      for (var i = 0; i < items.length; i++) {
        var label = this._createLabel(names[i], items[i]);
        this._add(label, {row: this._row, column: 0});
        var item = items[i];
        label.setBuddy(item);
        this._add(item, {row: this._row, column: 1});
        this._row++;

        this._connectVisibility(item, label);

        // store the names for translation
        if (qx.core.Environment.get("qx.dynlocale")) {
          this._names.push({name: names[i], label: label, item: items[i]});
        }
      }
    },


    /**
     * Adds a button the form renderer. All buttons will be added in a
     * single row at the bottom of the form.
     *
     * @param button {qx.ui.form.Button} The button to add.
     */
    addButton : function(button) {
      if (this._buttonRow == null) {
        // create button row
        this._buttonRow = new qx.ui.container.Composite();
        this._buttonRow.setMarginTop(5);
        var hbox = new qx.ui.layout.HBox();
        hbox.setAlignX("right");
        hbox.setSpacing(5);
        this._buttonRow.setLayout(hbox);
        // add the button row
        this._add(this._buttonRow, {row: this._row, column: 0, colSpan: 2});
        // increase the row
        this._row++;
      }

      // add the button
      this._buttonRow.add(button);
    },


    /**
     * Returns the set layout for configuration.
     *
     * @return {qx.ui.layout.Grid} The grid layout of the widget.
     */
    getLayout : function() {
      return this._getLayout();
    },


    /**
     * Creates a label for the given form item.
     *
     * @param name {String} The content of the label without the
     *   trailing * and :
     * @param item {qx.ui.core.Widget} The item, which has the required state.
     * @return {qx.ui.basic.Label} The label for the given item.
     */
    _createLabel : function(name, item) {
      var label = new qx.ui.basic.Label(this._createLabelText(name, item));
      // store labels for disposal
      this._labels.push(label);
      label.setRich(true);
      label.setAppearance("form-renderer-label");
      return label;
    },


    /**
     * Creates a header label for the form groups.
     *
     * @param title {String} Creates a header label.
     * @return {qx.ui.basic.Label} The header for the form groups.
     */
    _createHeader : function(title) {
      var header = new qx.ui.basic.Label(title);
      // store labels for disposal
      this._labels.push(header);
      header.setFont("bold");
      if (this._row != 0) {
        header.setMarginTop(10);
      }
      header.setAlignX("left");
      return header;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // first, remove all buttons from the button row because they
    // should not be disposed
    if (this._buttonRow) {
      this._buttonRow.removeAll();
      this._disposeObjects("_buttonRow");
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * <h2>Form Controller</h2>
 *
 * *General idea*
 *
 * The form controller is responsible for connecting a form with a model. If no
 * model is given, a model can be created. This created model will fit exactly
 * to the given form and can be used for serialization. All the connections
 * between the form items and the model are handled by an internal
 * {@link qx.data.controller.Object}.
 *
 * *Features*
 *
 * * Connect a form to a model (bidirectional)
 * * Create a model for a given form
 *
 * *Usage*
 *
 * The controller only works if both a controller and a model are set.
 * Creating a model will automatically set the created model.
 *
 * *Cross reference*
 *
 * * If you want to bind single values, use {@link qx.data.controller.Object}
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 */
qx.Class.define("qx.data.controller.Form",
{
  extend : qx.core.Object,

  /**
   * @param model {qx.core.Object | null} The model to bind the target to. The
   *   given object will be set as {@link #model} property.
   * @param target {qx.ui.form.Form | null} The form which contains the form
   *   items. The given form will be set as {@link #target} property.
   * @param selfUpdate {Boolean?false} If set to true, you need to call the
   *   {@link #updateModel} method to get the data in the form to the model.
   *   Otherwise, the data will be synced automatically on every change of
   *   the form.
   */
  construct : function(model, target, selfUpdate)
  {
    this.base(arguments);

    this._selfUpdate = !!selfUpdate;
    this.__bindingOptions = {};

    if (model != null) {
      this.setModel(model);
    }

    if (target != null) {
      this.setTarget(target);
    }
  },


  properties :
  {
    /** Data object containing the data which should be shown in the target. */
    model :
    {
      check: "qx.core.Object",
      apply: "_applyModel",
      event: "changeModel",
      nullable: true,
      dereference: true
    },


    /** The target widget which should show the data. */
    target :
    {
      check: "qx.ui.form.Form",
      apply: "_applyTarget",
      event: "changeTarget",
      nullable: true,
      init: null,
      dereference: true
    }
  },


  members :
  {
    __objectController : null,
    __bindingOptions : null,


    /**
     * The form controller uses for setting up the bindings the fundamental
     * binding layer, the {@link qx.data.SingleValueBinding}. To achieve a
     * binding in both directions, two bindings are neede. With this method,
     * you have the opportunity to set the options used for the bindings.
     *
     * @param name {String} The name of the form item for which the options
     *   should be used.
     * @param model2target {Map} Options map used for the binding from model
     *   to target. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     * @param target2model {Map} Options map used for the binding from target
     *   to model. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     */
    addBindingOptions : function(name, model2target, target2model)
    {
      this.__bindingOptions[name] = [model2target, target2model];

      // return if not both, model and target are given
      if (this.getModel() == null || this.getTarget() == null) {
        return;
      }

      // renew the affected binding
      var item = this.getTarget().getItems()[name];
      var targetProperty =
        this.__isModelSelectable(item) ? "modelSelection[0]" : "value";

      // remove the binding
      this.__objectController.removeTarget(item, targetProperty, name);
      // set up the new binding with the options
      this.__objectController.addTarget(
        item, targetProperty, name, !this._selfUpdate, model2target, target2model
      );
    },


    /**
     * Creates and sets a model using the {@link qx.data.marshal.Json} object.
     * Remember that this method can only work if the form is set. The created
     * model will fit exactly that form. Changing the form or adding an item to
     * the form will need a new model creation.
     *
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @return {qx.core.Object} The created model.
     */
    createModel : function(includeBubbleEvents) {
      var target = this.getTarget();

      // throw an error if no target is set
      if (target == null) {
        throw new Error("No target is set.");
      }

      var items = target.getItems();
      var data = {};
      for (var name in items) {
        var names = name.split(".");
        var currentData = data;
        for (var i = 0; i < names.length; i++) {
          // if its the last item
          if (i + 1 == names.length) {
            // check if the target is a selection
            var clazz = items[name].constructor;
            var itemValue = null;
            if (qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection)) {
              // use the first element of the selection because passed to the
              // marshaler (and its single selection anyway) [BUG #3541]
              itemValue = items[name].getModelSelection().getItem(0) || null;
            } else {
              itemValue = items[name].getValue();
            }
            // call the converter if available [BUG #4382]
            if (this.__bindingOptions[name] && this.__bindingOptions[name][1]) {
              itemValue = this.__bindingOptions[name][1].converter(itemValue);
            }
            currentData[names[i]] = itemValue;
          } else {
            // if its not the last element, check if the object exists
            if (!currentData[names[i]]) {
              currentData[names[i]] = {};
            }
            currentData = currentData[names[i]];
          }
        }
      }

      var model = qx.data.marshal.Json.createModel(data, includeBubbleEvents);
      this.setModel(model);

      return model;
    },


    /**
     * Responsible for synching the data from entered in the form to the model.
     * Please keep in mind that this method only works if you create the form
     * with <code>selfUpdate</code> set to true. Otherwise, this method will
     * do nothing because updates will be synched automatically on every
     * change.
     */
    updateModel: function(){
      // only do stuff if self update is enabled and a model or target is set
      if (!this._selfUpdate || !this.getModel() || !this.getTarget()) {
        return;
      }

      var items = this.getTarget().getItems();
      for (var name in items) {
        var item = items[name];
        var sourceProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";

        var options = this.__bindingOptions[name];
        options = options && this.__bindingOptions[name][1];

        qx.data.SingleValueBinding.updateTarget(
          item, sourceProperty, this.getModel(), name, options
        );
      }
    },


    // apply method
    _applyTarget : function(value, old) {
      // if an old target is given, remove the binding
      if (old != null) {
        this.__tearDownBinding(old);
      }

      // do nothing if no target is set
      if (this.getModel() == null) {
        return;
      }

      // target and model are available
      if (value != null) {
        this.__setUpBinding();
      }
    },


    // apply method
    _applyModel : function(value, old) {

      // set the model to null to reset all items before removing them
      if (this.__objectController != null && value == null) {
        this.__objectController.setModel(null);
      }

      // first, get rid off all bindings (avoids wrong data population)
      if (this.__objectController != null) {
        var items = this.getTarget().getItems();
        for (var name in items) {
          var item = items[name];
          var targetProperty =
            this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
          this.__objectController.removeTarget(item, targetProperty, name);
        }
      }

      // set the model of the object controller if available
      if (this.__objectController != null) {
        this.__objectController.setModel(value);
      }

      // do nothing is no target is set
      if (this.getTarget() == null) {
        return;
      }

      // model and target are available
      if (value != null) {
        this.__setUpBinding();
      }
    },


    /**
     * Internal helper for setting up the bindings using
     * {@link qx.data.controller.Object#addTarget}. All bindings are set
     * up bidirectional.
     */
    __setUpBinding : function() {
      // create the object controller
      if (this.__objectController == null) {
        this.__objectController = new qx.data.controller.Object(this.getModel());
      }

      // get the form items
      var items = this.getTarget().getItems();

      // connect all items
      for (var name in items) {
        var item = items[name];
        var targetProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
        var options = this.__bindingOptions[name];

        // try to bind all given items in the form
        try {
          if (options == null) {
            this.__objectController.addTarget(item, targetProperty, name, !this._selfUpdate);
          } else {
            this.__objectController.addTarget(
              item, targetProperty, name, !this._selfUpdate, options[0], options[1]
            );
          }
        // ignore not working items
        } catch (ex) {
          if (qx.core.Environment.get("qx.debug")) {
            this.warn("Could not bind property " + name + " of " + this.getModel());
          }
        }
      }
      // make sure the initial values of the model are taken for resetting [BUG #5874]
      this.getTarget().redefineResetter();
    },


    /**
     * Internal helper for removing all set up bindings using
     * {@link qx.data.controller.Object#removeTarget}.
     *
     * @param oldTarget {qx.ui.form.Form} The form which has been removed.
     */
    __tearDownBinding : function(oldTarget) {
      // do nothing if the object controller has not been created
      if (this.__objectController == null) {
        return;
      }

      // get the items
      var items = oldTarget.getItems();

      // disconnect all items
      for (var name in items) {
        var item = items[name];
        var targetProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
        this.__objectController.removeTarget(item, targetProperty, name);
      }
    },


    /**
     * Returns whether the given item implements
     * {@link qx.ui.core.ISingleSelection} and
     * {@link qx.ui.form.IModelSelection}.
     *
     * @param item {qx.ui.form.IForm} The form item to check.
     *
     * @return {Boolean} true, if given item fits.
     */
    __isModelSelectable : function(item) {
      return qx.Class.hasInterface(item.constructor, qx.ui.core.ISingleSelection) &&
      qx.Class.hasInterface(item.constructor, qx.ui.form.IModelSelection);
    }

  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     // dispose the object controller because the bindings need to be removed
     if (this.__objectController) {
       this.__objectController.dispose();
     }
   }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Defines the methods needed by every marshaler which should work with the
 * qooxdoo data stores.
 */
qx.Interface.define("qx.data.marshal.IMarshaler",
{
  members :
  {
    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code>. Two objects containing the same keys will not
     * create two different classes.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass : function(data, includeBubbleEvents) {},


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel : function(data) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is responsible for converting json data to class instances
 * including the creation of the classes.
 * To retrieve the native data of created models use the methods
 *   described in {@link qx.util.Serializer}.
 */
qx.Class.define("qx.data.marshal.Json",
{
  extend : qx.core.Object,
  implement : [qx.data.marshal.IMarshaler],

  /**
   * @param delegate {Object} An object containing one of the methods described
   *   in {@link qx.data.marshal.IMarshalerDelegate}.
   */
  construct : function(delegate)
  {
    this.base(arguments);

    this.__delegate = delegate;
  },

  statics :
  {
    $$instance : null,

    /**
     * Creates a qooxdoo object based on the given json data. This function
     * is just a static wrapper. If you want to configure the creation
     * process of the class, use {@link qx.data.marshal.Json} directly.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     *
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    createModel : function(data, includeBubbleEvents) {
      // singleton for the json marshaler
      if (this.$$instance === null) {
        this.$$instance = new qx.data.marshal.Json();
      }
      // be sure to create the classes first
      this.$$instance.toClass(data, includeBubbleEvents);
      // return the model
      return this.$$instance.toModel(data);
    }
  },


  members :
  {
    __delegate : null,


    /**
     * Converts a given object into a hash which will be used to identify the
     * classes under the namespace <code>qx.data.model</code>.
     *
     * @param data {Object} The JavaScript object from which the hash is
     *   required.
     * @return {String} The hash representation of the given JavaScript object.
     */
    __jsonToHash: function(data) {
      return Object.keys(data).sort().join('"');
    },


    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code> and the hash of the data created by
     * {@link #__jsonToHash}. Two objects containing the same keys will not
     * create two different classes. The class creation process also supports
     * the functions provided by its delegate.
     *
     * Important, please keep in mind that only valid JavaScript identifiers
     * can be used as keys in the data map. For convenience '-' in keys will
     * be removed (a-b will be ab in the end).
     *
     * @see qx.data.store.IStoreDelegate
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass: function(data, includeBubbleEvents) {
      this.__toClass(data, includeBubbleEvents, null, 0);
    },


    /**
     * Implementation of {@link #toClass} used for recursion.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     */
    __toClass : function(data, includeBubbleEvents, parentProperty, depth) {
      // break on all primitive json types and qooxdoo objects
      if (
        !qx.lang.Type.isObject(data)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        // check for arrays
        if (data instanceof Array || qx.Bootstrap.getClass(data) == "Array") {
          for (var i = 0; i < data.length; i++) {
            this.__toClass(data[i], includeBubbleEvents, parentProperty + "[" + i + "]", depth+1);
          }
        }

        // ignore arrays and primitive types
        return;
      }

      var hash = this.__jsonToHash(data);

      // ignore rules
      if (this.__ignore(hash, parentProperty, depth)) {
        return;
      }

      // check for the possible child classes
      for (var key in data) {
        this.__toClass(data[key], includeBubbleEvents, key, depth+1);
      }

      // class already exists
      if (qx.Class.isDefined("qx.data.model." + hash)) {
        return;
      }

      // class is defined by the delegate
      if (
        this.__delegate
        && this.__delegate.getModelClass
        && this.__delegate.getModelClass(hash, data, parentProperty, depth) != null
      ) {
        return;
      }

      // create the properties map
      var properties = {};
      // include the disposeItem for the dispose process.
      var members = {__disposeItem : this.__disposeItem};
      for (var key in data) {
        // apply the property names mapping
        if (this.__delegate && this.__delegate.getPropertyMapping) {
          key = this.__delegate.getPropertyMapping(key, hash);
        }

        // stip the unwanted characters
        key = key.replace(/-|\.|\s+/g, "");
        // check for valid JavaScript identifier (leading numbers are ok)
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue((/^[$0-9A-Za-z_]*$/).test(key),
          "The key '" + key + "' is not a valid JavaScript identifier.")
        }

        properties[key] = {};
        properties[key].nullable = true;
        properties[key].event = "change" + qx.lang.String.firstUp(key);
        // bubble events
        if (includeBubbleEvents) {
          properties[key].apply = "_applyEventPropagation";
        }
        // validation rules
        if (this.__delegate && this.__delegate.getValidationRule) {
          var rule = this.__delegate.getValidationRule(hash, key);
          if (rule) {
            properties[key].validate = "_validate" + key;
            members["_validate" + key] = rule;
          }
        }
      }

      // try to get the superclass, qx.core.Object as default
      if (this.__delegate && this.__delegate.getModelSuperClass) {
        var superClass =
          this.__delegate.getModelSuperClass(hash, parentProperty, depth) || qx.core.Object;
      } else {
        var superClass = qx.core.Object;
      }

      // try to get the mixins
      var mixins = [];
      if (this.__delegate && this.__delegate.getModelMixins) {
        var delegateMixins = this.__delegate.getModelMixins(hash, parentProperty, depth);
        // check if its an array
        if (!qx.lang.Type.isArray(delegateMixins)) {
          if (delegateMixins != null) {
            mixins = [delegateMixins];
          }
        } else {
          mixins = delegateMixins;
        }
      }

      // include the mixin for the event bubbling
      if (includeBubbleEvents) {
        mixins.push(qx.data.marshal.MEventBubbling);
      }

      // create the map for the class
      var newClass = {
        extend : superClass,
        include : mixins,
        properties : properties,
        members : members,
        destruct : this.__disposeProperties
      };

      qx.Class.define("qx.data.model." + hash, newClass);
    },


    /**
     * Destructor for all created classes which disposes all stuff stored in
     * the properties.
     */
    __disposeProperties : function() {
      var properties = qx.util.PropertyUtil.getAllProperties(this.constructor);
      for (var desc in properties) {
        this.__disposeItem(this.get(properties[desc].name));
      };
    },


    /**
     * Helper for disposing items of the created class.
     *
     * @param item {var} The item to dispose.
     */
    __disposeItem : function(item) {
      if (!(item instanceof qx.core.Object)) {
        // ignore all non objects
        return;
      }
      // ignore already disposed items (could happen during shutdown)
      if (item.isDisposed()) {
        return;
      }
      item.dispose();
    },


    /**
     * Creates an instance for the given data hash.
     *
     * @param hash {String} The hash of the data for which an instance should
     *   be created.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @param data {Map} The data for which an instance should be created.
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    __createInstance: function(hash, data, parentProperty, depth) {
      var delegateClass;
      // get the class from the delegate
      if (this.__delegate && this.__delegate.getModelClass) {
        delegateClass = this.__delegate.getModelClass(hash, data, parentProperty, depth);
      }
      if (delegateClass != null) {
        return (new delegateClass());
      } else {
        var className = "qx.data.model." + hash;
        var clazz = qx.Class.getByName(className);
        if (!clazz) {
          throw new Error("Class '" + className + "' could not be found.");
        }
        return (new clazz());
      }
    },


    /**
     * Helper to decide if the delegate decides to ignore a data set.
     * @param hash {String} The property names.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @return {Boolean} <code>true</code> if the set should be ignored
     */
    __ignore : function(hash, parentProperty, depth) {
      var del = this.__delegate;
      return del && del.ignore && del.ignore(hash, parentProperty, depth);
    },


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method. The creation
     * of the class itself is delegated to the {@link #__createInstance} method,
     * which could use the {@link qx.data.store.IStoreDelegate} methods, if
     * given.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel: function(data) {
      return this.__toModel(data, null, 0);
    },


    /**
     * Implementation of {@link #toModel} used for recursion.
     *
     * @param data {Object} The object for which models should be created.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     * @return {qx.core.Object} The created model object.
     */
    __toModel: function(data, parentProperty, depth) {
      var isObject = qx.lang.Type.isObject(data);
      var isArray = data instanceof Array || qx.Bootstrap.getClass(data) == "Array";

      if (
        (!isObject && !isArray)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        return data;

      // ignore rules
      } else if (this.__ignore(this.__jsonToHash(data), parentProperty, depth)) {
        return data;

      } else if (isArray) {
        var arrayClass = qx.data.Array;
        if (this.__delegate && this.__delegate.getArrayClass) {
          var customArrayClass = this.__delegate.getArrayClass(parentProperty, depth);
          arrayClass = customArrayClass || arrayClass;
        }

        var array = new arrayClass();
        // set the auto dispose for the array
        array.setAutoDisposeItems(true);

        for (var i = 0; i < data.length; i++) {
          array.push(this.__toModel(data[i], parentProperty + "[" + i + "]", depth+1));
        }
        return array;

      } else if (isObject) {
        // create an instance for the object
        var hash = this.__jsonToHash(data);
        var model = this.__createInstance(hash, data, parentProperty, depth);

        // go threw all element in the data
        for (var key in data) {
          // apply the property names mapping
          var propertyName = key;
          if (this.__delegate && this.__delegate.getPropertyMapping) {
            propertyName = this.__delegate.getPropertyMapping(key, hash);
          }
          var propertyNameReplaced = propertyName.replace(/-|\.|\s+/g, "");
          // warn if there has been a replacement
          if (
            (qx.core.Environment.get("qx.debug")) &&
            qx.core.Environment.get("qx.debug.databinding")
          ) {
            if (propertyNameReplaced != propertyName) {
              this.warn(
                "The model contained an illegal name: '" + key +
                "'. Replaced it with '" + propertyName + "'."
              );
            }
          }
          propertyName = propertyNameReplaced;
          // only set the properties if they are available [BUG #5909]
          var setterName = "set" + qx.lang.String.firstUp(propertyName);
          if (model[setterName]) {
            model[setterName](this.__toModel(data[key], key, depth+1));
          }
        }
        return model;
      }

      throw new Error("Unsupported type!");
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following four keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with five key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove', 'order' or 'add/remove'</li>
     * <li>added: The items which has been added (as a JavaScript array)</li>
     * <li>removed: The items which has been removed (as a JavaScript array)</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            added: [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The zero-based end index. <code>slice</code> extracts
     *   up to but not including <code>to</code>. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. A change event
     * will be fired for every removal or addition unless the array is
     * identical before and after splicing.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      } else if (amount == arguments.length - 2) {
        // if we added as much items as we removed
        var addedItems = qx.lang.Array.fromArguments(arguments, 2)
        // check if the array content equals the content before the operation
        for (var i = 0; i < addedItems.length; i++) {
          if (addedItems[i] !== returnArray[i]) {
            break;
          }
          // if all added and removed items are equal
          if (i == addedItems.length -1) {
            // prevent all events and return a new array
            return new qx.data.Array();
          }
        }
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      if (removed || added) {
        var addedItems = qx.lang.Array.fromArguments(arguments, 2);

        if (returnArray.length == 0) {
          var type = "add";
          var end = startIndex + addedItems.length;
        } else if (addedItems.length == 0) {
          var type = "remove";
          var end = this.length - 1;
        } else {
          var type = "add/remove";
          var end = startIndex + Math.max(addedItems.length, returnArray.length) - 1;
        }

        this.fireDataEvent("change",
          {
            start: startIndex,
            end: end,
            type: type,
            added : addedItems,
            removed : returnArray
          }, null
        );
      }

      // remove the listeners first [BUG #7132]
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }

      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + (i - 2));
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + (arguments.length - 2) - amount, this.length);

      // fire the changeBubble event
      if (removed || added) {
        var value = [];
        for (var i = 2; i < arguments.length; i++) {
          value[i-2] = arguments[i];
        }
        var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
        var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;

        var eventData = {
          value: value,
          name: name + "",
          old: returnArray,
          item: this
        };
        this.fireDataEvent("changeBubble", eventData);
      }
      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            added : [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add/remove",
          added: [item],
          removed: [oldItem]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },

    /**
     * Returns the last index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    lastIndexOf: function(item) {
      return this.__array.lastIndexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          removed : items,
          added : []
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      var oldLength = this.__array.length;
      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, oldLength + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          added : array,
          removed : []
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      Additional JS1.6 methods
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a new array with all elements that pass the test implemented by
     * the provided function. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing only the items
     *  which passed the test.
     */
    filter : function(callback, self) {
      return new qx.data.Array(this.__array.filter(callback, self));
    },


    /**
     * Creates a new array with the results of calling a provided function on every
     * element in this array. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The mapping function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing the new created items.
     */
    map : function(callback, self) {
      return new qx.data.Array(this.__array.map(callback, self));
    },


    /**
     * Tests whether any element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if any element passed the test function.
     */
    some : function(callback, self) {
      return this.__array.some(callback, self);
    },


    /**
     * Tests whether every element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if every element passed the test function.
     */
    every : function(callback, self) {
      return this.__array.every(callback, self);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from left-to-right) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduce : function(callback, initValue) {
      return this.__array.reduce(callback, initValue);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from right-to-left) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduceRight : function(callback, initValue) {
      return this.__array.reduceRight(callback, initValue);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */


/**
 * <h2>Object Controller</h2>
 *
 * *General idea*
 *
 * The idea of the object controller is to make the binding of one model object
 * containing one or more properties as easy as possible. Therefore the
 * controller can take a model as property. Every property in that model can be
 * bound to one or more target properties. The binding will be for
 * atomic types only like Numbers, Strings, ...
 *
 * *Features*
 *
 * * Manages the bindings between the model properties and the different targets
 * * No need for the user to take care of the binding ids
 * * Can create an bidirectional binding (read- / write-binding)
 * * Handles the change of the model which means adding the old targets
 *
 * *Usage*
 *
 * The controller only can work if a model is set. If the model property is
 * null, the controller is not working. But it can be null on any time.
 *
 * *Cross reference*
 *
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 * * If you want to bind a form widget, use {@link qx.data.controller.Form}
 */
qx.Class.define("qx.data.controller.Object",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param model {qx.core.Object?null} The model for the model property.
   */
  construct : function(model)
  {
    this.base(arguments);

    // create a map for all created binding ids
    this.__bindings = {};
    // create an array to store all current targets
    this.__targets = [];

    if (model != null) {
      this.setModel(model);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The model object which does have the properties for the binding. */
    model :
    {
      check: "qx.core.Object",
      event: "changeModel",
      apply: "_applyModel",
      nullable: true,
      dereference: true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // private members
    __targets : null,
    __bindings : null,

    /**
     * Apply-method which will be called if a new model has been set.
     * All bindings will be moved to the new model.
     *
     * @param value {qx.core.Object|null} The new model.
     * @param old {qx.core.Object|null} The old model.
     */
    _applyModel: function(value, old) {
      // for every target
      for (var i = 0; i < this.__targets.length; i++) {
        // get the properties
        var targetObject = this.__targets[i][0];
        var targetProperty = this.__targets[i][1];
        var sourceProperty = this.__targets[i][2];
        var bidirectional = this.__targets[i][3];
        var options = this.__targets[i][4];
        var reverseOptions = this.__targets[i][5];

        // remove it from the old if possible
        if (old != undefined && !old.isDisposed()) {
          this.__removeTargetFrom(targetObject, targetProperty, sourceProperty, old);
        }

        // add it to the new if available
        if (value != undefined) {
          this.__addTarget(
            targetObject, targetProperty, sourceProperty, bidirectional,
            options, reverseOptions
          );
        } else {
          // in shutdown situations, it may be that something is already
          // disposed [BUG #4343]
          if (targetObject.isDisposed() || qx.core.ObjectRegistry.inShutDown) {
            continue;
          }
          // if the model is null, reset the current target
          if (targetProperty.indexOf("[") == -1) {
            targetObject["reset" + qx.lang.String.firstUp(targetProperty)]();
          } else {
            var open = targetProperty.indexOf("[");
            var index = parseInt(
              targetProperty.substring(open + 1, targetProperty.length - 1), 10
            );
            targetProperty = targetProperty.substring(0, open);
            var targetArray = targetObject["get" + qx.lang.String.firstUp(targetProperty)]();
            if (index == "last") {
              index = targetArray.length;
            }
            if (targetArray) {
              targetArray.setItem(index, null);
            }
          }
        }
      }
    },


    /**
     * Adds a new target to the controller. After adding the target, the given
     * property of the model will be bound to the targets property.
     *
     * @param targetObject {qx.core.Object} The object on which the property
     *   should be bound.
     *
     * @param targetProperty {String} The property to which the binding should
     *   go.
     *
     * @param sourceProperty {String} The name of the property in the model.
     *
     * @param bidirectional {Boolean?false} Signals if the binding should also work
     *   in the reverse direction, from the target to source.
     *
     * @param options {Map?null} The options Map used by the binding from source
     *   to target. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     *
     * @param reverseOptions {Map?null} The options used by the binding in the
     *   reverse direction. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     */
    addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // store the added target
      this.__targets.push([
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      ]);

      // delegate the adding
      this.__addTarget(
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      );
    },


    /**
    * Does the work for {@link #addTarget} but without saving the target
    * to the internal target registry.
    *
    * @param targetObject {qx.core.Object} The object on which the property
    *   should be bound.
    *
    * @param targetProperty {String} The property to which the binding should
    *   go.
    *
    * @param sourceProperty {String} The name of the property in the model.
    *
    * @param bidirectional {Boolean?false} Signals if the binding should also work
    *   in the reverse direction, from the target to source.
    *
    * @param options {Map?null} The options Map used by the binding from source
    *   to target. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    *
    * @param reverseOptions {Map?null} The options used by the binding in the
    *   reverse direction. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    */
    __addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // do nothing if no model is set
      if (this.getModel() == null) {
        return;
      }

      // create the binding
      var id = this.getModel().bind(
        sourceProperty, targetObject, targetProperty, options
      );
      // create the reverse binding if necessary
      var idReverse = null
      if (bidirectional) {
        idReverse = targetObject.bind(
          targetProperty, this.getModel(), sourceProperty, reverseOptions
        );
      }

      // save the binding
      var targetHash = targetObject.toHashCode();
      if (this.__bindings[targetHash] == undefined) {
        this.__bindings[targetHash] = [];
      }
      this.__bindings[targetHash].push(
        [id, idReverse, targetProperty, sourceProperty, options, reverseOptions]
      );
    },

    /**
     * Removes the target identified by the three properties.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     */
    removeTarget: function(targetObject, targetProperty, sourceProperty) {
      this.__removeTargetFrom(
        targetObject, targetProperty, sourceProperty, this.getModel()
      );

      // delete the target in the targets reference
      for (var i = 0; i < this.__targets.length; i++) {
        if (
          this.__targets[i][0] == targetObject
          && this.__targets[i][1] == targetProperty
          && this.__targets[i][2] == sourceProperty
        ) {
          this.__targets.splice(i, 1);
        }
      }
    },


    /**
     * Does the work for {@link #removeTarget} but without removing the target
     * from the internal registry.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     *
     * @param sourceObject {String} The source object from which the binding
     *   comes.
     */
    __removeTargetFrom: function(
      targetObject, targetProperty, sourceProperty, sourceObject
    ) {
      // check for not fitting targetObjects
      if (!(targetObject instanceof qx.core.Object)) {
        // just do nothing
        return;
      }

      var currentListing = this.__bindings[targetObject.toHashCode()];
      // if no binding is stored
      if (currentListing == undefined || currentListing.length == 0) {
        return;
      }

      // go threw all listings for the object
      for (var i = 0; i < currentListing.length; i++) {
        // if it is the listing
        if (
          currentListing[i][2] == targetProperty &&
          currentListing[i][3] == sourceProperty
        ) {
          // remove the binding
          var id = currentListing[i][0];
          sourceObject.removeBinding(id);
          // check for the reverse binding
          if (currentListing[i][1] != null) {
            targetObject.removeBinding(currentListing[i][1]);
          }
          // delete the entry and return
          currentListing.splice(i, 1);
          return;
        }
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    // set the model to null to get the bindings removed
    if (this.getModel() != null && !this.getModel().isDisposed()) {
      this.setModel(null);
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This interface should be used in all objects managing a set of items
 * implementing {@link qx.ui.form.IModel}.
 */
qx.Interface.define("qx.ui.form.IModelSelection",
{

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Tries to set the selection using the given array containing the
     * representative models for the selectables.
     *
     * @param value {Array} An array of models.
     */
    setModelSelection : function(value) {},


    /**
     * Returns an array of the selected models.
     *
     * @return {Array} An array containing the models of the currently selected
     *   items.
     */
    getModelSelection : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This is an util class responsible for serializing qooxdoo objects.
 *
 * @ignore(qx.data, qx.data.IListData)
 * @ignore(qx.locale, qx.locale.LocalizedString)
 */
qx.Class.define("qx.util.Serializer",
{
  statics :
  {

    /**
     * Serializes the properties of the given qooxdoo object. To get the
     * serialization working, every property needs to have a string
     * representation because the value of the property will be concatenated to the
     * serialized string.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function?} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toUriParameter : function(object, qxSerializer, dateFormat)
    {
      var result = "";
      var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);

      for (var name in properties) {
        // ignore property groups
        if (properties[name].group != undefined) {
          continue;
        }
        var value = object["get" + qx.lang.String.firstUp(name)]();

        // handle arrays
        if (qx.lang.Type.isArray(value)) {
          var isdataArray = qx.data && qx.data.IListData &&
            qx.Class.hasInterface(value && value.constructor, qx.data.IListData);
          for (var i = 0; i < value.length; i++) {
            var valueAtI = isdataArray ? value.getItem(i) : value[i];
            result += this.__toUriParameter(name, valueAtI, qxSerializer);
          }
        } else if (qx.lang.Type.isDate(value) && dateFormat != null) {
          result += this.__toUriParameter(
            name, dateFormat.format(value), qxSerializer
          );
        } else {
          result += this.__toUriParameter(name, value, qxSerializer);
        }
      }
      return result.substring(0, result.length - 1);
    },


    /**
     * Helper method for {@link #toUriParameter}. Check for qooxdoo objects
     * and returns the serialized name value pair for the given parameter.
     *
     * @param name {String} The name of the value
     * @param value {var} The value itself
     * @param qxSerializer {Function?} The serializer for qooxdoo objects.
     * @return {String} The serialized name value pair.
     */
    __toUriParameter : function(name, value, qxSerializer)
    {

      if (value && value.$$type == "Class") {
        value = value.classname;
      }

      if (value && (value.$$type == "Interface" || value.$$type == "Mixin")) {
        value = value.name;
      }

      if (value instanceof qx.core.Object && qxSerializer != null) {
        var encValue = encodeURIComponent(qxSerializer(value));
        if (encValue === undefined) {
          var encValue = encodeURIComponent(value);
        }
      } else {
        var encValue = encodeURIComponent(value);
      }
      return encodeURIComponent(name) + "=" + encValue + "&";
    },


    /**
     * Serializes the properties of the given qooxdoo object into a native
     * object.
     *
     * @param object {qx.core.Object}
     *   Any qooxdoo object
     *
     * @param qxSerializer {Function?}
     *   Function used for serializing qooxdoo objects stored in the propertys
     *   of the object. Check for the type of classes you want to serialize
     *   and return the serialized value. In all other cases, just return
     *   nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String}
     *   The serialized object.
     */
    toNativeObject : function(object, qxSerializer, dateFormat)
    {
      var result;

      // null or undefined
      if (object == null)
      {
        return null;
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData))
      {
        result = [];
        for (var i = 0; i < object.getLength(); i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object.getItem(i), qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // other arrays
      if (qx.lang.Type.isArray(object))
      {
        result = [];
        for (var i = 0; i < object.length; i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object[i], qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return object.classname;
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return object.name;
      }

      // qooxdoo object
      if (object instanceof qx.core.Object)
      {
        if (qxSerializer != null)
        {
          var returnValue = qxSerializer(object);

          // if we have something returned, return that
          if (returnValue != undefined)
          {
            return returnValue;
          }

          // continue otherwise
        }

        result = {};

        var properties =
          qx.util.PropertyUtil.getAllProperties(object.constructor);

        for (var name in properties)
        {
          // ignore property groups
          if (properties[name].group != undefined)
          {
            continue;
          }

          var value = object["get" + qx.lang.String.firstUp(name)]();
          result[name] = qx.util.Serializer.toNativeObject(
            value, qxSerializer, dateFormat
          );
        }

        return result;
      }

      // date objects with date format
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return dateFormat.format(object);
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        return object.toString();
      }

      // JavaScript objects
      if (qx.lang.Type.isObject(object))
      {
        result = {};

        for (var key in object)
        {
          result[key] = qx.util.Serializer.toNativeObject(
            object[key], qxSerializer, dateFormat
          );
        }

        return result;
      }

      // all other stuff, including String, Date, RegExp
      return object;
    },


    /**
     * Serializes the properties of the given qooxdoo object into a json object.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function?} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toJson : function(object, qxSerializer, dateFormat) {
      var result = "";

      // null or undefined
      if (object == null) {
        return "null";
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData)) {
        result += "[";
        for (var i = 0; i < object.getLength(); i++) {
          result += qx.util.Serializer.toJson(object.getItem(i), qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // other arrays
      if (qx.lang.Type.isArray(object)) {
        result += "[";
        for (var i = 0; i < object.length; i++) {
          result += qx.util.Serializer.toJson(object[i], qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return '"' + object.classname + '"';
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return '"' + object.name + '"';
      }


      // qooxdoo object
      if (object instanceof qx.core.Object) {
        if (qxSerializer != null) {
          var returnValue = qxSerializer(object);
          // if we have something returned, ruturn that
          if (returnValue != undefined) {
            return '"' + returnValue + '"';
          }
          // continue otherwise
        }
        result += "{";
        var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);
        for (var name in properties) {
          // ignore property groups
          if (properties[name].group != undefined) {
            continue;
          }
          var value = object["get" + qx.lang.String.firstUp(name)]();
          result += '"' + name + '":' + qx.util.Serializer.toJson(value, qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        object = object.toString();
        // no return here because we want to have the string checks as well!
      }

      // date objects with formater
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return '"' + dateFormat.format(object) + '"';
      }

      // javascript objects
      if (qx.lang.Type.isObject(object)) {
        result += "{";
        for (var key in object) {
          result += '"' + key + '":' +
                    qx.util.Serializer.toJson(object[key], qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // strings
      if (qx.lang.Type.isString(object)) {
        // escape
        object = object.replace(/([\\])/g, '\\\\');
        object = object.replace(/(["])/g, '\\"');
        object = object.replace(/([\r])/g, '\\r');
        object = object.replace(/([\f])/g, '\\f');
        object = object.replace(/([\n])/g, '\\n');
        object = object.replace(/([\t])/g, '\\t');
        object = object.replace(/([\b])/g, '\\b');

        return '"' + object + '"';
      }

      // Date and RegExp
      if (qx.lang.Type.isDate(object) || qx.lang.Type.isRegExp(object)) {
        return '"' + object + '"';
      }

      // all other stuff
      return object + "";
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
     * Martin Wittemann (martinwittemann)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A page is the way to add content to a {@link TabView}. Each page gets a
 * button to switch to the page. Only one page is visible at a time.
 *
 * @childControl button {qx.ui.tabview.TabButton} tab button connected to the page
 */
qx.Class.define("qx.ui.tabview.Page",
{
  extend : qx.ui.container.Composite,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} Initial label of the tab
   * @param icon {String} Initial icon of the tab
   */
  construct : function(label, icon)
  {
    this.base(arguments);

    this._createChildControl("button");

    // init
    if (label != null) {
      this.setLabel(label);
    }

    if (icon != null) {
      this.setIcon(icon);
    }

  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired by {@link qx.ui.tabview.TabButton} if the close button is tapped.
     */
    "close" : "qx.event.type.Event"
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
      init : "tabview-page"
    },


    /** The label/caption/text of the Page's button. */
    label :
    {
      check : "String",
      init : "",
      apply : "_applyLabel"
    },


    /** Any URI String supported by qx.ui.basic.Image to display an icon in Page's button. */
    icon :
    {
      check : "String",
      init : "",
      apply : "_applyIcon",
      nullable: true
    },

    /** Indicates if the close button of a TabButton should be shown. */
    showCloseButton :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowCloseButton"
    }

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
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      barTop : 1,
      barRight : 1,
      barBottom : 1,
      barLeft : 1,
      firstTab : 1,
      lastTab : 1
    },



    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyIcon : function(value, old) {
      var btn = this.getChildControl("button");
      if (value) {
        btn.setIcon(value);
        btn._showChildControl("icon");
      } else {
        btn._excludeChildControl("icon");
      }
    },


    // property apply
    _applyLabel : function(value, old) {
      this.getChildControl("button").setLabel(value);
    },


    // overridden
    _applyEnabled: function(value, old)
    {
      this.base(arguments, value, old);

      // delegate to non-child widget button
      // since enabled is inheritable value may be null
      var btn = this.getChildControl("button");
      value == null ? btn.resetEnabled() : btn.setEnabled(value);
    },




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
        case "button":
          control = new qx.ui.tabview.TabButton;
          control.setAllowGrowX(true);
          control.setAllowGrowY(true);

          control.setUserData("page", this);
          control.addListener("close", this._onButtonClose, this);
          break;
      }

      return control || this.base(arguments, id);
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyShowCloseButton : function(value, old) {
      this.getChildControl("button").setShowCloseButton(value);
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Fires an "close" event when the close button of the TabButton of the page
     * is tapped.
     */
    _onButtonClose : function() {
      this.fireEvent("close");
    },


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the button used within this page. This method is used by
     * the TabView to access the button.
     *
     * @internal
     * @return {qx.ui.form.RadioButton} The button associated with this page.
     */
    getButton: function() {
      return this.getChildControl("button");
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

************************************************************************ */

/**
 * Each object, which should be managed by a {@link RadioGroup} have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.form.IRadioItem",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the item was checked or unchecked */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set whether the item is checked
     *
     * @param value {Boolean} whether the item should be checked
     */
    setValue : function(value) {},


    /**
     * Get whether the item is checked
     *
     * @return {Boolean} whether the item it checked
     */
    getValue : function() {},


    /**
     * Set the radiogroup, which manages this item
     *
     * @param value {qx.ui.form.RadioGroup} The radiogroup, which should
     *     manage the item.
     */
    setGroup : function(value) {
      this.assertInstance(value, qx.ui.form.RadioGroup);
    },


    /**
     * Get the radiogroup, which manages this item
     *
     * @return {qx.ui.form.RadioGroup} The radiogroup, which manages the item.
     */
    getGroup : function() {}
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
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This mixin links all methods to manage the single selection.
 *
 * The class which includes the mixin has to implements two methods:
 *
 * <ul>
 * <li><code>_getItems</code>, this method has to return a <code>Array</code>
 *    of <code>qx.ui.core.Widget</code> that should be managed from the manager.
 * </li>
 * <li><code>_isAllowEmptySelection</code>, this method has to return a
 *    <code>Boolean</code> value for allowing empty selection or not.
 * </li>
 * </ul>
 */
qx.Mixin.define("qx.ui.core.MSingleSelectionHandling",
{
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
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.core.SingleSelectionManager} the single selection manager */
    __manager : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      var selected = this.__getManager().getSelected();

      if (selected) {
        return [selected];
      } else {
        return [];
      }
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if one of the items is not a child element and if
     *    items contains more than one elements.
     */
    setSelection : function(items) {
      switch(items.length)
      {
        case 0:
          this.resetSelection();
          break;
        case 1:
          this.__getManager().setSelected(items[0]);
          break;
        default:
          throw new Error("Could only select one item, but the selection" +
            " array contains " + items.length + " items!");
      }
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      this.__getManager().resetSelected();
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item.
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if one of the items is not a child element.
     */
    isSelected : function(item) {
      return this.__getManager().isSelected(item);
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return this.__getManager().isSelectionEmpty();
    },


    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return this.__getManager().getSelectables(all);
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeSelected</code> event on single
     * selection manager.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    _onChangeSelected : function(e) {
      var newValue = e.getData();
      var oldVlaue = e.getOldData();

      newValue == null ? newValue = [] : newValue = [newValue];
      oldVlaue == null ? oldVlaue = [] : oldVlaue = [oldVlaue];

      this.fireDataEvent("changeSelection", newValue, oldVlaue);
    },

    /**
     * Return the selection manager if it is already exists, otherwise creates
     * the manager.
     *
     * @return {qx.ui.core.SingleSelectionManager} Single selection manager.
     */
    __getManager : function()
    {
      if (this.__manager == null)
      {
        var that = this;
        this.__manager = new qx.ui.core.SingleSelectionManager(
        {
          getItems : function() {
            return that._getItems();
          },

          isItemSelectable : function(item) {
            if (that._isItemSelectable) {
              return that._isItemSelectable(item);
            } else {
              return item.isVisible();
            }
          }
        });
        this.__manager.addListener("changeSelected", this._onChangeSelected, this);
      }
      this.__manager.setAllowEmptySelection(this._isAllowEmptySelection());

      return this.__manager;
    }
  },


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeObjects("__manager");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Responsible for the single selection management.
 *
 * The class manage a list of {@link qx.ui.core.Widget} which are returned from
 * {@link qx.ui.core.ISingleSelectionProvider#getItems}.
 *
 * @internal
 */
qx.Class.define("qx.ui.core.SingleSelectionManager",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * Construct the single selection manager.
   *
   * @param selectionProvider {qx.ui.core.ISingleSelectionProvider} The provider
   * for selection.
   */
  construct : function(selectionProvider) {
    this.base(arguments);

    if (qx.core.Environment.get("qx.debug")) {
      qx.core.Assert.assertInterface(selectionProvider,
        qx.ui.core.ISingleSelectionProvider,
        "Invalid selectionProvider!");
    }

    this.__selectionProvider = selectionProvider;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelected" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * If the value is <code>true</code> the manager allows an empty selection,
     * otherwise the first selectable element returned from the
     * <code>qx.ui.core.ISingleSelectionProvider</code> will be selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : true,
      apply : "__applyAllowEmptySelection"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.core.Widget} The selected widget. */
    __selected : null,

    /** @type {qx.ui.core.ISingleSelectionProvider} The provider for selection management */
    __selectionProvider : null,


    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the current selected element.
     *
     * @return {qx.ui.core.Widget | null} The current selected widget or
     *    <code>null</code> if the selection is empty.
     */
    getSelected : function() {
      return this.__selected;
    },

    /**
     * Selects the passed element.
     *
     * @param item {qx.ui.core.Widget} Element to select.
     * @throws {Error} if the element is not a child element.
     */
    setSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not select " + item +
          ", because it is not a child element!");
      }

      this.__setSelected(item);
    },

    /**
     * Reset the current selection. If {@link #allowEmptySelection} is set to
     * <code>true</code> the first element will be selected.
     */
    resetSelected : function(){
      this.__setSelected(null);
    },

    /**
     * Return <code>true</code> if the passed element is selected.
     *
     * @param item {qx.ui.core.Widget} Element to check if selected.
     * @return {Boolean} <code>true</code> if passed element is selected,
     *    <code>false</code> otherwise.
     * @throws {Error} if the element is not a child element.
     */
    isSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not check if " + item + " is selected," +
          " because it is not a child element!");
      }
      return this.__selected === item;
    },

    /**
     * Returns <code>true</code> if selection is empty.
     *
     * @return {Boolean} <code>true</code> if selection is empty,
     *    <code>false</code> otherwise.
     */
    isSelectionEmpty : function() {
      return this.__selected == null;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables : function(all)
    {
      var items = this.__selectionProvider.getItems();
      var result = [];

      for (var i = 0; i < items.length; i++)
      {
        if (this.__selectionProvider.isItemSelectable(items[i])) {
          result.push(items[i]);
        }
      }

      // in case of an user selecable list, remove the enabled items
      if (!all) {
        for (var i = result.length -1; i >= 0; i--) {
          if (!result[i].getEnabled()) {
            result.splice(i, 1);
          }
        };
      }

      return result;
    },


    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */


    // apply method
    __applyAllowEmptySelection : function(value, old)
    {
      if (!value) {
        this.__setSelected(this.__selected);
      }
    },


    /*
    ---------------------------------------------------------------------------
       HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Set selected element.
     *
     * If passes value is <code>null</code>, the selection will be reseted.
     *
     * @param item {qx.ui.core.Widget | null} element to select, or
     *    <code>null</code> to reset selection.
     */
    __setSelected : function(item) {
      var oldSelected = this.__selected;
      var newSelected = item;

      if (newSelected != null && oldSelected === newSelected) {
        return;
      }

      if (!this.isAllowEmptySelection() && newSelected == null) {
        var firstElement = this.getSelectables(true)[0];

        if (firstElement) {
          newSelected = firstElement;
        }
      }

      this.__selected = newSelected;
      this.fireDataEvent("changeSelected", newSelected, oldSelected);
    },

    /**
     * Checks if passed element is a child element.
     *
     * @param item {qx.ui.core.Widget} Element to check if child element.
     * @return {Boolean} <code>true</code> if element is child element,
     *    <code>false</code> otherwise.
     */
    __isChildElement : function(item)
    {
      var items = this.__selectionProvider.getItems();

      for (var i = 0; i < items.length; i++)
      {
        if (items[i] === item)
        {
          return true;
        }
      }
      return false;
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */
  destruct : function() {
    if (this.__selectionProvider.toHashCode) {
      this._disposeObjects("__selectionProvider");
    } else {
      this.__selectionProvider = null;
    }

    this._disposeObjects("__selected");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */
/**
 * Defines the callback for the single selection manager.
 *
 * @internal
 */
qx.Interface.define("qx.ui.core.ISingleSelectionProvider",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the elements which are part of the selection.
     *
     * @return {qx.ui.core.Widget[]} The widgets for the selection.
     */
    getItems: function() {},

    /**
     * Returns whether the given item is selectable.
     *
     * @param item {qx.ui.core.Widget} The item to be checked
     * @return {Boolean} Whether the given item is selectable
     */
    isItemSelectable : function(item) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This mixin offers the selection of the model properties.
 * It can only be included if the object including it implements the
 * {@link qx.ui.core.ISingleSelection} interface and the selectables implement
 * the {@link qx.ui.form.IModel} interface.
 */
qx.Mixin.define("qx.ui.form.MModelSelection",
{

  construct : function() {
    // create the selection array
    this.__modelSelection = new qx.data.Array();

    // listen to the changes
    this.__modelSelection.addListener("change", this.__onModelSelectionArrayChange, this);
    this.addListener("changeSelection", this.__onModelSelectionChange, this);
  },


  events :
  {
    /**
     * Pseudo event. It will never be fired because the array itself can not
     * be changed. But the event description is needed for the data binding.
     */
    changeModelSelection : "qx.event.type.Data"
  },


  members :
  {

    __modelSelection : null,
    __inSelectionChange : false,


    /**
     * Handler for the selection change of the including class e.g. SelectBox,
     * List, ...
     * It sets the new modelSelection via {@link #setModelSelection}.
     */
    __onModelSelectionChange : function() {
      if (this.__inSelectionChange) {
        return;
      }
      var data = this.getSelection();

      // create the array with the modes inside
      var modelSelection = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        // fallback if getModel is not implemented
        var model = item.getModel ? item.getModel() : null;
        if (model !== null) {
          modelSelection.push(model);
        }
      };

      // only change the selection if you are sure that its correct [BUG #3748]
      if (modelSelection.length === data.length) {
        try {
          this.setModelSelection(modelSelection);
        } catch (e) {
          throw new Error(
            "Could not set the model selection. Maybe your models are not unique? " + e
          );
        }
      }
    },


    /**
     * Listener for the change of the internal model selection data array.
     */
    __onModelSelectionArrayChange : function() {
      this.__inSelectionChange = true;
      var selectables = this.getSelectables(true);
      var itemSelection = [];

      var modelSelection = this.__modelSelection.toArray();
      for (var i = 0; i < modelSelection.length; i++) {
        var model = modelSelection[i];
        for (var j = 0; j < selectables.length; j++) {
          var selectable = selectables[j];
          // fallback if getModel is not implemented
          var selectableModel = selectable.getModel ? selectable.getModel() : null;
          if (model === selectableModel) {
            itemSelection.push(selectable);
            break;
          }
        }
      }
      this.setSelection(itemSelection);
      this.__inSelectionChange = false;

      // check if the setting has worked
      var currentSelection = this.getSelection();
      if (!qx.lang.Array.equals(currentSelection, itemSelection)) {
        // if not, set the actual selection
        this.__onModelSelectionChange();
      }
    },


    /**
     * Returns always an array of the models of the selected items. If no
     * item is selected or no model is given, the array will be empty.
     *
     * *CAREFUL!* The model selection can only work if every item item in the
     * selection providing widget has a model property!
     *
     * @return {qx.data.Array} An array of the models of the selected items.
     */
    getModelSelection : function()
    {
      return this.__modelSelection;
    },


    /**
     * Takes the given models in the array and searches for the corresponding
     * selectables. If an selectable does have that model attached, it will be
     * selected.
     *
     * *Attention:* This method can have a time complexity of O(n^2)!
     *
     * *CAREFUL!* The model selection can only work if every item item in the
     * selection providing widget has a model property!
     *
     * @param modelSelection {Array} An array of models, which should be
     *   selected.
     */
    setModelSelection : function(modelSelection)
    {
      // check for null values
      if (!modelSelection)
      {
        this.__modelSelection.removeAll();
        return;
      }

      if (qx.core.Environment.get("qx.debug")) {
        this.assertArray(modelSelection, "Please use an array as parameter.");
      }

      // add the first two parameter
      modelSelection.unshift(this.__modelSelection.getLength()); // remove index
      modelSelection.unshift(0);  // start index

      var returnArray = this.__modelSelection.splice.apply(this.__modelSelection, modelSelection);
      returnArray.dispose();
    }
  },

  destruct : function() {
    this._disposeObjects("__modelSelection");
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
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The radio group handles a collection of items from which only one item
 * can be selected. Selection another item will deselect the previously selected
 * item.
 *
 * This class is e.g. used to create radio groups or {@link qx.ui.form.RadioButton}
 * or {@link qx.ui.toolbar.RadioButton} instances.
 *
 * We also offer a widget for the same purpose which uses this class. So if
 * you like to act with a widget instead of a pure logic coupling of the
 * widgets, take a look at the {@link qx.ui.form.RadioButtonGroup} widget.
 */
qx.Class.define("qx.ui.form.RadioGroup",
{
  extend : qx.core.Object,
  implement : [
    qx.ui.core.ISingleSelection,
    qx.ui.form.IForm,
    qx.ui.form.IModelSelection
  ],
  include : [
    qx.ui.core.MSingleSelectionHandling,
    qx.ui.form.MModelSelection
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * @param varargs {qx.core.Object} A variable number of items, which are
   *     initially added to the radio group, the first item will be selected.
   */
  construct : function(varargs)
  {
    this.base(arguments);

    // create item array
    this.__items = [];

    // add listener before call add!!!
    this.addListener("changeSelection", this.__onChangeSelection, this);

    if (varargs != null) {
      this.add.apply(this, arguments);
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * Whether the radio group is enabled
     */
    enabled :
    {
      check : "Boolean",
      apply : "_applyEnabled",
      event : "changeEnabled",
      init: true
    },

    /**
     * Whether the selection should wrap around. This means that the successor of
     * the last item is the first item.
     */
    wrap :
    {
      check : "Boolean",
      init: true
    },

    /**
     * If is set to <code>true</code> the selection could be empty,
     * otherwise is always one <code>RadioButton</code> selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyAllowEmptySelection"
    },

    /**
     * Flag signaling if the group at all is valid. All children will have the
     * same state.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },

    /**
     * Flag signaling if the group is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },

    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage",
      apply : "_applyInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.form.IRadioItem[]} The items of the radio group */
    __items : null,


    /*
    ---------------------------------------------------------------------------
      UTILITIES
    ---------------------------------------------------------------------------
    */


    /**
     * Get all managed items
     *
     * @return {qx.ui.form.IRadioItem[]} All managed items.
     */
    getItems : function() {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      REGISTRY
    ---------------------------------------------------------------------------
    */


    /**
     * Add the passed items to the radio group.
     *
     * @param varargs {qx.ui.form.IRadioItem} A variable number of items to add.
     */
    add : function(varargs)
    {
      var items = this.__items;
      var item;

      for (var i=0, l=arguments.length; i<l; i++)
      {
        item = arguments[i];

        if (qx.lang.Array.contains(items, item)) {
          continue;
        }

        // Register listeners
        item.addListener("changeValue", this._onItemChangeChecked, this);

        // Push RadioButton to array
        items.push(item);

        // Inform radio button about new group
        item.setGroup(this);

        // Need to update internal value?
        if (item.getValue()) {
          this.setSelection([item]);
        }
      }

      // Select first item when only one is registered
      if (!this.isAllowEmptySelection() && items.length > 0 && !this.getSelection()[0]) {
        this.setSelection([items[0]]);
      }
    },

    /**
     * Remove an item from the radio group.
     *
     * @param item {qx.ui.form.IRadioItem} The item to remove.
     */
    remove : function(item)
    {
      var items = this.__items;
      if (qx.lang.Array.contains(items, item))
      {
        // Remove RadioButton from array
        qx.lang.Array.remove(items, item);

        // Inform radio button about new group
        if (item.getGroup() === this) {
          item.resetGroup();
        }

        // Deregister listeners
        item.removeListener("changeValue", this._onItemChangeChecked, this);

        // if the radio was checked, set internal selection to null
        if (item.getValue()) {
          this.resetSelection();
        }
      }
    },


    /**
     * Returns an array containing the group's items.
     *
     * @return {qx.ui.form.IRadioItem[]} The item array
     */
    getChildren : function()
    {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      LISTENER FOR ITEM CHANGES
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeValue</code> event of every managed item.
     *
     * @param e {qx.event.type.Data} Data event
     */
    _onItemChangeChecked : function(e)
    {
      var item = e.getTarget();
      if (item.getValue()) {
        this.setSelection([item]);
      } else if (this.getSelection()[0] == item) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */
    // property apply
    _applyInvalidMessage : function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setInvalidMessage(value);
      }
    },

    // property apply
    _applyValid: function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setValid(value);
      }
    },

    // property apply
    _applyEnabled : function(value, old)
    {
      var items = this.__items;
      if (value == null)
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].resetEnabled();
        }
      }
      else
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].setEnabled(value);
        }
      }
    },

    // property apply
    _applyAllowEmptySelection : function(value, old)
    {
      if (!value && this.isSelectionEmpty()) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION
    ---------------------------------------------------------------------------
    */


    /**
     * Select the item following the given item.
     */
    selectNext : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find next enabled item
      if (this.getWrap()) {
        index = (index + 1) % length;
      } else {
        index = Math.min(index + 1, length - 1);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index + 1) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /**
     * Select the item previous the given item.
     */
    selectPrevious : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find previous enabled item
      if (this.getWrap()) {
        index = (index - 1 + length) % length;
      } else {
        index = Math.max(index - 1, 0);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index - 1 + length) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS FOR SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the items for the selection.
     *
     * @return {qx.ui.form.IRadioItem[]} Items to select.
     */
    _getItems : function() {
      return this.getItems();
    },

    /**
     * Returns if the selection could be empty or not.
     *
     * @return {Boolean} <code>true</code> If selection could be empty,
     *    <code>false</code> otherwise.
     */
    _isAllowEmptySelection: function() {
      return this.isAllowEmptySelection();
    },


    /**
     * Returns whether the item is selectable. In opposite to the default
     * implementation (which checks for visible items) every radio button
     * which is part of the group is selected even if it is currently not visible.
     *
     * @param item {qx.ui.form.IRadioItem} The item to check if its selectable.
     * @return {Boolean} <code>true</code> if the item is part of the radio group
     *    <code>false</code> otherwise.
     */
    _isItemSelectable : function(item) {
      return this.__items.indexOf(item) != -1;
    },


    /**
     * Event handler for <code>changeSelection</code>.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    __onChangeSelection : function(e)
    {
      var value = e.getData()[0];
      var old = e.getOldData()[0];

      if (old) {
        old.setValue(false);
      }

      if (value) {
        value.setValue(true);
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeArray("__items");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Can be included for implementing {@link qx.ui.form.IModel}. It only contains
 * a nullable property named 'model' with a 'changeModel' event.
 */
qx.Mixin.define("qx.ui.form.MModelProperty",
{
  properties :
  {
    /**
     * Model property for storing additional information for the including
     * object. It can act as value property on form items for example.
     *
     * Be careful using that property as this is used for the
     * {@link qx.ui.form.MModelSelection} it has some restrictions:
     *
     * * Don't use equal models in one widget using the
     *     {@link qx.ui.form.MModelSelection}.
     *
     * * Avoid setting only some model properties if the widgets are added to
     *     a {@link qx.ui.form.MModelSelection} widge.
     *
     * Both restrictions result of the fact, that the set models are deputies
     * for their widget.
     */
    model :
    {
      nullable : true,
      event : "changeModel",
      apply : "_applyModel",
      dereference : true
    }
  },


  members :
  {
    // apply method
    _applyModel : function(value, old) {
      // Empty implementation
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object which wants to store data representative for the real item
 * should implement this interface.
 */
qx.Interface.define("qx.ui.form.IModel",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the model data changes */
    "changeModel" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set the representative data for the item.
     *
     * @param value {var} The data.
     */
    setModel : function(value) {},


    /**
     * Returns the representative data for the item
     *
     * @return {var} The data.
     */
    getModel : function() {},


    /**
     * Sets the representative data to null.
     */
    resetModel : function() {}
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

************************************************************************ */

/**
 * Radio buttons can be used in radio groups to allow to the user to select
 * exactly one item from a list. Radio groups are established by adding
 * radio buttons to a radio manager {@link qx.ui.form.RadioGroup}.
 *
 * Example:
 * <pre class="javascript">
 *   var container = new qx.ui.container.Composite(new qx.ui.layout.VBox);
 *
 *   var female = new qx.ui.form.RadioButton("female");
 *   var male = new qx.ui.form.RadioButton("male");
 *
 *   var mgr = new qx.ui.form.RadioGroup();
 *   mgr.add(female, male);
 *
 *   container.add(male);
 *   container.add(female);
 * </pre>
 */
qx.Class.define("qx.ui.form.RadioButton",
{
  extend : qx.ui.form.Button,
  include : [
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty
  ],
  implement : [
    qx.ui.form.IRadioItem,
    qx.ui.form.IForm,
    qx.ui.form.IBooleanForm,
    qx.ui.form.IModel
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String?null} An optional label for the radio button.
   */
  construct : function(label)
  {
    if (qx.core.Environment.get("qx.debug")) {
      this.assertArgumentsCount(arguments, 0, 1);
    }

    this.base(arguments, label);

    // Add listeners
    this.addListener("execute", this._onExecute);
    this.addListener("keypress", this._onKeyPress);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The assigned qx.ui.form.RadioGroup which handles the switching between registered buttons */
    group :
    {
      check  : "qx.ui.form.RadioGroup",
      nullable : true,
      apply : "_applyGroup"
    },

    /** The value of the widget. True, if the widget is checked. */
    value :
    {
      check : "Boolean",
      nullable : true,
      event : "changeValue",
      apply : "_applyValue",
      init: false
    },

    // overridden
    appearance :
    {
      refine : true,
      init : "radiobutton"
    },

    // overridden
    allowGrowX :
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
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      checked : true,
      focused : true,
      invalid : true,
      hovered : true
    },

    // overridden (from MExecutable to keet the icon out of the binding)
    /**
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "toolTipText",
      "value",
      "menu"
    ],

    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyValue : function(value, old)
    {
      value ?
        this.addState("checked") :
        this.removeState("checked");
    },


    /** The assigned {@link qx.ui.form.RadioGroup} which handles the switching between registered buttons */
    _applyGroup : function(value, old)
    {
      if (old) {
        old.remove(this);
      }

      if (value) {
        value.add(this);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT-HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for the "execute" event.
     *
     * Sets the property "checked" to true.
     *
     * @param e {qx.event.type.Event} execute event
     */
    _onExecute : function(e) {
      var grp = this.getGroup();
      if (grp && grp.getAllowEmptySelection()) {
        this.toggleValue();
      } else {
        this.setValue(true);
      }
    },


    /**
     * Event listener for the "keyPress" event.
     *
     * Selects the previous RadioButton when pressing "Left" or "Up" and
     * Selects the next RadioButton when pressing "Right" and "Down"
     *
     * @param e {qx.event.type.KeySequence} KeyPress event
     */
    _onKeyPress : function(e)
    {

      var grp = this.getGroup();
      if (!grp) {
        return;
      }

      switch(e.getKeyIdentifier())
      {
        case "Left":
        case "Up":
          grp.selectPrevious();
          break;

        case "Right":
        case "Down":
          grp.selectNext();
          break;
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A TabButton is the tapable part sitting on the {@link qx.ui.tabview.Page}.
 * By tapping on the TabButton the user can set a Page active.
 *
 * @childControl label {qx.ui.basic.Label} label of the tab button
 * @childControl icon {qx.ui.basic.Image} icon of the tab button
 * @childControl close-button {qx.ui.form.Button} close button of the tab button
 */
qx.Class.define("qx.ui.tabview.TabButton",
{
  extend : qx.ui.form.RadioButton,
  implement : qx.ui.form.IRadioItem,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    var layout = new qx.ui.layout.Grid(2, 0);
    layout.setRowAlign(0, "left", "middle");
    layout.setColumnAlign(0, "right", "middle");

    this._getLayout().dispose();
    this._setLayout(layout);

    this.initShowCloseButton();
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired by {@link qx.ui.tabview.Page} if the close button is tapped.
     *
     * Event data: The tab button.
     */
    "close" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {

    /** Indicates if the close button of a TabButton should be shown. */
    showCloseButton :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowCloseButton"
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
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      checked : true
    },

    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    _applyIconPosition : function(value, old)
    {

      var children = {
        icon : this.getChildControl("icon"),
        label : this.getChildControl("label"),
        closeButton : this.getShowCloseButton() ? this.getChildControl("close-button") : null
      };

      // Remove all children before adding them again
      for (var child in children)
      {
        if (children[child]) {
          this._remove(children[child]);
        }
      }

      switch (value)
      {
        case "top":
          this._add(children.label, {row: 3, column: 2});
          this._add(children.icon, {row: 1, column: 2});
          if (children.closeButton) {
            this._add(children.closeButton, {row: 0, column: 4});
          }
          break;

        case "bottom":
          this._add(children.label, {row: 1, column: 2});
          this._add(children.icon, {row: 3, column: 2});
          if (children.closeButton) {
            this._add(children.closeButton, {row: 0, column: 4});
          }
          break;

        case "left":
          this._add(children.label, {row: 0, column: 2});
          this._add(children.icon, {row: 0, column: 0});
          if (children.closeButton) {
            this._add(children.closeButton, {row: 0, column: 4});
          }
          break;

        case "right":
          this._add(children.label, {row: 0, column: 0});
          this._add(children.icon, {row: 0, column: 2});
          if (children.closeButton) {
            this._add(children.closeButton, {row: 0, column: 4});
          }
          break;
      }

    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id) {
        case "label":
          var control = new qx.ui.basic.Label(this.getLabel());
          control.setAnonymous(true);
          this._add(control, {row: 0, column: 2});
          this._getLayout().setColumnFlex(2, 1);
          break;

        case "icon":
          control = new qx.ui.basic.Image(this.getIcon());
          control.setAnonymous(true);
          this._add(control, {row: 0, column: 0});
          break;

        case "close-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.setKeepActive(true);
          control.addListener("tap", this._onCloseButtonTap, this);
          this._add(control, {row: 0, column: 4});

          if (!this.getShowCloseButton()) {
            control.exclude();
          }

          break;
      }

      return control || this.base(arguments, id);
    },

    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */


    /**
     * Fires a "close" event when the close button is tapped.
     */
    _onCloseButtonTap : function() {
      this.fireDataEvent("close", this);
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyShowCloseButton : function(value, old)
    {
      if (value) {
        this._showChildControl("close-button");
      } else {
        this._excludeChildControl("close-button");
      }
    },

    // property apply
    _applyCenter : function(value)
    {
      var layout = this._getLayout();

      if (value) {
        layout.setColumnAlign(2, "center", "middle");
      } else {
        layout.setColumnAlign(2, "left", "middle");
      }

    }

  }
});
