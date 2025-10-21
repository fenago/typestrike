# Product Requirements Document: TypeStrike
## AI-Powered Browser-Based Typing Education Game

---

## 1. Executive Summary

**TypeStrike** is a browser-based typing education game that teaches proper touch typing through an engaging space invaders-style gameplay experience. Built entirely with WebAssembly (WASM) for high performance and integrated with Google's Gemma 3 LLM for personalized AI coaching, TypeStrike makes learning to type both fun and effective.

### Key Differentiators
- 🎮 **Gamified Learning**: Space invaders mechanics make typing practice engaging
- 🤖 **AI-Powered Coach**: Gemma 3 provides personalized feedback and adaptive difficulty
- 🌐 **100% Browser-Based**: No downloads, runs entirely in the browser via WASM
- ✋ **Proper Technique Focus**: Emphasizes correct hand positioning and finger assignments
- 📈 **Progressive Curriculum**: Systematically expands from home row to full keyboard

---

## 2. Product Vision & Goals

### Vision Statement
*"Make touch typing mastery accessible, engaging, and personalized for everyone through AI-powered gamification."*

### Primary Goals
1. **Educational Excellence**: Teach proper touch typing technique with 90%+ user retention
2. **Engagement**: Achieve 20+ minute average session duration
3. **Accessibility**: Zero-friction browser experience with no installation required
4. **Performance**: Maintain 60fps gameplay on mid-range devices
5. **Personalization**: Leverage AI to adapt to individual learning patterns

---

## 3. Target Audience

### Primary Users
- **Students (Ages 12-18)**: Learning typing for school and future career
- **Career Switchers**: Adults entering tech/office careers needing typing skills
- **Casual Improvers**: People wanting to type faster for daily tasks

### User Personas

**Persona 1: "Alex the Student"**
- Age: 14
- Goal: Improve typing speed for school assignments
- Pain Point: Boring typing tutors, hunts-and-pecks
- Motivation: Games, visible progress, competition

**Persona 2: "Morgan the Career Switcher"**
- Age: 28
- Goal: Professional typing skills for new office job
- Pain Point: Bad typing habits from years of 2-finger typing
- Motivation: Career advancement, efficiency

**Persona 3: "Jamie the Optimizer"**
- Age: 35
- Goal: Increase WPM from 40 to 80+
- Pain Point: Plateaued at current speed
- Motivation: Productivity, personal challenge

---

## 4. Technical Architecture

### 4.1 Technology Stack

```
┌─────────────────────────────────────────────┐
│           Browser Environment               │
├─────────────────────────────────────────────┤
│  Frontend Layer                             │
│  - HTML5 Canvas (Rendering)                 │
│  - TypeScript (Game Logic Coordination)     │
│  - Tailwind CSS (UI Components)             │
├─────────────────────────────────────────────┤
│  Game Engine (WASM)                         │
│  - Rust + macroquad                         │
│  - Compiled to WebAssembly                  │
│  - 60fps rendering & physics                │
│  - Input handling                           │
│  - Collision detection                      │
├─────────────────────────────────────────────┤
│  AI Layer                                   │
│  - Gemma 3 (2B or 9B model)                 │
│  - MediaPipe LLM Inference API              │
│  - Browser-based inference (WebGPU)         │
│  - Personalized coaching & feedback         │
├─────────────────────────────────────────────┤
│  State Management                           │
│  - IndexedDB (Progress persistence)         │
│  - LocalStorage (Settings & preferences)    │
│  - Session state (In-memory game state)     │
└─────────────────────────────────────────────┘
```

### 4.2 WASM Game Engine (Rust + macroquad)

**Rationale**: macroquad is perfect for this use case:
- Lightweight and simple API
- Excellent keyboard input handling
- Easy animation and physics
- Compiles cleanly to WASM
- Good performance for 2D games

**Core Modules**:
```rust
// Game engine structure
mod game {
    mod entities;      // Letter, Bullet, Player, Explosion
    mod physics;       // Falling, collision detection
    mod input;         // Keyboard handling
    mod rendering;     // Canvas drawing
    mod scoring;       // Points, combos, statistics
    mod levels;        // Difficulty progression
}
```

### 4.3 AI Integration (Gemma 3/3n via MediaPipe)

**Model Selection**: Gemma 3n multimodal models (E2B/E4B recommended for browser)
- Runs efficiently in browser via WebGPU
- Fast inference for real-time feedback (~500ms)
- Capable of contextual coaching and adaptive content generation
- **Multimodal support**: Process text, images, and audio for enhanced feedback

**Integration Method: MediaPipe LLM Inference API**

MediaPipe is the primary approach for running Gemma 3/3n in-browser:
- **Advantages**:
  - Native support for Gemma 3n multimodal models (E2B, E4B)
  - Optimized WebGPU acceleration via Google's LiteRT runtime
  - Process text, images, and audio in a single inference call
  - Model caching for instant subsequent loads
  - Official Google implementation for Gemma models
  - Built-in support for vision and audio understanding

**Fallback: WebLLM**
- Used when MediaPipe unavailable or user preference
- Text-only inference with Llama 3.2 or Gemma 3 variants
- Automatic graceful degradation

**Implementation**:
```typescript
import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;

async function initAI() {
  const initProgressCallback = (report: webllm.InitProgressReport) => {
    console.log(report.text, report.progress);
    updateLoadingUI(report.progress);
  };

  engine = await webllm.CreateMLCEngine(
    "Gemma-2B-it-q4f16_1-MLC", // Quantized model for browser
    { initProgressCallback }
  );
}

async function getAICoaching(stats: Statistics): Promise<string> {
  const prompt = generateCoachingPrompt(stats);

  const messages: webllm.ChatCompletionMessageParam[] = [
    { role: "system", content: "You are an encouraging typing coach." },
    { role: "user", content: prompt }
  ];

  const reply = await engine!.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 150
  });

  return reply.choices[0].message.content;
}
```

**Model Options**:
- `Gemma-2B-it-q4f16_1-MLC` - ~1.5GB, fast inference, good quality
- `Gemma-2B-it-q4f32_1-MLC` - ~2GB, better quality, slightly slower

**Lazy Loading Strategy**:
```typescript
async function initApp() {
  // 1. Load WASM game engine immediately
  await loadWasmModule();

  // 2. Start game
  startGame();

  // 3. Load AI in background with progress indicator
  showAILoadingBanner("AI Coach loading... 0%");

  await initAI(); // WebLLM handles caching

  hideAILoadingBanner();
  enableAIFeatures();
  showNotification("🤖 AI Coach ready!");
}
```

**Graceful Degradation**:
- If WebGPU unavailable: Show message suggesting Chrome/Edge
- If model fails to load: Use pre-written coaching messages
- Offline mode: Cache recent AI responses for replay

---

## 5. Game Mechanics & Features

### 5.1 Core Gameplay Loop

```
┌─────────────────────────────────────────┐
│  1. Letters spawn at top of screen      │
│     (based on current lesson/level)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Letters fall at configured speed    │
│     (speed increases with level)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Player types the letter             │
│     - Correct: Letter explodes (+points)│
│     - Wrong: Penalty (red flash)        │
│     - Miss: Letter hits ground (-life)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Check game state                    │
│     - Lives remaining? Continue         │
│     - Lives = 0? Game Over              │
│     - Level complete? Advance           │
└─────────────────────────────────────────┘
```

### 5.2 Visual Design

**Theme**: Retro Space Invaders meets Modern Neon
- **Background**: Starfield with parallax scrolling
- **Letters**: Glowing neon characters in "letter ships"
- **Player**: Stationary turret at bottom center
- **Bullets**: Laser beams shooting upward when typing correct letter
- **Explosions**: Particle effects when letters are destroyed
- **UI**: Cyberpunk/retro terminal aesthetic

