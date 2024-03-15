-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sty 07, 2024 at 06:48 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `aji`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kategoria`
--

CREATE TABLE `kategoria` (
  `kategoria_id` int(11) NOT NULL,
  `nazwa` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategoria`
--

INSERT INTO `kategoria` (`kategoria_id`, `nazwa`) VALUES
(1, 'Warzywa');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `produkt`
--

CREATE TABLE `produkt` (
  `produkt_id` int(11) NOT NULL,
  `nazwa` text NOT NULL,
  `opis` text NOT NULL,
  `cena_jednostkowa` decimal(10,2) NOT NULL,
  `waga_jednostkowa` decimal(10,2) NOT NULL,
  `kategoria_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `produkt`
--

INSERT INTO `produkt` (`produkt_id`, `nazwa`, `opis`, `cena_jednostkowa`, `waga_jednostkowa`, `kategoria_id`) VALUES
(6, 'Pomidor', 'o no takie o', 1.20, 0.35, 1);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `produkt_zamowienie`
--

CREATE TABLE `produkt_zamowienie` (
  `produkt_zamowienie_id` int(11) NOT NULL,
  `produkt_id` int(11) NOT NULL,
  `zamowienie_id` int(11) NOT NULL,
  `ilosc` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `stan_zamowienia`
--

CREATE TABLE `stan_zamowienia` (
  `stan_zamowienia_id` int(11) NOT NULL,
  `nazwa` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `zamowienie`
--

CREATE TABLE `zamowienie` (
  `zamowienie_id` int(11) NOT NULL,
  `data_zatwierdzenia` date DEFAULT NULL,
  `stan_zamowienia_id` int(11) NOT NULL,
  `nazwa_uzytkownika` text NOT NULL,
  `email` text NOT NULL,
  `numer_telefonu` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `kategoria`
--
ALTER TABLE `kategoria`
  ADD PRIMARY KEY (`kategoria_id`);

--
-- Indeksy dla tabeli `produkt`
--
ALTER TABLE `produkt`
  ADD PRIMARY KEY (`produkt_id`),
  ADD KEY `produkt_kategoria` (`kategoria_id`);

--
-- Indeksy dla tabeli `produkt_zamowienie`
--
ALTER TABLE `produkt_zamowienie`
  ADD PRIMARY KEY (`produkt_zamowienie_id`),
  ADD KEY `prozam_produkt` (`produkt_id`),
  ADD KEY `prozam_zamowienie` (`zamowienie_id`);

--
-- Indeksy dla tabeli `stan_zamowienia`
--
ALTER TABLE `stan_zamowienia`
  ADD PRIMARY KEY (`stan_zamowienia_id`);

--
-- Indeksy dla tabeli `zamowienie`
--
ALTER TABLE `zamowienie`
  ADD PRIMARY KEY (`zamowienie_id`),
  ADD KEY `zamowienie_stan_zamowienia` (`stan_zamowienia_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kategoria`
--
ALTER TABLE `kategoria`
  MODIFY `kategoria_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `produkt`
--
ALTER TABLE `produkt`
  MODIFY `produkt_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `produkt_zamowienie`
--
ALTER TABLE `produkt_zamowienie`
  MODIFY `produkt_zamowienie_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stan_zamowienia`
--
ALTER TABLE `stan_zamowienia`
  MODIFY `stan_zamowienia_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `zamowienie`
--
ALTER TABLE `zamowienie`
  MODIFY `zamowienie_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `produkt`
--
ALTER TABLE `produkt`
  ADD CONSTRAINT `produkt_kategoria` FOREIGN KEY (`kategoria_id`) REFERENCES `kategoria` (`kategoria_id`);

--
-- Constraints for table `produkt_zamowienie`
--
ALTER TABLE `produkt_zamowienie`
  ADD CONSTRAINT `prozam_produkt` FOREIGN KEY (`produkt_id`) REFERENCES `produkt` (`produkt_id`),
  ADD CONSTRAINT `prozam_zamowienie` FOREIGN KEY (`zamowienie_id`) REFERENCES `zamowienie` (`zamowienie_id`);

--
-- Constraints for table `zamowienie`
--
ALTER TABLE `zamowienie`
  ADD CONSTRAINT `zamowienie_stan_zamowienia` FOREIGN KEY (`stan_zamowienia_id`) REFERENCES `stan_zamowienia` (`stan_zamowienia_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
