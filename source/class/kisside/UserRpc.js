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
  },

  destruct : function()
  {
  },

  members :
  {
    isSignedIn : function(callback, context)
    {
      this.__call(callback, "issignedin", { "authtoken" : this.__app.getAuthToken() }, context);
    },

    signIn : function(username, password, callback, context)
    {
      this.__call(callback, "signin", { "username" : username, "password" : password }, context);
    },
  
    signOut : function(callback, context)
    {
      this.__call(callback, "signout", {}, context);
    },

    setPassword : function(username, password, callback, context)
    {
      this.__call(callback, "setpassword", { "authtoken" : this.__app.getAuthToken(), "username" : username, "password" : password }, context);
    },
  
    update : function(user, callback, context)
    {
      this.__call(callback, "update", { "authtoken" : this.__app.getAuthToken(), "user" : user }, context);
    }
  }
});
