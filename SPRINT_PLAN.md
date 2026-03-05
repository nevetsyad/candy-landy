# Candy Landy Sprint Plan

**Date:** March 5, 2026
**Analysis:** GLM 4.7 (non-flash)

---

## Current State Assessment

The game is already very feature-complete:
- **Version:** 5 with critical fixes
- **Code Size:** 2,480 lines (much larger than documented 900 lines)
- **Implemented Features:**
  - ✅ Checkpoints with healing
  - ✅ Visible timer with color changes
  - ✅ Dash mechanic with invincibility
  - ✅ Wall jump system
  - ✅ Mini-map in HUD
  - ✅ Combo system
  - ✅ Time bonuses
  - ✅ 3 levels with progressive difficulty
  - ✅ 12 sound effects (not 6 as documented)
  - ✅ High score tracking
  - ✅ Screen transitions
  - ✅ Enhanced parallax backgrounds

The documentation is **significantly outdated** — claims about missing features are false. The game is actually in excellent shape.

---

## Identified Improvements (Prioritized)

### Sprint 1: Polish & Quality of Life ⭐⭐⭐⭐⭐
**Why:** Foundation improvements that make everything feel better
**Effort:** Low-Medium
**Impact:** High

**Tasks:**
1. **Smooth Level Transitions** - Currently has basic transitions, enhance with:
   - Fade in/out animations
   - Loading screens with candy theme
   - Smooth camera pan to level start

2. **Enhanced Particle Effects**
   - Add more variety to candy collection particles
   - Improve explosion effects on enemy defeat
   - Add sparkle effects during combo streaks

3. **Dynamic Camera Improvements**
   - Smoother player following (Lerp)
   - Slight camera shake on damage
   - Camera zoom on power-up collection

4. **UI Polish**
   - Add character preview animations to start screen
   - Smooth health bar transitions
   - Better mobile touch controls layout

**Success Criteria:**
- Level transitions feel professional and polished
- Particle effects provide clear visual feedback
- Camera movement is smooth and responsive
- UI is cleaner and more intuitive

---

### Sprint 2: Game Mechanics Depth ⭐⭐⭐⭐
**Why:** Adds strategic depth to gameplay
**Effort:** Medium
**Impact:** High

**Tasks:**
1. **Ground Pound Mechanic**
   - Down + Jump in air
   - Damage enemies below player
   - Break special floor tiles
   - Screen shake on impact

2. **Secret Areas & Collectibles**
   - Hidden platforms behind foreground elements
   - Special gems/stars with bonus points
   - Secret areas with unique challenges
   - Visual hints for secrets (slight shimmer)

3. **Enemy Variety**
   - Add flying enemies
   - Add enemies that throw projectiles
   - Add boss enemies at level ends

4. **Power-Up Variety**
   - Magnet power-up (attracts nearby candies)
   - Double jump power-up
   - Slow motion power-up
   - Shield regeneration over time

**Success Criteria:**
- Ground pound feels impactful and useful
- Secret areas are discoverable but not obvious
- Enemy variety forces different strategies
- New power-ups add meaningful choices

---

### Sprint 3: Level Expansion ⭐⭐⭐
**Why:** More content = more replay value
**Effort:** Medium-High
**Impact:** Medium-High

**Tasks:**
1. **Add 2-3 New Levels**
   - Level 4: Night-themed with reduced visibility
   - Level 5: Ice-themed with slippery platforms
   - Optional: Level 6: Boss level

2. **Level Select Screen**
   - Unlock levels as you complete them
   - Show best scores per level
   - Level preview thumbnails
   - Difficulty indicators

3. **Achievement System**
   - Track achievements (first combo, clear without damage, etc.)
   - Achievement popup on unlock
   - Achievement screen to view all
   - Celebration effects on achievement

**Success Criteria:**
- 3 new levels are complete and balanced
- Level select screen works and is intuitive
- Achievements track accurately and provide satisfaction

---

### Sprint 4: Audio & Visual Polish ⭐⭐⭐
**Why:** Makes the game feel premium
**Effort:** Medium
**Impact:** Medium

**Tasks:**
1. **Enhanced Sound Design**
   - Add music variations per level
   - Dynamic music changes during power-ups
   - Sound cues for low health or low time
   - Improved jump sound variations

2. **Character Animation Improvements**
   - Running leg animation
   - Pigtail sway during movement
   - Landing compression animation
   - Air resistance/hang effect on jumps

3. **Background Effects**
   - Multi-layer parallax (3+ layers)
   - Animated background elements (birds, etc.)
   - Time-of-day effects per level
   - Weather effects (rain, snow, etc.)

4. **Screen Effects**
   - Lens flare or bloom effects
   - Chromatic aberration on damage
   - CRT scanline effect option
   - Vignette effect for focus

