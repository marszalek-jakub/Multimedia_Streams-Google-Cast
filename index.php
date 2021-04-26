<!--
// Copyright 2019 Google LLC. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
-->

<!DOCTYPE html>
<html>
<head>
<title>Praca Dyplomowa</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-control" content="no-cache">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<script src="CastVideos.js" type="module"></script>
<link rel="shortcut icon" href="#">
<link rel="stylesheet" href="css/reset.css" type="text/css">
<link rel="stylesheet" href="css/mystyle.css" type="text/css">
<link href='//fonts.googleapis.com/css?family=Roboto&subset=latin,cyrillic-ext,greek-ext,latin-ext' rel='stylesheet' type='text/css'>
</head>
<body>

  <!-- exporting data from video database to .js file -->
  <?php
  include_once "./files-upload-php/dbh.php"; //połączenie z bazą dancyh
  $sql = " select * from videos";  //polecenie sql wyświetlenia całej tablicy
  $result = mysqli_query($conn, $sql); //wykonanie połączenie się z bazą danych i wykonanie polecenia 
  $json_array = array();
                              //struktura pliku .json 
  $start = "'use strict';
  /**
   * Videos JSON
   */
  let videoJSON = {   
    'videos': ";
$end = "};
export {
  videoJSON
}
";
  while($row = mysqli_fetch_assoc($result))
  {
      $json_array[] = $row;
  }
  file_put_contents('mediaVideo.js',$start . json_encode($json_array) . $end, LOCK_EX);
  ?>

    
 <header class="header container--header">

  <div class="container">
    <h1>Aplikacja internetowa do dystrybucji strumieni multimedialnych</h1>
  <?php 
      echo'
            <form class="upload--form" action="files-upload-php/gallery_upload.php" method="post" enctype="multipart/form-data">
              <div class="text">
              <p class="text__text">Uzupełnij nazwę oraz tytuł filmu</p>
              </div>
             <div class="text">
                <input class="form" size="50" type="text" name="fileName" placeholder="Nazwa pliku na serwerze">
                <input class="form" size="50" type="text" name="fileTitle" placeholder="Podaj tytuł pliku">
              </div>
              <div class="text">
                  <input class="form" size="50" type="file" name="file">
                  <button class="form input--submit" size="50" type="submit" name="submit">Wyślij Plik</button>
              </div>
            </form>
          '
  ?>

  </div>
</header>
<main class="main">

  <section class="videos">
    <div class="container">
      <div class="imageSub" id="main_video">
       
        <div class="blackbg" id="playerstatebg">IDLE</div>
        <div class=label id="playerstate">IDLE</div>
        <img src="imagefiles/default.png" id="video_image">
        <div id="video_image_overlay"></div>
        <video id="video_element">
        </video>
        <div id="media_control">
          <div id="play" class="available"></div>
          <div id="pause" class="available"></div>
          <div>
            <div id="audio_bg" class="available"></div>
            <div id="audio_bg_track" class="available"></div>
            <div id="audio_indicator" class="available"></div>
            <div id="audio_bg_level" class="available"></div>
            <div id="audio_on" class="available"></div>
            <div id="audio_off" class="available"></div>
          </div>
          <div id="progress_bg" class="available"></div>
          <div id="progress" class="available"></div>
          <div id="progress_indicator" class="available"></div>
          <div id="fullscreen_expand" class="available"></div>
          <div id="fullscreen_collapse" class="available"></div>
          <google-cast-launcher id="castbutton"></google-cast-launcher>
         
          <div id="duration" class="available">00:00</div>
        </div>
        <div id="media_info">
          <div id="media_title">
        </div>
      </div>

      </div>
    </div>
  </section>
  <section id="movies" class="movies">
  <div class="option">
    <button id="option--videos">VIDEOS</button>
    <button id="option--images">IMAGES</button>
  </div>
      
    <div id="carousel--videos">
    </div> 
    <div id="carousel--images">
    </div>
  </section>
  </main>


  <script type="text/javascript" src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
  <script type="text/javascript" src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js"></script>
  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
</body>
</html>
