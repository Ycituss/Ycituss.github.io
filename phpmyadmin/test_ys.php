<!DOCTYPE html>
<html>
<body>

<?php
$wsdl = "";
$client = new SoapClient($wsdl);
$soapParas = array($paras);
$outString = $client->__soapCall("UploadPhotoId", $soapParas);
//将XML转成数组
$obj = simplexml_load_string($outString->UploadPhotoIdResult->any);

echo($obj->ExtraInfo);
echo "<br/>";
echo($obj->ExtraCode);
echo "<br/>";
echo($obj->Code);
echo "<br/>";
echo($obj->Message);
?>
</body>
</html>
