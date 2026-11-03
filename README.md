# Welcome to your mahapocra project

## Project info

**URL**: https://mahapocra.dev/projects/a4e1cc95-723b-493f-aca2-00391d3815fb

## Service Check: rejection reasons

Each API row has a **Rejection reasons** column alongside **Error types**, for
example `Grievance already registered (3), Registration number wrong (2)`.
Reasons use the recorded rejection message, with the `rejected:` prefix removed
and identifiers masked by the existing PII masking helper. Matching labels are
combined after masking. If no message was recorded, the stored type (such as
`http_401`) or `unknown` is shown instead; reasons are not guessed.
Counts follow the selected date range and state. No matching rejections display
a dash. Existing error counts remain separate. Deploy the dashboard service
with the app; existing stored rejection messages need no migration or backfill.

Run the focused API-decoding and rendered-column check:

```sh
node --test scripts/service-check.test.cjs
```

## Service Check: Voice

In the Bharat Vistaar dashboard, open **Service Check** and select **Voice**.
The **Chat Completions** row shows recorded voice requests, completed requests,
failed requests, rejected/error counts, success rate, latency, last call, and
error types. Streaming and non-streaming requests are counted once each, not
once per chunk or model retry.

Completed 2xx responses are successful; completed 4xx responses are rejected;
server errors and interrupted streams are errors. The service dropdown is
populated by `GET /v1/service-check`; no separate Voice endpoint is needed.
Existing date/state filters and refresh apply. Counts require the updated voice
API, telemetry processor, and dashboard service; no historical outcome backfill
is available. A zero row means no recorded requests in the selected range.

## How can I edit this code? 

There are several ways of editing your application.

**Use mahapocra**

Simply visit the [mahapocra Project](https://mahapocra.dev/projects/a4e1cc95-723b-493f-aca2-00391d3815fb) and start prompting.

Changes made via mahapocra will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in mahapocra.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [mahapocra](https://mahapocra.dev/projects/a4e1cc95-723b-493f-aca2-00391d3815fb) and click on Share -> Publish.

## Can I connect a custom domain to my mahapocra project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.mahapocra.dev/tips-tricks/custom-domain#step-by-step-guide)
