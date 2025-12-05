# Architektura UI dla VideoSummary

## Streszczenie

Architektura interfejsu użytkownika VideoSummary opiera się na hybrydowym podejściu z wykorzystaniem Astro 5 do renderowania statycznych powłok i wysp React 19 dla interaktywnych elementów. Struktura jest podzielona na widoki publiczne (takie jak logowanie i rejestracja) oraz chronione (dashboard, podsumowania, profil), z naciskiem na responsywność mobilną, dostępność WCAG AA i bezpieczeństwo poprzez middleware autoryzacyjne. Nawigacja opiera się na górnym pasku z menu użytkownika i wyszukiwaniem, a interakcje wykorzystują toasty do powiadomień i modale do potwierdzeń. Całość zapewnia szybki dostęp do podsumowań, minimalizując obciążenie użytkownika i optymalizując doświadczenie dla osób z ograniczonym czasem.

## 1. Główne założenia i technologie

Architektura interfejsu użytkownika VideoSummary opiera się na hybrydowym podejściu z wykorzystaniem Astro 5 do renderowania statycznych powłok i wysp React 19 dla interaktywnych elementów. Struktura jest podzielona na widoki publiczne (takie jak logowanie i rejestracja) oraz chronione (dashboard, podsumowania, profil), z naciskiem na responsywność mobilną, dostępność WCAG AA i bezpieczeństwo poprzez middleware autoryzacyjne. Nawigacja opiera się na górnym pasku z menu użytkownika i wyszukiwaniem, a interakcje wykorzystują toasty do powiadomień i modale do potwierdzeń. Całość zapewnia szybki dostęp do podsumowań, minimalizując obciążenie użytkownika i optymalizując doświadczenie dla osób z ograniczonym czasem.

## 2. Lista widoków

- **Nazwa widoku**: Strona logowania  
  **Ścieżka widoku**: /login  
  **Główny cel**: Umożliwienie zalogowanym użytkownikom dostępu do aplikacji poprzez podanie e-maila i hasła.  
  **Kluczowe informacje do wyświetlenia**: Formularz z polami e-mail i hasło, link do rejestracji i resetu hasła, komunikat o błędach.  
  **Kluczowe komponenty widoku**: Centrowany formularz, przycisk logowania, linki nawigacyjne.  
  **UX, dostępność i względy bezpieczeństwa**: Prosty, centrowany layout dla szybkiego logowania; walidacja formularza z komunikatami błędów; ARIA etykiety dla pól; ochrona przed nieautoryzowanym dostępem poprzez middleware.

- **Nazwa widoku**: Strona rejestracji  
  **Ścieżka widoku**: /register  
  **Główny cel**: Rejestracja nowego użytkownika z walidacją e-maila i hasła, z automatycznym logowaniem po sukcesie.  
  **Kluczowe informacje do wyświetlenia**: Formularz z e-mailem, hasłem i potwierdzeniem hasła, link do logowania.  
  **Kluczowe komponenty widoku**: Formularz z walidacją, przycisk rejestracji.  
  **UX, dostępność i względy bezpieczeństwa**: Walidacja po stronie klienta i serwera; toasty z błędami (np. zajęty e-mail); fokus klawiaturowy; bezpieczne hashowanie haseł.

- **Nazwa widoku**: Strona resetu hasła  
  **Ścieżka widoku**: /reset-password  
  **Główny cel**: Inicjowanie procesu resetu hasła poprzez wysłanie e-maila z linkiem.  
  **Kluczowe informacje do wyświetlenia**: Formularz z e-mailem, komunikat o wysłaniu linku.  
  **Kluczowe komponenty widoku**: Prosty formularz, przycisk wysłania.  
  **UX, dostępność i względy bezpieczeństwa**: Link jednorazowy z limitem czasu; toast potwierdzenia; ochrona przed brute-force.

- **Nazwa widoku**: Potwierdzenie resetu hasła  
  **Ścieżka widoku**: /reset-password/confirm  
  **Główny cel**: Ustawienie nowego hasła po kliknięciu linku z e-maila.  
  **Kluczowe informacje do wyświetlenia**: Formularz z nowym hasłem i potwierdzeniem, komunikat sukcesu.  
  **Kluczowe komponenty widoku**: Formularz hasła, przycisk zapisu.  
  **UX, dostępność i względy bezpieczeństwa**: Walidacja siły hasła; redirect do logowania; token jednorazowy.

- **Nazwa widoku**: Dashboard  
  **Ścieżka widoku**: /dashboard  
  **Główny cel**: Wyświetlenie listy najnowszych podsumowań w formie kart dla szybkiego przeglądu.  
  **Kluczowe informacje do wyświetlenia**: Karty z tytułem filmu, kanałem, datą i TL;DR; CTA do generowania; pusty stan bez subskrypcji.  
  **Kluczowe komponenty widoku**: Lista kart, nieskończone przewijanie, przycisk generowania.  
  **UX, dostępność i względy bezpieczeństwa**: Sortowanie chronologiczne; skeleton loading; ARIA dla kart; RLS na dane.

- **Nazwa widoku**: Lista podsumowań  
  **Ścieżka widoku**: /summaries  
  **Główny cel**: Filtrowana lista podsumowań z akcjami takimi jak ukrywanie i ocenianie.  
  **Kluczowe informacje do wyświetlenia**: Tabela lub siatka z filtrami, wyszukiwaniem; statystyki ocen.  
  **Kluczowe komponenty widoku**: Tabela/siatka, filtry, przyciski akcji.  
  **UX, dostępność i względy bezpieczeństwa**: Nieskończone przewijanie; debounced wyszukiwanie; fokus na filtrach; autoryzacja na akcjach.