**Color Palette**:
```
Primary: Neon Blue (#00F0FF)
Secondary: Neon Pink (#FF006E)
Accent: Neon Green (#39FF14)
Background: Deep Space (#0A0E27)
Text: White/Cyan (#FFFFFF / #00F0FF)
Error: Red (#FF3366)
Success: Green (#39FF14)
```

### 5.3 Progressive Learning System

**Lesson Progression** (Based on Proper Finger Positions):

```
Level 1: Home Row Foundation
- F & J (index fingers) - 30 seconds
- Add D & K (middle fingers) - 30 seconds
- Add S & L (ring fingers) - 30 seconds
- Add A & ; (pinkies) - 30 seconds
- Full home row practice - 60 seconds

Level 2: Upper Row Expansion
- Add R & U (index)
- Add E & I (middle)
- Add W & O (ring)
- Add Q & P (pinky)
- Mixed practice

Level 3: Lower Row Integration
- Add V & M (index)
- Add C & , (middle)
- Add X & . (ring)
- Add Z & / (pinky)
- Mixed practice

Level 4: Number Row
- Numbers 4-5-6-7 (index)
- Numbers 3-8 (middle)
- Numbers 2-9 (ring)
- Numbers 1-0 (pinky)

Level 5: Symbols & Full Keyboard
- Common symbols
- Shift key integration
- All letters randomized

Level 6+: Speed & Endurance
- Progressively faster fall speeds
- More simultaneous letters
- Word formation bonuses
- Combo multipliers
```

### 5.4 Difficulty Scaling

**Dynamic Variables**:
- **Fall Speed**: 100px/s → 400px/s (increases by 15% per level)
- **Spawn Rate**: 1 letter/2s → 4 letters/s (increases gradually)
- **Letter Pool**: Expands based on lesson progression
- **Lives**: 5 lives per session (configurable)
- **Time Limit**: None (pure survival mode)

**Adaptive Difficulty** (AI-Powered):
- Gemma 3 analyzes player performance
- Identifies struggling letters/fingers
- Adjusts spawn frequency to focus on weak areas
- Provides encouragement when player is frustrated
- Suggests breaks after detected fatigue patterns

### 5.5 Scoring System

**Base Points**:
- Correct letter typed: **10 points**
- Perfect streak (10+ correct): **2x multiplier**
- Speed bonus (< 0.5s reaction): **+5 points**
- Accuracy bonus (95%+ in session): **+50 points**

**Penalties**:
- Wrong letter typed: **-2 points**
- Letter hits ground: **-10 points, -1 life**

**Combos & Achievements**:
- **Sharpshooter**: 20 correct in a row → +100 points
- **Speed Demon**: Average reaction < 0.4s → +150 points
- **Perfect Round**: Complete level with no errors → +200 points
- **Home Row Hero**: Master home row with 95% accuracy → Badge

### 5.6 Game Modes

**1. Campaign Mode** (Primary)
- Structured lesson progression
- Unlocks new letters systematically
- Story narrative (optional): Defend Earth from "Typo Invaders"
- AI coach provides contextual tips

**2. Practice Mode**
- Choose specific letters to practice
- No lives/game over
- Focus on problem areas identified by AI

**3. Speed Challenge**
- Type as many letters as possible in 60 seconds
- Leaderboard (local browser storage)
- Test current WPM

**4. Zen Mode**
- Slow, meditative typing practice
- Ambient music
- No score pressure
- Focus on form and accuracy

**5. Daily Challenge**
- AI-generated custom challenge each day
- Specific letter combinations
- Special rewards

---

## 6. Gamification & Viral Mechanics

### 6.1 Core Psychological Principles

**Research from Viral Games** (Tetris, Wordle, 2048, Flappy Bird):

| Principle | Description | Implementation in TypeStrike |
|-----------|-------------|------------------------------|
| **Easy to Learn, Hard to Master** | Simple rules, infinite skill ceiling | Type letters to shoot them - but mastering speed/accuracy takes time |
| **Flow State** | Perfect balance of challenge & skill | AI-adjusted difficulty keeps players in "flow zone" |
| **Variable Rewards** | Unpredictable positive reinforcement | Random power-ups, surprise bonuses, achievement unlocks |
| **Progress Visibility** | Clear sense of advancement | XP bar, level progression, WPM graph, badges |
| **Just One More** | Sessions end at moment of peak engagement | Levels designed for 90-120 second completion, "Continue?" prompt |
| **Social Proof** | Comparison with others | Daily leaderboard, "Beat your friends" challenges |
| **Zeigarnik Effect** | Unfinished tasks create tension | Mid-level progress saves, daily streak tracking |
| **Autonomy** | Player choice & control | Multiple game modes, customize difficulty, skip tutorials |
| **Mastery** | Visible skill improvement | WPM tracking, accuracy %, "You've improved X% this week!" |

### 6.2 The "Tetris Effect" - Making It Addictive

**What Made Tetris Viral:**
1. ✅ **Immediate feedback** → Every keypress has instant visual/audio response
2. ✅ **No dead time** → Continuous action, no waiting between levels
3. ✅ **Clear goals** → Survive, improve score, beat personal best
4. ✅ **Escalating difficulty** → Gradually speeds up, tests limits
5. ✅ **Simple mechanics** → Anyone can play in 30 seconds
6. ✅ **Session flexibility** → Play for 2 minutes or 2 hours

**TypeStrike Implementation**:
```
✅ Instant feedback: Letter explodes when typed correctly
✅ No dead time: New letters spawn immediately
✅ Clear goals: Reach Level X, hit Y WPM, earn Z achievement
✅ Escalating difficulty: Letters fall faster, more spawn simultaneously
✅ Simple mechanics: See letter → type letter → profit
✅ Session flexibility: Levels are 90-120s, can play 1 or 20
```

### 6.3 The "Wordle Formula" - Daily Engagement

**What Made Wordle Viral:**
- **Daily Ritual**: One new challenge every day, FOMO if you miss it
- **Social Sharing**: Easy to share results without spoilers
- **Streak Tracking**: Don't break the chain!
- **Universal Access**: Same challenge for everyone

**TypeStrike Implementation**:

**Daily Challenge System**:
```
Every day at midnight (local time):
1. AI generates unique typing challenge
2. Same challenge for all players globally
3. Leaderboard shows top scores
4. Share results: "TypeStrike Day 47: ⭐⭐⭐⭐⭐ WPM: 58 | Try it!"
5. Streak counter: "🔥 15 day streak! Don't break the chain!"

Example Challenge:
"Day 47: Speed Demon Challenge"
- All vowels spawn 2x faster
- Complete 100 letters in 90 seconds
- Bonus: +50 points for 0 errors
```

**Shareable Results** (text-based, like Wordle):
```
TypeStrike Day 47 🚀
⬜⬜⬜🟩🟩 WPM: 58
Accuracy: ⭐⭐⭐⭐⭐
Streak: 🔥 15 days

Play: typestrike.app
```

### 6.4 Progression Loops (Retention Hooks)

**Short Loop** (Session-level, 2-3 minutes):
```
Play Level → Earn Points → See Progress → Level Up → Unlock Achievement
     ↑                                                        ↓
     ←←←←←←←←←←←←←←← "Play Next Level" ←←←←←←←←←←←←←←←←←←←←←←
```

**Medium Loop** (Daily, 15-30 minutes):
```
Complete Daily Challenge → Maintain Streak → Earn Special Badge
                              ↓
                         Come Back Tomorrow (FOMO)
```

