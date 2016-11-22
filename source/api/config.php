<?php

// sqlite database file
define("DATABASE_FILENAME", "../data/kiss.sqlite");

// number of seconds before user authorization expires
define("AUTH_EXPIRE_SECONDS", 3600 * 24 * 30);

// directories to expose
$BASE_DIRS = array(
  "www-html" => "/var/www/html/",
);

?>