# Dokument wymagań produktu (PRD) - VideoSummary

## Streszczenie

VideoSummary to aplikacja internetowa zaprojektowana dla użytkowników, którzy subskrybują wiele wartościowych kanałów YouTube, ale brakuje im czasu na regularne oglądanie wszystkich publikowanych treści. Aplikacja rozwiązuje ten problem, automatycznie generując zwięzłe, ustrukturyzowane podsumowania nowych filmów z kanałów subskrybowanych przez użytkownika. Wizją produktu jest umożliwienie użytkownikom efektywnego przyswajania wiedzy i bycia na bieżąco z kluczowymi informacjami w ułamku czasu wymaganego do obejrzenia pełnych materiałów, eliminując w ten sposób "strach przed przegapieniem" (FOMO).

## 1. Problem i rozwiązanie

Głównym problemem, na który odpowiada VideoSummary, jest przeciążenie informacyjne i brak czasu. Użytkownicy śledzą kanały o tematyce edukacyjnej, finansowej, czy newsowej, aby się rozwijać i być na bieżąco. Jednak natłok codziennych obowiązków uniemożliwia im regularne oglądanie wszystkich interesujących materiałów. W rezultacie cenne treści umykają, a użytkownicy odczuwają frustrację i wrażenie, że coś ważnego ich omija. VideoSummary celuje w rozwiązanie tego konfliktu, dostarczając skondensowaną wartość z długich materiałów wideo w przystępnej formie.

## 2. Grupa docelowa

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i Profil Użytkownika

- Rejestracja i logowanie za pomocą adresu e-mail i hasła.
- Kompletny mechanizm resetowania hasła ("zapomniałem hasła").
- Prosta strona profilu użytkownika z listą subskrybowanych kanałów i opcją ich usuwania oraz przycisk "Wyloguj".

### 3.2. Zarządzanie Kanałami

- Możliwość dodawania kanałów YouTube poprzez wklejenie pełnego adresu URL kanału.
- Limit 10 subskrybowanych kanałów na użytkownika.

### 3.3. Generowanie Podsumowań

- Automatyczne generowanie: Raz dziennie (godz. 19:00) system skanuje kanały i generuje podsumowanie dla jednego najnowszego filmu z każdego kanału.
- Manualne generowanie: Użytkownik może ręcznie wygenerować podsumowanie dla filmu z kanału, który subskrybuje.
- Dzienny limit jednego **udanego** podsumowania na kanał **globalnie** (współdzielony przez automat, akcję manualną i wszystkich użytkowników):
  - Podsumowania są współdzielonym zasobem - jedno podsumowanie służy wszystkim użytkownikom subskrybującym dany kanał.
  - Jeśli użytkownik A wygeneruje podsumowanie dla kanału X dzisiaj, użytkownik B zobaczy to samo podsumowanie (nie może wygenerować kolejnego tego samego dnia).
  - Nieudane próby generowania (np. brak napisów) nie liczą się do limitu i można je ponawiać.
- Dwa formaty podsumowań generowane w jednym zapytaniu LLM:
  - TL;DR (do 100 tokenów).
  - Pełne podsumowanie (do 500 tokenów, w formacie JSON z sekcjami: `summary`, `conclusions`, `key_points`).

### 3.4. Interfejs Użytkownika (Dashboard)

- Główny dashboard z listą podsumowań w formie kart, sortowanych chronologicznie.
- Karta podsumowania zawiera: tytuł filmu, nazwę kanału, datę publikacji na YT oraz TL;DR.
- Dedykowana podstrona dla każdego podsumowania (`/dashboard/[id]`) z pełną treścią, linkiem do oryginału oraz przyciskami do oceny (kciuk w górę/dół).
- Opcja ukrywania pojedynczych podsumowań z dashboardu użytkownika (podsumowania są współdzielone między użytkownikami, więc nie mogą być fizycznie usuwane).
- Pełna responsywność interfejsu (RWD) dla przeglądarek mobilnych.

### 3.5. Obsługa Błędów i Powiadomień

- Wykorzystanie powiadomień "toast" do informowania o statusach i błędach.
- Czytelne komunikaty o błędach generowania podsumowań (np. "Brak napisów", "Film prywatny").
- Specjalny komunikat dla filmów dłuższych niż 45 minut.

### 3.6. Specyfikacja Techniczna

- Frontend: Astro 5 + React 19, Tailwind CSS 4, shadcn/ui.
- Backend: Supabase (PostgreSQL + Auth) z zaimplementowanym Row-Level Security (RLS).
- Baza Danych: PostgreSQL (przez Supabase).
- Integracja z LLM: OpenRouter.
- Testowanie: Testy jednostkowe (Vitest), testy E2E (Playwright).
- Automatyzacja: CI/CD (GitHub Actions).
- Hosting: DigitalOcean (Docker container).

