<?php
require_once("qooxdoorpc.php");
require_once("auth.php");

class KISSHandler extends QooxDooRPCHandler
{
  protected $user = null;
  protected $auth = null;

  protected function checkUserAuth($authToken)
  {
    $this->user = null;
    $this->auth = authVerify($authToken);
    error_log("this->auth = " . print_r($this->auth, true));
    if($this->auth)
      $this->user = userGetByID($this->auth["userid"]);
    error_log("this->user = " . print_r($this->user, true));
    return $this->user;
  }

  protected function logReq($method, $req, $resp, $elapsed)
  {
    error_log("Method call: $method, req = " . print_r($req, true). ", resp = " . print_r($resp, true) . ", elapsed = $elapsed");
  }
}

?>