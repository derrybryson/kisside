<?php
require_once("kisshandler.php");
require_once("user.php");
require_once("auth.php");

class userHandler extends KISSHandler
{
  const ERR_NOT_AUTHORIZED = 1000;
  const ERR_INVALID_USER = 1001;
  const ERR_NOT_SIGNED_IN = 1002;

  public function method_signin($req)
  {
    $params = $req["params"][0];
    if(!$this->checkParams($params, array("username", "password")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    $user = userVerify($params["username"], $params["password"]);
    if($user)
    {
      error_log("user = " . print_r($user, true));
      $authToken = authAdd($user);
      return $this->newResp(array("authtoken" => $authToken, "user" => $user), null, $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(userHandler::ERR_INVALID_USER, "Invalid username or password"), $req["id"]);
  }

  public function method_signout($req)
  {
    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    authRem($params["authtoken"]);
    return $this->newResp(true, null, $req["id"]);
  }

  public function method_issignedin($req)
  {
    $params = $req["params"][0];
    error_log("params = " . print_r($params, true));
    if(!$this->checkParams($params, array("authtoken")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    $user = $this->checkUserAuth($params["authtoken"]);
    return $this->newResp($user ? $user : false, null, $req["id"]);
  }

  public function method_setpassword($req)
  {
    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "username", "password")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if($this->user["username"] == $params["username"] || $this->user["admin"])
      {
        $user = userGet($params["username"]);
        $update = array("password" => $params["password"]);
        userUpdate($user["userid"], $update);
        return $this->newResp(true, null, $req["id"]);
      }
      else
        return $this->newResp(null, $this->newError(userHandler::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(userHandler::ERR_NOT_SIGNED_IN, "Not authorized"), $req["id"]);
  }

  public function method_update($req)
  {
    $params = $req["params"][0];
    if(!$this->checkParams($params, array("authtoken", "user")))
      return $this->newParamErrorResp($req);
    $this->trimParams($params);
    if($this->checkUserAuth($params["authtoken"]))
    {
      if($this->user["username"] == $params["user"]["username"] || $this->user["admin"])
      {
        if(array_key_exists("password", $params["user"]))
          unset($params["user"]["password"]);
        userUpdate($params["user"]["userid"], $params["user"]);
        return $this->newResp(true, null, $req["id"]);
      }
      else
        return $this->newResp(null, $this->newError(userHandler::ERR_NOT_AUTHORIZED, "Not authorized"), $req["id"]);
    }
    else
      return $this->newResp(null, $this->newError(userHandler::ERR_NOT_SIGNED_IN, "Not authorized"), $req["id"]);
  }
} 

?>