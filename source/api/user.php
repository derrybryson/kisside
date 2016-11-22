<?php

function userGet($username)
{
  global $db;
  $user = null;
  try
  {
    $db->beginTransaction();
    $result = $db->query("select * from users where username=" . $db->quote($username));
    if($result)
      $user = $result->fetch();
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $user;
}

function userGetByID($userid)
{
  global $db;
  $user = null;
  try
  {
    $db->beginTransaction();
    $result = $db->query("select * from users where userid=" . $db->quote($userid));
    if($result)
      $user = $result->fetch();
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $user;
}

function userAdd($user)
{
  global $db;
  $id = -1;
  try
  {
    $db->beginTransaction();
    $result = $conn->query("insert into users (username, password, admin) values (" . $db->quote($user["username"]) . ", " . $db->quote(password_hash($user["password"])) . ", " . $db->quote($user["admin"]) . ")");
    if($result)
      $id = $db->lastInsertId();
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $id;
}

function userUpdate($userid, $update)
{
  global $db;
  $retval = false;
  try
  {
    $set = "";
    foreach($update as $field => $value)
    {
      if($field == "password")
        $value = password_hash($value, PASSWORD_DEFAULT);
      $set .=  ($set == "" ? "" : ", ") . $field . "=" . $db->quote($value);
    }
    $db->beginTransaction();
    $result = $db->query("update users set $set where userid=" . $db->quote($userid));
    if($result)
      $retval = true;
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $retval;
}

function userRem($username)
{
  global $db;
  $retval = false;
  try
  {
    $db->beginTransaction();
    $result = $db->query("delete from users where username=" . $db->quote($username));
    if($result)
      $retval = true;
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $retval;
}

function userVerify($username, $password)
{
  $user = userGet($username);
  return ($user && password_verify($password, $user["password"])) ? $user : false;
}

?>