<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/5

## Run Locally

**Prerequisites:**  Node.js


#1. Install dependencies: Install Node.js
 #  `npm install`

#2. Run the app:
#   `npm run dev`

#Go to bash and run the following command
docker compose up --build

Now you’ll have:

Your app → http://localhost:8000

Ollama → http://localhost:11434

HAPI FHIR → http://localhost:8080/fhir

Postgres DB → localhost:5432 (user: hapi, pass: hapi)
