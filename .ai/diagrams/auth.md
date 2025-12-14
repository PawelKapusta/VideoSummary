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

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka (React/Astro)
    participant Middleware as Middleware (SSR Guard)
    participant Supabase as Supabase Auth & DB

    Note over Browser, Supabase: Scenariusz 1: Rejestracja i Automatyczne Logowanie (US-001)

    activate Browser
    Browser->>Supabase: signUp(email, password)
    activate Supabase
    Supabase-->>Browser: Session { access_token, user }
    deactivate Supabase
    
    Browser->>Browser: Zapisz tokeny w Cookies (sb-*)
    Browser->>Browser: Przekierowanie na /dashboard (window.location)
    deactivate Browser

    Note over Browser, Supabase: Scenariusz 2: Dostęp do Chronionej Trasy (US-002 / Weryfikacja)

    Browser->>Middleware: GET /dashboard (Cookies: sb-token)
    activate Middleware
    Middleware->>Middleware: createServerClient()
    Middleware->>Supabase: getUser(access_token)
    activate Supabase
    
    alt Token Ważny
        Supabase-->>Middleware: User Object (200 OK)
        Middleware-->>Browser: Renderuj Dashboard (HTML)
    else Token Nieważny / Brak
        Supabase-->>Middleware: Error / Null
        deactivate Supabase
        Middleware-->>Browser: 302 Redirect -> /login
    end
    deactivate Middleware

    Note over Browser, Supabase: Scenariusz 3: Wylogowanie (US-003)

    activate Browser
    Browser->>Supabase: signOut()
    Browser->>Browser: Usuń Cookies sesyjne
    Browser->>Browser: Przekierowanie na /login
    deactivate Browser

    Note over Browser, Supabase: Scenariusz 4: Reset Hasła (US-004)

    activate Browser
    Browser->>Supabase: resetPasswordForEmail(email)
    Supabase-->>Browser: Potwierdzenie wysłania
    deactivate Browser
    
    Supabase->>Browser: Email z magic linkiem (poza systemem)
    
    Note right of Browser: Użytkownik klika w link z emaila
    
    Browser->>Supabase: Auth Callback (wymiana kodu na sesję)
    Supabase-->>Browser: Session (Zalogowany)
    Browser->>Browser: Przekierowanie na /update-password
    
    activate Browser
    Browser->>Supabase: updateUser({ password: newWithConfirm })
    activate Supabase
    Supabase->>Supabase: Zapisz hasło (Hash)
    Supabase-->>Browser: Success
    deactivate Supabase
    Browser->>Browser: Przekierowanie na /dashboard
    deactivate Browser
```
</mermaid_diagram>
