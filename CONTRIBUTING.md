# Contributing to Candy Landy

First off, thank you for considering contributing to Candy Landy! 🍬

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Questions](#questions)

---

## Code of Conduct

This project and everyone participating in it is governed by the Candy Landy Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Text editor or IDE (VS Code recommended)
- Basic knowledge of JavaScript, HTML5 Canvas, and CSS
- Understanding of ES6 modules

### Quick Start

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/candy-landy.git
   cd candy-landy
   ```
3. Open `index.html` in your browser
4. Start coding!

---

## Development Setup

### Local Development

No build process required! Simply:

1. Open `index.html` in a web browser
2. For live reload, use a local server:
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # Node.js (if you have http-server installed)
   http-server
   ```
3. Navigate to `http://localhost:8080`

### Module Development

The game uses ES6 modules. When developing:

1. Edit files in the `src/` directory
2. Changes are reflected immediately (refresh browser)
3. Check the browser console for errors
4. Test on both desktop and mobile

---

## Project Structure

```
candy-landy/
├── index.html              # Main HTML file
├── mobile.css              # Mobile-specific styles
├── enhanced-game.js        # Legacy fallback (monolithic)
├── src/                    # Modular source code
│   ├── config.js           # Game constants and settings
│   ├── audio.js            # Sound system (Web Audio API)
│   ├── particles.js        # Enhanced particle system
│   ├── input.js            # Keyboard and touch input
│   ├── levels.js           # Level data and management
│   ├── player.js           # Player and Enemy classes
│   ├── ui.js               # HUD, menus, achievements, transitions
│   ├── game.js             # Main game loop and controller
│   └── README.md           # Module documentation
├── README.md               # Main documentation
├── CONTRIBUTING.md         # This file
├── CHANGELOG.md            # Version history
├── TESTING.md              # Testing guide
└── SPRINT*.md              # Sprint completion reports
```

### Module Responsibilities

- **config.js**: All game constants (no dependencies)
- **audio.js**: Sound effects and music (depends on config)
- **particles.js**: Visual particle effects (no dependencies)
- **input.js**: Keyboard and touch controls (no dependencies)
- **levels.js**: Level definitions and loading (depends on config)
- **player.js**: Player physics and enemy AI (depends on config, particles, audio, input)
- **ui.js**: All UI rendering (depends on config, levels, player, particles)
- **game.js**: Main game controller (depends on all modules)

---

## Coding Standards

### JavaScript

- Use ES6+ features (const/let, arrow functions, classes)
- Use JSDoc comments for functions and classes
- Follow existing code style
- Keep functions focused and small
- Use meaningful variable names
- Add comments for complex logic

Example:
```javascript
/**
 * Perform a jump with enhanced visual effects
 * @returns {void}
 */
performJump() {
    // Calculate jump power based on power-ups
    let jumpPower = this.jumpPower;
    if (this.powerUp === POWER_UPS.JUMP) {
        jumpPower = -20; // Enhanced jump power
    }
    
    // Apply velocity
    this.vy = jumpPower;
    this.grounded = false;
    
    // Play sound effect
    audioManager.playSound('jump');
}
```

### CSS

- Use mobile.css for mobile-specific styles
- Keep styles organized by component
- Use CSS custom properties where appropriate
- Ensure responsive design works

### HTML

- Keep index.html minimal
- Use semantic HTML elements
- Ensure accessibility where possible

---

## Submitting Changes

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Test thoroughly
   - Update documentation if needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```
   
   Commit message prefixes:
   - `Add:` - New features
   - `Fix:` - Bug fixes
   - `Update:` - Improvements to existing features
   - `Remove:` - Removed features
   - `Docs:` - Documentation changes
   - `Test:` - Testing changes

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Documentation updated (if needed)
- [ ] All features tested
- [ ] No console errors
- [ ] Mobile compatibility maintained
- [ ] Performance not degraded

---

## Reporting Bugs

### Before Reporting

1. Check the [existing issues](https://github.com/your-repo/candy-landy/issues)
2. Test in the latest version
3. Try to reproduce the bug

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g. Chrome 95]
- Device: [e.g. Desktop, iPhone 12]
- OS: [e.g. Windows 10, iOS 15]

**Console Errors**
Paste any console errors here.
```

---

## Feature Requests

### Before Requesting

1. Check if the feature already exists
2. Check if it's already been requested
3. Consider if it fits the project scope

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

---

## Development Tips

### Adding New Features

1. **Plan first**: Consider which module(s) need changes
2. **Start small**: Make incremental changes
3. **Test often**: Check both desktop and mobile
4. **Document**: Update README.md and src/README.md
5. **Follow patterns**: Look at existing code for examples

### Adding New Levels

Edit `src/levels.js`:

```javascript
{
    name: "Level Name",
    description: "Description",
    thumbnail: "🎮",
    platforms: [
        { x: 0, y: 550, width: 800, height: 50 },
        // Add more platforms
    ],
    candies: [
        { x: 100, y: 500, collected: false },
        // Add more candies
    ],
    secrets: [
        { x: 750, y: 100, collected: false },
        // Add 2 secrets per level
    ],
    powerUps: [
        { x: 300, y: 300, type: POWER_UPS.SPEED, collected: false },
        // Add power-ups
    ],
    enemies: [
        { x: 300, y: 520, width: 30, height: 30, vx: 2, range: 80 },
        // Add enemies
    ],
    checkpoints: [
        { x: 200, y: 520, collected: false },
        // Add checkpoints
    ],
    timeLimit: 120, // seconds
    timeBonusMultiplier: 2
}
```

### Adding New Achievements

Edit `src/ui.js`:

```javascript
// In AchievementSystem constructor
newAchievement: { 
    id: 'newAchievement', 
    name: 'Achievement Name', 
    desc: 'Description of achievement', 
    icon: '🏆',
    unlocked: false 
}
```

Then unlock it in `src/game.js`:
```javascript
this.ui.achievements.unlock('newAchievement');
```

### Adding New Power-Ups

1. Add constant to `src/config.js`
2. Add logic to `src/player.js`
3. Add visual to `src/game.js`
4. Update documentation

---

## Testing

### Manual Testing

See [TESTING.md](TESTING.md) for comprehensive test checklist.

### Key Areas to Test

- All keyboard controls
- All touch controls (mobile)
- All achievements
- All transitions
- All power-ups
- All enemy interactions
- Save/load functionality
- Performance with many particles

### Browser Testing

Test in at least:
- Chrome (desktop and mobile)
- Firefox (desktop)
- Safari (desktop and iOS)
- Edge (desktop)

---

## Questions?

- Open an issue for bugs or feature requests
- Check existing documentation first
- Be patient for responses

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions

Thank you for contributing to Candy Landy! 🍬🎮

---

*Happy Coding!*
