<?php

include '../config/settings.inc.php';

// Parse the incoming JSON request body
$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);
error_log(print_r($request_body, true));
file_put_contents("./data.txt", "");
// Connect to the database
$conn = new mysqli(_DB_SERVER_, _DB_USER_, _DB_PASSWD_, _DB_NAME_);

// Check the connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$secretKey = "c85a2278-bb51-11ed-afa1-0242ac120002";
if ($data["secretKey"] === $secretKey){
   foreach ($data["productData"] as $ref => $price){
        $sql = "UPDATE ps_product p
                JOIN ps_product_shop ps ON p.id_product = ps.id_product
                SET p.price = " . $price * 1.25 . ", p.wholesale_price = " . $price . ", ps.price = " . $price * 1.25 . ", ps.wholesale_price = " . $price . "
                WHERE p.reference = '" . $ref . "'";
        $result = $conn->query($sql);
    }
    http_response_code(200); // Unauthorized
    echo json_encode(array("message" => "successfully updated"));
    exit();
}
else {
  http_response_code(401); // Unauthorized
  echo json_encode(array("message" => "Invalid secret key"));
  exit();
}



// Close the database connection
$conn->close();
header('Content-Type: application/json');

?>