**Long Loop** (Weekly/Monthly):
```
Master Letter Set → Unlock New Theme → Progress on Career Path
                         ↓
                  "Typing Novice" → "Keyboard Warrior" → "Typing Ninja"
```

### 6.5 Variable Reward System (Dopamine Triggers)

**Predictable Rewards** (Expected):
- Complete level → XP + coins
- 10 correct letters → Combo multiplier
- Daily login → +10 coins

**Variable Rewards** (Surprise, high dopamine):
- **Random Power-ups** (5% spawn chance):
  - ⚡ Lightning: Next 5 letters auto-typed
  - 🎯 Bullseye: 2x points for 10 seconds
  - ⏰ Time Freeze: Letters pause for 3 seconds
  - 🛡️ Shield: Next error forgiven

- **Mystery Boxes** (appear randomly):
  - Bronze (70% chance): 50 coins
  - Silver (25% chance): 150 coins + 1 life
  - Gold (4% chance): 500 coins + rare badge
  - Legendary (1% chance): Exclusive theme unlock

- **Critical Hits** (random proc on fast typing):
  - Type letter in < 0.3s → "CRITICAL HIT!" +25 bonus points
  - Visual explosion effect + satisfying sound

- **Lucky Streaks**:
  - 7th, 14th, 21st correct letter in a row → Bonus rewards
  - "Lucky number" gamification (777 total letters typed → special badge)

### 6.6 Achievement System (100+ Achievements)

**Categories**:

**Speed Achievements**:
- 🐌 First Steps: 10 WPM
- 🚶 Getting There: 20 WPM
- 🏃 Speed Walker: 40 WPM
- 🚀 Rocket Fingers: 60 WPM
- ⚡ Lightning Hands: 80 WPM
- 🔥 Typing God: 100+ WPM

**Accuracy Achievements**:
- 🎯 Sharpshooter: 95% accuracy (1 session)
- 🎯 Deadeye: 98% accuracy (1 session)
- 🎯 Perfection: 100% accuracy (full level)

**Persistence Achievements**:
- 📅 Dedicated: 7-day login streak
- 📅 Committed: 30-day login streak
- 📅 Legend: 100-day login streak

**Mastery Achievements**:
- ✋ Home Row Hero: Master F-J-D-K-S-L-A-; (95%+ accuracy, 100 attempts each)
- 🔤 Alphabet Master: Type every letter 1,000 times
- 📊 Data Nerd: Play 100 sessions

**Fun/Easter Egg Achievements**:
- 🦉 Night Owl: Play at 2-4am
- ☀️ Early Bird: Play at 5-7am
- 🎂 Birthday Bash: Play on account anniversary
- 🍀 Lucky Seven: Score exactly 777 points
- 🔢 Numerologist: Type 12,345 total letters
- 🎵 Rhythm Master: Type to the beat (every 0.5s exactly for 20 letters)

### 6.7 Social & Competitive Features

**Leaderboards** (Local browser, no server):
- **Daily Top Scores**: Best scores today (resets midnight)
- **All-Time Personal Bests**: Your top 10 sessions
- **WPM Progression**: Fastest improvement this week
- **Accuracy Champions**: Highest accuracy sessions

**Ghost Mode**:
- Race against your previous best performance
- See "ghost" letters representing your last run's timing
- Beat your ghost → Unlock special badge

**Friend Challenges** (Share via link):
```
Share custom challenge link:
"Can you beat my TypeStrike run?
 Level: 3-2 | Score: 2,450 | WPM: 52
 [Play Challenge]"

Friend clicks link → Plays same seed/difficulty → Compare results
```

**Weekly Tournaments** (Optional future):
- Every Monday: New tournament starts
- Play anytime during the week
- Best score counts
- Top 10% get special badge

### 6.8 Progression & Unlockables

**Currency System**:
- **Coins**: Earned from gameplay (10 per level, bonuses)
- **Gems**: Rare currency (daily challenges, achievements)

**Unlockable Content**:

**Visual Themes** (Cost: 500-2000 coins):
- 🌌 Classic Space (Default, free)
- 🌊 Ocean Deep (Underwater theme, letters are fish)
- 🏙️ Cyberpunk City (Neon, Matrix-style)
- 🌸 Zen Garden (Peaceful, pastel colors)
- 🎃 Spooky Season (Halloween theme)
- 🎄 Winter Wonderland (Holiday theme)
- 🌈 Rainbow Rave (Colorful, party vibes)

**Sound Packs** (Cost: 300-1000 coins):
- 🎮 Retro Arcade (8-bit sounds)
- 🎹 Piano Keys (Musical notes)
- 🔫 Laser Blaster (Sci-fi pew pew)
- 🎵 Drum Kit (Percussion)
- 🔇 Silent Mode (No sounds)

**Power-up Upgrades**:
- Increase power-up spawn rate (5% → 8% → 10%)
- Extend power-up duration (3s → 5s → 7s)
- Unlock new power-ups

**Profile Customization**:
- Titles: "Typing Novice", "Keyboard Warrior", "Letter Destroyer"
- Avatars: Different turret designs
- Badge displays: Show off achievements

### 6.9 Feedback & Juice (Game Feel)

**Visual Feedback** (Every action feels impactful):
- ✅ Correct letter typed:
  - Letter explodes with particle effect
  - Screen shake (subtle, 2px)
  - Flash of light at impact
  - Score counter bounces up

- ❌ Wrong letter typed:
  - Red flash on screen edges
  - Error sound (harsh but not punishing)
  - Letter shakes but continues falling
  - -2 points floats up from letter

- 💥 Combo achieved:
  - Multiplier appears center screen (2x! 3x! 10x!)
  - Background color shifts
  - Particle trail on subsequent letters
  - Music intensity increases

- 🎯 Level complete:
  - Slow-mo effect on last letter
  - Victory sound
  - Confetti explosion
  - Stats count up with sound effects

**Audio Feedback** (Satisfying sounds):
- Each correct letter: Distinct pitch (C-D-E-F-G-A-B-C musical scale)
- Combo sounds: Ascending chime
- Error: Subtle buzz (not harsh)
- Level up: Triumphant fanfare
- Achievement unlock: Special jingle + voice "Achievement Unlocked!"

**Haptic Feedback** (Mobile/Controller):
- Correct letter: Light pulse
- Wrong letter: Double pulse
- Combo: Increasing intensity
- Level complete: Victory pattern

### 6.10 The "Just One More" Hook

**End-of-Session Design** (Critical for retention):

```
[Level Complete Screen]

┌────────────────────────────────────────┐
│  🎉 LEVEL 3-2 COMPLETE! 🎉             │
│                                        │
│  Score: 2,450 pts (+450 from best!)   │
│  ⭐⭐⭐⭐⭐ Perfect Accuracy!             │
│                                        │
│  🎁 Unlocked: "Sharpshooter" badge     │
│  💎 +50 gems (Daily Challenge bonus)   │
│                                        │
│  ━━━━━━━━━━━━━━━━━━ 90% to Level 4-1  │← Zeigarnik Effect
│                                        │
│  💬 AI Coach: "Wow! Your 'U' key is    │
│     finally clicking! I think you're   │
│     ready for the number row..."       │← Encouragement + teaser
│                                        │
│  [▶️ NEXT LEVEL] ← Big, obvious        │
│  [🏠 Main Menu]  ← Small, less obvious │
│                                        │
│  ⚡ Bonus: Play now for 2x XP!         │← Time-limited FOMO
│     (expires in 4:37)                  │
└────────────────────────────────────────┘
```

