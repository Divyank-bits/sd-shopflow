# GST Billing App — Google Apps Script

A web app for generating GST-compliant invoices, managing products/customers, tracking stock, and exporting GSTR-1 reports.

---

## One-time setup (do this once, then CI/CD takes over)

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com) → **New project** → give it a name (e.g. "GST Billing")
2. Copy the **Script ID** from **Project settings** (the long alphanumeric string)
3. Paste it into `.clasp.json`:
   ```json
   { "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE", "rootDir": "." }
   ```

### 2. Get your clasp credentials (CLASP_TOKEN secret)

```bash
# Install clasp locally once
npm install -g @google/clasp

# Login — this opens a browser OAuth window
clasp login

# The credentials are stored in:
cat ~/.clasprc.json
# looks like: {"token":{"access_token":"...","refresh_token":"..."},"oauth2ClientSettings":{...}}
```

Copy the **entire JSON output** of `~/.clasprc.json`.

### 3. Add GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `CLASP_TOKEN` | The full JSON from `~/.clasprc.json` |

### 4. Push to GitHub

```bash
cd "/mnt/hdd3/GST App"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -m main          # rename master → main if needed
git push -u origin main
```

The GitHub Action fires, installs clasp, and pushes all files to your Apps Script project automatically.

---

## First run (in Apps Script editor)

1. Open the script at [script.google.com](https://script.google.com)
2. Run `setup()` once — creates all spreadsheet tabs + a "GST Invoices" Drive folder
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Me** (or "Anyone" for a shop terminal)
4. Copy the web app URL and open it in your browser

### (Optional) Auto-deploy to the live web app on every push

After creating the first deployment, note its **Deployment ID** (e.g. `AKfycb...`).  
Uncomment and edit the last step in `.github/workflows/deploy.yml`:

```yaml
- name: Update live deployment
  run: clasp deploy -i AKfycbYOUR_DEPLOYMENT_ID -d "Auto deploy ${{ github.sha }}"
```

---

## Local development

```bash
npm install -g @google/clasp
clasp login
clasp push          # push changes now
clasp open          # open the Apps Script editor in browser
```

---

## Project structure

| File | Role |
|---|---|
| `appsscript.json` | Manifest (scopes, webapp config) |
| `Code.gs` | `doGet`, shared DB helpers |
| `Setup.gs` | One-time sheet creation + settings |
| `Gst.gs` | Tax calculation — CGST/SGST/IGST, amount in words |
| `Masters.gs` | Product & customer CRUD |
| `Invoice.gs` | Invoice creation with stock deduction |
| `Pdf.gs` | HTML → PDF → Drive |
| `Share.gs` | Gmail email + WhatsApp link |
| `Reports.gs` | Monthly summary + GSTR-1 sheet |
| `Index.html` | Main web UI shell |
| `Style.html` | CSS |
| `Client.html` | Frontend JS |
| `InvoiceTemplate.html` | Printable invoice layout |
