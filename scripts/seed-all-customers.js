// Run a read-only dry-run with the database connection supplied by the shell:
// node scripts/seed-all-customers.js
// Import after review: node scripts/seed-all-customers.js --commit
import mongoose from "mongoose";
import { performance } from "node:perf_hooks";
import { connectDB, mongoClient } from "../src/lib/db.js";
import Customer from "../src/models/Customer.js";
import LedgerEntry from "../src/models/LedgerEntry.js";
import { postEntry } from "../src/lib/ledger.js";
import { withTx } from "../src/lib/tx-core.js";

const CUSTOMERS_DATA = [
  [
    "Reka Traders (Fresh Cement)",
    "01711306257",
    "Trimohini, Kushtia",
    145000,
    0,
    "cement"
  ],
  [
    "Babul Mistri (General)",
    "01752397003",
    "Trimohini, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ruma Apa (General)",
    "01715041298",
    "Housing, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Pulok Contractor (General)",
    "01712121750",
    "6 Rastar Mor, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Swapon Haji (General)",
    "01712575680",
    "Mojompur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sumon Ali (General)",
    "01711147392",
    "Dorgapara, Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Shukila Ruju Agrani Bank (General)",
    "01727668795",
    "Mojompur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Shoharab Engineer (General)",
    "01711958021",
    "Aruapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Razzak Chairman (General)",
    "01711271758",
    "Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Jony (General)",
    "01717902918",
    "Alfa Mor, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Dr.ist Eye Hospital (General)",
    "01321173586",
    "Courasta Mor, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Eman Mistri (General)",
    "01790261979",
    "6 Rastar mor, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "TS Tower/ Shofikul Engineer (General)",
    "01716782469",
    "Court para, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Faruk Contractor (General)",
    "01711981623",
    "Thanapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Tara Boka Contractor (General)",
    "01711952597",
    "Thanapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "MD. Tipu (General)",
    "01726830595",
    "Piaratola, Kushtia Sadar, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ratan Engineer (General)",
    "01736125276",
    "Fulpara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Rasel (General)",
    "01711066987",
    "Komlapur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Razzak (General)",
    "01755760392",
    "Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Roby (General)",
    "01743286922",
    "Babor Ali Get, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Abdul Jalal Shikh (General)",
    "01711480387",
    "Nodobaria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mayen Ali (General)",
    "01767247572",
    "Mongolbaria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Dablu (General)",
    "01776179702",
    "Mongolbaria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Channu Contractor (General)",
    "01712266086",
    "Aruapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Milon / Shohag (General)",
    "01704427099",
    "Thanapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Kasem Tower (General)",
    "01303029526",
    "Kamlapur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Manirul/ Shamim Engineer (General)",
    "01708784938",
    "Housing, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mayer Doa Enterprise (Bashundhara cement)",
    "01719283167",
    "Horiarampur, Kushtia",
    0,
    50000,
    "cement"
  ],
  [
    "Mohona Traders (Holcim Cement)",
    "01777402354",
    "Housing, Kushtia",
    46640,
    0,
    "cement"
  ],
  [
    "Monjurul Alam (General)",
    "01718320400",
    "Aruapara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Jahangir Abba (General)",
    "01712902001",
    "Mongolbaria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Majed Saheb (General)",
    "01325082271",
    "Mojompur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Monir Jamuna Bank (General)",
    "01711971628",
    "Kushtia Sadar, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Manowar Reshi (General)",
    "01829562727",
    "Kaburhat, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Milon Countractor (General)",
    "01717471058",
    "Taragunia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mehedi Jubayer (General)",
    "01713936091",
    "Court para, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Khokon Shikder (General)",
    "01711274261",
    "Court para, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ajijul/Salam (General)",
    "01715060279",
    "Boria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Nur Alam/Halim (General)",
    "01716564579",
    "Boria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Motalab Sir (General)",
    "01716337141",
    "Samajikpara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Seno Dadu (General)",
    "01843480238",
    "Housing, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sarowar Contractor (General)",
    "01712675801",
    "Mirpur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Raju Vai (General)",
    "01711191398",
    "Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Anowar Haji (General)",
    "01735602394",
    "Vadalia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Halal Driver (General)",
    "01727947187",
    " Chorada, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Anowar (General)",
    "01711282106",
    "Court Para, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sadhin Fresh Officer (General)",
    "01757766726",
    " Mollateghoria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Shihab Holcim Officer (General)",
    "01712285775",
    "Borkhada, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Biplob/Khairul (General)",
    "01779702812",
    "Chourhas, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mithu Neta (General)",
    "01767874548",
    " Gosala, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mahabub Sonali Trading (General)",
    "01320471717",
    "Vadalia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Jahid (General)",
    "01711983519",
    "Gosala, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Anis contracturer (General)",
    "01779824931",
    "Voraimara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Selim Mistri (General)",
    "01984128034",
    "Horipur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Babor (General)",
    "01727215325",
    "Milion Bazar, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Taju Mistri (General)",
    "01773939427",
    "Trimohini, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Aziz Van (General)",
    "01778824593",
    " Vadapara, Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sujib (General)",
    "01815172258",
    "Mongolbaria, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Faruk Hoshen (General)",
    "01812098091",
    "Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sagor (General)",
    "01731911127",
    " Vadapara, Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Vai Vai Traders (Holcim Cement)",
    "01739239251",
    "Kumarkhali, Kushtia",
    41200,
    0,
    "cement"
  ],
  [
    "Taher & Sons (Holcim Cement)",
    "01715734105",
    " Pausha Bazar, Kushtia",
    159350,
    0,
    "cement"
  ],
  [
    "Siraj Bali Vander (Holcim Cement)",
    "01951034736",
    "Kumarkhali, Kushtia",
    59400,
    0,
    "cement"
  ],
  [
    "Mayer Doa Enterprise (Holcim Cement)",
    "01768478198",
    "Bargirampur, Kushtia",
    31800,
    0,
    "cement"
  ],
  [
    "Mayer Doa Traders (Holcim Cement)",
    "01914202579",
    "Jugia School Para, Kushtia",
    34200,
    0,
    "cement"
  ],
  [
    "Khan Traders (Holcim Cement)",
    "01729232979",
    "Char-Mila, Kushtia",
    24650,
    0,
    "cement"
  ],
  [
    "M.S.B Enterprise (Holcim Cement)",
    "01729684608",
    "Kamarpara, Kushtia",
    25200,
    0,
    "cement"
  ],
  [
    "Badol Mama (Holcim Cement)",
    "01725357328",
    "Kumarkhali, Kushtia",
    128380,
    0,
    "cement"
  ],
  [
    "A.Qu (General)",
    "01711473719",
    "Barimail, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Asraf/ Swapon Haji (General)",
    "01712575778",
    "Mojompur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Majid Mistri (General)",
    "01757376417",
    "Karakhol, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Biplob/ Mamun (General)",
    "01711583699",
    "Kamlapur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Babu Tils (General)",
    "01933638156",
    "Housing, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Rofikul Gaji (General)",
    "01716034581",
    "Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ruhul Dhalai Officer (General)",
    "01712204039",
    "Haripur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Kolyano / Aziz (General)",
    "01747885363",
    "Horiarampur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Mehdi Kibria (General)",
    "01735262129",
    "Komlapur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Aziz Miah (General)",
    "01719232015",
    "Haripur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ujjol Munsur Bypari (General)",
    "01711049545",
    " Upazila Mor, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Abu Bokkar / Mokasir Mistri (General)",
    "01722263764",
    "Kamarpara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Manik (General)",
    "01338096405",
    "Baul danga, Haripur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sohel/ Raju (General)",
    "01722300380",
    "Chourhas, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Ashraful EDLC (General)",
    "01714910151",
    "Kushtia Sadar, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Tuku/ Mokasir Mistri (General)",
    "01755033794",
    "Haripur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Rabiul Mistri (General)",
    "01950432075",
    "Trimohini, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "S.S Steel Tuhin (General)",
    "01771197080",
    "Fulpara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Swapon Contactor (General)",
    "01711103419",
    "Gosala, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Amin Labon shah Mill (General)",
    "01711106619",
    "Haripur, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Nupur (General)",
    "01715757774",
    "Fulpara, Kushtia",
    0,
    0,
    "general"
  ],
  [
    " Moniruzzaman DC Court (General)",
    "01304780305",
    " DC Court, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Sattar/ Tofail (General)",
    "01852804120",
    " 5 no Gate, Jugia, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Hira Enterprise",
    "01726-274530",
    " Alapdia, Kumarkhali",
    0,
    40000,
    "cement"
  ],
  [
    "Vai Vai Hardware (Bashundhara cement)",
    "01980551103",
    " Dhomorpur, Kumarkhali, Kushtia",
    107998,
    0,
    "cement"
  ],
  [
    "Rakib Traders (Bashundhara cement)",
    "01933994012",
    "Shenghordia Bazar, Kushtia",
    1000,
    0,
    "cement"
  ],
  [
    "Munir Traders (Bashundhara cement)",
    "01711032888",
    "Haripur, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Hamidul Hok Enterprise (Bashundhara cement)",
    "01712928477",
    " Barobazar, Kushtia",
    0,
    486483,
    "cement"
  ],
  [
    "Najifa Enterprise Hitter Vai (Bashundhara cement)",
    "01716761077",
    " BDC Bazar, Kushtia",
    0,
    101625,
    "cement"
  ],
  [
    "RM Enterprise (Dhalai Special)",
    "01711-799475",
    "Kumarkhali, Kushtia",
    343855,
    0,
    "cement"
  ],
  [
    "Ma Hardware & Machinery (Dhalai Special)",
    "01711-387558",
    "Bogram, Kumarkhali, Kushtia",
    774685,
    0,
    "cement"
  ],
  [
    "Khokhon Traders (Dhalai Special)",
    "01719-093552",
    "Kalisia, Mirpur, Kushtia",
    656840,
    0,
    "cement"
  ],
  [
    "Ma Traders (Dhalai Special)",
    "01715-630249",
    "Arpara, Mirpur, Kushtia",
    498810,
    0,
    "cement"
  ],
  [
    "Mama Vagne Traders (Dhalai Special) (Block)",
    "01737-732288",
    "Kumarkhali, Kushtia",
    78700,
    0,
    "cement"
  ],
  [
    "Sarbik Enterprise (Dhalai Special) (Block)",
    "01727-236093",
    "Kumarkhali, Kushtia",
    338450,
    0,
    "cement"
  ],
  [
    "Vai Vai Traders Chourangi (Dhalai Special)",
    "01988-457555",
    "Chourangi Bazar, Kumarkhali, Kushtia",
    168200,
    0,
    "cement"
  ],
  [
    "Safa Hardware (Dhalai Special)",
    "01740-295315",
    "Kumarkhali, Kushtia",
    225480,
    0,
    "cement"
  ],
  [
    "Sara Enterprise (Dhalai Special)",
    "01920-072700",
    "Kumarkhali, Kushtia",
    49720,
    0,
    "cement"
  ],
  [
    "Afaj Enterprise (Dhalai Special)",
    "01915-129777",
    "Kumarkhali, Kushtia",
    216100,
    0,
    "cement"
  ],
  [
    "Jillu Hardware (Dhalai Special)",
    "01913-310399",
    " Moypara, Kumarkhali, Kushtia",
    340500,
    0,
    "cement"
  ],
  [
    "Dakua Bali Mohol (Dhalai Special)",
    "01943-290275",
    " Panti Bazar, Kumarkhali, Kushtia",
    799910,
    0,
    "cement"
  ],
  [
    "Biswas Enterprise Kumarkhali (Dhalai Special)",
    "01782-672061",
    "Gopgram, Kumarkhali, Kushtia",
    102000,
    0,
    "cement"
  ],
  [
    "Soyeb Traders (Dhalai Special)",
    "01718-136426",
    "Kumarkhali, Kushtia",
    366150,
    0,
    "cement"
  ],
  [
    "Ma babar Doa (Dhalai Special)",
    "01718455086",
    "Doulotpur, Kushtia",
    102500,
    0,
    "cement"
  ],
  [
    "Ashraful Traders (Fresh Cement) (Block)",
    "01716979072",
    "Lahan Bottoil, Kushtia",
    160000,
    0,
    "cement"
  ],
  [
    "Fahim Siha Enterprise (Fresh Cement) (Block)",
    "01743703088",
    "Baborali Gat, Kushtia",
    68250,
    0,
    "cement"
  ],
  [
    "Rupali Store/Akbar (Fresh Cement) (Block)",
    "01716145757",
    "Taherpur, Kushtia",
    69300,
    0,
    "cement"
  ],
  [
    "Rohan Enterprise (Fresh Cement) (Block)",
    "01712257489",
    "Haripur, Kushtia",
    105510,
    0,
    "cement"
  ],
  [
    "Najifa Enterprise Hitter Vai (Fresh Cement)",
    "01716761077",
    "Kushtia Sadar, Kushtia",
    0,
    1200,
    "cement"
  ],
  [
    "A-One Traders (Fresh Cement) (Block)",
    "01912906228",
    "Housing, Kushtia",
    200015,
    0,
    "cement"
  ],
  [
    "Shajol Traders (Dhalai Special)",
    "01711220268",
    " Mirpur, Kushtia",
    157500,
    0,
    "cement"
  ],
  [
    "api Traders (Fresh Cement)",
    "01712566006",
    "EB, Kushtia",
    180220,
    0,
    "cement"
  ],
  [
    "Mason Traders (Dhalai Special)",
    "01711582936",
    "Mizan Bazar, Mirpur, Kushtia",
    97400,
    0,
    "cement"
  ],
  [
    "Biswas Traders Mirpur (Dhalai Special)",
    "01711-177889",
    " Amla Mirpur, Kushtia",
    785000,
    0,
    "cement"
  ],
  [
    "Riya Enterprise (Dhalai Special)",
    "01711-039847",
    " Mirpur, Kushtia",
    595710,
    0,
    "cement"
  ],
  [
    "Sabuj Traders (Dhalai Special)",
    "01922-710800",
    " Varol, Mirpur, Kushtia",
    148100,
    0,
    "cement"
  ],
  [
    "Hasan Traders (Dhalai Special)",
    "01729-557514",
    " Amla, Mirpur, Kushtia",
    630800,
    0,
    "cement"
  ],
  [
    "Gaffar Hardware & Machinery (Dhalai Special)",
    "01912-920704",
    "Majhat, Mirpur, Kushtia",
    162000,
    0,
    "cement"
  ],
  [
    "Khan Engineering (Dhalai Special)",
    "01738-675109",
    " Mirpur, Kushtia",
    457900,
    0,
    "cement"
  ],
  [
    "Ma hardware (Dhalai Special)",
    "01738-675109",
    "Sultani Bazar, Mirpur, Kushtia",
    664950,
    0,
    "cement"
  ],
  [
    "Mahabub Traders (Dhalai Special)",
    "01713-049606",
    "Fulbaria, Kushtia",
    57090,
    0,
    "cement"
  ],
  [
    "EH Traders (Dhalai Special)",
    "01715-102543",
    "Trimohini, Kushtia",
    200,
    0,
    "cement"
  ],
  [
    "Biswas Enterprise Alisara (Dhalai Special)",
    "01795-768710",
    "Alisara, Kushtia",
    325300,
    0,
    "cement"
  ],
  [
    "Bismillah Iron (Dhalai Special)",
    "01725-538024",
    " Vadalia, Kushtia",
    257420,
    0,
    "cement"
  ],
  [
    "Mahoria Enterprise (Saton) (Dhalai Special)",
    "01720-600602",
    "Madaripur, Kushtia",
    45500,
    0,
    "cement"
  ],
  [
    "Dehor Traders (Dhalai Special)",
    "01712-475625",
    "Haripur, Kushtia",
    25900,
    0,
    "cement"
  ],
  [
    "SE Enterprise (Dhalai Special)",
    "01716-021604",
    " Kamarpara, Kushtia",
    128560,
    0,
    "cement"
  ],
  [
    "Kakon Traders (Dhalai Special)",
    "01713-088753",
    " Boria, Kushtia",
    376700,
    0,
    "cement"
  ],
  [
    "Rafid Enterprise (Dhalai Special)",
    "01713-134145",
    " Upazila Road, Kushtia",
    105910,
    0,
    "cement"
  ],
  [
    "Eman Enterprise (Dhalai Special)",
    "01723-446683",
    "Alisara Bazar, Kushtia",
    1218405,
    0,
    "cement"
  ],
  [
    "Faiz",
    "01719628308",
    "Housing, Kushtia",
    0,
    0,
    "general"
  ],
  [
    "Iman Enterprise (Fresh cement)",
    "01723-446683",
    "Alisara Bazar, Kushtia",
    181750,
    0,
    "cement"
  ],
  [
    "Mir Gaffar Traders (Fresh cement)",
    "01850372722",
    "Mongolbaria, Kushtia",
    11760,
    0,
    "cement"
  ],
  [
    "Rupali Traders Nader (Bashundhara cement) (Block)",
    "01716018757",
    "Boria, Satbaria, Kushtia",
    43300,
    0,
    "cement"
  ],
  [
    "Rohan Enterprise (Bashundhara cement)",
    "01775751718",
    "Haripur, Kushtia",
    127750,
    0,
    "cement"
  ],
  [
    "Samor Rahman Traders (Bashundhara cement) (Block)",
    "01711240578",
    "Madaripur, Kushtia",
    37490,
    0,
    "cement"
  ],
  [
    "Rakia Ment (Bashundhara cement)",
    "01927319706",
    "Jugia, Kadamtala, Kushtia",
    191704,
    0,
    "cement"
  ],
  [
    "Oli Vai (Bashundhara cement) (Block)",
    "01714222864",
    "Pantipara, Kushtia",
    2600,
    0,
    "cement"
  ],
  [
    "Jannat Traders (Bashundhara cement) (Block)",
    "01882083385",
    "Bypas Road, Kushtia",
    29000,
    0,
    "cement"
  ],
  [
    "Mia traders (Bashundhara cement)",
    "01718634345",
    "Vadalia, Kushtia",
    48200,
    0,
    "cement"
  ],
  [
    "Razzak Traders (Bashundhara cement)",
    "01711901952",
    "6 Rastar mor, Kushtia",
    149900,
    0,
    "cement"
  ],
  [
    "Masita Enterprise (Bashundhara cement) (Block)",
    "01713691809",
    "Miron, Kushtia",
    124000,
    0,
    "cement"
  ],
  [
    "Masudul Enterprise (Bashundhara cement)",
    "01711925998",
    "Hospital mor, Kushtia",
    51850,
    0,
    "cement"
  ],
  [
    "Tutul Traders (Bashundhara cement)",
    "01711524773",
    "Sasta Bazar, Kumarkhali, Kushtia",
    55950,
    0,
    "cement"
  ],
  [
    "Shourav Traders (Bashundhara cement)",
    "01722439528",
    " Chadpur, Kumarkhali, Kushtia",
    44000,
    0,
    "cement"
  ],
  [
    "Rajib Traders (Bashundhara cement)",
    "01715098363",
    " Panti Bazar, Kumarkhali, Kushtia",
    47900,
    0,
    "cement"
  ],
  [
    "Khan Traders (Bashundhara cement)",
    "01740625987",
    "Joduboyra, Kumarkhali, Kushtia",
    188080,
    0,
    "cement"
  ],
  [
    "Hira Hardware (Bashundhara cement)",
    "01727002288",
    " Bongram, Kumarkhali, Kushtia",
    2670,
    0,
    "cement"
  ],
  [
    "Sabuj Sathi Enterprise (Bashundhara cement)",
    "01737096067",
    "Kumarkhali, Kushtia",
    104779,
    0,
    "cement"
  ],
  [
    "Sagor Enterprise (Bashundhara cement)",
    "01715800799",
    " Modhupur, Kumarkhali, Kushtia",
    84950,
    0,
    "cement"
  ],
  [
    "Mallika Hardware (Bashundhara cement)",
    "01926269671",
    " Alauddin nagor, Kumarkhali, Kushtia",
    212910,
    0,
    "cement"
  ],
  [
    "Shohag Traders (Bashundhara cement)",
    "01712310144",
    " Vobanong, Kumarkhali, Kushtia",
    248450,
    0,
    "cement"
  ],
  [
    "Torun Traders (Bashundhara cement)",
    "01719007152",
    " Alapdia, Kumarkhali, Kushtia",
    91490,
    0,
    "cement"
  ],
  [
    "Faiza Traders (Bashundhara cement)",
    "01730354541",
    "Kumarkhali, Kushtia",
    198100,
    0,
    "cement"
  ],
  [
    "Badol Mama (Bashundhara cement)",
    "01717362472",
    "Kumarkhali, Kushtia",
    455940,
    0,
    "cement"
  ],
  [
    "Shohidul Traders (Bashundhara cement)",
    "01930332309",
    "Kumarkhali, Kushtia",
    247750,
    0,
    "cement"
  ],
  [
    "MR Reaz Traders (Bashundhara cement)",
    "01729850581",
    "Kumarkhali, Kushtia",
    285898,
    0,
    "cement"
  ],
  [
    "Monirul Traders (Bashundhara cement)",
    "01980290358",
    "Koya, Kumarkhali, Kushtia",
    54454,
    0,
    "cement"
  ],
  [
    "Azadul Decorator (Bashundhara cement)",
    "01704582388",
    "Kornopur, Kumarkhali, Kushtia",
    85545,
    0,
    "cement"
  ],
  [
    "Sida Traders (Bashundhara cement)",
    "01711473540",
    " Golka Bazar, Kumarkhali, Kushtia",
    221920,
    0,
    "cement"
  ],
  [
    "Tuhin Traders (Bashundhara cement)",
    "01719505623",
    " Moypara, Kumarkhali, Kushtia",
    9792,
    0,
    "cement"
  ],
  [
    "Siraj Bali Vander (Bashundhara cement)",
    "01951034736",
    " Nondolalpur, Kumarkhali, Kushtia",
    283800,
    0,
    "cement"
  ],
  [
    "Azad Traders (Bashundhara cement)",
    "01932723859",
    "Kumarkhali, Kushtia",
    220305,
    0,
    "cement"
  ],
  [
    "Babul Traders (Bashundhara cement)",
    "01792310199",
    "Halsabazar, Kushtia",
    4625,
    0,
    "cement"
  ],
  [
    "Choudhuri Traders (Bashundhara cement)",
    "01720636171",
    " Monohardi Bazar, Kushtia",
    286840,
    0,
    "cement"
  ],
  [
    "Momin Traders (Bashundhara cement)",
    "01727037576",
    " Magura Bazar, Kushtia",
    376440,
    0,
    "cement"
  ],
  [
    "Habib Traders (Bashundhara cement)",
    "01925909197",
    " Pathabari Bazar, Kushtia",
    249322,
    0,
    "cement"
  ],
  [
    "Ayen Enterprise (Bashundhara cement)",
    "01715992251",
    " Pausha Bazar, Kushtia",
    286187,
    0,
    "cement"
  ],
  [
    "Sonda Traders (Bashundhara cement)",
    "01712781938",
    " Bajju mor, Kushtia",
    0,
    87000,
    "cement"
  ],
  [
    "Vai Vai Traders (Bashundhara cement)",
    "01760802719",
    " Kanchanpur, Kushtia",
    21650,
    0,
    "cement"
  ],
  [
    "Sami Traders (Bashundhara cement)",
    "01711369833",
    "Fulbaria, Kushtia",
    93900,
    0,
    "cement"
  ],
  [
    "Joadder Traders (Bashundhara cement)",
    "01713905297",
    " Kamlapur, Kushtia",
    109200,
    0,
    "cement"
  ],
  [
    "Mir Gaffar Traders (Bashundhara cement)",
    "01850372722",
    "Mongolbaria, Kushtia",
    22040,
    0,
    "cement"
  ],
  [
    "Alisha Traders (Bashundhara cement)",
    "01922382105",
    "Baddapara, Kushtia",
    6390,
    0,
    "cement"
  ],
  [
    "Rakib Traders (Bashundhara cement)",
    "01725771024",
    "Koburhat, Kushtia",
    115970,
    0,
    "cement"
  ],
  [
    "Bipna Traders (Bashundhara cement)",
    "01725184398",
    " Lahin Bot toli, Kushtia",
    163700,
    0,
    "cement"
  ],
  [
    "Brinty Traders (Bashundhara cement)",
    "01719401019",
    "Jagati, Dargahita, Kushtia",
    240262,
    0,
    "cement"
  ],
  [
    "Momin Traders (Bashundhara cement)",
    "01737977265",
    " Jiaraki, Komlapur, Kushtia",
    182970,
    0,
    "cement"
  ],
  [
    "Ma babar Doa (Bashundhara cement)",
    "01917226012",
    "Bot toli, Kushtia",
    102510,
    0,
    "cement"
  ],
  [
    "Jithil/biswas Traders (Bashundhara cement)",
    "01330619277",
    "Haripur, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Bokul Traders (Bashundhara cement)",
    "01722261157",
    "Haripur, Kushtia",
    122090,
    0,
    "cement"
  ],
  [
    "Sumon Enterprise (Bashundhara cement)",
    "01711892304",
    "Haripur, Kushtia",
    1450,
    0,
    "cement"
  ],
  [
    "shahed Traders (Panna) (Bashundhara cement)",
    "01727691088",
    "Lahin, Kushtia",
    239250,
    0,
    "cement"
  ],
  [
    "Uzzal Traders (Bashundhara cement)",
    "01712839529",
    "Chader er boder, Kushtia",
    49547,
    0,
    "cement"
  ],
  [
    "Morsel Traders (Bashundhara cement)",
    "01729772214",
    " Duborchar, Kushtia",
    169975,
    0,
    "cement"
  ],
  [
    "Emon Enterprise (Bashundhara cement)",
    "01723446683",
    "Alisara, Kushtia",
    66280,
    0,
    "cement"
  ],
  [
    "Sajid Traders (Bashundhara cement)",
    "01712007337",
    "Udhbari, Kushtia",
    72480,
    0,
    "cement"
  ],
  [
    "SR Enterprise (Bashundhara cement)",
    "01714821694",
    " Kamarpara, Kushtia",
    188944,
    0,
    "cement"
  ],
  [
    "Kakon Traders (Bashundhara cement)",
    "0171308875",
    "Boria jamtala, Kushtia",
    113520,
    0,
    "cement"
  ],
  [
    "Babu Traders (Bashundhara cement)",
    "01719002257",
    "Trimohini, Kushtia",
    22282,
    0,
    "cement"
  ],
  [
    "Raju Enterprise (Bashundhara cement)",
    "01715080676",
    " Mollateghoria, Kushtia",
    78884,
    0,
    "cement"
  ],
  [
    "Ahnaf Traders (Fresh Cement)",
    "01722042435",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Azarul Traders (Fresh Cement)",
    "01720534316",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "M/S Karim Traders (Fresh Cement)",
    "01716923234",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Jony Traders (Fresh Cement)",
    "01711246612",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Al-Amin Traders (Fresh Cement)",
    "01714547317",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Natik Traders (Fresh Cement)",
    "01722233554",
    "Kumarkhali, Kushtia",
    280860,
    0,
    "cement"
  ],
  [
    "Arita Traders (Fresh Cement)",
    "01303454712",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Soaeb Traders (Fresh Cement)",
    "01723456426",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Abir Traders (Fresh Cement)",
    "01734796356",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Mobarak Sanitory & Hardware (Fresh Cement)",
    "01742193528",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "M/S Nural Eerouring (Fresh Cement)",
    "01712702483",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Halal Enyinrg (Fresh Cement)",
    "01738541228",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Abirta Traders (Fresh Cement)",
    "01776761728",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Mita Traders (Fresh Cement)",
    "01918970005",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Manir Traders (Fresh Cement)",
    "01716087318",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "HMA Sanitäry (Fresh Cement)",
    "01768302491",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Shouhae Sanitory (Fresh Cement)",
    "01939787522",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Samlal Traders (Fresh Cement)",
    "01716090202",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Belal Traders (Fresh Cement)",
    "01719763463",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Vai Vai Traders (Fresh Cement)",
    "01936457533",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Rukaya Traders (Fresh Cement)",
    "01922582257",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Manik Traders (Fresh Cement)",
    "01725222918",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Azizul Hck (Fresh Cement)",
    "01914722858",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Majibor Traders (Fresh Cement)",
    "01924206379",
    "Kumarkhali, Kushtia",
    272450,
    0,
    "cement"
  ],
  [
    "Hira Parves Hardware (Fresh Cement)",
    "01721892388",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Kalam Traders (Fresh Cement)",
    "01932325932",
    "Kumarkhali, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "Bari Traders (Fresh Cement)",
    "01927425596",
    "Kumarkhali, Kushtia",
    48950,
    0,
    "cement"
  ],
  [
    "Rongon Entrprise (Fresh Cement)",
    "01917797002",
    "Kushtia Sadar, Kushtia",
    23000,
    0,
    "cement"
  ],
  [
    "Halal traders (Fresh Cement)",
    "01921232100",
    "Kushtia Sadar, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "M/s Rafid Enterprise (Fresh Cement)",
    "01738784745",
    "Kushtia Sadar, Kushtia",
    1597450,
    0,
    "cement"
  ],
  [
    "M/S NISHARani TRADERS (Fresh Cement)",
    "01712034526",
    "Kushtia Sadar, Kushtia",
    0,
    427190,
    "cement"
  ],
  [
    "M/s Sotota Traders (Fresh Cement)",
    "01712885778",
    "Kushtia Sadar, Kushtia",
    331970,
    0,
    "cement"
  ],
  [
    "Sorola Traders (Fresh Cement)",
    "01712781938",
    "Kushtia Sadar, Kushtia",
    0,
    175750,
    "cement"
  ],
  [
    "M/S AHmAdul Enterprise (Fresh Cement)",
    "01718220951",
    "Kushtia Sadar, Kushtia",
    747570,
    0,
    "cement"
  ],
  [
    "Mohona Traders (Fresh Cement)",
    "01777402354",
    "Kushtia Sadar, Kushtia",
    64050,
    0,
    "cement"
  ],
  [
    "Bipna Traders (Fresh Cement)",
    "01711983100",
    "Kushtia Sadar, Kushtia",
    174100,
    0,
    "cement"
  ],
  [
    "Abbas Enterprise (Fresh Cement)",
    "01711270526",
    "Kumarkhali, Kushtia",
    790320,
    0,
    "cement"
  ],
  [
    "Shahed Traders (Panna) (Fresh Cement)",
    "01727691088",
    "Kushtia Sadar, Kushtia",
    243600,
    0,
    "cement"
  ],
  [
    "M/s Rahan Traders (Fresh Cement)",
    "01711044478",
    "Kushtia Sadar, Kushtia",
    422225,
    0,
    "cement"
  ],
  [
    "Jashim Traders (basir) (Fresh Cement)",
    "01713656218",
    "Kushtia Sadar, Kushtia",
    315000,
    0,
    "cement"
  ],
  [
    "Sabuj enterprise (Fresh Cement)",
    "01715251758",
    "Kushtia Sadar, Kushtia",
    581755,
    0,
    "cement"
  ],
  [
    "M/S Hena Enterprise (Fresh Cement)",
    "01722802561",
    "Kushtia Sadar, Kushtia",
    254297,
    0,
    "cement"
  ],
  [
    "SR Traders (Fresh Cement)",
    "01714821694",
    "Kushtia Sadar, Kushtia",
    280800,
    0,
    "cement"
  ],
  [
    "M/s Bhajokuko traders (Fresh Cement)",
    "01712956778",
    "Kushtia Sadar, Kushtia",
    8550,
    0,
    "cement"
  ],
  [
    "M/s Shiekh Enterprise (Fresh Cement)",
    "01711902499",
    "Kushtia Sadar, Kushtia",
    169200,
    0,
    "cement"
  ],
  [
    "M/S Arfan Traders (Fresh Cement)",
    "01920545395",
    "Kushtia Sadar, Kushtia",
    188080,
    0,
    "cement"
  ],
  [
    "SADIA TRADERS (Fresh Cement)",
    "01721491923",
    "Kushtia Sadar, Kushtia",
    91490,
    0,
    "cement"
  ],
  [
    "Mallik Traders (Fresh Cement)",
    "01719008389",
    "Kushtia Sadar, Kushtia",
    59950,
    0,
    "cement"
  ],
  [
    "M/S Makcie (Sirina) (Fresh Cement)",
    "01712008982",
    "Kushtia Sadar, Kushtia",
    0,
    40000,
    "cement"
  ],
  [
    "M/S.Sattan Traders (Fresh Cement)",
    "01961607256",
    "Kushtia Sadar, Kushtia",
    186912,
    0,
    "cement"
  ],
  [
    "Monirul Store (Fresh Cement)",
    "01927670286",
    "Kushtia Sadar, Kushtia",
    64590,
    0,
    "cement"
  ],
  [
    "M/S Sarsha Traders (Fresh Cement)",
    "01714407788",
    "Kushtia Sadar, Kushtia",
    192840,
    0,
    "cement"
  ],
  [
    "M/S Wahaby Traders (Fresh Cement)",
    "01712989088",
    "Kushtia Sadar, Kushtia",
    220308,
    0,
    "cement"
  ],
  [
    "Shihab Traders (Fresh Cement)",
    "01724989281",
    "Kushtia Sadar, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "M/S Belal Traders (Fresh Cement)",
    "01728007478",
    "Kushtia Sadar, Kushtia",
    51000,
    0,
    "cement"
  ],
  [
    "Pramanik Traders (Fresh Cement)",
    "01719528575",
    "Kushtia Sadar, Kushtia",
    275000,
    0,
    "cement"
  ],
  [
    "Joadder Traders (Fresh Cement)",
    "01713905297",
    "EB, Kushtia",
    0,
    20000,
    "cement"
  ],
  [
    "Shak Traders (Fresh Cement)",
    "01712426445",
    "EB, Kushtia",
    1000,
    0,
    "cement"
  ],
  [
    "Rajib Traders (Fresh Cement)",
    "01723447791",
    "EB, Kushtia",
    29400,
    0,
    "cement"
  ],
  [
    "Abu Kalam Traders (Fresh Cement)",
    "01723447756",
    "EB, Kushtia",
    69250,
    0,
    "cement"
  ],
  [
    "M/S Rahat Traders (Fresh Cement)",
    "01827574337",
    "EB, Kushtia",
    34900,
    0,
    "cement"
  ],
  [
    "Taher and Sons (Fresh Cement)",
    "01715734105",
    "EB, Kushtia",
    280200,
    0,
    "cement"
  ],
  [
    "Zia Enterprise (Fresh Cement)",
    "01718436998",
    "EB, Kushtia",
    487800,
    0,
    "cement"
  ],
  [
    "M/S Al Baraka Hardware (Fresh Cement)",
    "01621619550",
    "EB, Kushtia",
    125500,
    0,
    "cement"
  ],
  [
    "M/S Radsan Traders (Fresh Cement)",
    "01719426336",
    "EB, Kushtia",
    19950,
    0,
    "cement"
  ],
  [
    "M/S Lihaza Heardware (Fresh Cement)",
    "01714634275",
    "EB, Kushtia",
    238800,
    0,
    "cement"
  ],
  [
    "M/S Sonali Traders (Fresh Cement)",
    "01725326359",
    "EB, Kushtia",
    315500,
    0,
    "cement"
  ],
  [
    "Bakul & Brothers (Fresh Cement)",
    "01713905269",
    "EB, Kushtia",
    0,
    0,
    "cement"
  ],
  [
    "M/S soroj Entrprise (Fresh Cement)",
    "01711914746",
    "EB, Kushtia",
    182900,
    0,
    "cement"
  ],
  [
    "M/S Aktarul Heardware (Fresh Cement)",
    "01725402444",
    "EB, Kushtia",
    131000,
    0,
    "cement"
  ],
  [
    "Milon Trders (Dhalai Special) (Block)",
    "01733-312421",
    "Durba chara, Kushtia",
    55700,
    0,
    "cement"
  ],
  [
    "MAYNA Enterprise (Dhalai Special) (Block)",
    "01782-353609",
    "Matm, Kushtia",
    99000,
    0,
    "cement"
  ],
  [
    "Shaklim Entrprise (Dhalai Special) (Block)",
    "01715-687822",
    "Haripur, Kushtia",
    168043,
    0,
    "cement"
  ],
  [
    "Vai Vai Traders Geder Bazar (Dhalai Special)",
    "01742-208642",
    "Geder Bazar, Kumarkhali, Kushtia",
    51300,
    0,
    "cement"
  ],
  [
    "SR Hardware (Dhalai Special) (Block)",
    "01936-080163",
    "Chourangi, Kumarkhali, Kushtia",
    43200,
    0,
    "cement"
  ],
  [
    "Shak Traders (Dhalai Special)",
    "01718424092",
    "Nottola, Mirpur, Kushtia",
    0,
    192400,
    "cement"
  ],
  [
    "San Enterprise (Dhalai Special)",
    "01729-005792",
    "Arif Road, Mirpur, Kushtia",
    87670,
    0,
    "cement"
  ],
  [
    "Arafat Traders (Dhalai Special)",
    "01882-521340",
    "Mirpur, Kushtia",
    640800,
    0,
    "cement"
  ],
  [
    "Guddufi Entrprise (Dhalai Special) (Block)",
    "01913-313792",
    "Horiarampur, Kushtia",
    240300,
    0,
    "cement"
  ],
  [
    "Munshi Entrprise (Dhalai Special)",
    "01721-937376",
    "Madaripur, Kushtia",
    147000,
    0,
    "cement"
  ],
  [
    "Raja Entrprise (Dhalai Special)",
    "01721-527853",
    "Mollateghoria, Kushtia",
    68400,
    0,
    "cement"
  ],
  [
    "Arista Tils (Dhalai Special)",
    "01712-011051",
    "Bittipara, Kushtia",
    28420,
    0,
    "cement"
  ],
  [
    "Shohag Entrprise (Dhalai Special)",
    "01722-004054",
    "Lahin, Bot tola, Kushtia",
    48930,
    0,
    "cement"
  ]
];
const OPENING_DATE = new Date("2026-10-27");
const EXPECTED = {
  customers: 282,
  dueCustomers: 161,
  dueTaka: 31952333,
  advanceCustomers: 11,
  advanceTaka: 1621648,
};
const shouldCommit = process.argv.includes("--commit");
const diagnosticsOnly = process.argv.includes("--diagnose");

