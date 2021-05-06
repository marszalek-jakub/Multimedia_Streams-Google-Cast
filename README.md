# strumienie_multimedialne-Google-Cast

The aim of the work was to design and build a web application for the distribution of multimedia streams using Chromecast technology.
The main assumptions of the application: The ability to display graphic files and play video files in a web browser, streaming media to a TV using the Google Chromecast Ultra 4K device. 

If you need more information please visit: https://developers.google.com/cast.

Hello, here some informations about the project.
1. In File "files-upload-php/dbh.php" set your credentials to created database with databse from SQL_database.sql query ($servername,$username,$password,$dbname)
2. In File "./castVideos.js" in 24 line write your server IP address (local ip address), and change the file path.
3. If you choose XAMPP/Apache as a server provider and you would like to save big multimedia files in your database change in file php.ini values :
- upload_max_filesize
- post_max_size



The application works only with https. If you use http, the "Cast" icon might not appear. If icon "Cast" is not visible please refresh the page.



