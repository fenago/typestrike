use macroquad::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Letter {
    pub char: char,
    pub x: f32,
    pub y: f32,
    pub speed: f32,
    pub size: f32,
    pub color: Color,
    pub is_targeted: bool,
}

impl Letter {
    pub fn new(char: char, x: f32, speed: f32) -> Self {
        Self {
            char,
            x,
            y: -50.0,
            speed,
            size: 40.0,
            color: Color::from_rgba(0, 240, 255, 255), // Neon cyan
            is_targeted: false,
        }
    }

    pub fn update(&mut self, delta: f32) {
        self.y += self.speed * delta;
    }

    pub fn draw(&self) {
        // Draw glow effect
        draw_circle(self.x, self.y, self.size * 0.8, Color::from_rgba(0, 240, 255, 50));

        // Draw letter background
        draw_circle(self.x, self.y, self.size * 0.6, Color::from_rgba(0, 100, 120, 200));

        // Draw letter
        let text = self.char.to_string();
        let font_size = (self.size * 1.2) as u16;
        let text_dims = measure_text(&text, None, font_size, 1.0);

        draw_text(
            &text,
            self.x - text_dims.width / 2.0,
            self.y + text_dims.height / 3.0,
            font_size as f32,
            WHITE,
        );

        // Draw targeting indicator if targeted
        if self.is_targeted {
            draw_circle_lines(self.x, self.y, self.size * 0.9, 3.0, YELLOW);
        }
    }

    pub fn is_off_screen(&self, screen_height: f32) -> bool {
        self.y > screen_height + 50.0
    }
}

#[derive(Clone, Debug)]
pub struct Particle {
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
    pub life: f32,
    pub max_life: f32,
    pub size: f32,
    pub color: Color,
}

impl Particle {
    pub fn new(x: f32, y: f32) -> Self {
        let angle = rand::random::<f32>() * std::f32::consts::TAU;
        let speed = 100.0 + rand::random::<f32>() * 200.0;

        Self {
            x,
            y,
            vx: angle.cos() * speed,
            vy: angle.sin() * speed,
            life: 1.0,
            max_life: 1.0,
            size: 3.0 + rand::random::<f32>() * 5.0,
            color: Color::from_rgba(0, 240, 255, 255),
        }
    }

    pub fn update(&mut self, delta: f32) {
        self.x += self.vx * delta;
        self.y += self.vy * delta;
        self.vy += 300.0 * delta; // Gravity
        self.life -= delta;
    }

    pub fn draw(&self) {
        let alpha = (self.life / self.max_life * 255.0) as u8;
        let color = Color::from_rgba(
            self.color.r,
            self.color.g,
            self.color.b,
            alpha,
        );
        draw_circle(self.x, self.y, self.size, color);
    }

    pub fn is_dead(&self) -> bool {
        self.life <= 0.0
    }
}

#[derive(Clone, Debug)]
pub struct Player {
    pub x: f32,
    pub y: f32,
    pub lives: i32,
    pub max_lives: i32,
}

impl Player {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            lives: 5,
            max_lives: 5,
        }
    }

    pub fn draw(&self) {
        // Draw turret base
        draw_triangle(
            Vec2::new(self.x - 30.0, self.y + 20.0),
            Vec2::new(self.x + 30.0, self.y + 20.0),
            Vec2::new(self.x, self.y - 40.0),
            Color::from_rgba(0, 240, 255, 255),
        );

        // Draw turret core
        draw_circle(self.x, self.y, 15.0, Color::from_rgba(255, 0, 110, 255));

        // Draw glow
        draw_circle(self.x, self.y, 20.0, Color::from_rgba(255, 0, 110, 50));
    }
}
