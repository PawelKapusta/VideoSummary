# Analiza Autentykacji

<authentication_analysis>

1. **Przepływy autentykacji**:
   - **Rejestracja (US-001)**: Użytkownik tworzy konto, następuje automatyczne logowanie (bez wymuszonej weryfikacji email na start MMP), zapisanie sesji w ciasteczkach i przekierowanie do Dashboardu.
   - **Logowanie (US-002)**: Użytkownik podaje dane, Supabase zwraca sesję, klient zapisuje ciasteczka, następuje przekierowanie.
   - **Wylogowanie (US-003)**: Klient wywołuje wylogowanie, ciasteczka są czyszczone, użytkownik ląduje na stronie logowania.
   - **Reset hasła (US-004)**: Żądanie resetu -> Email z linkiem -> Kliknięcie loguje użytkownika -> Użytkownik ustawia nowe hasło.
   - **Ochrona tras (Middleware)**: Weryfikacja sesji po stronie serwera (SSR) dla każdej chronionej podstrony.

2. **Aktorzy i interakcje**:
   - **Przeglądarka (Klient React)**: Inicjuje akcje (formularze), zarządza stanem UI (toasty, przekierowania), komunikuje się bezpośrednio z Supabase Client.
   - **Middleware (Astro Server)**: Strażnik tras. Sprawdza ciasteczka `sb-access-token` przy każdym żądaniu do `/dashboard/*`.
   - **Supabase Auth**: Zewnętrzny dostawca tożsamości. Wystawia tokeny (JWT), obsuguje logikę biznesową auth.

3. **Weryfikacja i odświeżanie**:
   - Tokeny (`access_token`, `refresh_token`) są przechowywane w ciasteczkach (`httpOnly` zalecane, ale `supervisor/ssr` zarządza nimi hybrydowo).
   - Middleware używa `createServerClient` do weryfikacji tokenu przy renderowaniu po stronie serwera.
   - Klient (Browser) automatycznie odświeża token w tle dzięki bibliotece Supabase.

</authentication_analysis>

# Diagram Autentykacji

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#0070f3', 'textColor': '#ffffff' }}}%%
sequenceDiagram
    autonumber
    participant Browser as "Przeglądarka (React/Astro)"
    participant Middleware as "Middleware (SSR Guard)"
    participant Supabase as "Supabase Auth & DB"

    Note over Browser, Supabase: Scenariusz 1: Rejestracja i Automatyczne Logowanie

    activate Browser
    Browser->>Supabase: signUp(email, password)
    activate Supabase
    Supabase-->>Browser: Session { access_token, user }
    deactivate Supabase

    Browser->>Browser: Zapisz tokeny w Cookies (sb-*)
    Browser->>Browser: Przekierowanie na /dashboard
    deactivate Browser

    Note over Browser, Supabase: Scenariusz 2: Dostęp do Chronionej Trasy

    Browser->>Middleware: GET /dashboard (Cookies: sb-token)
    activate Middleware
    Middleware->>Middleware: createServerClient()
    Middleware->>Supabase: getUser(access_token)
    activate Supabase
    Supabase-->>Middleware: User Object / Error
    deactivate Supabase

    alt Token Ważny
        Middleware-->>Browser: Renderuj Dashboard (HTML)
    else Token Nieważny / Brak
        Middleware-->>Browser: 302 Redirect -> /login
    end
    deactivate Middleware

    Note over Browser, Supabase: Scenariusz 3: Wylogowanie

    activate Browser
    Browser->>Supabase: signOut()
    activate Supabase
    Supabase-->>Browser: Success
    deactivate Supabase
    Browser->>Browser: Usuń Cookies i przekieruj
    deactivate Browser

    Note over Browser, Supabase: Scenariusz 4: Reset Hasła

    activate Browser
    Browser->>Supabase: resetPasswordForEmail(email)
    activate Supabase
    Supabase-->>Browser: Potwierdzenie wysłania
    deactivate Supabase
    deactivate Browser

    Note right of Browser: Użytkownik klika w link z emaila

    Browser->>Supabase: Auth Callback (wymiana kodu)
    activate Supabase
    Supabase-->>Browser: Session (Zalogowany)
    deactivate Supabase
    Browser->>Browser: Przekierowanie na /update-password

    activate Browser
    Browser->>Supabase: updateUser({ password })
    activate Supabase
    Supabase->>Supabase: Zapisz hasło (Hash)
    Supabase-->>Browser: Success
    deactivate Supabase
    Browser->>Browser: Przekierowanie na /dashboard
    deactivate Browser
```
