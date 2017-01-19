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
    ERR_FILE_EXISTS : 3001,
    ERR_FOLDER_EXISTS : 3002,
    ERR_FILE_EXISTS_MOD : 3003,
    ERR_NO_FILE : 3004,
    ERR_NO_FOLDER : 3005,
    ERR_SPECIAL_FILE : 3006,
    
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
    S_IXOTH : 01,        // others have execute permission
  
    // write flags
    WRITE_FLAG_OVERWRITE : 1,       // overwrite existing file
    WRITE_FLAG_OVERWRITE_MOD : 2    // overwrite file existing file 
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
    stat : function(filename, callback, context)
    {
      this._call(callback, "stat", { "authtoken" : this._app.getAuthToken(), "filename" : filename }, context);
    },
    
    listdir : function(basedir, path, recurse, callback, context)
    {
      this._call(callback, "listdir", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path, "recurse" : recurse }, context);
    },
    
    mkdir : function(basedir, path, callback, context)
    {
      this._call(callback, "mkdir", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path }, context);
    },
    
    rmdir : function(basedir, path, callback, context)
    {
      this._call(callback, "rmdir", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path }, context);
    },
    
    rename : function(basedir, oldname, newname, callback, context)
    {
      this._call(callback, "rename", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "oldname" : oldname, "newname" : newname }, context);
    },
    
    unlink : function(basedir, path, callback, context)
    {
      this._call(callback, "unlink", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path }, context);
    },
    
    read : function(basedir, path, callback, context)
    {
      this._call(callback, "read", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path }, context);
    },
    
    write : function(basedir, path, contents, mtime, flags, callback, context)
    {
      this._call(callback, "write", { "authtoken" : this._app.getAuthToken(), "basedir" : basedir, "path" : path, "contents" : contents, "mtime" : mtime, "flags" : flags }, context);
    },
    
    copy : function(srcbasedir, srcpath, destbasedir, destpath, flags, callback, context)
    {
      this._call(callback, "copy", { "authtoken" : this._app.getAuthToken(), "srcbasedir" : srcbasedir, "srcpath" : srcpath, "destbasedir" : destbasedir, "destpath" : destpath, "flags" : flags }, context);
    }
  }
});
