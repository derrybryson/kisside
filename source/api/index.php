<?php
require_once("error.php");
require_once("config.php");

error_log("=============================================");
try
{
  spl_autoload_register(function ($class_name) {
    include $class_name . '.php';
  });

  require_once("db.php");

  error_log("method = {$_SERVER['REQUEST_METHOD']}");
  $request = file_get_contents('php://input');
  error_log("request = " . print_r($request, true));
  $request = json_decode($request, true);
  error_log("request = " . print_r($request, true));

  if($request && array_key_exists('service', $request) && $request['service'] &&
     array_key_exists('method', $request) && $request['method'] &&
     array_key_exists('params', $request) && $request['params'] &&
     array_key_exists('id', $request) && $request['id'] != null)
  {
    $classname = $request['service'] . "Handler";
    $handler = new $classname();
    $resp = $handler->handler($request);
    error_log("resp = " . print_r($resp, true));
    print(json_encode($resp)); 
  }
  else
  {
    error_log("should be 500 error");
//    header('HTTP/1.1 500 Internal Server Error');
  }
}
catch(Exception $e)
{
  error_log($e->getMessage() . ": " . $e->getTraceAsString());
  header('HTTP/1.1 500 Internal Server Error');
}

?>