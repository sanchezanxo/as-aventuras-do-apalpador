/**
 * Constantes globais do xogo
 */

export const GAME = {
    WIDTH: 960,
    HEIGHT: 540,
    GRAVITY: 800,
    // Tamaño do mundo por defecto (para scroll)
    WORLD_WIDTH: 2400
};

export const PLAYER = {
    SPEED: 280,
    JUMP_VELOCITY: -480,
    MAX_JUMPS: 2,
    // Salto variable (soltar = caer antes)
    JUMP_CUT_MULTIPLIER: 0.4,
    // Wall slide/jump
    WALL_SLIDE_SPEED: 80,
    WALL_JUMP_VELOCITY_X: 320,
    WALL_JUMP_VELOCITY_Y: -420,
    // Tamaño
    WIDTH: 64,
    HEIGHT: 64
};

export const TILE = {
    SIZE: 16,
    COLS: 17,
    // índice = fila * 17 + columna
    // Chan principal (2 filas de alto)
    SNOW: {
        TOP_LEFT: 20,     TOP: 21,     TOP_RIGHT: 22,     // fila 1
        BOTTOM_LEFT: 37,  BOTTOM: 38,  BOTTOM_RIGHT: 39   // fila 2
    },
    // Plataformas flotantes (1 fila fina)
    PLATFORM: {
        LEFT: 60,    // fila 3, col 9
        CENTER: 61,  // fila 3, col 10
        RIGHT: 64    // fila 3, col 13
    },
    // Paredes verticais
    WALL: {
        TOP: 28,     // fila 1, col 11 (con neve)
        CENTER: 45,  // fila 2, col 11
        BOTTOM: 96   // fila 5, col 11
    }
};

export const COLORS = {
    // Fondo
    SKY: '#87CEEB',
    // Plataformas (valores hexadecimais para Phaser)
    GROUND: 0x654321,
    PLATFORM: 0x8B4513,
    WALL: 0x555555,
    // Obxectos
    CHESTNUT: 0xD2691E,
    GOAL: 0x00FF00
};

export const SCORE = {
    CHESTNUT: 10,
    TIME_BONUS: 5,      // Por cada segundo restante
    LIFE_BONUS: 50      // Por cada vida restante
};
