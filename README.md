# Scale Driller Studio

This is a music theory trainer application built with React, TypeScript, and Vite.

## Local Development

To run the application on your local machine, follow these steps:

1.  **Install Dependencies:**
    Open your terminal and run the following command to install the necessary packages.
    ```bash
    npm install
    ```

2.  **Start the Development Server:**
    Once the installation is complete, start the Vite development server.
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

This command will compile the TypeScript code, bundle all assets, and place the optimized static files into the `dist/` directory.

## Deploying to GitHub Pages

This repository is configured for deployment to GitHub Pages under the `/ScaleDrillerStudio/` subpath.

1.  **Build the Project:**
    First, ensure you have a fresh production build.
    ```bash
    npm run build
    ```

2.  **Prepare the `docs/` Directory:**
    GitHub Pages will serve files from the `docs/` directory in the `main` branch.
    
    - If a `docs/` directory already exists, remove it.
    - Copy the contents of the `dist/` directory into a new `docs/` directory.

    On macOS/Linux:
    ```bash
    rm -rf docs
    mkdir docs
    cp -r dist/* docs/
    ```
    On Windows (Command Prompt):
    ```bash
    rmdir /s /q docs
    mkdir docs
    xcopy dist docs /E /I
    ```

3.  **Create SPA Fallback:**
    To ensure Single-Page Application (SPA) routing works correctly on GitHub Pages, copy the `index.html` to `404.html` inside the `docs/` directory. This tells GitHub Pages to serve your app for any route that would normally be a 404.
    
    On macOS/Linux:
    ```bash
    cp docs/index.html docs/404.html
    ```
    On Windows (Command Prompt):
    ```bash
    copy docs\index.html docs\404.html
    ```

4.  **Commit and Push:**
    Add the `docs/` directory to your commit, and push it to your `main` branch on GitHub.
    ```bash
    git add .
    git commit -m "Deploy latest build to GitHub Pages"
    git push origin main
    ```

5.  **Configure GitHub Repository Settings:**
    - Go to your repository on GitHub.
    - Navigate to **Settings** > **Pages**.
    - Under **Build and deployment**, set the **Source** to **Deploy from a branch**.
    - Set the **Branch** to `main` and the **Folder** to `/docs`.
    - Click **Save**.

Your site will be deployed to `https://josec1154.github.io/ScaleDrillerStudio/`. It may take a few minutes for the changes to go live.
