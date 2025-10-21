use macroquad::prelude::*;
use std::collections::HashMap;
use crate::entities::{Letter, Particle, Player};
use crate::levels::Level;

#[derive(PartialEq, Clone, Copy)]
pub enum GameState {
    Menu,
    Playing,
    LevelComplete,
    GameOver,
}

pub struct Game {
    state: GameState,
    player: Player,
    letters: Vec<Letter>,
    particles: Vec<Particle>,
    current_level: usize,
    level: Level,
    score: i32,
    combo: i32,
    correct_count: i32,
    total_count: i32,
    spawn_timer: f32,
    level_timer: f32,
    last_key_time: f32,
    screen_shake: f32,
    typed_letters: HashMap<char, i32>,
    errors: HashMap<char, i32>,
    flash_timer: f32,
    flash_color: Color,
}

impl Game {
    pub fn new() -> Self {
        let level = Level::get_level(0);
        Self {
            state: GameState::Menu,
            player: Player::new(400.0, 550.0),
            letters: Vec::new(),
            particles: Vec::new(),
            current_level: 0,
            level,
            score: 0,
            combo: 0,
            correct_count: 0,
            total_count: 0,
            spawn_timer: 0.0,
            level_timer: 0.0,
            last_key_time: 0.0,
            screen_shake: 0.0,
            typed_letters: HashMap::new(),
            errors: HashMap::new(),
            flash_timer: 0.0,
            flash_color: Color::from_rgba(0, 0, 0, 0),
        }
    }

    pub fn update(&mut self, delta: f32) {
        match self.state {
            GameState::Menu => self.update_menu(),
            GameState::Playing => self.update_playing(delta),
            GameState::LevelComplete => self.update_level_complete(),
            GameState::GameOver => self.update_game_over(),
        }
    }

