<?php
require_once("kisshandler.php");
require_once("user.php");
require_once("auth.php");

class fsHandler extends kisshandler
{
  const ERR_INVALID_BASEDIR = 3000;

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
        return $this->newResp(stat($params["filename"], null, $req["id"]));
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
      foreach($entries as $entry)
      {
        if($entry == "." || $entry == "..")
          continue;
        $direntry = array("name" => $entry, "stat" => stat("$path/$entry"), "entries" => null);
        if(is_dir("$path/$entry") && $recurse)
          $direntry["entries"] = $this->scanDir("$path/$entry", true);
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
    if(!$params["basedir"] == null || !$params["path"] || !$this->validPath($params["path"]))
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
    if(!$params["basedir"] == null || !$params["path"] || !$this->validPath($params["path"]) || $params["contents"] == null)
      return $this->newParamErrorResp($req);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if(array_key_exists($params["basedir"], $BASE_DIRS))
      {
        $tmpname = tempnam($BASE_DIRS[$params["basedir"]]);
        $result = null;
        if(file_put_contents($tmpname, $params["contents"]))
        {
          if(rename($tmpname, $BASE_DIRS[$params["basedir"]] . $params["path"]))
            $result = stat($BASE_DIRS[$params["basedir"]] . $params["path"]);
        }
        if(!$result)
        {
          unlink($tmpname);
          return $this->newResp(null, $this->newError(JSONRPC2Handler::ERR_INTERNAL_ERROR, "Unknown error"), $req["id"]);
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