## 4. Granice produktu

Następujące funkcjonalności są świadomie wyłączone z zakresu MVP i zostaną rozważone w przyszłych iteracjach produktu:

- Generowanie podsumowań z dowolnego linku do filmu YouTube (bez subskrypcji kanału).
- Zaawansowany system kategoryzacji i filtrowania podsumowań.
- Możliwość edycji danych profilu użytkownika (poza hasłem).
- Logowanie przez dostawców zewnętrznych (np. Google, GitHub).
- Obsługa filmów o długości przekraczającej 45 minut.
- Tłumaczenie podsumowań na inne języki.
- Płatne plany subskrypcyjne zwiększające limity.
- Optymalizacja kosztów LLM poprzez generowanie jednego podsumowania dla wielu użytkowników.
- Dedykowana aplikacja mobilna.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc zarejestrować się w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło (z potwierdzeniem).
  - Walidacja po stronie klienta i serwera sprawdza poprawność formatu e-maila i siłę hasła.
  - Po pomyślnej rejestracji, użytkownik jest automatycznie logowany i przekierowywany na główny dashboard.
  - W przypadku błędu (np. zajęty e-mail), wyświetlany jest czytelny komunikat.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, podając e-mail i hasło, aby kontynuować korzystanie z aplikacji.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po pomyślnym zalogowaniu, użytkownik jest przekierowywany na główny dashboard.
  - W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat.

- ID: US-003
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę móc wylogować się z aplikacji, aby zapewnić bezpieczeństwo mojego konta.
- Kryteria akceptacji:
  - W interfejsie użytkownika (np. na stronie profilu) znajduje się przycisk "Wyloguj".
  - Po kliknięciu przycisku, sesja użytkownika jest kończona, a on sam jest przekierowywany na stronę logowania.

- ID: US-004
- Tytuł: Resetowanie zapomnianego hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość zainicjowania procesu jego resetowania, aby odzyskać dostęp do mojego konta.
- Kryteria akceptacji:
  - Na stronie logowania znajduje się link "Zapomniałem hasła".
  - Po kliknięciu i podaniu adresu e-mail, na skrzynkę użytkownika wysyłany jest link do zresetowania hasła.
  - Link jest unikalny, jednorazowy i ma ograniczony czas ważności.
  - Po przejściu pod link, użytkownik może ustawić nowe hasło.

### Zarządzanie Kanałami

- ID: US-005
- Tytuł: Dodawanie nowego kanału YouTube
- Opis: Jako zalogowany użytkownik, chcę dodać kanał YouTube do mojej listy subskrypcji poprzez wklejenie jego adresu URL, aby system zaczął go monitorować.
- Kryteria akceptacji:
  - W interfejsie znajduje się pole do wklejenia adresu URL kanału.
  - System waliduje, czy podany link jest poprawnym adresem URL kanału YouTube.
  - Po pomyślnym dodaniu, kanał pojawia się na liście subskrybowanych kanałów na stronie profilu.
  - Użytkownik otrzymuje powiadomienie "toast" o pomyślnym dodaniu kanału.

- ID: US-006
- Tytuł: Ograniczenie liczby subskrybowanych kanałów
- Opis: Jako użytkownik posiadający już 10 subskrybowanych kanałów, przy próbie dodania kolejnego, chcę zobaczyć komunikat o błędzie informujący o osiągnięciu limitu.
- Kryteria akceptacji:
  - System nie pozwala na dodanie więcej niż 10 kanałów dla jednego użytkownika.
  - Przy próbie dodania jedenastego kanału, wyświetlany jest czytelny komunikat "toast" o błędzie.

- ID: US-007
- Tytuł: Usuwanie kanału z subskrypcji
- Opis: Jako zalogowany użytkownik, chcę móc usunąć kanał z mojej listy subskrypcji, aby system przestał generować dla niego podsumowania.
- Kryteria akceptacji:
  - Na liście subskrybowanych kanałów (strona profilu) przy każdej pozycji znajduje się opcja "Usuń".
  - Po potwierdzeniu chęci usunięcia, kanał znika z listy.
  - System przestaje monitorować usunięty kanał.

### Interakcja z Podsumowaniami

- ID: US-008
- Tytuł: Przeglądanie podsumowań na dashboardzie
- Opis: Jako zalogowany użytkownik, chcę widzieć na głównym dashboardzie listę wygenerowanych podsumowań w formie kart, posortowanych od najnowszego, abym mógł szybko zorientować się w nowych treściach.
- Kryteria akceptacji:
  - Dashboard jest domyślną stroną po zalogowaniu.
  - Każda karta zawiera tytuł filmu, nazwę kanału, datę publikacji filmu oraz podsumowanie TL;DR.
  - Lista jest paginowana lub wykorzystuje nieskończone przewijanie, jeśli podsumowań jest dużo.

