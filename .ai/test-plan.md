# Plan Testów dla Projektu YTInsights (Video Summary App)

## 1. Wprowadzenie i Cele
Celem niniejszego planu jest zapewnienie wysokiej jakości aplikacji YTInsights poprzez systematyczną weryfikację funkcjonalności, wydajności i bezpieczeństwa. Głównym priorytetem jest stabilność kluczowych procesów biznesowych (generowanie podsumowań wideo) oraz niezawodność mechanizmów autentykacji.

## 2. Zakres Testów
Plan obejmuje testowanie:
*   Frontend (Astro/React) i interakcji z użytkownikiem.
*   Integracji z backendem (Supabase, Cloudflare Functions).
*   Logiki biznesowej (transkrypcje, przetwarzanie wideo).
*   Zabezpieczeń dostępu do danych (Auth/RLS).

**Wyłączone z zakresu:**
*   Testy wydajnościowe samej infrastruktury Cloudflare (polegamy na SLA dostawcy).
*   Weryfikacja jakości merytorycznej generowanych podsumowań przez model AI (podlega osobnej ewaluacji).
*   Testy trybu ciemnego (funkcjonalność niezaimplementowana).

## 3. Typy Testów

### A. Testy Jednostkowe (Unit Tests)
*   **Cel:** Weryfikacja izolowanej logiki funkcji, hooków i komponentów.
*   **Zakres:** `src/lib` (narzędzia, parsery), `src/hooks`, proste komponenty UI.
*   **Kluczowe obszary:** Parsowanie czasu, formatowanie dat, walidacja formularzy.

### B. Testy Integracyjne (Integration Tests)
*   **Cel:** Sprawdzenie współpracy między modułami (np. Komponent React <-> React Query <-> Supabase Client).
*   **Zakres:** Formularze logowania/rejestracji, widoki dashboardu, komponenty gridów (`VideosGrid`).
*   **Kluczowe obszary:** Poprawne wyświetlanie stanów loading/error, reakcja na odpowiedzi z API.

### C. Testy End-to-End (E2E)
*   **Cel:** Symulacja rzeczywistych zachowań użytkownika w przeglądarce.
*   **Zakres:** Pełne ścieżki (Rejestracja -> Logowanie -> Dodanie wideo -> Odczyt podsumowania).
*   **Kluczowe obszary:** Routing, Middleware (ochrona stron), przepływ danych między podstronami.

### D. Testy Regresji Wizualnej (Visual Testing)
*   **Cel:** Zapewnienie stałej, wysokiej jakości estetyki UI (Pixel-perfect).
*   **Zakres:** Kluczowe komponenty (karty, gridy) oraz widoki Dashboard/Landing.
*   **Narzędzia:** Playwright Snapshots / Storybook.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Autentykacja i Zarządzanie Kontem
| ID | Tytuł Scenariusza | Oczekiwany Rezultat | Priorytet |
|:---|:---|:---|:---|
| AUTH-01 | Rejestracja nowego użytkownika z poprawnymi danymi | Konto utworzone, e-mail weryfikacyjny wysłany, przekierowanie do ekranu potwierdzenia. | Wysoki |
| AUTH-02 | Próba rejestracji na istniejący e-mail | Wyświetlenie komunikatu błędu ("User already registered"). | Wysoki |
| AUTH-03 | Logowanie poprawne | Przekierowanie do Dashboardu. | Wysoki |
| AUTH-04 | Dostęp do chronionej trasy (np. `/dashboard`) bez logowania | Przekierowanie do `/login`. | Wysoki |
| AUTH-05 | Reset hasła (Forgot Password flow) | E-mail wysłany, możliwość ustawienia nowego hasła po kliknięciu linku. | Średni |

### 4.2. Obsługa Wideo i Podsumowań
| ID | Tytuł Scenariusza | Oczekiwany Rezultat | Priorytet |
|:---|:---|:---|:---|
| VID-01 | Dodanie linku URL YouTube do analizy | Pobranie metadanych wideo, rozpoczęcie generowania. | Wysoki |
| VID-02 | Obsługa wideo bez transkryptu | Wyświetlenie odpowiedniego błędu użytkownikowi. | Średni |
| VID-03 | Ponowna próba generowania (Retry) dla "Failed Summary" | Stan karty zmienia się na ładowanie, ponowienie procesu. | Średni |
| VID-04 | Ukrywanie podsumowania (Hide) | Karta znika z głównego widoku, licznik "Hidden Summaries" rośnie. | Średni |
| VID-05 | Przejście do szczegółów podsumowania | Poprawne załadowanie widoku `/summaries/[id]` z pełnym tekstem. | Wysoki |

### 4.3. UI i Interfejs
| ID | Tytuł Scenariusza | Oczekiwany Rezultat | Priorytet |
|:---|:---|:---|:---|
| UI-01 | Responsywność Dashboardu na Mobile | Karty układają się w jednej kolumnie, brak poziomego scrolla. | Wysoki |
| UI-02 | Powiadomienia (Toasts) | Wyświetlanie sukcesów i błędów w prawym dolnym/górnym rogu (Sonner). | Średni |

## 5. Środowisko Testowe i Dane
*   **Local:** Środowisko deweloperskie z lokalną instancją Supabase (lub podpięte pod projekt `dev`).
*   **Preview:** Deploy na Cloudflare Pages (dla Pull Requestów).
*   **Dane testowe:** Zestaw linków do YouTube o różnej długości, dostępności napisów i statusie (publiczny/prywatny).

## 6. Narzędzia do Testowania
*   **Vitest + MSW (Mock Service Worker):** Do testów jednostkowych i integracyjnych (izolacja logiki od backendu).
*   **React Testing Library:** Do testowania interakcji i dostępności (Accessibility).
*   **Playwright + Visual Regression:** Do testów E2E oraz automatycznej weryfikacji wyglądu UI (snapshots).
*   **Storybook:** Do rozwoju i testowania stanów komponentów UI w izolacji.
*   **Supabase CLI (pgtap):** Do weryfikacji poprawności polityk RLS (bezpieczeństwo danych).

## 7. Harmonogram
*   **Smoke Tests:** Uruchamiane przy każdym commicie (pre-commit hook).
*   **Regression Tests:** Uruchamiane automatycznie w CI/CD przy Pull Requestach.
*   **Pełne testy E2E:** Uruchamiane przed wdrożeniem na produkcję.

## 8. Kryteria Akceptacji (DoD)
*   Wszystkie testy krytyczne (Wysoki Priorytet) muszą przechodzić (Pass).
*   Brak błędów krytycznych (blokujących działanie aplikacji) w logach.
*   Interfejs użytkownika jest responsywny i działa poprawnie na urządzeniach mobilnych oraz desktopowych.

## 9. Procedury Raportowania Błędów
Błędy należy zgłaszać w systemie śledzenia zadań według szablonu:
1.  **Tytuł:** Zwięzły opis problemu.
2.  **Kroki do reprodukcji:** Dokładna ścieżka.
3.  **Oczekiwane zachowanie:** Co powinno się stać.
4.  **Rzeczywiste zachowanie:** Co się stało.
5.  **Dowody:** Zrzut ekranu/Logi.
