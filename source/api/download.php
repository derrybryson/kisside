<?php
require_once("error.php");
require_once("config.php");

spl_autoload_register(function ($class_name) {
  include $class_name . '.php';
});

require_once("db.php");
require_once("auth.php");

function getReqValue($name, $def = "")
{
  if(array_key_exists($name, $_REQUEST))
    return $_REQUEST[$name];
  return $def;
}

$authtoken = getReqValue("authtoken");
$basedir = getReqValue("basedir");
$path = getReqValue("path");

$auth = authVerify($authtoken);
//error_log("auth = " . print_r($auth, true));
if(!$auth)
  header('HTTP/1.1 401 Not Authorized');
else
{
  $fullpath = $BASE_DIRS[$basedir] . $path;
  error_log("fullpath = $fullpath");
  if(file_exists($fullpath)) 
  {
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($path) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($fullpath));
    readfile($fullpath);
    exit;
  }
  else
    header('HTTP/1.1 404 Not Found');
}
?>