**Design Tactics**:
1. **Progress Bar Almost Full**: "Just one more level to reach Level 4!"
2. **Tease Next Content**: "Number row unlocks next - are you ready?"
3. **Time-Limited Bonus**: "Play in next 5 mins for 2x XP!"
4. **AI Cliffhanger**: "I noticed something interesting about your typing... let's test it in the next level!"
5. **Near-Miss Achievement**: "Only 3 more perfect levels for 'Flawless Streak' badge!"

### 6.11 Retention Mechanics

**Daily Return Incentives**:
- **Login Rewards**:
  - Day 1: 10 coins
  - Day 2: 20 coins
  - Day 3: 30 coins + 1 gem
  - Day 7: 100 coins + 5 gems + special badge
  - Day 30: Exclusive theme unlock

- **Daily Challenges**:
  - New challenge every 24 hours
  - "Don't break your streak!" notification
  - Streak counter with fire emoji (🔥)

- **Missed Day Recovery**:
  - Miss 1 day: "Use 50 gems to restore streak?"
  - Miss 2+ days: Streak resets, but "Comeback Badge" awarded when starting new streak

**Session Frequency**:
- **Recommended Session**: 15 minutes (shown in UI)
- **Break Reminders**: "You've been playing for 30 mins - nice! Take a 5 min break?"
- **Optimal Practice**: AI suggests best time to practice based on performance patterns

**Re-engagement (Browser Notifications)**:
- "Your 15-day streak is at risk! 🔥 Come back today!"
- "New Daily Challenge available! Can you beat yesterday's score?"
- "You're 2 levels away from unlocking the Cyberpunk theme!"
- (All optional, opt-in only)

---

## 7. AI Integration - Creative Uses of Gemma 3

### 7.1 Intelligent Coaching System

**Real-Time Performance Analysis**:
```javascript
// Example AI prompt structure
const analysisPrompt = `
You are a typing coach analyzing this student's performance:

Session Stats:
- Letters attempted: ${stats.total}
- Accuracy: ${stats.accuracy}%
- Weak letters: ${stats.weakLetters.join(', ')}
- Weak fingers: ${stats.weakFingers.join(', ')}
- Average reaction time: ${stats.avgReaction}ms
- Session duration: ${stats.duration} minutes

Provide brief, encouraging feedback (max 2 sentences) and one specific tip to improve.
`;
```

**AI Coach Features**:
1. **Session Summaries**: After each game, AI provides personalized insights
2. **Motivation Messages**: Detects frustration (e.g., repeated errors) and provides encouragement
3. **Technique Tips**: Suggests specific finger/hand position improvements
4. **Progress Narratives**: Describes improvement over time in engaging language
5. **Challenge Generation**: Creates custom letter sequences to address weaknesses

### 7.2 Adaptive Content Generation

**Dynamic Letter Sequences**:
- AI generates practice sequences focusing on weak areas
- Creates "pronounceable" letter combos for better learning
- Balances challenge with achievable goals

**Example**:
```
Player struggles with 'K' and 'L':
AI generates: "KLAK LOLK KALE LAKE KEEL LEEK"
(Real words when possible, muscle memory patterns)
```

### 7.3 Conversational Tutorial

**Interactive Onboarding**:
```
AI Coach: "Welcome! Let me see how you type. Place your left index
          finger on 'F' and right index on 'J'. Feel those little
          bumps? Those are your home keys. Ready to try?"

[Player completes tutorial level]

AI Coach: "Great! I noticed you're looking at the keyboard for 'K'.
          That's normal! 'K' is just one key to the right of 'J'.
          Try feeling for it without looking. Let's practice!"
```

### 7.4 Mistake Pattern Recognition

**Common Error Analysis**:
```javascript
// AI identifies patterns
Detected Pattern: Player types 'L' when target is 'K' (70% of K errors)
AI Insight: "Ring finger reaching too far - K is closer than you think!"

Detected Pattern: Player types 'R' when target is 'T'
AI Insight: "Index finger drifting! Remember, 'R' and 'T' are both
            index fingers, but T is the stretch upward from F."
```

### 7.5 Gamified Story Mode

**AI-Generated Narrative**:
- Each level has AI-generated story context
- Narrative adapts to player's performance
- Creates emotional investment

**Example Story Arc**:
```
Level 1: "The Typo Invaders are approaching! Master your home row
         defense system (F-D-S-A and J-K-L-;) to activate the shields!"

Level 3: "Excellent work, recruit! The invaders are adapting - they're
         now attacking from the lower quadrant. Time to learn the
         bottom row defenses!"

[Player struggles on Level 5]

AI: "Commander, I know this is tough. But you've come so far! Remember
     how Level 1 felt impossible? Now you're defending against full
     keyboard assaults. Take a breath, reset your hands to home position,
     and let's show these invaders what you're made of!"
```

### 7.6 Performance Prediction & Goal Setting

**Intelligent Progression**:
```
AI Analysis:
- Current WPM: 25
- Improvement rate: +3 WPM/week
- Prediction: "At this pace, you'll hit 40 WPM in 5 weeks!"
- Suggested goal: "Let's aim for 30 WPM by next week. I'll adjust
  your practice to focus on your slowest letter transitions."
```

### 7.7 Multimodal AI Capabilities (Gemma 3n E2B/E4B)

TypeStrike leverages Gemma 3n's multimodal capabilities to provide unprecedented typing coaching through vision and audio analysis.

#### 7.7.1 Visual Hand Position Analysis

**Screenshot-Based Feedback**:
- Capture webcam or screen during typing sessions
- AI analyzes hand positioning on keyboard
- Detects common mistakes:
  - Fingers not on home row
  - Wrist angle issues (ergonomics)
  - Looking at keyboard vs screen
  - Incorrect finger assignments

**Example Implementation**:
```typescript
async function analyzeHandPosition(screenshot: string): Promise<string> {
  const prompt = `Analyze this image of a person's hands on a keyboard.

  Check for:
  1. Are index fingers on F and J (home keys)?
  2. Is wrist angle neutral (not bent)?
  3. Are fingers curved properly?
  4. Is the person looking at the screen or keyboard?

  Provide brief, actionable feedback in 2 sentences.`;

  const response = await aiCoach.getMultimodalFeedback(
    stats,
    [screenshot], // image input
    undefined     // no audio
  );

  return response;
}
```

**Visual Feedback Examples**:
```
✅ "Perfect form! Your fingers are resting on the home row with a nice
   curved posture. Keep that wrist angle neutral!"

⚠️ "I see your wrists are bent upward - try to keep them flat and level
   with your forearms to prevent strain."

⚠️ "Your left pinky is drifting off the 'A' key. Remember to always
   return to home position between keystrokes!"
```

#### 7.7.2 Typing Rhythm Audio Analysis

**Microphone-Based Feedback**:
- Record keystroke sounds during gameplay
- AI analyzes typing rhythm and patterns
- Detects:
  - Inconsistent timing (hesitation patterns)
  - "Hunt and peck" vs touch typing rhythm
  - Stress indicators (loud, forceful keystrokes)
  - Optimal flow state patterns

**Audio Pattern Recognition**:
```typescript
async function analyzeTypingRhythm(audioBuffer: AudioBuffer): Promise<string> {
  const prompt = `Listen to this typing session audio.

  Analyze:
  1. Is the typing rhythm consistent or irregular?
  2. Are there long pauses indicating searching for keys?
  3. Is keystroke force even or does it vary?
  4. Does this sound like confident touch typing or hesitant hunt-and-peck?

  Provide encouraging feedback about their typing rhythm.`;

  const response = await aiCoach.getMultimodalFeedback(
    stats,
    undefined,    // no images
    audioBuffer   // audio input
  );

  return response;
}
```

