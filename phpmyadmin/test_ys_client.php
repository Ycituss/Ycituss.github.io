<!DOCTYPE html>
<html>
<body>

<?php
try{
    $soap = new SoapClient(null,array('location'=>"http://152.136.42.63/phpmyadmin/test_ys.php",'uri'=>'test_ys.php'));
    $result1 = $soap->hello();//调用方式1
    $result2 = $soap->__soapCall("sum",array(1,2));//调用方式2
    echo $result1."<br/>";
    echo $result2;
} catch(SoapFault $e){
    echo 111;
    echo $e->getMessage();
}catch(Exception $e){
    echo 222;
    echo $e->getMessage();
}




?>

</body>
</html>