**Success Criteria:**
- Music is varied and enhances gameplay
- Character animations are fluid and expressive
- Backgrounds have depth and life
- Screen effects add polish without being distracting

---

### Sprint 5: Mobile & Accessibility ⭐⭐⭐
**Why:** Expands potential audience
**Effort:** Medium
**Impact:** Medium-High

**Tasks:**
1. **Mobile Touch Controls Enhancement**
   - Virtual joystick for movement
   - Action buttons with visual feedback
   - Haptic feedback on mobile (if available)
   - Auto-calibrate to screen size

2. **Accessibility Options**
   - Colorblind mode
   - High contrast mode
   - Adjustable game speed (0.5x - 2x)
   - Larger UI elements option

3. **Save System**
   - Save progress mid-level
   - Resume from save points
   - Multiple save slots
   - Auto-save on checkpoints

4. **Tutorial System**
   - Interactive tutorial level
   - Pop-up hints for new mechanics
   - Optional advanced tutorials
   - Skip option for experienced players

**Success Criteria:**
- Mobile controls feel natural and responsive
- Accessibility options are comprehensive
- Save/load system works reliably
- Tutorial teaches mechanics effectively

---

### Sprint 6: Performance & Code Quality ⭐⭐
**Why:** Foundation for long-term maintenance
**Effort:** Low-Medium
**Impact:** High (long-term)

**Tasks:**
1. **Code Refactoring**
   - Extract classes from procedural code
   - Improve function organization
   - Add comprehensive comments
   - Reduce code duplication

2. **Performance Optimization**
   - Object pooling for particles
   - Lazy loading for levels
   - Optimize rendering pipeline
   - Reduce memory allocations in game loop

3. **Error Handling**
   - Graceful degradation if WebGL fails
   - Better error messages for debugging
   - Save data validation
   - Auto-save before crashes

4. **Testing Framework**
   - Unit tests for game logic
   - Integration tests for level transitions
   - Performance profiling tools
   - Automated screenshot testing

**Success Criteria:**
- Code is cleaner and more maintainable
- Performance is smooth on mid-range devices
- Errors are handled gracefully
- Tests provide confidence in changes

---

### Sprint 7: Multiplayer / Social ⭐
**Why:** Adds social element, optional bonus
**Effort:** High
**Impact:** Variable

**Tasks:**
1. **Ghost Racing Mode**
   - Record and race against your best run
   - Async multiplayer (compare replays)
   - Leaderboards per level
   - Weekly challenges

2. **Social Sharing**
   - Share scores to social media
   - Share replay GIFs
   - Challenge friends to beat score
   - Integration with Discord/webhook

3. **Customization**
   - Character skins/unlockables
   - Custom colors for UI
   - Sound pack selection
   - Theme customization

**Success Criteria:**
- Ghost system records and replays accurately
- Social sharing works smoothly
- Customization provides meaningful options

---

## Implementation Strategy

### Phase 1: Foundation (Sprints 1-2)
**Timeline:** 2-3 days
**Goal:** Polish existing mechanics and add depth
**Deliverables:**
- Enhanced UI and transitions
- Ground pound mechanic
- Secret areas and new enemy types

### Phase 2: Expansion (Sprints 3-4)
**Timeline:** 3-4 days
**Goal:** Add content and polish
**Deliverables:**
- 3 new levels
- Level select screen
- Achievement system
- Enhanced audio and visuals

### Phase 3: Accessibility & Quality (Sprints 5-6)
**Timeline:** 2-3 days
**Goal:** Broaden appeal and improve codebase
**Deliverables:**
- Mobile enhancements
- Accessibility options
- Save system
- Code refactoring and performance improvements

### Phase 4: Optional (Sprint 7)
**Timeline:** As needed
**Goal:** Add social features if time permits

---

## Testing & Deployment

### Per-Sprint Testing
- Test all new features thoroughly
- Verify no regressions in existing functionality
- Check mobile compatibility
- Performance profiling

### Deployment
- Deploy to GitHub Pages after each sprint
- Tag releases with sprint numbers (v5.1, v5.2, etc.)
- Update CHANGELOG.md with sprint details
- Create demo videos of major features

---

## GitHub Pages Deployment

The project should be deployed to:
`https://username.github.io/candy-landy-backup-sprint1/`

Deployment command:
```bash
cd /Users/stevenday/.openclaw/workspace/candy-landy-backup-sprint1
gh pages deploy
```

This will automatically deploy the latest version to GitHub Pages.

---

## Next Steps

1. Start with **Sprint 1: Polish & Quality of Life**
2. Test thoroughly after each sprint
3. Deploy to GitHub Pages
4. Monitor player feedback (if any)
5. Iterate based on results

**Ready to begin implementation!**
