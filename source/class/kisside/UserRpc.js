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
    isSignedIn : function(callback)
    {
      this.__call(callback, "issignedin", { "authtoken" : this.__app.getAuthToken() });
    },

    signIn : function(username, password, callback)
    {
      this.__call(callback, "signin", { "username" : username, "password" : password });
    },
  
    signOut : function(callback)
    {
      this.__call(callback, "signout", {});
    },

    setPassword : function(username, password, callback)
    {
      this.__call(callback, "setpassword", { "authtoken" : this.__app.getAuthToken(), "username" : username, "password" : password });
    },
  
    update : function(user, callback)
    {
      this.__call(callback, "update", { "authtoken" : this.__app.getAuthToken(), "user" : user });
    }
  }
});