**Audio Feedback Examples**:
```
✅ "Your typing rhythm is smooth and consistent - that's the sound of
   muscle memory in action! Beautiful flow!"

⚠️ "I hear some hesitation before certain keys. That's normal! Try
   practicing those letters in isolation to build confidence."

⚠️ "Your keystrokes are a bit forceful. Try lighter, gentler presses -
   it's less fatiguing and actually faster!"
```

#### 7.7.3 Combined Multimodal Analysis

**Vision + Audio + Performance Data**:
The most powerful coaching comes from combining all modalities:

```typescript
async function getComprehensiveFeedback(
  stats: SessionStats,
  handScreenshot: string,
  typingAudio: AudioBuffer
): Promise<CoachingReport> {

  const multimodalPrompt = `Analyze this typing session:

PERFORMANCE DATA:
- WPM: ${stats.wpm}
- Accuracy: ${stats.accuracy}%
- Weak letters: ${stats.weakLetters.join(', ')}

VISUAL INPUT (hand position screenshot):
[Image shows current hand positioning on keyboard]

AUDIO INPUT (typing sounds):
[Audio captures keystroke rhythm and patterns]

Provide comprehensive coaching feedback addressing:
1. Technical form (hand position, posture)
2. Rhythm and flow (from audio patterns)
3. Performance correlation (how form affects stats)
4. Specific actionable improvements

Keep it encouraging and under 4 sentences.`;

  const response = await aiCoach.getMultimodalFeedback(
    stats,
    [handScreenshot],
    typingAudio
  );

  return response;
}
```

**Combined Feedback Example**:
```
🎯 "I notice your hands are in good position on the home row, but the
   audio reveals hesitation before the 'K' key - your ring finger needs
   more practice! Your 78% accuracy on 'K' confirms this. Try the
   'KLAK LOLK' drill to build that muscle memory, and you'll see both
   your rhythm smooth out and your accuracy jump to 90%+!"
```

#### 7.7.4 Real-Time Technique Coaching

**Live Session Monitoring** (Future Enhancement):
- Webcam tracks hand position during gameplay
- Audio captures typing rhythm in real-time
- AI provides live tips during breaks between levels

**Adaptive Difficulty Based on Multimodal Cues**:
```typescript
// Detect when player is struggling via multiple signals
if (visualAnalysis.handsOffHomeRow &&
    audioAnalysis.irregularRhythm &&
    stats.accuracy < 80) {

  // AI suggests: "I see you're searching for keys - let's slow down
  // and focus on returning to F and J between each keystroke."

  levelDifficulty.reduce();
  spawnRate.decrease();
}
```

#### 7.7.5 Progressive Skill Building with Vision

**Hand Position Tutorial with Live Feedback**:
```
Level 0 (Tutorial):
1. AI: "Show me your hands on the keyboard"
2. [Webcam captures image]
3. AI analyzes: "Great! I see your index fingers on F and J. Now let's
   practice the home row. Keep your eyes on the screen, not the keyboard!"
4. [Player types home row letters]
5. [Webcam captures periodic screenshots]
6. AI: "Perfect! You're maintaining position even during typing!"
```

#### 7.7.6 Posture & Ergonomics Coaching

**Long-term Health Monitoring**:
- Periodic screenshots during extended sessions
- AI detects posture degradation over time
- Reminds users to take breaks when poor posture detected

**Ergonomic Feedback Examples**:
```
⚠️ "I've noticed your shoulders are creeping upward as you play. Take a
   deep breath, relax your shoulders, and maintain that home row position!"

⚠️ "Your wrist angle has shifted - remember to keep wrists neutral and
   level with the keyboard. Consider a wrist rest if you're feeling strain."

✅ "Your posture is excellent! Shoulders relaxed, wrists neutral, fingers
   curved - this is how to type for hours without fatigue!"
```

#### 7.7.7 Privacy & Ethics Considerations

**User Control & Privacy**:
- All multimodal features are **opt-in only**
- Camera/microphone access requires explicit permission
- All processing happens locally in-browser (no data sent to servers)
- Users can disable multimodal features at any time
- Visual indicators when camera/mic are active
- Captured media never stored permanently (ephemeral analysis only)

**Settings UI**:
```
Multimodal AI Features:
☐ Enable camera for hand position analysis
☐ Enable microphone for rhythm analysis
☐ Periodic posture checks (every 10 minutes)
☐ Show visual indicator when camera is active

[All processing is 100% local - nothing leaves your device!]
```

#### 7.7.8 Technical Implementation

**MediaPipe Multimodal API**:
```typescript
// Gemma 3n E2B/E4B support multimodal inputs
const multimodalPrompt = [
  '<start_of_turn>user\n',
  'Analyze this typing session:\n',
  systemPrompt,
  '\n\nPerformance stats:\n',
  statsText,
  '\n\nHand position (screenshot):\n',
  { imageSource: base64Screenshot },  // Vision input
  '\n\nTyping rhythm (audio):\n',
  { audioSource: audioBuffer },        // Audio input
  '\n\nProvide coaching feedback.<end_of_turn>\n',
  '<start_of_turn>model\n'
];

const response = await llmEngine.generateResponse(multimodalPrompt);
```

**Browser Requirements**:
- WebGPU support (Chrome 113+, Edge 113+)
- Gemma 3n E2B (1.5GB) or E4B (3GB) model
- getUserMedia() API for camera/microphone access
- Canvas API for screenshot capture

### 7.8 Social Features (Optional Future)

**AI-Generated Challenges**:
- "Your friend beat your score! Here's a custom practice routine to help you catch up."
- "AI thinks you can beat your personal best today - special challenge loaded!"

---

## 8. User Experience Flow

### 8.1 First-Time User Journey

```
1. Landing Page
   ↓
   "Start Learning" button
   ↓
2. Hand Position Tutorial
   ↓
   Interactive visual: Hands on keyboard
   AI Coach: "Place your fingers on the home row..."
   ↓
3. Quick Assessment (Optional)
   ↓
   "Let's see your current level!"
   Type a few letters → AI assesses starting point
   ↓
4. Main Game
   ↓
   Tutorial overlays for first session
   AI coach provides real-time guidance
   ↓
5. Post-Session Feedback
   ↓
   AI-generated summary
   Stats visualization
   Next lesson preview
```

### 8.2 Returning User Journey

```
1. Landing Page
   ↓
   Shows progress stats, next lesson
   ↓
2. Quick Play
   ↓
   Continue from last lesson
   OR
   Choose practice mode/challenge
   ↓
3. Play Session
   ↓
4. Results & AI Feedback
   ↓
5. Review Progress Chart
```

### 8.3 UI/UX Screens

**Screen 1: Main Menu**
```
╔════════════════════════════════════════════╗
║            🚀 TYPE STRIKE 🚀               ║
║                                            ║
║  ┌──────────────────────────────────────┐ ║
║  │  👤 Welcome back, Alex!              │ ║
║  │  📊 Level 3 | WPM: 28 | Accuracy: 94%│ ║
║  └──────────────────────────────────────┘ ║
║                                            ║
║  [▶ Continue Campaign - Level 3]          ║
║                                            ║
║  [ 🎯 Practice Mode ]                     ║
║  [ ⚡ Speed Challenge ]                    ║
║  [ 🧘 Zen Mode ]                          ║
║  [ 📈 View Progress ]                     ║
║  [ ⚙️  Settings ]                          ║
║                                            ║
║  💬 AI Coach: "Ready to tackle the lower  ║
║     row? I've prepared a special practice ║
║     session for you!"                     ║
╚════════════════════════════════════════════╝
```

