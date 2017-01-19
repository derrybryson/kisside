/**
 * Source code editor.
 *
 * @asset(kisside/*)
 */
qx.Class.define("kisside.UserRpc",
{
  extend: kisside.KissRpc,

  statics :
  {
    ERR_NOT_AUTHORIZED : 1000,
    ERR_INVALID_USER : 1001,
    ERR_NOT_SIGNED_IN : 1002
  },

  construct : function(app)
  {
    this.base(arguments, app, "api/index.php", "user");
    console.log("userRpc constructor, app = " + app + ", this._app = " + this._app);
  },

  destruct : function()
  {
  },

  members :
  {
    isSignedIn : function(callback, context)
    {
      window.signedinapp = this._app;
      this._call(callback, "issignedin", { "authtoken" : this._app.getAuthToken() }, context);
    },

    signIn : function(username, password, callback, context)
    {
      this._call(callback, "signin", { "username" : username, "password" : password }, context);
    },
  
    signOut : function(callback, context)
    {
      this._call(callback, "signout", {}, context);
    },

    setPassword : function(username, password, callback, context)
    {
      this._call(callback, "setpassword", { "authtoken" : this._app.getAuthToken(), "username" : username, "password" : password }, context);
    },
  
    update : function(user, callback, context)
    {
      this._call(callback, "update", { "authtoken" : this._app.getAuthToken(), "user" : user }, context);
    },
    
    add : function(user, callback, context)
    {
      this._call(callback, "add", { "authtoken" : this._app.getAuthToken(), "user" : user }, context);
    },
    
    remove : function(username, callback, context)
    {
      this._call(callback, "remove", { "authtoken" : this._app.getAuthToken(), "username" : username }, context);
    },
    
    getByID : function(userid, callback, context)
    {
      this._call(callback, "get_by_id", { "authtoken" : this._app.getAuthToken(), "userid" : userid }, context);
    },
    
    getByUsername : function(username, callback, context)
    {
      this._call(callback, "get_by_username", { "authtoken" : this._app.getAuthToken(), "username" : username }, context);
    },
    
    getAll : function(callback, context)
    {
      this._call(callback, "get_all", { "authtoken" : this._app.getAuthToken() }, context);
    }
  }
});
