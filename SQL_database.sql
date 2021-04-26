-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Czas generowania: 17 Sie 2020, 09:15
-- Wersja serwera: 10.4.11-MariaDB
-- Wersja PHP: 7.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `pracadyplomowav3`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `videos`
--

CREATE TABLE `videos` (
  `idVideo` int(11) NOT NULL,
  `titleVideo` longtext COLLATE utf8mb4_polish_ci NOT NULL,
  `FullName` longtext COLLATE utf8mb4_polish_ci NOT NULL,
  `TypeFile` longtext COLLATE utf8mb4_polish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

--
-- Zrzut danych tabeli `videos`
--

INSERT INTO `videos` (`idVideo`, `titleVideo`, `FullName`, `TypeFile`) VALUES
(59, 'Pierwsze Video', 'video1.5f3a2c1760c030.90357875.webm', 'webm'),
(60, 'Drugie Video', 'video2.5f3a2c3c39a2b5.20696423.mp4', 'mp4'),
(61, 'Video trzecie', 'video3.5f3a2c4b0d6523.20459127.mp4', 'mp4'),
(62, 'Zdjecie pierwsze', 'image1.5f3a2c60ce9263.85055680.jpg', 'jpg'),
(63, 'Zdjecie drugie', 'image2.5f3a2c76de92c1.61862821.jpg', 'jpg');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`idVideo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT dla tabeli `videos`
--
ALTER TABLE `videos`
  MODIFY `idVideo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
