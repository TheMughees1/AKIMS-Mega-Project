# Download and run AKIMS Campus

This guide runs the demonstration on your own computer. The included local database launcher has been validated on Linux x64. For a Windows x64 computer, use Ubuntu in WSL 2. Native Windows and macOS need a separately configured PostgreSQL server; they have not been validated for this release.

## 1. Download the project

Open [the akims-mvp branch](https://github.com/TheMughees1/AKIMS-Mega-Project/tree/akims-mvp), select **Code → Download ZIP**, and extract it. If GitHub asks you to sign in, use an account with access to this repository.

The extracted folder is normally named `AKIMS-Mega-Project-akims-mvp`. Run project commands inside the folder containing `package.json`.

## 2. Prepare Windows, if applicable

On Windows 10/11 with WSL support, open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Restart if Windows requests it. Open **Ubuntu** from the Start menu and complete its Linux username/password setup. Run the remaining commands in **Ubuntu**, as your normal Linux user, not in PowerShell and not as root. If Ubuntu is already installed under WSL 2, skip this installation.

Keep the project in Ubuntu's home directory for reliable permissions and file watching. To transfer the downloaded ZIP, run this in Ubuntu:

```bash
cd ~
explorer.exe .
```

Copy the downloaded ZIP into the Explorer window that opens. After installing the prerequisites below, extract it in Ubuntu:

```bash
unzip AKIMS-Mega-Project-akims-mvp.zip
cd AKIMS-Mega-Project-akims-mvp
```

## 3. Install Node.js 24 and prerequisites

In Ubuntu (including Ubuntu under WSL), install the basic utilities:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git unzip xz-utils
```

If `node --version` already reports Node.js 24 and `npm --version` works in this terminal, skip the Node installation. Otherwise, install Node through [nvm](https://github.com/nvm-sh/nvm). These commands download the installer from its versioned official repository and then run it:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh -o /tmp/akims-nvm-install.sh
bash /tmp/akims-nvm-install.sh
. "$HOME/.nvm/nvm.sh"
nvm install 24
nvm use 24
node --version
npm --version
```

Install Node inside Ubuntu even if you previously installed it on Windows. On another Linux distribution, use its package manager for the utilities and Node.js 24. Internet access is required during the initial dependency installation.

## 4. Start the project

From the extracted project folder:

```bash
npm run setup
npm run local:start
```

Setup installs the locked dependencies, creates `.env.local` from `.env.example` when needed, starts the local PostgreSQL database, applies migrations and loads fictional demonstration records into an empty database. A separate PostgreSQL installation is not needed for this Linux setup. Do not use `sudo` for these npm commands.

When the terminal reports that the web service is ready, enter `http://localhost:3000/login` in your computer's browser. Windows browsers can normally reach this address while Ubuntu/WSL is running. Use the demonstration role buttons to open Student, Staff, Accounts, Administration, Faculty or Alumni. Demo accounts do not have seeded passwords.

The starter runs services in the background; returning to the command prompt is expected. After restarting your computer or WSL, open the project folder in Ubuntu and run:

```bash
npm run local:start
```

You do not need to repeat setup each time. Local records and uploaded receipts are stored under `.local`; keep that folder if you want to preserve the demonstration data. Do not run multiple copies with the same ports at once.

## If something goes wrong

| Symptom | What to check |
| --- | --- |
| `npm` or `node` is not found | Install Node.js 24 inside the same Ubuntu terminal; reopen Ubuntu after installing nvm. |
| `Missing script: setup` or missing `package.json` | Change into the extracted project folder containing `package.json`. |
| `bash` is not recognized | Run the commands in Ubuntu/WSL, not Windows Command Prompt. |
| Database did not become ready | Inspect `.local/database.log`; verify port 54329 is available and that you are a normal Linux user. Do not delete database lock files or `.local/postgres` to fix a startup error. |
| Web service did not become ready | Inspect `.local/web.log`; verify port 3000 is available and `.env.local` still has the intended local `APP_ORIGIN`. |
| GitHub reports 404 | Sign in with the GitHub account that can access the repository, then open the branch link again. |

Share the exact error message when asking for help. Do not share `.env.local`, database files, private receipts or passwords.

This release uses fictional data and watermarked sample documents. See [operations and deployment](OPERATIONS.md) before configuring an institutional deployment; the demonstration startup is not a public production setup.
