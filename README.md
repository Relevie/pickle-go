# Pickle Go Club

A multi-page pickleball club website organized into frontend and backend folders.

## Project layout

```text
frontend/   Static website pages, styles, and browser interactions
backend/    Reserved for the API/server application
```

The frontend currently includes Home, About, Courts, Events, Learn, Gallery, Contact, and Profile pages. Shared navigation and footer are in `frontend/site.js`; page interactions are in `frontend/app.js`; shared styling is in `frontend/styles.css`.

## Open the current site

Open `frontend/index.html` in a browser. No build step or dependencies are required. Browser location access works on `localhost` or HTTPS.

## Backend status

The backend folder is a placeholder; no API, database, or Radzen app has been created yet. The current site uses sample data and browser local storage. See `backend/README.md` for the intended integration boundary.

The club identity, contact address, DUPR values, match history, and event schedule are sample data. The court page map opens to the Philippines; no live court listings or event availability feed is connected. Replace `hello@pickle-go.example` and the club details before launch. Photos are hosted by Unsplash and need an internet connection.
