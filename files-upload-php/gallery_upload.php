<?php

if (isset($_POST['submit'])) {

    $newFileName = $_POST['fileName'];
    if (empty($newFileName)) {
        $newFileName = "files-sources";
    } else {
        $newFileName = strtolower(str_replace(" ","-", $newFileName));
    }

    $imageTitle = $_POST['fileTitle'];

    $file = $_FILES['file'];

    $fileName = $file["name"];
    $fileType = $file["type"];
    $fileTempName = $file["tmp_name"];
    $fileError = $file["error"];
    $fileSize = $file["size"];

    $fileExt = explode(".", $fileName);
    $fileActualExt = strtolower(end($fileExt));

    $fileType = array("jpg", "jpeg", "png", "mp4", "webm", "ogg");
    $typeImg = array("jpg", "jpeg", "png");
    $typeVideo = array("mp4", "webm", "ogg");


        if ($fileError === 0) {
            
            if (in_array($fileActualExt, $fileType)){  //czy dodawany plik posiada dozwolone rozszerzenie 
                $FileFullName = $newFileName . "." . uniqid("", true, ) . "." . $fileActualExt; //unikalna nazwa pliku
                if(in_array($fileActualExt, $typeImg)){  //czy dodawany plik jest typu zdjęcie
                    $fileDestination = "../files-sources/gallery/" . $FileFullName; //ścieżka do plików typu zdjęcie
                include_once "dbh.php";  //połączenie z baza danych
                }
                else {
                    $fileDestination = "../files-sources/videos/" . $FileFullName; //ścieżka do plików typu video
                    include_once "dbh.php";  //połaczenie z bazą danych
                }
          
                
                if (empty($imageTitle)) {
                    header("Location: ../index.php?upload=empty");
                    exit();
                } 
                else {
                    $sql = "SELECT * FROM videos";
                    $stmt = mysqli_stmt_init($conn);
                    if (!mysqli_stmt_prepare($stmt, $sql)){
                        echo "SQL statement failed!";
                    } 
                    else {
                        mysqli_stmt_execute($stmt);
                        $result = mysqli_stmt_get_result($stmt);
                        $rowCount = mysqli_num_rows($result);
                        $setFileOrder = $rowCount + 1;

                        $sql = "INSERT INTO videos (titleVideo, FullName, TypeFile) VALUES (?, ?, ?);";
                        if (!mysqli_stmt_prepare($stmt, $sql)){
                            echo "SQL statement failed!";
                        } 
                        else {
                            mysqli_stmt_bind_param($stmt, "sss", $imageTitle, $FileFullName, $fileActualExt);
                            mysqli_stmt_execute($stmt);

                            move_uploaded_file($fileTempName, $fileDestination);

                            header("Location: ../index.php?upload=success");
                        }
                    }
                }
           
            }
                else {
                echo "You need to upload a proper file type!";
                exit();
            }
        
        } else {
            echo "You had an error!";
            exit();
        }
}

?>