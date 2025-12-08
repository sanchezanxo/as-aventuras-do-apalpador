/**
 * GameScene - Escena principal do xogo
 */

import { GAME, PLAYER, COLORS, SCORE, TILE } from '../config/constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.levelData = data.levelData;
    }

    create() {
        // Configurar mundo e cámara
        const worldWidth = this.levelData.worldWidth || GAME.WORLD_WIDTH;
        this.physics.world.setBounds(0, 0, worldWidth, GAME.HEIGHT);
        this.cameras.main.setBounds(0, 0, worldWidth, GAME.HEIGHT);

        // Fondo parallax (móvese máis lento que a cámara)
        this.createParallaxBackground(worldWidth);

        // Crear plataformas desde JSON
        this.platforms = this.physics.add.staticGroup();
        // Paredes para wall slide (separadas para detectar colisión lateral)
        this.walls = this.physics.add.staticGroup();

        this.levelData.platforms.forEach(plat => {
            const theme = plat.isGround ? TILE.SNOW : TILE.PLATFORM;
            this.createTiledPlatform(plat.x, plat.y, plat.width, plat.height, theme);
        });

        // Crear paredes desde JSON (se existen) - sempre pedra
        if (this.levelData.walls) {
            this.levelData.walls.forEach(wall => {
                this.createTiledWall(wall.x, wall.y, wall.width, wall.height);
            });
        }

        // Crear xogador con física
        const start = this.levelData.playerStart;
        this.player = this.physics.add.sprite(start.x, start.y, 'player-idle');
        this.player.setCollideWorldBounds(true);

        // Cámara segue ao xogador
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Colisións
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.walls);

        // Estado do salto
        this.jumpCount = 0;
        this.isWallSliding = false;
        this.wallSide = 0; // -1 esquerda, 1 dereita, 0 ningún

        // Animación de correr (alternar frames manualmente)
        this.runFrameTimer = 0;
        this.runFrameIndex = 0;
        this.runFrames = ['player-run-1', 'player-run-2'];

        // Puntuación e castañas
        this.chestnutCount = 0;
        this.score = 0;
        this.totalChestnuts = this.levelData.collectibles.length;

        // Sistema de vidas
        this.lives = 3;
        this.isInvulnerable = false;
        this.updateHUD('lives', this.lives);

        // Sistema de tempo
        this.timeLimit = this.levelData.timeLimit || 60;
        this.timeRemaining = this.timeLimit;
        this.updateHUD('time', this.timeRemaining);

        // Timer que resta 1 segundo cada 1000ms
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.levelData.collectibles.forEach((pos, index) => {
            const chestnut = this.add.image(pos.x, pos.y, 'chestnut');
            this.physics.add.existing(chestnut, true);
            this.physics.add.overlap(this.player, chestnut, this.collectChestnut, null, this);

            // Animación de flotación (arriba-abaixo)
            this.tweens.add({
                targets: chestnut,
                y: pos.y - 8,
                duration: 1000 + (index * 100), // Lixeira variación para que non vaian sincronizadas
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Crear trampas (pinchos)
        this.traps = this.physics.add.staticGroup();
        if (this.levelData.traps) {
            this.levelData.traps.forEach(trap => {
                const count = trap.count || 3; // Por defecto 3 pinchos
                for (let i = 0; i < count; i++) {
                    const spike = this.add.image(trap.x + (i * 16), trap.y + 8, 'spike');
                    spike.setOrigin(0.5, 1);
                    this.physics.add.existing(spike, true);
                    spike.body.setSize(12, 10);
                    spike.body.setOffset(2, 6);
                    this.traps.add(spike);
                }
            });
            this.physics.add.overlap(this.player, this.traps, this.hitTrap, null, this);
        }

        // Crear animacións dos marcadores
        this.anims.create({
            key: 'start-wave',
            frames: this.anims.generateFrameNumbers('start', { start: 0, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'end-shine',
            frames: this.anims.generateFrameNumbers('end', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // Marcador de inicio (bandeira animada)
        if (this.levelData.startMarker) {
            const startPos = this.levelData.startMarker;
            const startMarker = this.add.sprite(startPos.x - 40, startPos.y + 16, 'start');
            startMarker.setOrigin(0.5, 1);
            startMarker.setDepth(-1);
            startMarker.play('start-wave');
        }

        // Meta (trofeo animado)
        const goal = this.levelData.goal;
        this.goal = this.add.sprite(goal.x, goal.y + 16, 'end');
        this.goal.setOrigin(0.5, 1);
        this.goal.play('end-shine');
        this.physics.add.existing(this.goal, true);
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        // Estado do xogo
        this.gameOver = false;

        // Configurar controis
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Sistema de pausa
        this.isPaused = false;
        this.pauseOverlay = null;
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this.togglePause());
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        const body = this.player.body;
        const onGround = body.blocked.down || body.touching.down;
        const onWallLeft = body.blocked.left || body.touching.left;
        const onWallRight = body.blocked.right || body.touching.right;
        const inAir = !onGround;

        // Reset saltos ao tocar o chan
        if (onGround) {
            this.jumpCount = 0;
            this.isWallSliding = false;
            this.wallSide = 0;
        }

        // Controis táctiles (se existen)
        const touch = window.touchControls || { left: false, right: false, jump: false, jumpJustPressed: false };

        // Detectar wall slide
        if (inAir && (onWallLeft || onWallRight)) {
            const leftPressed = this.cursors.left.isDown || this.wasd.left.isDown || touch.left;
            const rightPressed = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;

            // Só wall slide se está empuxando contra a parede
            if ((onWallLeft && leftPressed) || (onWallRight && rightPressed)) {
                this.isWallSliding = true;
                this.wallSide = onWallLeft ? -1 : 1;
                // Caída lenta
                if (body.velocity.y > PLAYER.WALL_SLIDE_SPEED) {
                    this.player.setVelocityY(PLAYER.WALL_SLIDE_SPEED);
                }
                // Reset saltos ao tocar parede (permite wall jump)
                this.jumpCount = 1;
            }
        } else {
            this.isWallSliding = false;
        }

        // Movemento horizontal
        const leftPressed = this.cursors.left.isDown || this.wasd.left.isDown || touch.left;
        const rightPressed = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;

        if (leftPressed) {
            this.player.setVelocityX(-PLAYER.SPEED);
            this.player.setFlipX(true);
        } else if (rightPressed) {
            this.player.setVelocityX(PLAYER.SPEED);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // Salto (JustDown para evitar manter pulsado)
        const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                                Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                                Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                                touch.jumpJustPressed;

        const jumpHeld = this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown || touch.jump;

        // Reset do jumpJustPressed táctil despois de lelo
        if (touch.jumpJustPressed) {
            touch.jumpJustPressed = false;
        }

        if (jumpJustPressed) {
            if (this.isWallSliding) {
                // Wall jump: saltar en dirección oposta á parede
                this.player.setVelocityY(PLAYER.WALL_JUMP_VELOCITY_Y);
                this.player.setVelocityX(-this.wallSide * PLAYER.WALL_JUMP_VELOCITY_X);
                this.isWallSliding = false;
                this.jumpCount = 1;
            } else if (this.jumpCount < PLAYER.MAX_JUMPS) {
                // Salto normal ou dobre salto
                this.player.setVelocityY(PLAYER.JUMP_VELOCITY);
                this.jumpCount++;
            }
        }

        // Salto variable: soltar a tecla = caer antes (máis control)
        if (!jumpHeld && body.velocity.y < 0) {
            this.player.setVelocityY(body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
        }

        // Cambiar sprite segundo estado
        const isMoving = leftPressed || rightPressed;

        if (inAir) {
            this.player.setTexture('player-jump');
        } else if (isMoving) {
            // Animación de correr: alternar frames cada 150ms
            this.runFrameTimer += this.game.loop.delta;
            if (this.runFrameTimer >= 150) {
                this.runFrameTimer = 0;
                this.runFrameIndex = (this.runFrameIndex + 1) % this.runFrames.length;
            }
            this.player.setTexture(this.runFrames[this.runFrameIndex]);
        } else {
            this.player.setTexture('player-idle');
            this.runFrameTimer = 0;
            this.runFrameIndex = 0;
        }
    }

    updateHUD(type, value) {
        // Actualizar HUD desktop
        const desktopMap = {
            'chestnut': 'chestnut-count',
            'score': 'score-count',
            'lives': 'lives-count',
            'time': 'time-count'
        };
        // Actualizar HUD móbil
        const mobileMap = {
            'chestnut': 'mobile-chestnut',
            'score': 'mobile-score',
            'lives': 'mobile-lives',
            'time': 'mobile-time'
        };

        if (desktopMap[type]) {
            const el = document.getElementById(desktopMap[type]);
            if (el) el.textContent = value;
        }
        if (mobileMap[type]) {
            const el = document.getElementById(mobileMap[type]);
            if (el) el.textContent = value;
        }
    }

    togglePause() {
        if (this.gameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pausar física e timer
            this.physics.pause();
            if (this.timerEvent) this.timerEvent.paused = true;

            // Crear overlay de pausa
            this.pauseOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

            const bg = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7);
            this.pauseOverlay.add(bg);

            const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, 'PAUSA', {
                fontSize: '48px',
                fontFamily: 'monospace',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.pauseOverlay.add(title);

            const hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 30, 'Preme ESC para continuar', {
                fontSize: '18px',
                fontFamily: 'monospace',
                fill: '#aaaaaa'
            }).setOrigin(0.5);
            this.pauseOverlay.add(hint);
        } else {
            // Reanudar física e timer
            this.physics.resume();
            if (this.timerEvent) this.timerEvent.paused = false;

            // Destruír overlay
            if (this.pauseOverlay) {
                this.pauseOverlay.destroy();
                this.pauseOverlay = null;
            }
        }
    }

    createParallaxBackground(worldWidth) {
        // Fondo fixo que cubre a pantalla
        const bg = this.add.image(0, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(-10);
        bg.setAlpha(0.5); // Menos opacidade

        // Escalar para cubrir a pantalla
        const scaleX = GAME.WIDTH / bg.width;
        const scaleY = GAME.HEIGHT / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Efecto neve
        this.createSnowEffect();
    }

    createSnowEffect() {
        // Crear partículas de neve usando gráficos
        const snowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        snowGraphics.fillStyle(0xffffff, 1);
        snowGraphics.fillCircle(4, 4, 4);
        snowGraphics.generateTexture('snowflake', 8, 8);
        snowGraphics.destroy();

        // Emisor de partículas
        this.snowEmitter = this.add.particles(0, -10, 'snowflake', {
            x: { min: 0, max: GAME.WIDTH },
            y: -10,
            lifespan: 6000,
            speedY: { min: 30, max: 60 },
            speedX: { min: -20, max: 20 },
            scale: { min: 0.2, max: 0.5 },
            alpha: { start: 0.8, end: 0.3 },
            quantity: 1,
            frequency: 100,
            blendMode: 'ADD'
        });
        this.snowEmitter.setScrollFactor(0);
        this.snowEmitter.setDepth(-5);
    }

    createTiledPlatform(centerX, centerY, width, height, theme) {
        const tileSize = TILE.SIZE;
        const tilesWide = Math.ceil(width / tileSize);
        const tilesHigh = Math.ceil(height / tileSize);

        const startX = centerX - (tilesWide * tileSize) / 2 + tileSize / 2;
        const startY = centerY - (tilesHigh * tileSize) / 2 + tileSize / 2;

        for (let row = 0; row < tilesHigh; row++) {
            for (let col = 0; col < tilesWide; col++) {
                const x = startX + col * tileSize;
                const y = startY + row * tileSize;
                const tileIndex = this.getTileIndex(row, col, tilesHigh, tilesWide, theme);
                this.add.image(x, y, 'terrain', tileIndex);
            }
        }

        const hitbox = this.add.rectangle(centerX, centerY, tilesWide * tileSize, tilesHigh * tileSize);
        hitbox.setVisible(false);
        this.physics.add.existing(hitbox, true);
        this.platforms.add(hitbox);
    }

    createTiledWall(centerX, centerY, width, height) {
        const theme = TILE.WALL;
        const tileSize = TILE.SIZE;
        const tilesWide = Math.ceil(width / tileSize);
        const tilesHigh = Math.ceil(height / tileSize);

        const startX = centerX - (tilesWide * tileSize) / 2 + tileSize / 2;
        const startY = centerY - (tilesHigh * tileSize) / 2 + tileSize / 2;

        for (let row = 0; row < tilesHigh; row++) {
            for (let col = 0; col < tilesWide; col++) {
                const x = startX + col * tileSize;
                const y = startY + row * tileSize;
                const tileIndex = this.getTileIndex(row, col, tilesHigh, tilesWide, theme);
                this.add.image(x, y, 'terrain', tileIndex);
            }
        }

        const hitbox = this.add.rectangle(centerX, centerY, tilesWide * tileSize, tilesHigh * tileSize);
        hitbox.setVisible(false);
        this.physics.add.existing(hitbox, true);
        this.walls.add(hitbox);
    }

    getTileIndex(row, col, totalRows, totalCols, theme) {
        const isTop = row === 0;
        const isBottom = row === totalRows - 1;
        const isLeft = col === 0;
        const isRight = col === totalCols - 1;

        // Para temas con TOP/BOTTOM (chan e paredes)
        if (theme.TOP !== undefined) {
            if (isTop && isLeft) return theme.TOP_LEFT || theme.TOP;
            if (isTop && isRight) return theme.TOP_RIGHT || theme.TOP;
            if (isTop) return theme.TOP;
            if (isBottom && isLeft) return theme.BOTTOM_LEFT || theme.BOTTOM;
            if (isBottom && isRight) return theme.BOTTOM_RIGHT || theme.BOTTOM;
            if (isBottom) return theme.BOTTOM;
            if (isLeft) return theme.TOP_LEFT || theme.CENTER;
            if (isRight) return theme.TOP_RIGHT || theme.CENTER;
            return theme.CENTER || theme.TOP;
        }

        // Para temas simples (plataformas flotantes)
        if (isLeft) return theme.LEFT;
        if (isRight) return theme.RIGHT;
        return theme.CENTER;
    }

    collectChestnut(player, chestnut) {
        // Gardar posición antes de destruír
        const x = chestnut.x;
        const y = chestnut.y;

        chestnut.destroy();
        this.chestnutCount++;
        this.score += SCORE.CHESTNUT;

        // Actualizar HUD
        this.updateHUD('chestnut', this.chestnutCount);
        this.updateHUD('score', this.score);

        // Efecto visual: texto "+10" que sobe e desaparece
        const scoreText = this.add.text(x, y, '+10', {
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: scoreText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => scoreText.destroy()
        });

        // Efecto partículas douradas
        const particles = this.add.particles(x, y, 'snowflake', {
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            lifespan: 400,
            tint: 0xffcc00,
            quantity: 8,
            emitting: false
        });
        particles.explode();
    }

    showEndScreen(config) {
        if (this.gameOver) return;
        this.gameOver = true;

        // Parar timer e física
        if (this.timerEvent) this.timerEvent.remove();
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // Overlay escuro
        this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7)
            .setScrollFactor(0);

        // Título
        const startY = GAME.HEIGHT / 2 - (config.lines.length * 15) - 20;
        this.add.text(GAME.WIDTH / 2, startY, config.title, {
            fontSize: '36px',
            fontFamily: 'monospace',
            fill: config.titleColor
        }).setOrigin(0.5).setScrollFactor(0);

        // Liñas de información
        config.lines.forEach((line, i) => {
            this.add.text(GAME.WIDTH / 2, startY + 50 + (i * 30), line.text, {
                fontSize: line.fontSize || '20px',
                fontFamily: 'monospace',
                fill: line.color
            }).setOrigin(0.5).setScrollFactor(0);
        });

        // Prompt para reiniciar (adaptar a móbil)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const promptText = isMobile ? config.promptMobile || 'Toca para reintentar' : config.prompt;
        this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 120, promptText, {
            fontSize: '18px',
            fontFamily: 'monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0);

        // Función de reinicio
        const restartGame = () => {
            this.updateHUD('chestnut', 0);
            this.updateHUD('score', 0);
            this.updateHUD('time', this.levelData.timeLimit || 60);
            if (config.resetLives) this.updateHUD('lives', 3);
            this.scene.restart({ levelData: this.levelData });
        };

        // Escoitar espazo e tap para reiniciar
        this.input.keyboard.once('keydown-SPACE', restartGame);
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', restartGame);
        });
    }

    reachGoal() {
        const timeBonus = this.timeRemaining * SCORE.TIME_BONUS;
        const lifeBonus = this.lives * SCORE.LIFE_BONUS;
        const finalScore = this.score + timeBonus + lifeBonus;
        this.updateHUD('score', finalScore);

        this.showEndScreen({
            title: 'Nivel completado!',
            titleColor: '#ffffff',
            prompt: 'Preme ESPAZO para xogar de novo',
            promptMobile: 'Toca para xogar de novo',
            resetLives: false,
            lines: [
                { text: `Castañas: ${this.chestnutCount}/${this.totalChestnuts} = ${this.score} pts`, color: '#f4a261' },
                { text: `Tempo: ${this.timeRemaining}s x ${SCORE.TIME_BONUS} = ${timeBonus} pts`, color: '#87CEEB' },
                { text: `Vidas: ${this.lives} x ${SCORE.LIFE_BONUS} = ${lifeBonus} pts`, color: '#ff6b6b' },
                { text: `TOTAL: ${finalScore} pts`, color: '#ffcc00', fontSize: '28px' }
            ]
        });
    }

    updateTimer() {
        if (this.gameOver) return;

        this.timeRemaining--;
        this.updateHUD('time', this.timeRemaining);

        if (this.timeRemaining <= 0) {
            this.timeOut();
        }
    }

    timeOut() {
        this.showEndScreen({
            title: 'Tempo esgotado!',
            titleColor: '#ff6b6b',
            prompt: 'Preme ESPAZO para reintentar',
            resetLives: true,
            lines: [
                { text: `Castañas: ${this.chestnutCount}/${this.totalChestnuts}`, color: '#f4a261', fontSize: '24px' }
            ]
        });
    }

    hitTrap() {
        if (this.isInvulnerable || this.gameOver) return;

        this.lives--;
        this.updateHUD('lives', this.lives);

        if (this.lives <= 0) {
            this.playerDeath();
            return;
        }

        // Dano sen morte: knockback + invulnerabilidade temporal
        this.isInvulnerable = true;
        this.player.setVelocityY(-300); // Pequeno salto de retroceso

        // Efecto visual: parpadeo
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.player.setAlpha(1);
                this.isInvulnerable = false;
            }
        });
    }

    playerDeath() {
        this.showEndScreen({
            title: 'Game Over!',
            titleColor: '#ff6b6b',
            prompt: 'Preme ESPAZO para reintentar',
            resetLives: true,
            lines: [
                { text: `Castañas: ${this.chestnutCount}/${this.totalChestnuts}`, color: '#f4a261', fontSize: '24px' }
            ]
        });
    }
}
