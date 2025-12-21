Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API
- **Konfiguracja**: Nazwy modeli są przechowywane w pliku `.env`, co pozwala na łatwą zmianę dostawcy bez modyfikacji kodu.

Testowanie - Zapewnienie jakości i stabilności aplikacji:
- Vitest do testów jednostkowych (unit tests) - szybki framework testowy zintegrowany z Vite/Astro
- Playwright do testów end-to-end (E2E) - automatyzacja testowania kompletnych workflow'ów użytkownika w przeglądarce
- Cel: minimum 80% pokrycia kodu dla logiki biznesowej, 100% dla ścieżek krytycznych (auth, płatności, usuwanie danych)

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD (automatyczne testy, linting, deployment)
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu Docker
