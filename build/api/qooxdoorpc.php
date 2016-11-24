<?php
 
class QooxDooRPCHandler
{
  // error origins
  const ORIGIN_SERVER = 1;
  const ORIGIN_SERVICE = 2;

  // error codes for origin server
  const ERR_ILLEGAL_SERVICE = 1;
  const ERR_SERVICE_NOT_FOUND = 2;
  const ERR_CLASS_NOT_FOUND = 3;
  const ERR_METHOD_NOT_FOUND = 4;
  const ERR_PARAMETER_MISMATCH = 5;
  const ERR_PERMISSION_DENIED = 6;

  // error codes for origin service (taken from JSON RPC2 spec)
  const ERR_PARSE_ERROR = -32700;
  const ERR_INVALID_REQ = -32600;
  const ERR_INVALID_METHOD = -32601;
  const ERR_INVALID_PARAMS = -32602;
  const ERR_INTERNAL_ERROR = - 32603;

  public function __construct()
  {
  }

  public function __destruct()
  {
  }

  public static function trimParams($params)
  {
    foreach($params as $param => $value)
      if(is_string($value))
        $params[$param] = trim($value);
  }

  public static function newError($code = -1, $message = "", $data = null, $origin = self::ORIGIN_SERVICE)
  {
    return array("origin" => $origin, "code" => $code, "message" => $message, "data" => json_encode($data));
  }

  public static function newResp($result = null, $error = null, $id = null)
  {
    $resp = array("jsonrpc" => "2.0", "id" => $id);
    if($result !== null)
      $resp["result"] = $result;
    if($error !== null)
      $resp["error"] = $error;

    return $resp;
  }

  public static function checkReq($req)
  {
//    if(!array_key_exists("jsonrpc", $req) || $req["jsonrpc"] != "2.0")
//      return false;
    if(!array_key_exists("method", $req) || $req["method"] == null)
      return false;
    if(!array_key_exists("id", $req) || $req["id"] == null)
      return false;

    return true;
  }

  public static function checkParams($params, $requiredFields)
  {
    error_log("params = " . print_r($params, true));
    foreach($requiredFields as $field)
      if(!array_key_exists($field, $params))
      {
        error_log("request missing '$field'");
        return false;
      }
    return true;
  }

  public function newParamErrorResp($req)
  {
    return $this->newResp(null, $this->newError(self::ERR_PARAMETER_MISMATCH, "Invalid JSON-RPC2 Params", null, self::ORIGIN_SERVER), $req["id"]);
  }

  protected function logReq($method, $req, $resp, $timeElapsed)
  {
  }

  protected function reportError($req, $msg, $stackTrace)
  {
  }

  protected function handleReq($req)
  {
    $start = microtime(true);

    if(!$this->checkReq($req))
      return $this->newResp(null, $this->newError(self::ERR_ILLEGAL_SERVICE, "Invalid JSON-RPC2 Request", null, self::ORIGIN_SERVER), $req["id"]);
    if(!method_exists($this, "method_" . $req["method"]))
      return $this->newResp(null, $this->newError(self::ERR_METHOD_NOT_FOUND, "Method not found '{$req["method"]}'", null, self::ORIGIN_SERVER), $req["id"]);
    try
    {
      $methodname = "method_" . $req["method"];
      $resp = $this->$methodname($req);
      $elapsed = microtime(true) - $start;
      $this->logReq($req["method"], $req, $resp, $elapsed);
      return $resp;
    }
    catch(Exception $e)
    {
      error_log($e->getMessage() . ": " . $e->getTraceAsString());
      $this->reportError($req, $e->getMessage(), $e->getTraceAsString());
      return $this->newResp(null, $this->newError(self::ERR_INTERNAL_ERROR, $e->getMessage(), $e), $req["id"]);
    }
  }

  public function handler($req)
  {
    try
    {
      if(array_key_exists(0, $req))
      {
        $resp = array();
        foreach($req as $r)
          $resp[] = $this->handleReq($r);
        return $resp;
      }
      else
        return $this->handleReq($req);
    }
    catch(Exception $e)
    {
      error_log($e->getMessage() . ": " . $e->getTraceAsString());
      $this->reportError($req, $e->getMessage(), $e->getTraceAsString());
      return $this->newResp(null, $this->newError($e->getMessage(), $e), $req["id"]);
    }
  }
}

?>