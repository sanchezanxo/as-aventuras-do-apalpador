/**
 * O Apalpador - Pixel Adventure Game
 * Punto de entrada principal
 */

import { GAME } from './config/constants.js';
import MenuScene from './scenes/MenuScene.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME.GRAVITY },
            debug: false
        }
    },
    scene: [MenuScene, BootScene, GameScene]
};

// Crear instancia do xogo
const game = new Phaser.Game(config);
