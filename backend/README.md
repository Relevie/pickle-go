# Backend

This folder is reserved for the future server/API project. No backend code exists yet.

Suggested boundary for a .NET implementation:

- Player API: profile, DUPR value, and match history.
- Court API: court search and map/listing data.
- Event API: open play, clinics, tournament listings, and saved registrations.

The current frontend is static HTML, CSS, and JavaScript. If choosing Radzen Blazor, build the pages as Razor components and inject data services; Radzen is the UI layer, while the ASP.NET Core app and its services provide server behavior. The existing pages can serve as the visual reference during that conversion.