    fn update_menu(&mut self) {
        if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::Enter) {
            self.start_game();
        }
    }

    fn start_game(&mut self) {
        self.state = GameState::Playing;
        self.player.lives = self.player.max_lives;
        self.letters.clear();
        self.particles.clear();
        self.score = 0;
        self.combo = 0;
        self.correct_count = 0;
        self.total_count = 0;
        self.spawn_timer = 0.0;
        self.level_timer = 0.0;
        self.typed_letters.clear();
        self.errors.clear();
    }

    fn update_playing(&mut self, delta: f32) {
        self.level_timer += delta;
        self.spawn_timer += delta;
        self.screen_shake = (self.screen_shake - delta * 5.0).max(0.0);
        self.flash_timer = (self.flash_timer - delta * 3.0).max(0.0);

        // Spawn new letters
        if self.spawn_timer >= self.level.spawn_rate {
            self.spawn_letter();
            self.spawn_timer = 0.0;
        }

        // Update letters
        for letter in &mut self.letters {
            letter.update(delta);
        }

        // Check for letters that hit the ground
        let screen_height = screen_height();
        let mut to_remove = Vec::new();

        for (i, letter) in self.letters.iter().enumerate() {
            if letter.is_off_screen(screen_height) {
                to_remove.push(i);
                self.player.lives -= 1;
                self.combo = 0;
                self.trigger_flash(Color::from_rgba(255, 51, 102, 100)); // Red flash

                if self.player.lives <= 0 {
                    self.state = GameState::GameOver;
                }
            }
        }

        // Remove letters from back to front to maintain indices
        for i in to_remove.iter().rev() {
            self.letters.remove(*i);
        }

        // Handle keyboard input
        self.handle_input();

        // Update particles
        for particle in &mut self.particles {
            particle.update(delta);
        }
        self.particles.retain(|p| !p.is_dead());

        // Check level completion
        if self.level_timer >= self.level.duration && self.player.lives > 0 {
            self.state = GameState::LevelComplete;
        }
    }

    fn handle_input(&mut self) {
        // Check all letter keys
        let keys = [
            (KeyCode::A, 'A'), (KeyCode::B, 'B'), (KeyCode::C, 'C'), (KeyCode::D, 'D'),
            (KeyCode::E, 'E'), (KeyCode::F, 'F'), (KeyCode::G, 'G'), (KeyCode::H, 'H'),
            (KeyCode::I, 'I'), (KeyCode::J, 'J'), (KeyCode::K, 'K'), (KeyCode::L, 'L'),
            (KeyCode::M, 'M'), (KeyCode::N, 'N'), (KeyCode::O, 'O'), (KeyCode::P, 'P'),
            (KeyCode::Q, 'Q'), (KeyCode::R, 'R'), (KeyCode::S, 'S'), (KeyCode::T, 'T'),
            (KeyCode::U, 'U'), (KeyCode::V, 'V'), (KeyCode::W, 'W'), (KeyCode::X, 'X'),
            (KeyCode::Y, 'Y'), (KeyCode::Z, 'Z'), (KeyCode::Semicolon, ';'),
        ];

        for (keycode, character) in keys.iter() {
            if is_key_pressed(*keycode) {
                self.handle_letter_typed(*character);
            }
        }
    }

    fn handle_letter_typed(&mut self, typed_char: char) {
        self.total_count += 1;

        // Find matching letter (closest to ground)
        let mut found_index = None;
        let mut max_y = -1.0;

        for (i, letter) in self.letters.iter().enumerate() {
            if letter.char == typed_char && letter.y > max_y {
                found_index = Some(i);
                max_y = letter.y;
            }
        }

        if let Some(index) = found_index {
            // Correct letter typed!
            let letter = self.letters.remove(index);
            self.correct_count += 1;
            self.combo += 1;

            // Calculate points
            let base_points = 10;
            let combo_multiplier = 1 + (self.combo / 10);
            let points = base_points * combo_multiplier;
            self.score += points;

            // Track stats
            *self.typed_letters.entry(typed_char).or_insert(0) += 1;

            // Create explosion particles
            for _ in 0..15 {
                self.particles.push(Particle::new(letter.x, letter.y));
            }

            // Screen shake
            self.screen_shake = 2.0;

            // Flash green
            self.trigger_flash(Color::from_rgba(57, 255, 20, 80));
        } else {
            // Wrong letter!
            self.combo = 0;
            self.score = (self.score - 2).max(0);
            *self.errors.entry(typed_char).or_insert(0) += 1;

            // Flash red
            self.trigger_flash(Color::from_rgba(255, 51, 102, 150));
        }
    }

    fn spawn_letter(&mut self) {
        if self.level.letters.is_empty() {
            return;
        }

        let idx = rand::random::<usize>() % self.level.letters.len();
        let character = self.level.letters[idx];

        let screen_width = screen_width();
        let margin = 60.0;
        let x = margin + rand::random::<f32>() * (screen_width - margin * 2.0);

        let letter = Letter::new(character, x, self.level.fall_speed);
        self.letters.push(letter);
    }

    fn trigger_flash(&mut self, color: Color) {
        self.flash_timer = 0.2;
        self.flash_color = color;
    }

    fn update_level_complete(&mut self) {
        if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::Enter) {
            self.current_level += 1;
            if self.current_level >= Level::total_levels() {
                self.current_level = Level::total_levels() - 1;
            }
            self.level = Level::get_level(self.current_level);
            self.start_game();
        } else if is_key_pressed(KeyCode::M) {
            self.state = GameState::Menu;
        }
    }

    fn update_game_over(&mut self) {
        if is_key_pressed(KeyCode::Space) || is_key_pressed(KeyCode::R) {
            self.start_game();
        } else if is_key_pressed(KeyCode::M) {
            self.state = GameState::Menu;
        }
    }

    pub fn draw(&self) {
        // Apply screen shake
        let shake_x = if self.screen_shake > 0.0 {
            (rand::random::<f32>() - 0.5) * self.screen_shake * 4.0
        } else {
            0.0
        };
        let shake_y = if self.screen_shake > 0.0 {
            (rand::random::<f32>() - 0.5) * self.screen_shake * 4.0
        } else {
            0.0
        };

        let camera = Camera2D {
            offset: vec2(shake_x, shake_y),
            ..Default::default()
        };
        set_camera(&camera);

        match self.state {
            GameState::Menu => self.draw_menu(),
            GameState::Playing => self.draw_playing(),
            GameState::LevelComplete => self.draw_level_complete(),
            GameState::GameOver => self.draw_game_over(),
        }

        // Draw flash overlay
        if self.flash_timer > 0.0 {
            let alpha = (self.flash_timer * 255.0 * 5.0) as u8;
            let color = Color::from_rgba(
                self.flash_color.r,
                self.flash_color.g,
                self.flash_color.b,
                alpha.min(self.flash_color.a),
            );
            draw_rectangle(0.0, 0.0, screen_width(), screen_height(), color);
        }

        set_default_camera();
    }

    fn draw_menu(&self) {
        let width = screen_width();
        let height = screen_height();

        // Title
        let title = "TYPE STRIKE";
        draw_text(title, width / 2.0 - 200.0, height / 2.0 - 100.0, 80.0,
                  Color::from_rgba(0, 240, 255, 255));

        // Subtitle
        let subtitle = "AI-Powered Typing Trainer";
        draw_text(subtitle, width / 2.0 - 150.0, height / 2.0 - 40.0, 30.0,
                  Color::from_rgba(255, 0, 110, 255));

        // Instructions
        let start_text = "Press SPACE to Start";
        draw_text(start_text, width / 2.0 - 120.0, height / 2.0 + 50.0, 25.0, WHITE);

        // Controls
        let controls = "Type the falling letters to destroy them!";
        draw_text(controls, width / 2.0 - 180.0, height / 2.0 + 120.0, 20.0, GRAY);
    }

    fn draw_playing(&self) {
        // Draw starfield background (simple)
        for i in 0..50 {
            let x = (i * 127 % screen_width() as i32) as f32;
            let y = (i * 211 % screen_height() as i32) as f32;
            let size = 1.0 + (i % 3) as f32;
            draw_circle(x, y, size, Color::from_rgba(255, 255, 255, 100 + (i % 155) as u8));
        }

        // Draw particles
        for particle in &self.particles {
            particle.draw();
        }

        // Draw letters
        for letter in &self.letters {
            letter.draw();
        }

        // Draw player
        self.player.draw();

        // Draw ground line
        draw_line(0.0, 580.0, screen_width(), 580.0, 3.0, RED);

        // Draw HUD
        self.draw_hud();
    }

    fn draw_hud(&self) {
        let margin = 20.0;

        // Lives
        let lives_text = format!("Lives: {}", self.player.lives);
        draw_text(&lives_text, margin, margin + 20.0, 25.0, RED);

        // Score
        let score_text = format!("Score: {}", self.score);
        draw_text(&score_text, margin, margin + 50.0, 25.0, YELLOW);

        // Combo
        if self.combo > 0 {
            let combo_text = format!("Combo: {}x", self.combo);
            let combo_color = if self.combo >= 10 {
                Color::from_rgba(57, 255, 20, 255)
            } else {
                WHITE
            };
            draw_text(&combo_text, margin, margin + 80.0, 25.0, combo_color);
        }

        // Level info (top right)
        let level_text = format!("Level: {}", self.level.name);
        draw_text(&level_text, screen_width() - 300.0, margin + 20.0, 20.0, SKYBLUE);

        // Timer
        let time_remaining = (self.level.duration - self.level_timer).max(0.0);
        let timer_text = format!("Time: {:.0}s", time_remaining);
        draw_text(&timer_text, screen_width() - 300.0, margin + 50.0, 20.0, WHITE);

        // Accuracy
        let accuracy = if self.total_count > 0 {
            (self.correct_count as f32 / self.total_count as f32 * 100.0) as i32
        } else {
            100
        };
        let accuracy_text = format!("Accuracy: {}%", accuracy);
        let accuracy_color = if accuracy >= 90 { GREEN } else if accuracy >= 70 { YELLOW } else { RED };
        draw_text(&accuracy_text, screen_width() - 300.0, margin + 80.0, 20.0, accuracy_color);
    }

    fn draw_level_complete(&self) {
        self.draw_playing();

        // Overlay
        draw_rectangle(0.0, 0.0, screen_width(), screen_height(),
                      Color::from_rgba(0, 0, 0, 180));

        let width = screen_width();
        let height = screen_height();

        // Title
        draw_text("LEVEL COMPLETE!", width / 2.0 - 180.0, height / 2.0 - 100.0, 60.0, GREEN);

        // Stats
        let accuracy = if self.total_count > 0 {
            (self.correct_count as f32 / self.total_count as f32 * 100.0) as i32
        } else {
            100
        };

        let score_text = format!("Score: {}", self.score);
        draw_text(&score_text, width / 2.0 - 100.0, height / 2.0 - 20.0, 30.0, YELLOW);

        let accuracy_text = format!("Accuracy: {}%", accuracy);
        draw_text(&accuracy_text, width / 2.0 - 100.0, height / 2.0 + 20.0, 30.0, WHITE);

        // Continue
        draw_text("Press SPACE for next level", width / 2.0 - 150.0, height / 2.0 + 80.0, 25.0, SKYBLUE);
        draw_text("Press M for menu", width / 2.0 - 100.0, height / 2.0 + 110.0, 20.0, GRAY);
    }

    fn draw_game_over(&self) {
        self.draw_playing();

        // Overlay
        draw_rectangle(0.0, 0.0, screen_width(), screen_height(),
                      Color::from_rgba(0, 0, 0, 200));

        let width = screen_width();
        let height = screen_height();

        // Title
        draw_text("GAME OVER", width / 2.0 - 150.0, height / 2.0 - 80.0, 60.0, RED);

        // Final score
        let score_text = format!("Final Score: {}", self.score);
        draw_text(&score_text, width / 2.0 - 120.0, height / 2.0, 30.0, YELLOW);

        // Retry
        draw_text("Press SPACE to retry", width / 2.0 - 120.0, height / 2.0 + 60.0, 25.0, WHITE);
        draw_text("Press M for menu", width / 2.0 - 100.0, height / 2.0 + 90.0, 20.0, GRAY);
    }
}
