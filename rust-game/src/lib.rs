use macroquad::prelude::*;

mod game;
mod entities;
mod levels;

use game::Game;

#[macroquad::main("TypeStrike")]
async fn main() {
    let mut game = Game::new();

    loop {
        clear_background(Color::from_rgba(10, 14, 39, 255)); // Deep space background

        game.update(get_frame_time());
        game.draw();

        next_frame().await;
    }
}
