/**
 * Source code editor.
 *
 * @asset(kisside/*)
 */
qx.Class.define("kisside.FSRpc",
{
  extend: kisside.KissRpc,

  statics :
  {
    // error codes
    ERR_INVALID_BASEDIR : 3000,
    
    // stat mode flags
    S_IFMT : 0170000,   // bit mask for the file type bit fields
    S_IFSOCK : 0140000, // socket
    S_IFLNK : 0120000,  // symbolic link
    S_IFREG : 0100000,  // regular file
    S_IFBLK : 060000,   // block device
    S_IFDIR : 040000,   // directory
    S_IFCHR : 020000,   // character device
    S_IFIFO : 010000,   // FIFO
    S_ISUID : 04000,    // set-user-ID bit
    S_ISGID : 02000,    // set-group-ID bit (see below)
    S_ISVTX : 01000,    // sticky bit (see below)
    S_IRWXU : 0700,     // mask for file owner permissions
    S_IRUSR : 0400,     // owner has read permission
    S_IWUSR : 0200,     // owner has write permission
    S_IXUSR : 0100,     // owner has execute permission
    S_IRWXG : 070,      // mask for group permissions
    S_IRGRP : 040,      // group has read permission
    S_IWGRP : 020,      // group has write permission
    S_IXGRP : 010,      // group has execute permission
    S_IRWXO : 07,       // mask for permissions for others (not in group)
    S_IROTH : 04,       // others have read permission
    S_IWOTH : 02,       // others have write permission
    S_IXOTH : 01        // others have execute permission
  },

  construct : function(app)
  {
    this.base(arguments, app, "api/index.php", "fs");
  },

  destruct : function()
  {
  },

  members :
  {
    stat : function(filename, callback)
    {
      this.__call(callback, "stat", { "authtoken" : this.__app.getAuthToken(), "filename" : filename });
    },
    
    listdir : function(basedir, path, recurse, callback)
    {
      this.__call(callback, "listdir", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path, "recurse" : recurse });
    },
    
    mkdir : function(basedir, path, callback)
    {
      this.__call(callback, "mkdir", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path });
    },
    
    rmdir : function(basedir, path, callback)
    {
      this.__call(callback, "rmdir", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path });
    },
    
    rename : function(basedir, oldname, newname, callback)
    {
      this.__call(callback, "rename", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "oldname" : oldname, "newname" : newname });
    },
    
    unlink : function(basedir, path, callback)
    {
      this.__call(callback, "rename", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path });
    },
    
    read : function(basedir, path, callback)
    {
      this.__call(callback, "read", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path });
    },
    
    write : function(basedir, path, contents, callback)
    {
      this.__call(callback, "read", { "authtoken" : this.__app.getAuthToken(), "basedir" : basedir, "path" : path, "contents" : contents });
    }
  }
});