const normalizePhone = (phone) => String(phone).replace(/\D/g, "");
const customerKey = (name, phone) => `${String(name).trim().toLocaleLowerCase("en-US")}|${normalizePhone(phone)}`;

function validateSource() {
  if (CUSTOMERS_DATA.length !== EXPECTED.customers) {
    throw new Error(`Expected ${EXPECTED.customers} source rows; found ${CUSTOMERS_DATA.length}. No data was written.`);
  }

  const keys = new Set();
  let dueCount = 0;
  let dueTaka = 0;
  let advanceCount = 0;
  let advanceTaka = 0;
  const invalidPhones = [];

  for (const [index, row] of CUSTOMERS_DATA.entries()) {
    if (!Array.isArray(row) || row.length !== 6) throw new Error(`Invalid source row ${index + 1}. No data was written.`);
    const [name, phone, address, due, advance, tag] = row;
    if (!name?.trim() || !phone?.trim() || !address?.trim()) throw new Error(`Missing customer fields in source row ${index + 1}. No data was written.`);
    if (!Number.isSafeInteger(due) || due < 0 || !Number.isSafeInteger(advance) || advance < 0 || (due > 0 && advance > 0)) {
      throw new Error(`Invalid opening balance in source row ${index + 1}. No data was written.`);
    }

    const key = customerKey(name, phone);
    if (keys.has(key)) throw new Error(`Duplicate name and phone in source row ${index + 1}. No data was written.`);
    keys.add(key);

    const isGeneral = tag === "general";
    if (isGeneral !== (/\(General\)\s*$/i.test(name) || name.trim().toLowerCase() === "faiz")) {
      throw new Error(`Unexpected customer category in source row ${index + 1}. No data was written.`);
    }
    if (!["general", "cement"].includes(tag)) throw new Error(`Unsupported customer category in source row ${index + 1}. No data was written.`);

    if (due > 0) { dueCount += 1; dueTaka += due; }
    if (advance > 0) { advanceCount += 1; advanceTaka += advance; }
    if (normalizePhone(phone).length !== 11) invalidPhones.push(index + 1);
  }

  if (dueCount !== EXPECTED.dueCustomers || dueTaka !== EXPECTED.dueTaka ||
      advanceCount !== EXPECTED.advanceCustomers || advanceTaka !== EXPECTED.advanceTaka) {
    throw new Error("Source balance totals do not match the reviewed dataset. No data was written.");
  }

  return { dueCount, dueTaka, advanceCount, advanceTaka, invalidPhones };
}

