# Solar AI Advisor

An AI-powered online platform for comparing solar power options and calculating savings.

## Features

- Instant solar system recommendations based on electricity bill
- Transparent pricing and installer comparisons
- Government subsidy guidance
- Responsive design

## Usage

1. Open `index.html` in a web browser (requires a local server for proper loading).
2. Enter your monthly electricity bill in rupees.
3. Click "Calculate Now" for an instant estimate.
4. Scroll through sections for more information.

## Development

- HTML: `index.html`
- CSS: `css/styles.css`
- JavaScript: `js/script.js`

To run locally:
```
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Troubleshooting

- If the page doesn't load, ensure you're using a local server (direct file:// may not work for external resources).
- For accurate AI features, integrate with backend services (not implemented yet). 