- **Nazwa widoku**: Szczegóły podsumowania  
  **Ścieżka widoku**: /summaries/[id]  
  **Główny cel**: Wyświetlenie pełnego podsumowania z sekcjami i opcjami interakcji.  
  **Kluczowe informacje do wyświetlenia**: Tytuł, kanał, link do filmu, sekcje podsumowania, oceny, przyciski ukrycia/oceny.  
  **Kluczowe komponenty widoku**: Stacked layout, ikony ocen, link do YT.  
  **UX, dostępność i względy bezpieczeństwa**: Responsywny stack; alt dla miniatur; potwierdzenie ukrycia; RLS na dostęp.

- **Nazwa widoku**: Profil użytkownika  
  **Ścieżka widoku**: /profile  
  **Główny cel**: Zarządzanie subskrypcjami i wylogowanie.  
  **Kluczowe informacje do wyświetlenia**: Lista subskrybowanych kanałów, przyciski usuwania, przycisk wylogowania.  
  **Kluczowe komponenty widoku**: Tabela subskrypcji, formularz zmiany hasła, menu użytkownika.  
  **UX, dostępność i względy bezpieczeństwa**: Potwierdzenie usuwania; limit 10 kanałów; ARIA dla tabeli; sesja Supabase.

- **Nazwa widoku**: Generowanie podsumowania  
  **Ścieżka widoku**: /generate  
  **Główny cel**: Ręczne generowanie podsumowania poprzez URL filmu z subskrybowanego kanału.  
  **Kluczowe informacje do wyświetlenia**: Formularz URL, podgląd filmu, sprawdzenie limitu, komunikat błędów.  
  **Kluczowe komponenty widoku**: Formularz z walidacją, podgląd, przycisk generowania.  
  **UX, dostępność i względy bezpieczeństwa**: Walidacja URL; toast dla limitu; debounce; sprawdzenie subskrypcji.

- **Nazwa widoku**: Lista filmów  
  **Ścieżka widoku**: /videos  
  **Główny cel**: Przegląd filmów z subskrybowanych kanałów bez podsumowań.  
  **Kluczowe informacje do wyświetlenia**: Karty filmów z miniaturami, filtrami kanału; overlay do generowania.  
  **Kluczowe komponenty widoku**: Siatka kart, filtry.  
  **UX, dostępność i względy bezpieczeństwa**: Infinite scroll; alt dla miniaturek; RLS na filmy.

## 3. Mapa podróży użytkownika

Podróż użytkownika zaczyna się od publicznej strony logowania lub rejestracji. Po sukcesie, middleware przekierowuje do /dashboard, gdzie nowy użytkownik widzi pusty stan i jest zachęcany do dodania kanału via /profile (dodanie URL → walidacja → toast sukcesu). Na dashboardzie kliknięcie karty prowadzi do /summaries/[id] dla szczegółów, z opcjami oceny (ikony kciuków → mutacja API → toast) lub ukrycia (modal potwierdzenia → hide endpoint). Do generowania: /generate → input URL → sprawdzenie limitu via API → toast "w toku" → redirect do dashboardu. Zarządzanie: /profile → usuwanie subskrypcji (potwierdzenie → DELETE → refetch). Błędy: toasty dla limitów, brak napisów; wylogowanie → /login. Przepływ jest liniowy dla głównego użycia (przegląd → szczegóły → akcje), z globalnym wyszukiwaniem dla szybkiej nawigacji.

## 4. Układ i struktura nawigacji

Nawigacja opiera się na stałym górnym headerze z logo po lewej, globalnym wyszukiwaniem (Cmd+K modal) pośrodku i menu użytkownika (avatar, profil, wyloguj) po prawej. Na mobile: hamburger Sheet (<768px) z linkami do dashboard, summaries, videos, profile, generate. Brak dolnych tabów dla spójności. Middleware chroni chronione routes, przekierowując nieautoryzowanych do /login z zachowaniem ?from= dla powrotu. Linki wewnętrzne używają Astro routing; wyszukiwanie integruje z filtrami w listach. Skip link do #main dla dostępności.

## 5. Kluczowe komponenty

- **Header**: Stały pasek nawigacyjny z logo, wyszukiwaniem i menu użytkownika; responsywny z hamburgerem na mobile.  
- **SummaryCard**: Karta z miniaturą, tytułem, TL;DR i akcjami (klik do szczegółów, ukryj); ARIA dla interaktywności.  
- **RatingButtons**: Ikony kciuków w górę/dół z wizualnym potwierdzeniem; obsługa mutacji z optimistic updates.  
- **ToastNotifications**: Globalne powiadomienia (Sonner) dla sukcesów/błędów (np. "Generowanie w toku"); auto-zamykające się.  
- **ConfirmModal**: Modal potwierdzenia dla destrukcyjnych akcji (ukryj, usuń subskrypcję); klawiatura ESC do anulowania.  
- **FormInput**: Walidowane pola (Zod) z debounce dla URL/wyszukiwania; etykiety ARIA i focus management.  
- **LoadingSkeleton**: Placeholder'y dla list i szczegółów podczas ładowania; redukcja perceived latency.  
- **EmptyState**: Ilustrowany komunikat z CTA dla pustych list (np. "Dodaj kanał"); motywujący UX.