**Screen 2: Game Play**
```
╔════════════════════════════════════════════╗
║ ❤️❤️❤️❤️❤️  |  Score: 1,250  |  Combo: x3  ║
║ Level 2-3: Upper Row Challenge             ║
╠════════════════════════════════════════════╣
║                                            ║
║         🅰️              🅵                  ║
║                                            ║
║                   🅱️                       ║
║                                            ║
║    🅨️         🅷                           ║
║                                            ║
║              🅹️                            ║
║                                            ║
║                                            ║
║                    ▼                       ║
║                   ╱│╲  [Player Turret]    ║
║══════════════════════════════════════════  ║
║                                            ║
║ 🎯 Target: Type the falling letters!      ║
║ ⌨️  Keep fingers on home row (ASDF JKL;)  ║
╚════════════════════════════════════════════╝
```

**Screen 3: Post-Game AI Feedback**
```
╔════════════════════════════════════════════╗
║           🎉 LEVEL COMPLETE! 🎉            ║
║                                            ║
║  Final Score: 2,450 pts                    ║
║  Accuracy: 92% ⭐⭐⭐                        ║
║  Speed: 32 WPM (+4 from last session!)     ║
║  Streak: 15 correct in a row               ║
║                                            ║
║  ┌────────────────────────────────────┐   ║
║  │ 🤖 AI Coach Feedback:              │   ║
║  │                                    │   ║
║  │ "Fantastic progress! Your 'E' and  │   ║
║  │  'I' keys are much smoother now.   │   ║
║  │  I noticed you're still hesitating │   ║
║  │  on 'U' - let's focus on that next.│   ║
║  │  Keep that middle finger ready!"   │   ║
║  └────────────────────────────────────┘   ║
║                                            ║
║  Weak Keys: U (78%), R (85%)               ║
║  Strong Keys: E (99%), I (97%)             ║
║                                            ║
║  [ ▶ Next Level ]  [ 🔄 Retry ]  [ 🏠 Menu]║
╚════════════════════════════════════════════╝
```

**Screen 4: Progress Dashboard**
```
╔════════════════════════════════════════════╗
║            📈 YOUR PROGRESS 📈              ║
╠════════════════════════════════════════════╣
║                                            ║
║  WPM Over Time:                            ║
║  40 │                              ╱       ║
║  30 │                         ╱────        ║
║  20 │                  ╱──────             ║
║  10 │         ╱────────                    ║
║   0 └────────────────────────────────→     ║
║     Week 1  Week 2  Week 3  Week 4         ║
║                                            ║
║  Accuracy by Finger:                       ║
║  Left Hand:  L.Pinky ████████░░ 82%        ║
║              L.Ring  ██████████ 95%        ║
║              L.Mid   ████████░░ 89%        ║
║              L.Index ██████████ 98%        ║
║                                            ║
║  Right Hand: R.Index ██████████ 96%        ║
║              R.Mid   ███████░░░ 87%        ║
║              R.Ring  █████░░░░░ 79% ⚠️     ║
║              R.Pinky ████░░░░░░ 75% ⚠️     ║
║                                            ║
║  💬 AI Insight: "Your left hand is stronger│
║     than your right! Let's balance that    ║
║     with focused practice on K, L, and ;." ║
║                                            ║
║  [ 🎯 Generate Practice Plan ]             ║
╚════════════════════════════════════════════╝
```

---

## 9. Technical Requirements

### 9.1 Performance Requirements

| Metric | Target | Critical |
|--------|--------|----------|
| Frame Rate | 60 FPS | 30 FPS min |
| Initial Load Time | < 3 seconds | < 5 seconds |
| AI Response Time | < 1 second | < 2 seconds |
| Input Latency | < 50ms | < 100ms |
| Memory Usage | < 200MB | < 400MB |
| Bundle Size (WASM) | < 2MB | < 5MB |
| AI Model Load | < 5 seconds | < 10 seconds |

### 9.2 Browser Compatibility

**Minimum Requirements**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 15+ (WebGPU for AI)
- WebAssembly support (all modern browsers)
- WebGPU or WebGL 2.0 (for AI inference)
- LocalStorage & IndexedDB support

**Graceful Degradation**:
- If WebGPU unavailable: Load smaller Gemma 3 model or use simplified AI
- If WASM fails: Display error with browser update recommendation
- Mobile: Touch support for UI, but keyboard required for gameplay

### 9.3 Data Storage

**IndexedDB Schema**:
```javascript
{
  userProfile: {
    userId: string,           // UUID
    createdAt: timestamp,
    lastPlayed: timestamp,
    totalSessions: number,
    totalPlayTime: number     // minutes
  },

  progress: {
    currentLevel: number,
    unlockedLevels: number[],
    completedLessons: string[],
    achievements: string[]
  },

  statistics: {
    perLetterStats: {
      'a': { attempts: 100, correct: 95, avgTime: 423 },
      'b': { attempts: 87, correct: 78, avgTime: 512 },
      // ... all letters
    },
    perFingerStats: {
      'leftPinky': { accuracy: 82, avgTime: 567 },
      // ... all fingers
    },
    sessionHistory: [
      {
        timestamp: timestamp,
        duration: number,
        level: string,
        score: number,
        accuracy: number,
        wpm: number,
        mistakes: { letter: count }
      }
    ]
  },

  aiContext: {
    conversationHistory: [],   // Last 10 AI interactions
    identifiedWeaknesses: [],
    customChallenges: [],
    lastAnalysis: timestamp
  }
}
```

**Privacy Considerations**:
- All data stored locally (no server)
- Optional export for backup
- Clear data option in settings
- No tracking or analytics (unless user opts in)

### 9.4 Development Phases

**Phase 1: MVP (4-6 weeks)**
- ✅ Basic WASM game engine (letter falling, typing detection)
- ✅ Home row lessons (Levels 1-2)
- ✅ Simple scoring system
- ✅ Basic UI (game screen, menu, results)
- ✅ Local storage for progress
- ⏸️ No AI integration yet (placeholder coach messages)

**Phase 2: Full Game (3-4 weeks)**
- ✅ Complete lesson progression (Levels 1-6)
- ✅ All game modes (Campaign, Practice, Speed, Zen)
- ✅ Enhanced visuals (particles, animations, sound effects)
- ✅ Achievements & unlockables
- ✅ Statistics dashboard

**Phase 3: AI Integration (3-4 weeks)**
- ✅ Gemma 3 integration via MediaPipe/Transformers.js
- ✅ Real-time AI coaching
- ✅ Performance analysis & insights
- ✅ Adaptive difficulty
- ✅ AI-generated challenges

**Phase 4: Polish & Optimization (2-3 weeks)**
- ✅ Performance optimization (WASM, AI inference)
- ✅ Accessibility features (high contrast mode, keyboard shortcuts)
- ✅ Tutorial improvements
- ✅ Sound design & music
- ✅ Mobile-responsive UI (for non-gameplay screens)

**Phase 5: Advanced Features (Future)**
- Cloud sync (optional account system)
- Multiplayer typing races
- Social features (friends, leaderboards)
- Custom lesson creator
- Integration with educational platforms

---

## 10. Success Metrics

### 10.1 User Engagement

| Metric | Target (3 months) |
|--------|-------------------|
| Average Session Duration | 15+ minutes |
| Daily Active Users (if public) | 1,000+ |
| Return Rate (7-day) | 40%+ |
| Completion Rate (Level 1) | 80%+ |
| Completion Rate (Full Campaign) | 30%+ |

### 10.2 Educational Effectiveness

| Metric | Target |
|--------|--------|
| Average WPM Improvement (4 weeks) | +15 WPM |
| Average Accuracy Improvement | +10% |
| Users reaching 40+ WPM | 60%+ |
| Users mastering home row | 85%+ |

### 10.3 Technical Performance

