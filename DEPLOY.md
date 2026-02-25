# GitHub Pages Deployment

## Quick Start

The Candy Landy Enhanced Edition is a static HTML5 game that can be deployed to any static hosting service.

### Option 1: Local Testing

#### Using Python (Recommended)
```bash
cd /Users/stevenday/.openclaw/workspace/candy-landy
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

#### Using Node.js serve
```bash
npm install
npm start
```

#### Using PHP
```bash
php -S localhost:8000
```

### Option 2: GitHub Pages

#### Setup Instructions

1. **Create a GitHub Repository**
   - Go to GitHub and create a new repository named `candy-landy`
   - Make it public (GitHub Pages requires public repos for free hosting)

2. **Initialize Git Repository**
   ```bash
   cd /Users/stevenday/.openclaw/workspace/candy-landy
   git init
   git add .
   git commit -m "Initial commit: Candy Landy Enhanced Edition"
   ```

3. **Add Remote Repository**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/candy-landy.git
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
   - Your game will be live at: `https://YOUR_USERNAME.github.io/candy-landy/`
   - It may take a few minutes for GitHub Pages to build and deploy

### Option 3: Netlify (Alternative)

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Build settings (leave as defaults - it's a static site)
6. Click "Deploy site"

### Option 4: Vercel (Alternative)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Select your GitHub repository
5. Click "Deploy"

## File Structure

```
candy-landy/
├── index.html              # Main HTML file with game canvas
├── enhanced-game.js        # Complete game logic (~1,600 lines)
├── game.js                 # Simple version (backup)
├── js/
│   └── game.js            # Original polished version
├── README.md              # User documentation
├── FEATURES.md            # Complete feature list
├── DEPLOY.md              # This file
├── package.json           # NPM configuration
└── .git/                  # Git repository (if initialized)
```

## Maintenance

### Updating the Game

To update the game after deployment:

1. Make changes to the game files
2. Test locally using one of the methods above
3. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update: Describe your changes"
   git push origin main
   ```
4. GitHub Pages will automatically redeploy within 1-2 minutes

### Version Control

The game uses Git for version control. Key files:
- `enhanced-game.js` - Main game logic (always update this)
- `index.html` - HTML structure and UI
- `README.md` - User-facing documentation
- `FEATURES.md` - Technical documentation

## Browser Compatibility

The game works in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

Required browser features:
- HTML5 Canvas
- Web Audio API
- ES6 JavaScript
- localStorage

## Performance

The game is optimized for:
- **60 FPS** smooth gameplay
- **Low Memory Usage** - Efficient particle system
- **Fast Loading** - No external assets needed
- **Responsive** - Works on different screen sizes

## Audio Note

Due to browser autoplay policies, users must interact with the page (click or keypress) before audio will play. This is handled automatically - the first keypress initializes the audio system.

## Customization

### Changing Game Settings

Edit constants in `enhanced-game.js`:
```javascript
const GRAVITY = 0.6;           // Gravity strength
const JUMP_STRENGTH = -14;     // Jump power
const MOVE_SPEED = 5;          // Movement speed
const GROUND_HEIGHT = 60;      // Ground/platform height
```

### Adding New Levels

Extend the `loadLevel()` method in the `Level` class around line 450. Follow the existing pattern for platforms, candies, enemies, and power-ups.

### Modifying Colors

Search for hex color codes in the code:
- Character colors: Lines ~200-300
- Platform colors: Lines ~450-600
- UI colors: Lines ~800-900

### Adding New Sound Effects

Extend the `SoundSystem` class (lines ~50-120):
```javascript
customSound() {
    this.playTone(frequency, duration, type, volume);
    // Add more tones for complex sounds
}
```

## Troubleshooting

### Game Won't Start
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Try a different browser

### No Sound
- Click anywhere on the page to initialize audio
- Check volume settings (0-5 keys)
- Ensure browser supports Web Audio API

### Game Runs Slowly
- Close other browser tabs
- Check for background processes
- Try a different browser

### High Scores Not Saving
- Ensure localStorage is enabled
- Check browser privacy settings
- Try incognito/private mode (note: scores won't persist)

## Analytics (Optional)

To add analytics:

```html
<!-- Add to index.html before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## Security Notes

- The game is client-side only
- No server-side code
- No external dependencies
- Safe to host anywhere
- High scores stored locally (user's browser)

## License

This game is provided as-is for educational and entertainment purposes.

## Support

For issues or questions:
1. Check the README.md for gameplay help
2. Review FEATURES.md for technical details
3. Check browser console for errors
4. Open an issue on GitHub if you find a bug

## Future Enhancements

Possible improvements:
- Mobile touch controls
- More levels
- Additional enemy types
- Boss battles
- Achievements system
- Multiplayer mode
- Level editor
- Custom sound files (optional)

---

Enjoy deploying and playing Candy Landy Enhanced Edition! 🍬🎮
