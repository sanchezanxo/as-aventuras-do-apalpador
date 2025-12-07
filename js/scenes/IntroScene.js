/**
 * IntroScene - Pantalla de historia/intro antes do xogo
 */
import { GAME } from '../config/constants.js';

export default class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });
    }

    init(data) {
        this.introData = data.introData;
        this.levelData = data.levelData;
        this.currentPage = 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Titulo da historia
        this.add.text(GAME.WIDTH / 2, 60, this.introData.title, {
            fontSize: '32px',
            fontFamily: 'monospace',
            fill: '#f4a261',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Texto da páxina actual
        this.pageText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, '', {
            fontSize: '22px',
            fontFamily: 'monospace',
            fill: '#ffffff',
            wordWrap: { width: GAME.WIDTH - 120 },
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // Indicador de páxina
        this.pageIndicator = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 100, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fill: '#666666'
        }).setOrigin(0.5);

        // Instrucións (con parpadeo)
        this.promptText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 60, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            fill: '#87CEEB'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.promptText,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Mostrar primeira páxina
        this.showPage(0);

        // Controis
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Space' || event.code === 'Enter' || event.code === 'ArrowRight') {
                this.nextPage();
            } else if (event.code === 'ArrowLeft') {
                this.prevPage();
            } else if (event.code === 'Escape') {
                this.skipIntro();
            }
        });

        this.input.on('pointerdown', () => this.nextPage());
    }

    showPage(index) {
        const pages = this.introData.pages;
        this.currentPage = Math.max(0, Math.min(index, pages.length - 1));

        // Efecto de fade para o texto
        this.pageText.setAlpha(0);
        this.pageText.setText(pages[this.currentPage].text);

        this.tweens.add({
            targets: this.pageText,
            alpha: 1,
            duration: 400,
            ease: 'Power2'
        });

        // Actualizar indicador
        this.pageIndicator.setText(`${this.currentPage + 1} / ${pages.length}`);

        // Actualizar prompt
        const isLastPage = this.currentPage === pages.length - 1;
        this.promptText.setText(isLastPage ? 'Preme ESPAZO para comezar' : 'Preme ESPAZO para continuar');
    }

    nextPage() {
        if (this.currentPage < this.introData.pages.length - 1) {
            this.showPage(this.currentPage + 1);
        } else {
            this.startGame();
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.showPage(this.currentPage - 1);
        }
    }

    skipIntro() {
        this.startGame();
    }

    startGame() {
        this.scene.start('GameScene', { levelData: this.levelData });
    }
}
