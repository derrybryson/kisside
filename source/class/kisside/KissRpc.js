/**
 * Source code editor.
 *
 * @asset(kisside/*)
 */
qx.Class.define("kisside.KissRpc",
{
  extend: qx.core.Object,

  statics :
  {
    // origins
    ORIGIN_SERVER : 1,
    ORIGIN_SERVICE : 2,

    // error codes for origin server
    ERR_ILLEGAL_SERVICE : 1,
    ERR_SERVICE_NOT_FOUND : 2,
    ERR_CLASS_NOT_FOUND : 3,
    ERR_METHOD_NOT_FOUND : 4,
    ERR_PARAMETER_MISMATCH : 5,
    ERR_PERMISSION_DENIED : 6,

    // error codes for origin service (taken from JSON RPC2 spec)
    ERR_PARSE_ERROR : -32700,
    ERR_INVALID_REQ : -32600,
    ERR_INVALID_METHOD : -32601,
    ERR_INVALID_PARAMS : -32602,
    ERR_INTERNAL_ERROR : -32603
  },

  construct : function(app, url, service)
  {
    this.base(arguments);
    this.__app = app;
    this.__rpc = new qx.io.remote.Rpc(url, service);  
  },

  destruct : function()
  {
    this.__app = null;
    this.__rpc = null;
  },

  members :
  {
    __app : null,
    __rpc : null,

    __onCall : function(result, exc, callback, method, params)
    {
      if(callback)
        callback(result, exc);
    },

    __call : function(callback, method, params)
    {
      var self = this;
      this.__rpc.callAsync(function(result, exc) { self.__onCall(result, exc, callback, method, params); }, method, params);
    }
  }
});