function findConflicts(existingCustomers) {
  const incoming = new Set(CUSTOMERS_DATA.map(([name, phone]) => customerKey(name, phone)));
  return existingCustomers.filter((customer) => incoming.has(customerKey(customer.name, customer.phone)));
}

async function main() {
  const totals = validateSource();
  try {
    await connectDB();
    if (diagnosticsOnly) {
      await mongoClient.connect();
      const hello = await mongoClient.db().admin().command({ hello: 1 });
      let transactionSupported = false;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Customer.countDocuments({}).session(session);
        });
        transactionSupported = true;
      } finally {
        await session.endSession();
      }

      const [customerCount, openingEntryCount] = await Promise.all([
        Customer.countDocuments({}),
        LedgerEntry.countDocuments({ type: { $in: ["opening_due", "advance"] } }),
      ]);
      console.log(JSON.stringify({
        diagnostics: {
          topology: hello.setName ? "replicaSet" : hello.msg === "isdbgrid" ? "mongos" : "unknown",
          transactionSupported,
          logicalSessionTimeoutMinutes: hello.logicalSessionTimeoutMinutes ?? null,
          customerCount,
          openingEntryCount,
        },
      }));
      return;
    }

    const existing = await Customer.find({}).select("name phone").lean();
    const conflicts = findConflicts(existing);
    if (conflicts.length) {
      throw new Error(`${conflicts.length} matching customer record(s) already exist. Import stopped without changing any records.`);
    }

    const ledgerEntries = totals.dueCount + totals.advanceCount;
    console.log(`Validated ${CUSTOMERS_DATA.length} customers.`);
    console.log(`Opening due: ${totals.dueCount} customers, ৳${totals.dueTaka.toLocaleString("en-US")} (${totals.dueTaka * 100} paisa).`);
    console.log(`Opening advance: ${totals.advanceCount} customers, ৳${totals.advanceTaka.toLocaleString("en-US")} (${totals.advanceTaka * 100} paisa).`);
    console.log(`Expected opening ledger entries: ${ledgerEntries}.`);
    if (totals.invalidPhones.length) {
      console.warn(`Source rows with a phone number that is not 11 digits after removing separators: ${totals.invalidPhones.join(", ")}. Source values will be preserved.`);
    }

    if (!shouldCommit) {
      console.log("Dry run only. No database records were written. Re-run with --commit to import.");
      return;
    }

    const transactionStartedAt = performance.now();
    await withTx(async (session) => {
      let stageStartedAt = performance.now();
      const logStage = (stage) => {
        const now = performance.now();
        console.log(`Transaction stage ${stage}: ${Math.round(now - stageStartedAt)}ms elapsed; ${Math.round(now - transactionStartedAt)}ms total.`);
        stageStartedAt = now;
      };

      const current = await Customer.find({}).select("name phone").session(session).lean();
      const currentConflicts = findConflicts(current);
      if (currentConflicts.length) {
        throw new Error(`${currentConflicts.length} matching customer record(s) appeared before commit. Import stopped.`);
      }
      logStage("conflict check");

      const customers = await Customer.insertMany(CUSTOMERS_DATA.map(([name, phone, address, dueTaka, advanceTaka, tag]) => ({
          name,
          phone,
          address: address.trim(),
          tags: tag === "general" ? [] : ["cement"],
          balance: 0,
          active: true,
        })), { session, ordered: true });
      logStage("customer insert");
      const createdCustomers = customers.map((customer, index) => ({
        customer,
        dueTaka: CUSTOMERS_DATA[index][3],
        advanceTaka: CUSTOMERS_DATA[index][4],
      }));
      if (createdCustomers.length !== CUSTOMERS_DATA.length || createdCustomers.some(({ customer }) => !customer?._id)) {
        throw new Error("Customer insert did not return all generated IDs. Transaction will be rolled back.");
      }

      const openingEntries = [];
      for (const { customer, dueTaka, advanceTaka } of createdCustomers) {
        if (dueTaka > 0) {
          const amount = dueTaka * 100;
          openingEntries.push({
            partyId: customer._id,
            date: OPENING_DATE,
            type: "opening_due",
            debit: amount,
            credit: 0,
            description: "Opening due balance",
          });
        } else if (advanceTaka > 0) {
          const amount = advanceTaka * 100;
          openingEntries.push({
            partyId: customer._id,
            date: OPENING_DATE,
            type: "advance",
            debit: 0,
            credit: amount,
            description: "Opening advance balance",
          });
        }
      }
      await postEntry(openingEntries, session);
      logStage("opening ledger entries");

      const ids = createdCustomers.map(({ customer }) => customer._id);
      const balanceTotals = await Customer.aggregate([
        { $match: { _id: { $in: ids } } },
        { $group: {
          _id: null,
          due: { $sum: { $cond: [{ $gt: ["$balance", 0] }, "$balance", 0] } },
          dueCount: { $sum: { $cond: [{ $gt: ["$balance", 0] }, 1, 0] } },
          advance: { $sum: { $cond: [{ $lt: ["$balance", 0] }, { $multiply: ["$balance", -1] }, 0] } },
        } },
      ]).session(session);
      const actualLedgerCount = await LedgerEntry.countDocuments({ partyType: "customer", partyId: { $in: ids } }).session(session);
      logStage("balance verification queries");
      const actual = balanceTotals[0] || { due: 0, dueCount: 0, advance: 0 };
      if (actual.due !== totals.dueTaka * 100 || actual.dueCount !== totals.dueCount ||
          actual.advance !== totals.advanceTaka * 100 || actualLedgerCount !== ledgerEntries) {
        throw new Error("Post-import balance or ledger verification failed. Transaction will be rolled back.");
      }
    });
    console.log(`Transaction completed in ${Math.round(performance.now() - transactionStartedAt)}ms.`);

    console.log(`Import complete: ${CUSTOMERS_DATA.length} customers and ${ledgerEntries} opening ledger entries.`);
    console.log(`Verified receivable due: ৳${totals.dueTaka.toLocaleString("en-US")} across ${totals.dueCount} customers.`);
  } finally {
    await mongoose.disconnect();
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    name: error?.name || "Error",
    message: error instanceof Error ? error.message : "Customer import failed.",
    code: error?.code,
    errorLabels: error?.errorLabels || [],
    cause: error?.cause instanceof Error ? error.cause.message : undefined,
  }));
  process.exitCode = 1;
});