| Metric | Target |
|--------|--------|
| Crash Rate | < 0.1% |
| Load Failure Rate | < 1% |
| Average FPS | 58+ |
| AI Timeout Rate | < 5% |

---

## 11. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemma 3 too slow in browser | High | Medium | Offer "lite mode" without AI, use smaller model |
| WASM compatibility issues | High | Low | Extensive browser testing, fallback to JS version |
| AI provides inappropriate feedback | Medium | Low | Prompt engineering, content filtering, user reporting |
| Users get frustrated with difficulty | Medium | Medium | AI-driven adaptive difficulty, optional easier modes |
| Large bundle size | Medium | Medium | Code splitting, lazy loading AI model, compression |

---

## 12. Future Enhancements

### 12.1 Short-term (3-6 months)
- **Voice Coach**: Optional AI voice feedback (text-to-speech)
- **Themed Levels**: Different visual themes (cyberpunk, fantasy, retro)
- **Custom Soundtracks**: User-uploaded music or Spotify integration
- **Accessibility**: Screen reader support, colorblind modes
- **Localization**: Support for international keyboard layouts

### 12.2 Long-term (6-12 months)
- **Multiplayer**: Real-time typing races with friends
- **Tournament Mode**: Weekly competitions with prizes
- **AI Tutor Chat**: Full conversational interface with Gemma 3
- **Physical Keyboard Visualization**: Camera integration to check hand position
- **VR Mode**: Immersive typing experience (Quest browser)
- **API for Educators**: School/corporate integration
- **Advanced Analytics**: ML-powered posture/technique analysis

---

## 13. Technical Architecture Details

### 13.1 Project Structure

```
typestrike/
├── rust-game/                 # Rust/macroquad WASM game engine
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── game/
│   │   │   ├── entities.rs   # Letter, Bullet, Player
│   │   │   ├── physics.rs    # Movement, collisions
│   │   │   ├── input.rs      # Keyboard handling
│   │   │   ├── rendering.rs  # Canvas drawing
│   │   │   └── state.rs      # Game state management
│   │   ├── levels/
│   │   │   ├── curriculum.rs # Lesson definitions
│   │   │   └── difficulty.rs # Adaptive scaling
│   │   └── scoring/
│   │       ├── points.rs     # Score calculation
│   │       └── stats.rs      # Statistics tracking
│   ├── Cargo.toml
│   └── build.sh              # WASM compilation script
│
├── web/                       # TypeScript/JS web layer
│   ├── src/
│   │   ├── main.ts           # App initialization
│   │   ├── wasm-loader.ts    # WASM module loading
│   │   ├── ai/
│   │   │   ├── gemma.ts      # Gemma 3 integration
│   │   │   ├── coach.ts      # AI coaching logic
│   │   │   └── prompts.ts    # Prompt templates
│   │   ├── ui/
│   │   │   ├── menu.ts       # Main menu
│   │   │   ├── hud.ts        # In-game HUD
│   │   │   ├── results.ts    # Post-game screen
│   │   │   └── dashboard.ts  # Progress dashboard
│   │   ├── storage/
│   │   │   ├── db.ts         # IndexedDB wrapper
│   │   │   └── stats.ts      # Statistics persistence
│   │   └── utils/
│   │       ├── audio.ts      # Sound effects
│   │       └── analytics.ts  # Performance tracking
│   ├── index.html
│   ├── styles/
│   │   └── main.css          # Tailwind + custom styles
│   ├── package.json
│   └── vite.config.ts        # Build config
│
├── assets/
│   ├── audio/
│   │   ├── sfx/              # Sound effects
│   │   └── music/            # Background music
│   ├── images/
│   │   ├── sprites/          # Game sprites
│   │   └── ui/               # UI elements
│   └── fonts/
│       └── mono.woff2        # Monospace font
│
├── docs/
│   ├── prd.md                # This document
│   ├── api.md                # WASM ↔ JS API docs
│   └── ai-prompts.md         # AI prompt library
│
└── README.md
```

### 13.2 WASM ↔ JavaScript Bridge

**Data Flow**:
```rust
// Rust exposes functions to JS
#[no_mangle]
pub extern "C" fn game_init() -> *const GameState { ... }

#[no_mangle]
pub extern "C" fn game_update(delta_time: f32) { ... }

#[no_mangle]
pub extern "C" fn game_handle_input(key_code: u32) -> *const InputResult { ... }

#[no_mangle]
pub extern "C" fn game_get_stats() -> *const Statistics { ... }
```

```typescript
// TypeScript calls Rust functions
interface WasmModule {
  game_init(): GameStatePtr;
  game_update(deltaTime: number): void;
  game_handle_input(keyCode: number): InputResultPtr;
  game_get_stats(): StatisticsPtr;
}

// JS handles AI, UI, storage
async function onGameComplete(stats: Statistics) {
  const aiFeedback = await getAICoaching(stats);
  await saveStatsToDb(stats);
  showResultsScreen(stats, aiFeedback);
}
```

### 13.3 AI Implementation with WebLLM

