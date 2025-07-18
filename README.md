# MyNotes App

Eine moderne Notizen-App mit React Frontend und FastAPI Backend, die sowohl online als auch offline funktioniert.

## Features

- 📝 Rich Text Editor mit Formatierungsoptionen
- 📁 Hierarchische Ordnerstruktur  
- 💾 Automatisches Speichern
- 🔄 Offline-Funktionalität mit Sync
- 🌙 Dark Mode Design
- 📱 Responsive Design

## Technologien

**Frontend:**
- React 19.1.0 mit Hooks
- Tailwind CSS für Styling
- LocalStorage für Offline-Speicherung

**Backend:**
- FastAPI für REST API
- PostgreSQL Datenbank
- SQLAlchemy ORM
- Alembic für Migrationen

## Installation

### Voraussetzungen

1. **Node.js** (v18 oder höher)
2. **Python** (v3.8 oder höher)
3. **PostgreSQL** (v12 oder höher)

### Backend Setup

1. PostgreSQL starten und sicherstellen, dass es auf localhost:5432 läuft

2. Backend Dependencies installieren:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Umgebungsvariablen konfigurieren:
   ```bash
   # .env Datei aus dem Template erstellen
   cp .env.example .env
   
   # .env Datei bearbeiten und dein PostgreSQL Passwort eintragen
   # DATABASE_URL=postgresql://postgres:DEIN_PASSWORT@localhost:5432/mynotes_db
   ```

4. Datenbank setup:
   ```bash
   python setup_db.py
   ```

5. Backend starten:
   ```bash
   python run.py
   ```

   Das Backend läuft auf http://localhost:8000

### Frontend Setup

1. Frontend Dependencies installieren:
   ```bash
   cd frontend
   npm install
   ```

2. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

   Das Frontend läuft auf http://localhost:5173

## API Endpoints

### Folders
- `GET /api/folders` - Alle Ordner abrufen
- `POST /api/folders` - Neuen Ordner erstellen
- `PUT /api/folders/{id}` - Ordner aktualisieren
- `DELETE /api/folders/{id}` - Ordner löschen

### Notes
- `GET /api/notes` - Alle Notizen abrufen
- `GET /api/notes?folder_id={id}` - Notizen eines Ordners abrufen
- `POST /api/notes` - Neue Notiz erstellen
- `PUT /api/notes/{id}` - Notiz aktualisieren
- `DELETE /api/notes/{id}` - Notiz löschen
- `POST /api/notes/sync` - Offline-Notizen synchronisieren

## Offline Funktionalität

Die App funktioniert auch ohne Internetverbindung:

- Alle Daten werden im Browser LocalStorage gespeichert
- Bei Internetverbindung werden Änderungen automatisch synchronisiert
- Konflikte werden durch Timestamps aufgelöst

## Datenbank Schema

### Folders Tabelle
- `id` - Primary Key
- `name` - Ordnername
- `icon` - Emoji Icon
- `parent_id` - Übergeordneter Ordner (nullable)
- `created_at`, `updated_at` - Timestamps

### Notes Tabelle
- `id` - Primary Key
- `title` - Titel der Notiz
- `content` - HTML Content
- `folder_id` - Zugehöriger Ordner (nullable)
- `is_deleted` - Soft Delete Flag
- `created_at`, `updated_at` - Timestamps

## Entwicklung

### Backend entwickeln
```bash
cd backend
# Neue Migration erstellen
alembic revision --autogenerate -m "Description"
# Migration ausführen
alembic upgrade head
```

### Frontend entwickeln
```bash
cd frontend
npm run dev    # Entwicklungsserver
npm run build  # Production Build
npm run lint   # Linting
```

## Troubleshooting

### PostgreSQL Verbindungsfehler
- Stelle sicher, dass PostgreSQL läuft: `brew services start postgresql`
- Prüfe die Verbindungsdaten in der `.env` Datei
- Erstelle den Benutzer falls nötig: `createuser -s postgres`

### CORS Fehler
- Stelle sicher, dass das Backend auf Port 8000 läuft
- Das Frontend muss auf Port 5173 laufen (Vite Standard)

### Sync Probleme
- Prüfe die Browser-Konsole für Fehler
- Lösche den LocalStorage: `localStorage.clear()`
- Starte beide Server neu