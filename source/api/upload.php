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
$filename = getReqValue("filename");

$auth = authVerify($authtoken);
error_log("auth = " . print_r($auth, true));
if(!$auth)
  header('HTTP/1.1 401 Not Authorized');
else
{
  if($_SERVER['REQUEST_METHOD'] == "POST")
  {
//    print("authtoken = $authtoken<br>\n");
//    print("basedir = $basedir<br>\n");
//    print("path = $path<br>\n");
//    print_r($_FILES);
    if(array_key_exists($basedir, $BASE_DIRS))
    {
      $fullpath = $BASE_DIRS[$basedir] . $path;
      $tmpname = tempnam($fullpath, "kisside");
      if(move_uploaded_file($_FILES['filename']['tmp_name'], $tmpname))
      {
        chmod($tmpname, DEF_FILE_MODE);
        rename($tmpname, $fullpath . "/" . basename($_FILES["filename"]["name"]));
      }
      print("<script>window.parent.app.closeUploadDialog()</script>");
    }
  }
  else
  {
  ?>
  <html><head><title>KISSIDE Upload</title></head>
    <body>
      <form method="POST" action="<?php echo $_SERVER["SCRIPT_NAME"] ?>" enctype="multipart/form-data">
        <input type="hidden" name="authtoken" value="<?php echo $authtoken ?>">
        <input type="hidden" name="basedir" value="<?php echo $basedir ?>">
        <input type="hidden" name="path" value="<?php echo $path ?>">
        <input type="file" name="filename">
        <br><br>
        <input type="submit" value="Upload">
      </form>
    </body>
  </html>
  <?php
  }
}
?>