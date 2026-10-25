// Geen "server-only": dit woordenboek wordt enkel client-side gebruikt (Header
// en AgendaView), maar bevat geen geheimen, dus een server-import zou ook geen
// kwaad kunnen. Vertaalt enkel de vaste schermteksten (chrome); door de
// beheerder ingevoerde inhoud (titel, locatie, beschrijving, en de naam van
// een soort) blijft zoals ingevoerd. Een soort heeft z'n eigen naamNl/naamTr
// in de database (zie lib/soort-types.ts), dus dit woordenboek hoeft geen
// soortnamen meer te vertalen.
export const TALEN = ["nl", "tr"] as const;
export type Taal = (typeof TALEN)[number];

export type WoordenBoek = {
  agenda: string;
  beheer: string;
  uitloggen: string;
  inloggen: string;
  weergave: string;
  vandaag: string;
  dag: string;
  week: string;
  maand: string;
  jaar: string;
  lijst: string;
  d1: string;
  d2: string;
  d3: string;
  toevoegen: string;
  komende: string;
  soortenBeheren: string;
  nieuweSoort: string;
  klaar: string;
  abonneerKort: string;
  abonneer: string;
  abonneerTekst: string;
  google: string;
  apple: string;
  kopieer: string;
  gekopieerd: string;
  uur: string;
  heleDag: string;
  alles: string;
  meer: string;
  geenDag: string;
  dagVol: string[];
  dagKort: string[];
  wk: string[];
  maanden: string[];
  maandKort: string[];
};

export const DICT: Record<Taal, WoordenBoek> = {
  nl: {
    agenda: "Agenda",
    beheer: "Beheer",
    uitloggen: "Uitloggen",
    inloggen: "Inloggen",
    weergave: "Weergave",
    vandaag: "Vandaag",
    dag: "Dag",
    week: "Week",
    maand: "Maand",
    jaar: "Jaar",
    lijst: "Lijst",
    d1: "1 dag",
    d2: "2 dagen",
    d3: "3 dagen",
    toevoegen: "Toevoegen aan mijn agenda",
    komende: "Komende activiteiten",
    soortenBeheren: "Soorten beheren",
    nieuweSoort: "Nieuwe soort",
    klaar: "Klaar",
    abonneerKort: "Abonneren",
    abonneer: "Abonneer op de hele agenda",
    abonneerTekst: "Nieuwe activiteiten verschijnen vanzelf in je eigen agenda-app.",
    google: "Google Agenda",
    apple: "Apple Agenda",
    kopieer: "Kopieer link",
    gekopieerd: "Gekopieerd!",
    uur: "uur",
    heleDag: "Hele dag",
    alles: "Alles",
    meer: "meer",
    geenDag: "Geen activiteiten op deze dag.",
    dagVol: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    dagKort: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    wk: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
    maanden: [
      "januari", "februari", "maart", "april", "mei", "juni",
      "juli", "augustus", "september", "oktober", "november", "december",
    ],
    maandKort: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  },
  tr: {
    agenda: "Ajanda",
    beheer: "Yönetim",
    uitloggen: "Çıkış",
    inloggen: "Giriş",
    weergave: "Görünüm",
    vandaag: "Bugün",
    dag: "Gün",
    week: "Hafta",
    maand: "Ay",
    jaar: "Yıl",
    lijst: "Liste",
    d1: "1 gün",
    d2: "2 gün",
    d3: "3 gün",
    toevoegen: "Takvimime ekle",
    komende: "Yaklaşan etkinlikler",
    soortenBeheren: "Türleri yönet",
    nieuweSoort: "Yeni tür",
    klaar: "Bitti",
    abonneerKort: "Abone ol",
    abonneer: "Tüm ajandaya abone ol",
    abonneerTekst: "Yeni etkinlikler kendi takvim uygulamanda otomatik görünür.",
    google: "Google Takvim",
    apple: "Apple Takvim",
    kopieer: "Bağlantıyı kopyala",
    gekopieerd: "Kopyalandı!",
    uur: "saat",
    heleDag: "Tüm gün",
    alles: "Hepsi",
    meer: "daha",
    geenDag: "Bu gün için etkinlik yok.",
    dagVol: ["pazar", "pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi"],
    dagKort: ["paz", "pzt", "sal", "çar", "per", "cum", "cmt"],
    wk: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    maanden: [
      "ocak", "şubat", "mart", "nisan", "mayıs", "haziran",
      "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık",
    ],
    maandKort: ["oca", "şub", "mar", "nis", "may", "haz", "tem", "ağu", "eyl", "eki", "kas", "ara"],
  },
};
