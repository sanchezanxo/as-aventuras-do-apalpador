/**
 * BootScene - Carga inicial de assets
 */

import { GAME } from '../config/constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Mostrar texto de carga
        this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'Cargando...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Cargar sprites do Apalpador
        this.load.image('player-idle', 'assets/sprites/apalpador/idle.png');
        this.load.image('player-run-1', 'assets/sprites/apalpador/idle.png');
        this.load.image('player-run-2', 'assets/sprites/apalpador/idle-2.png');
        this.load.image('player-jump', 'assets/sprites/apalpador/jump.png');

        // Cargar castaña
        this.load.image('chestnut', 'assets/sprites/chestnut.png');

        // Cargar marcadores de inicio e fin (spritesheets animados)
        this.load.spritesheet('start', 'assets/sprites/start-moving.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('end', 'assets/sprites/end-moving.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Cargar trampas
        this.load.image('spike', 'assets/sprites/traps/spike.png');

        // Cargar fondo parallax
        this.load.image('background', 'assets/background/background.png');

        // Cargar tileset de inverno (16x16 por tile)
        this.load.spritesheet('terrain', 'assets/tilesets/Terrain(16x16).png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Cargar decoracións de inverno
        this.load.spritesheet('winter-decor', 'assets/tilesets/Winter_entities(16x16).png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Cargar nivel e intro
        this.load.json('level1', 'levels/world1/level1.json');
        this.load.json('intro', 'data/intro.json');
    }

    create() {
        // Pasar á intro cos datos
        const levelData = this.cache.json.get('level1');
        const introData = this.cache.json.get('intro');
        this.scene.start('IntroScene', { introData, levelData });
    }
}
