<?php

function authAdd($user)
{
  global $db;
  $hash = hash_init("sha256");
  hash_update($hash, $user["username"]);
  hash_update($hash, $user["password"]);
  hash_update($hash, time());
  $authToken = hash_final($hash);
  $expdate = time() + AUTH_EXPIRE_SECONDS;
  $retval = null;
  try
  {
    $db->beginTransaction();
    $query = "insert into auths (auth_token, userid, expdate) values (" . $db->quote($authToken) . ", " . $db->quote($user["userid"]) . ", " . $db->quote($expdate) . ")";
    $result = $db->query($query);
    if(!$result)
      $retval = $authToken;
    $db->commit();
    $retval = $authToken;
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $retval;
}

function authRem($authToken)
{
  global $db;
  $retval = false;
  try
  {
    $db->beginTransaction();
    $query = "delete from auths where auth_token=" . $db->quote($authToken);
    $result = $db->query($query);
    if(!$result)
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

function authVerify($authToken)
{
  global $db;
  $auth = null;
  try
  {
    $db->beginTransaction();
    $query = "select * from auths where auth_token=" . $db->quote($authToken);
    $result = $db->query($query);
    if($result)
    {
      $auth = $result->fetch();
      error_log("auth = " . print_r($auth, true) . ", time = " . time());
      if($auth && $auth["expdate"] <= time())
      {
        error_log("clearing auth");
        $auth = null;
        $query = "delete from auths where auth_token=" . $db->quote($authToken);
        $result = $db->query($query);
      }
      else
      {
        $expdate = time() + AUTH_EXPIRE_SECONDS;
        $query = "update auths set expdate=" . $db->quote($expdate) . " where auth_token=" . $db->quote($authToken);
        error_log("query = $query");
        $result = $db->query($query);
        error_log("error updating auths record");
      }
    }
    $db->commit();
  }
  catch(Exception $e)
  {
    error_log($e->getMessage() . ": " . $e->getTraceAsString());
    $db->rollBack();
  }
  return $auth;
}

?>