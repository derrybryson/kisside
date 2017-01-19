<?php
if (php_sapi_name() === 'cli') 
{
  require_once("error.php");
  require_once("config.php");

  require_once("db.php");
  require_once("user.php");

  $user = array("username" => $argv[1], "password" => $argv[2], "admin" => 1);
  userAdd($user);
}
?>