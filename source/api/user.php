<?php

function _userEncodeConfig(&$user)
{
  if(array_key_exists("config", $user))
    $user["config"] = json_encode($user["config"]);
}

function _userDecodeConfig(&$user)
{
  if(array_key_exists("config", $user))
    $user["config"] = json_decode($user["config"]);
}

function userGet($username)
{
  global $db;
  $user = null;
  try
  {
    $db->beginTransaction();
    $result = $db->query("select * from users where username=" . $db->quote($username));
    if($result)
    {
      $user = $result->fetch();
      _userDecodeConfig($user);
    }
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
    {
      $user = $result->fetch();
      _userDecodeConfig($user);
    }
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $user;
}

function userGetAll()
{
  global $db;
  $users = array();
  try
  {
    $db->beginTransaction();
    $result = $db->query("select * from users order by username");
    if($result)
    {
      $users = $result->fetchAll();
      foreach($users as $user)
        _userDecodeConfig($user);
    }
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $users;
}

function userAdd($user)
{
  global $db, $DEF_USER_OPTIONS;
  $id = -1;
  try
  {
    $db->beginTransaction();
    $user["config"] = $DEF_USER_OPTIONS;
    _userEncodeConfig($user);
    $result = $db->query("insert into users (username, password, admin, config) values (" . $db->quote($user["username"]) . ", " . $db->quote(password_hash($user["password"], PASSWORD_DEFAULT)) . ", " . $db->quote($user["admin"]) . ", " . $db->quote($user["config"]) . ")");
    if($result)
      $id = $db->lastInsertId();
    else
    {
      $error = $db->errorInfo();
      throw new Exception($error[2], $error[1]);
    }
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
    _userEncodeConfig($update);
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