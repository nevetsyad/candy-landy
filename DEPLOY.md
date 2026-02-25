# GitHub Pages Deployment

## Setup Instructions

1. **Create a GitHub Repository**
   - Go to GitHub and create a new repository named `candy-landy-game-deployment`
   - Make it public (GitHub Pages requires public repos for free hosting)

2. **Initialize Git Repository**
   ```bash
   cd /Users/stevenday/.openclaw/workspace/candy-landy-game-deployment
   git init
   git add .
   git commit -m "Initial commit: Candy Landy game"
   ```

3. **Add Remote Repository**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/candy-landy-game-deployment.git
   # Replace YOUR_USERNAME with your actual GitHub username
   ```

4. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

5. **Enable GitHub Pages**
   - Go to your GitHub repository page
   - Click **Settings** → **Pages**
   - Under "Source", select **Deploy from a branch**
   - Branch: **main** (or master)
   - Folder: **/ (root)**
   - Click **Save**

6. **Access Your Game**
   - Your game will be live at: `https://YOUR_USERNAME.github.io/candy-landy-game-deployment/`
   - It may take a few minutes for GitHub Pages to build and deploy

## Maintenance

- To update the game, simply modify the files and push to the main branch
- GitHub Pages will automatically redeploy when you push changes

## Customization

- Replace placeholder graphics with actual sprite images
- Add custom CSS styling in index.html
- Extend game.js with additional levels and features