- ID: US-009
- Tytuł: Wyświetlanie pełnego podsumowania
- Opis: Jako użytkownik, chcę móc kliknąć w kartę podsumowania, aby przejść na dedykowaną stronę z jego pełną, sformatowaną treścią.
- Kryteria akceptacji:
  - Kliknięcie w kartę przenosi na unikalny URL (np. `/dashboard/[id]`).
  - Strona wyświetla pełne podsumowanie z podziałem na sekcje (`summary`, `conclusions`, `key_points`).
  - Na stronie znajduje się również link do oryginalnego filmu na YouTube, data publikacji oraz data wygenerowania podsumowania.

- ID: US-010
- Tytuł: Manualne generowanie podsumowania
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego wygenerowania podsumowania dla filmu z kanału, który subskrybuję, aby nie czekać na codzienny cykl automatyczny.
- Kryteria akceptacji:
  - W interfejsie dostępny jest formularz do wklejenia linku do filmu.
  - System sprawdza, czy link prowadzi do filmu z subskrybowanego kanału.
  - System sprawdza, czy dzienny limit podsumowań dla danego kanału nie został wykorzystany.
  - Po zainicjowaniu, użytkownik widzi powiadomienie "toast" "Generowanie w toku...".
  - Po zakończeniu, nowe podsumowanie pojawia się na górze listy na dashboardzie.

- ID: US-011
- Tytuł: Ocenianie podsumowania
- Opis: Jako użytkownik, na stronie szczegółowej podsumowania, chcę móc je ocenić za pomocą ikon "kciuk w górę" lub "kciuk w dół", aby przekazać feedback.
- Kryteria akceptacji:
  - Na stronie pełnego podsumowania znajdują się dwie klikalne ikony: "kciuk w górę" i "kciuk w dół".
  - Użytkownik może wybrać jedną z opcji. Jego wybór jest zapisywany w bazie danych.
  - Po zagłosowaniu, interfejs może pokazać wizualne potwierdzenie oddania głosu.

- ID: US-012
- Tytuł: Ukrywanie wygenerowanego podsumowania
- Opis: Jako użytkownik, chcę mieć możliwość ukrycia pojedynczego podsumowania z mojego dashboardu, aby zachować porządek i personalizować mój widok.
- Kryteria akceptacji:
  - Na karcie podsumowania lub na jego stronie szczegółowej znajduje się opcja "Ukryj".
  - Po potwierdzeniu, podsumowanie znika z dashboardu użytkownika, ale pozostaje w bazie danych (jest współdzielone z innymi użytkownikami).
  - Podsumowanie może być przywrócone do widoku poprzez dedykowaną stronę "Ukryte" (`/hidden`).
  - Inne użytkowniki subskrybujący ten sam kanał nadal widzą to podsumowanie na swoich dashboardach.

### Scenariusze brzegowe i obsługa błędów

- ID: US-013
- Tytuł: Obsługa błędu generowania podsumowania
- Opis: Jako użytkownik, w sytuacji gdy podsumowanie dla danego filmu nie może zostać wygenerowane, chcę zobaczyć na dashboardzie czytelną informację o przyczynie problemu.
- Kryteria akceptacji:
  - Jeśli generowanie się nie powiedzie, na karcie filmu zamiast podsumowania pojawia się status błędu.
  - Komunikaty są jasne dla użytkownika, np. "Błąd: Brak dostępnych napisów", "Błąd: Film jest prywatny lub usunięty".

- ID: US-014
- Tytuł: Obsługa filmów zbyt długich
- Opis: Jako użytkownik, przy próbie manualnego wygenerowania podsumowania dla filmu dłuższego niż 45 minut, chcę otrzymać informację, że operacja nie jest wspierana.
- Kryteria akceptacji:
  - System przed rozpoczęciem generowania weryfikuje długość filmu.
  - Jeśli film przekracza 45 minut, proces jest przerywany.
  - Użytkownik otrzymuje powiadomienie "toast" z komunikatem: "Obsługa filmów dłuższych niż 45 minut nie jest obecnie wspierana".

## 6. Metryki sukcesu

Sukces MVP będzie mierzony za pomocą następujących kluczowych wskaźników:

- Aktywność i zaangażowanie: Użytkownicy generują średnio co najmniej 1 podsumowanie na każdy subskrybowany kanał w ciągu tygodnia.
- Jakość generowanych treści: Co najmniej 70% wszystkich ocenionych podsumowań otrzymuje ocenę pozytywną ("kciuk w górę").
- Stabilność i niezawodność: Co najmniej 80% wszystkich dodanych przez użytkowników kanałów jest aktywnie i bezbłędnie monitorowanych przez system (brak błędów API lub innych problemów technicznych).
