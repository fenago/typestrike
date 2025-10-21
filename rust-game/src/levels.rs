use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Level {
    pub id: String,
    pub name: String,
    pub letters: Vec<char>,
    pub fall_speed: f32,
    pub spawn_rate: f32,
    pub duration: f32,
    pub description: String,
}

impl Level {
    pub fn get_level(level_num: usize) -> Self {
        match level_num {
            0 => Self {
                id: "1-1".to_string(),
                name: "Home Row: F & J".to_string(),
                letters: vec!['F', 'J'],
                fall_speed: 100.0,
                spawn_rate: 2.0,
                duration: 30.0,
                description: "Place your index fingers on F and J. Feel the bumps!".to_string(),
            },
            1 => Self {
                id: "1-2".to_string(),
                name: "Home Row: D & K".to_string(),
                letters: vec!['F', 'J', 'D', 'K'],
                fall_speed: 110.0,
                spawn_rate: 1.8,
                duration: 30.0,
                description: "Add your middle fingers on D and K.".to_string(),
            },
            2 => Self {
                id: "1-3".to_string(),
                name: "Home Row: S & L".to_string(),
                letters: vec!['F', 'J', 'D', 'K', 'S', 'L'],
                fall_speed: 120.0,
                spawn_rate: 1.6,
                duration: 30.0,
                description: "Ring fingers on S and L.".to_string(),
            },
            3 => Self {
                id: "1-4".to_string(),
                name: "Home Row: A & ;".to_string(),
                letters: vec!['F', 'J', 'D', 'K', 'S', 'L', 'A', ';'],
                fall_speed: 130.0,
                spawn_rate: 1.5,
                duration: 30.0,
                description: "Pinkies on A and ;".to_string(),
            },
            4 => Self {
                id: "1-5".to_string(),
                name: "Full Home Row".to_string(),
                letters: vec!['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
                fall_speed: 140.0,
                spawn_rate: 1.3,
                duration: 60.0,
                description: "Master the home row!".to_string(),
            },
            5 => Self {
                id: "2-1".to_string(),
                name: "Upper Row: R & U".to_string(),
                letters: vec!['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U'],
                fall_speed: 150.0,
                spawn_rate: 1.2,
                duration: 45.0,
                description: "Index fingers reach up to R and U.".to_string(),
            },
            6 => Self {
                id: "2-2".to_string(),
                name: "Upper Row: E & I".to_string(),
                letters: vec!['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U', 'E', 'I'],
                fall_speed: 160.0,
                spawn_rate: 1.1,
                duration: 45.0,
                description: "Middle fingers to E and I.".to_string(),
            },
            7 => Self {
                id: "2-3".to_string(),
                name: "Speed Challenge".to_string(),
                letters: vec!['A', 'S', 'D', 'F', 'J', 'K', 'L', 'E', 'I', 'R', 'U'],
                fall_speed: 200.0,
                spawn_rate: 0.9,
                duration: 60.0,
                description: "All letters you've learned - faster!".to_string(),
            },
            _ => Self {
                id: "endless".to_string(),
                name: "Endless Mode".to_string(),
                letters: vec!['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'E', 'I', 'R', 'U'],
                fall_speed: 150.0 + (level_num as f32 * 10.0),
                spawn_rate: 1.0,
                duration: f32::INFINITY,
                description: "Survive as long as you can!".to_string(),
            },
        }
    }

    pub fn total_levels() -> usize {
        8
    }
}
