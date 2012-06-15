<?php
  // this is not server side report saving, this is quick and dirty single purpose backup tool so that I can have versioned backup of currently tested report in git

  // get json text
  $json = $_REQUEST['json'];

  // use json prettifier if it is available
  if (file_exists("json_pretty_format.php")) {
    require_once "json_pretty_format.php";
    $json = json_indent($json);
  }

  // save json to file
  file_put_contents('report1.json',$json);
?>
