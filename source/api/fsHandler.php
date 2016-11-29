<?php
require_once("kisshandler.php");
require_once("user.php");
require_once("auth.php");

class fsHandler extends kisshandler
{
  // error codes
  const ERR_INVALID_BASEDIR = 3000;

  // stat mode flags
  const S_IFMT = 0170000;   // bit mask for the file type bit fields
  const S_IFSOCK = 0140000; // socket
  const S_IFLNK = 0120000;  // symbolic link
  const S_IFREG = 0100000;  // regular file
  const S_IFBLK = 060000;   // block device
  const S_IFDIR = 040000;   // directory
  const S_IFCHR = 020000;   // character device
  const S_IFIFO = 010000;   // FIFO
  const S_ISUID = 04000;    // set-user-ID bit
  const S_ISGID = 02000;    // set-group-ID bit (see below)
  const S_ISVTX = 01000;    // sticky bit (see below)
  const S_IRWXU = 0700;     // mask for file owner permissions
  const S_IRUSR = 0400;     // owner has read permission
  const S_IWUSR = 0200;     // owner has write permission
  const S_IXUSR = 0100;     // owner has execute permission
  const S_IRWXG = 070;      // mask for group permissions
  const S_IRGRP = 040;      // group has read permission
  const S_IWGRP = 020;      // group has write permission
  const S_IXGRP = 010;      // group has execute permission
  const S_IRWXO = 07;       // mask for permissions for others (not in group)
  const S_IROTH = 04;       // others have read permission
  const S_IWOTH = 02;       // others have write permission
  const S_IXOTH = 01;       // others have execute permission
  
  // write flags
  const WRITE_FLAG_OVERWRITE = 1;       // overwrite existing file
  const WRITE_FLAG_OVERWRITE_MOD = 2;   // overwrite file existing file 

  protected function validPath($path)
  {
    return strlen($path) == 0 || ($path[0] != '.' && $path[0] != '/');
  }

  public function method_stat($req)
  {
    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "filename")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$req["basedir"] == null || !$req["path"])
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp(stat($params["filename"]), null, $req["id"]));
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  protected function scanDir($path, $recurse)
  {
    $dir = array();
    $entries = scandir($path);
    if($entries)
    {
      // do directories 
      foreach($entries as $entry)
      {
        if($entry == "." || $entry == "..")
          continue;
        if(!is_dir("$path/$entry"))
          continue;
        try
        {
          $stat = stat("$path/$entry");
        }
        catch(Exception $e)
        {
          continue;
        }
        $direntry = array("name" => $entry, "stat" => $stat, "entries" => null);
        if($recurse)
          $direntry["entries"] = $this->scanDir("$path/$entry", true);
        $dir[] = $direntry;
      }
      
      // now do files
      foreach($entries as $entry)
      {
        if($entry == "." || $entry == "..")
          continue;
        if(!is_file("$path/$entry"))
          continue;
        try
        {
          $stat = stat("$path/$entry");
        }
        catch(Exception $e)
        {
          continue;
        }
        if(!($stat["mode"] & (self::S_IFREG | self::S_IFDIR)))
          continue;
        $direntry = array("name" => $entry, "stat" => $stat, "entries" => null);
        $dir[] = $direntry;
      }
      return $dir;
    }
    else
      return null;
  }

  public function method_listdir($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path", "recurse")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$this->validPath($params["path"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if($params["basedir"] == "")
      {
        $dir = array();
        foreach($BASE_DIRS as $name => $path)
        {
          if($params["recurse"])
            $dir[] = array("name" => $name, "stat" => stat($BASE_DIRS[$name]), "entries" => $this->scanDir($path, true));
          else
            $dir[] = array("name" => $name, "stat" => stat($BASE_DIRS[$name]), "entries" => null);
        } 
        return $this->newResp($dir, null, $req["id"]);
      }
      else if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp($this->scanDir($BASE_DIRS[$params["basedir"]] . $params["path"], $params["recurse"]), null, $req["id"]);
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_mkdir($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$params["basedir"] || !$params["path"] || !$this->validPath($params["path"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp(mkdir($BASE_DIRS[$params["basedir"]] . $params["path"]), null, $params["id"]);
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_rmdir($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$req["basedir"] || !$req["path"] || !$this->validPath($req["path"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp(rmdir($BASE_DIRS[$params["basedir"]] . $params["path"]), null, $req["id"]);
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_rename($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "oldpath", "newpath")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$params["basedir"] == null || !$params["oldpath"] || !$params["newpath"] || !$this->validPath($params["oldpath"]) || !$this->validPath($params["newpath"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp(rename($BASE_DIRS[$params["basedir"]] . $params["oldpath"], $BASE_DIRS[$params["basedir"]] . $params["newpath"]), null, $req["id"]);
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_unlink($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if(!$params["basedir"] == null || !$params["path"] || !$this->validPath($params["path"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
        return $this->newResp(unlink($BASE_DIRS[$params["basedir"]] . $params["path"]), null, $req["id"]);
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_read($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if($params["basedir"] == null || !$params["path"] || !$this->validPath($params["path"]))
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
      {
        $result = array("contents" => file_get_contents($BASE_DIRS[$params["basedir"]] . $params["path"]), 
                        "stat" => stat($BASE_DIRS[$params["basedir"]] . $params["path"]));
        return $this->newResp($result, null, $req["id"]);
      }
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }

  public function method_write($req)
  {
    global $BASE_DIRS;

    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "basedir", "path", "contents")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if($params["basedir"] == null || !$params["path"] || !$this->validPath($params["path"]) || $params["contents"] === null)
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
      {
        error_log("temp path = " . $BASE_DIRS[$params["basedir"]] . dirname($params["path"]) . ", contents = " . print_r($params["contents"], true));
        $tmpname = tempnam($BASE_DIRS[$params["basedir"]] . dirname($params["path"]), "kisside");
        $result = null;
//        if(file_put_contents($tmpname, $params["contents"]))
        if($fp = fopen($tmpname, "w"))
        {
          if($params["contents"] != "")
            fwrite($fp, $params["contents"]);
          fclose($fp);
          chmod($tmpname, DEF_FILE_MODE);
          if(rename($tmpname, $BASE_DIRS[$params["basedir"]] . $params["path"]))
            $result = stat($BASE_DIRS[$params["basedir"]] . $params["path"]);
        }
        if(!$result)
        {
          unlink($tmpname);
          return $this->newResp(null, $this->newError(QooxDooRPCHandler::ERR_INTERNAL_ERROR, "Unknown error"), $req["id"]);
        }
        else
          return $this->newResp($result, null, $req["id"]);
      }
      else
        return $this->newResp(null, $this->newError(fsHandler::ERR_INVALID_BASEDIR, "Invalid basedir '{$params["basedir"]}'"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(KISSService::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
  }
}

?>