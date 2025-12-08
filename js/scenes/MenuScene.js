/**
 * MenuScene - Pantalla de inicio do xogo
 */
import { GAME } from '../config/constants.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Fondo
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Título principal
        this.add.text(GAME.WIDTH / 2, 100, 'As aventuras do', {
            fontSize: '28px',
            fontFamily: 'monospace',
            fill: '#87CEEB'
        }).setOrigin(0.5);

        this.add.text(GAME.WIDTH / 2, 150, 'Apalpador', {
            fontSize: '64px',
            fontFamily: 'monospace',
            fill: '#f4a261',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Instrucións para comezar (con parpadeo)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const startText = this.add.text(GAME.WIDTH / 2, 320, isMobile ? 'Toca para comezar' : 'Preme calquera tecla para comezar', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Efecto parpadeo
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Información do proxecto
        this.add.text(GAME.WIDTH / 2, 400, 'apalpador.io', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fill: '#f4a261'
        }).setOrigin(0.5);

        this.add.text(GAME.WIDTH / 2, 445, 'Sprites de itch.io (licenzas non comerciais)', {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(GAME.WIDTH / 2, 460, 'Xogo para navegador. Coa axuda de Phaser 3', {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#666666'
        }).setOrigin(0.5);

        // Link GitHub
        const githubText = this.add.text(GAME.WIDTH / 2, 490, 'github.com/sanchezanxo/as-aventuras-do-apalpador', {
            fontSize: '11px',
            fontFamily: 'monospace',
            fill: '#87CEEB'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        githubText.on('pointerover', () => githubText.setFill('#ffffff'));
        githubText.on('pointerout', () => githubText.setFill('#87CEEB'));
        githubText.on('pointerdown', () => {
            window.open('https://github.com/sanchezanxo/as-aventuras-do-apalpador', '_blank');
        });

        // Versión
        this.add.text(GAME.WIDTH / 2, 520, 'v0.1.0', {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#555555'
        }).setOrigin(0.5);

        // Escoitar calquera tecla para comezar
        this.input.keyboard.once('keydown', () => {
            this.scene.start('BootScene');
        });

        // Tamén permitir clic/tap para comezar
        this.input.once('pointerdown', () => {
            this.scene.start('BootScene');
        });
    }
}