**Full Implementation Example**:
```typescript
import * as webllm from "@mlc-ai/web-llm";

class AICoach {
  private engine: webllm.MLCEngine | null = null;
  private isLoading = false;
  private isReady = false;

  async initialize() {
    if (this.isReady) return;
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      const initProgressCallback = (report: webllm.InitProgressReport) => {
        console.log(`Loading AI: ${report.text} - ${(report.progress * 100).toFixed(0)}%`);
        this.updateUI(report.progress);
      };

      this.engine = await webllm.CreateMLCEngine(
        "Gemma-2B-it-q4f16_1-MLC", // ~1.5GB quantized model
        {
          initProgressCallback,
          logLevel: "WARN"
        }
      );

      this.isReady = true;
      this.isLoading = false;
      console.log("AI Coach initialized successfully!");

    } catch (error) {
      console.error("Failed to initialize AI:", error);
      this.isLoading = false;
      // Fall back to pre-written messages
    }
  }

  async getSessionFeedback(stats: Statistics): Promise<string> {
    if (!this.isReady || !this.engine) {
      return this.getFallbackFeedback(stats);
    }

    const prompt = this.generateFeedbackPrompt(stats);

    const messages: webllm.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are TypeBot, an encouraging and concise typing coach.
                  Provide brief feedback in 2-3 sentences. Be warm, specific,
                  and actionable. Never be negative.`
      },
      { role: "user", content: prompt }
    ];

    try {
      const reply = await this.engine.chat.completions.create({
        messages,
        temperature: 0.8,
        max_tokens: 100,
        top_p: 0.9
      });

      return reply.choices[0].message.content || this.getFallbackFeedback(stats);

    } catch (error) {
      console.error("AI generation error:", error);
      return this.getFallbackFeedback(stats);
    }
  }

  private generateFeedbackPrompt(stats: Statistics): string {
    return `
Session Performance:
- Duration: ${stats.duration}s
- Letters typed: ${stats.total}
- Accuracy: ${stats.accuracy}%
- WPM: ${stats.wpm}
- Weak letters (< 85%): ${stats.weakLetters.join(', ') || 'None'}
- Previous WPM: ${stats.previousWPM}
- Improvement: ${stats.wpm - stats.previousWPM > 0 ? '+' : ''}${stats.wpm - stats.previousWPM} WPM

Provide encouraging feedback highlighting one strength and one specific tip.
    `.trim();
  }

  private getFallbackFeedback(stats: Statistics): string {
    // Pre-written messages when AI unavailable
    const templates = [
      `Great session! You typed ${stats.total} letters at ${stats.wpm} WPM. Keep practicing!`,
      `Nice work! Your accuracy of ${stats.accuracy}% is solid. Focus on building speed next!`,
      `You're improving! ${stats.wpm} WPM is progress. Keep your fingers on the home row!`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private updateUI(progress: number) {
    // Update loading bar in UI
    const loadingBar = document.getElementById('ai-loading-progress');
    if (loadingBar) {
      loadingBar.style.width = `${progress * 100}%`;
    }
  }
}

// Usage
const aiCoach = new AICoach();

// Initialize in background after game loads
setTimeout(() => {
  aiCoach.initialize();
}, 2000);

// Get feedback after session
async function onGameComplete(stats: Statistics) {
  const feedback = await aiCoach.getSessionFeedback(stats);
  showFeedbackScreen(stats, feedback);
}
```

**Streaming Responses** (for longer interactions):
```typescript
async getStreamingFeedback(stats: Statistics): Promise<void> {
  const prompt = this.generateFeedbackPrompt(stats);

  const chunks = await this.engine!.chat.completions.create({
    messages: [
      { role: "system", content: "You are TypeBot..." },
      { role: "user", content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 150,
    stream: true // Enable streaming
  });

  let fullResponse = "";

  for await (const chunk of chunks) {
    const content = chunk.choices[0]?.delta?.content || "";
    fullResponse += content;

    // Update UI with each chunk for real-time typing effect
    updateFeedbackDisplay(fullResponse);
  }
}
```

---

## 14. Marketing & Distribution

### 14.1 Target Distribution Channels
- **Primary**: Direct web hosting (typestrike.app)
- **Secondary**:
  - Product Hunt launch
  - Hacker News "Show HN"
  - Reddit r/learnprogramming, r/typing
  - Educational platforms (ClassDojo, Google Classroom)

### 14.2 Key Messaging
- **Tagline**: "Learn to type at the speed of thought"
- **USPs**:
  - "Your personal AI typing coach"
  - "Zero downloads, pure browser magic"
  - "From hunt-and-peck to typing ninja in 30 days"
  - "Space Invaders meets typing tutor"

### 14.3 Monetization (Optional)
- **Free Tier**: Full game, AI features, progress tracking
- **Premium** ($5/month or $30/year):
  - Advanced statistics
  - Cloud sync
  - Custom themes
  - Multiplayer mode
  - Priority AI coaching (larger model)

---

## 15. Development Resources

### 15.1 Required Skills
- **Rust**: WASM compilation, macroquad framework
- **TypeScript/JavaScript**: Modern web development
- **WebAssembly**: Browser integration
- **ML**: Gemma 3 integration, prompt engineering
- **Game Design**: Physics, collision detection, UX

### 15.2 External Dependencies

**Rust/WASM**:
```toml
[dependencies]
macroquad = "0.4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
getrandom = { version = "0.2", features = ["js"] }  # For WASM random
```

**TypeScript/Web**:
```json
{
  "dependencies": {
    "@mlc-ai/web-llm": "^0.2.46",
    "vite": "^5.0.0",
    "idb": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "chart.js": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
```

**Assets**:
- Sound effects: freesound.org or custom
- Music: royalty-free (incompetech.com)
- Fonts: Google Fonts (JetBrains Mono)

### 15.3 Testing Strategy
- **Unit Tests**: Rust game logic, TypeScript utilities
- **Integration Tests**: WASM ↔ JS bridge
- **E2E Tests**: Playwright for user flows
- **Performance Tests**: Lighthouse, custom FPS monitoring
- **AI Tests**: Validate coaching quality, response time
- **Browser Tests**: BrowserStack for compatibility

---

## 16. Appendix

### 16.1 Typing Pedagogy Research

**Key Principles** (incorporated into game design):
1. **Home Row First**: F & J are foundational
2. **Finger Assignment**: Never type a letter with wrong finger
3. **Muscle Memory**: Repetition without looking
4. **Progressive Loading**: Don't overwhelm with full keyboard
5. **Error Correction**: Immediate feedback on mistakes
6. **Speed vs Accuracy**: Accuracy first, speed follows naturally

**Research Sources**:
- "Touch Typing Study" - University of Aalto (2016)
- "Optimal Typing Learning Progression" - MIT Media Lab
- Standard typing curricula (Mavis Beacon, TypingClub)

### 16.2 Competitive Analysis

| Product | Strengths | Weaknesses | Differentiation |
|---------|-----------|------------|-----------------|
| TypingClub | Comprehensive curriculum | Boring UI, no gamification | We have AI + space invaders theme |
| Nitro Type | Racing multiplayer is fun | No teaching, assumes knowledge | We teach from zero, AI coaching |
| Keybr | Good adaptive algorithm | Minimal visuals, dry | We have engaging gameplay |
| MonkeyType | Beautiful minimalist design | No tutorial/teaching | We teach + test, AI personalization |
| **TypeStrike** | AI coaching, WASM performance, engaging gameplay | New player, needs user base | AI + Gamification + Education |

### 16.3 AI Prompt Library Examples

**Session Summary Prompt**:
```
You are an encouraging typing coach named "TypeBot".
Analyze this typing session and provide brief, actionable feedback.

Session Data:
- Duration: {duration} minutes
- Letters typed: {total}
- Accuracy: {accuracy}%
- WPM: {wpm}
- Weak letters (< 80% accuracy): {weakLetters}
- Strong letters (> 95% accuracy): {strongLetters}
- Previous session WPM: {previousWPM}

Provide:
1. One sentence of encouragement
2. One specific insight about their performance
3. One actionable tip for next session

Keep it under 50 words total. Be warm and supportive.
```

**Adaptive Challenge Generation Prompt**:
```
Generate a custom typing practice sequence for this student.

Current Level: {level}
Known Letters: {knownLetters}
Weak Areas: {weakLetters} (needs 80% more practice)
Strong Areas: {strongLetters}

Create a 20-letter practice sequence that:
1. Focuses 60% on weak letters ({weakLetters})
2. Includes 30% known strong letters for confidence
3. Introduces 10% new letters from next lesson
4. Forms pronounceable patterns when possible

Output only the letter sequence, uppercase, space-separated.
Example: A S D F G H J K L A S D
```

---

## 17. Success Criteria & Launch Checklist

### Pre-Launch Checklist

**Technical**:
- [ ] WASM module loads in < 3 seconds
- [ ] Game runs at 60fps on mid-range laptop
- [ ] AI model loads successfully in Chrome, Firefox, Safari
- [ ] No console errors in clean install
- [ ] IndexedDB persists progress correctly
- [ ] Game works offline after first load
- [ ] Mobile UI responsive (even if gameplay disabled)

**Content**:
- [ ] Levels 1-3 fully implemented and tested
- [ ] AI coaching provides sensible feedback
- [ ] Tutorial clearly explains hand positioning
- [ ] At least 10 achievements implemented
- [ ] Sound effects for key events (optional, can mute)

**UX**:
- [ ] First-time user can start playing within 60 seconds
- [ ] Keyboard shortcuts documented
- [ ] Settings include accessibility options
- [ ] Progress can be exported/imported
- [ ] "Report Bug" link visible

**Legal/Privacy**:
- [ ] Privacy policy (all data local, no tracking)
- [ ] Open source license (if applicable)
- [ ] Asset attribution for sounds/images

### Launch Definition of Success
- **Week 1**: 100 unique players, 70% complete Level 1
- **Month 1**: 500 unique players, average 20-min sessions
- **Month 3**: 1,500 unique players, 5% reach Level 6

---

## 18. Contact & Contribution

**Project Lead**: [Your Name]
**Repository**: [GitHub URL once created]
**Documentation**: /docs folder
**Bug Reports**: GitHub Issues
**Feature Requests**: GitHub Discussions

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-20 | Initial PRD | Claude Code |

---

**End of PRD**

*"Type faster. Think clearer. TypeStrike."*
