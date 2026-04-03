/**
 * Tablet QR Scanner - Milestone 3
 * Game Loop: Rundenbasiertes Kampfsystem, Spieler-HP und Boss-Angriffsmuster
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elemente referenzieren
    const readerElement = document.getElementById('reader');
    const resultContainer = document.getElementById('result-container');
    const scannedResultDisplay = document.getElementById('scanned-result');
    const scanNextBtn = document.getElementById('scan-next-btn');
    const scannerWrapper = document.getElementById('scanner-wrapper');

    // Boss UI Elemente
    const bossNameDisplay = document.getElementById('boss-name');
    const bossHpBarFill = document.getElementById('boss-hp-bar');
    const bossHpTextDisplay = document.getElementById('boss-hp-text');
    const bossImage = document.getElementById('boss-image');
    
    // Spieler UI Elemente
    const playerHpBarFill = document.getElementById('player-hp-bar');
    const playerHpTextDisplay = document.getElementById('player-hp-text');
    const roundDisplay = document.getElementById('round-display');
    const endTurnBtn = document.getElementById('end-turn-btn');

    // Overlay Elemente
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverMessage = document.getElementById('game-over-message');
    const retryBtn = document.getElementById('retry-btn');
    
    // Feedback Elemente
    const toast = document.getElementById('feedback-toast');
    const toastMessage = document.getElementById('toast-message');

    let html5QrCode;
    let database = null;
    let isGameOver = false;
    let gameState = {
        bossHp: 0,
        bossMaxHp: 0,
        playerHp: 30,
        playerMaxHp: 30,
        currentRound: 1
    };

    /**
     * Datenbank laden und Spiel initialisieren
     */
    const loadDatabase = async () => {
        try {
            const response = await fetch('datenbank.json');
            database = await response.json();
            console.log("Datenbank erfolgreich geladen:", database);
            
            resetGameState();
        } catch (err) {
            console.error("Fehler beim Laden der Datenbank:", err);
            showFeedback("Datenbank-Fehler!", "error");
        }
    };

    /**
     * Spiel-Status zurücksetzen
     */
    const resetGameState = () => {
        if (!database) return;

        isGameOver = false;
        gameState.bossHp = database.boss.hp;
        gameState.bossMaxHp = database.boss.maxHp;
        gameState.playerHp = 30; // Startwert laut Anforderung
        gameState.playerMaxHp = 30;
        gameState.currentRound = 1;

        gameOverScreen.classList.add('hidden');
        scannerWrapper.style.display = 'flex';
        resultContainer.classList.add('hidden');
        
        updateUI();
    };

    /**
     * Gesamte UI aktualisieren
     */
    const updateUI = () => {
        if (!database) return;

        // Boss Update
        bossNameDisplay.textContent = database.boss.name;
        bossImage.src = database.boss.image;
        const bossHpPercent = (gameState.bossHp / gameState.bossMaxHp) * 100;
        bossHpBarFill.style.width = `${Math.max(0, bossHpPercent)}%`;
        bossHpTextDisplay.textContent = `${Math.max(0, gameState.bossHp)} / ${gameState.bossMaxHp}`;

        // Spieler Update
        const playerHpPercent = (gameState.playerHp / gameState.playerMaxHp) * 100;
        playerHpBarFill.style.width = `${Math.max(0, playerHpPercent)}%`;
        playerHpTextDisplay.textContent = `${Math.max(0, gameState.playerHp)} / ${gameState.playerMaxHp}`;

        // Runden Info
        roundDisplay.textContent = `Runde ${gameState.currentRound}`;

        // Farben/Warnungen
        updateBarColors(bossHpBarFill, bossHpPercent);
        updateBarColors(playerHpBarFill, playerHpPercent);
    };

    const updateBarColors = (bar, percent) => {
        if (percent < 30) {
            bar.style.filter = 'hue-rotate(-50deg) brightness(1.2)';
        } else {
            bar.style.filter = 'none';
        }
    };

    /**
     * Feedback anzeigen (Toast)
     */
    const showFeedback = (message, type = 'success') => {
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        setTimeout(() => toast.classList.add('hidden'), 3000);
    };

    /**
     * Boss-Angriff ausführen (Runden-Ende)
     */
    const handleBossTurn = () => {
        if (isGameOver) return;

        const monster = database.boss;
        const pattern = monster.angriffsmuster;
        
        // Schaden ermitteln (Modulus für Loop-Muster)
        const patternIndex = (gameState.currentRound - 1) % pattern.length;
        const damage = pattern[patternIndex];

        // Spieler HP abziehen
        gameState.playerHp -= damage;
        
        // Visuelles Feedback
        playerHpBarFill.classList.add('hp-bar-flash');
        setTimeout(() => playerHpBarFill.classList.remove('hp-bar-flash'), 400);
        
        showFeedback(`${monster.name} greift an: ${damage} Schaden!`, "error");

        // Runde erhöhen
        gameState.currentRound++;
        
        updateUI();
        checkWinLoss();
    };

    /**
     * Scanner Initialisierung
     */
    const initScanner = () => {
        html5QrCode = new Html5Qrcode("reader");
        
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
        };

        const config = { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.333334 
        };

        html5QrCode.start(
            { facingMode: "user" }, 
            config, 
            qrCodeSuccessCallback
        ).catch((err) => {
            console.error("Scanner-Startfehler, versuche Fallback...", err);
            html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
        });
    };

    /**
     * Logik nach erfolgreichem Scan
     */
    const handleScanSuccess = (decodedText, decodedResult) => {
        if (isGameOver) return;

        console.log(`Scan erfolgreich: ${decodedText}`);
        html5QrCode.pause(true);

        const card = database.cards[decodedText];

        if (card) {
            applyCardEffect(card);
            scannedResultDisplay.textContent = `${card.name} (${card.type})`;
        } else {
            scannedResultDisplay.textContent = decodedText;
            showFeedback("Unbekannte Karte", "error");
        }
        
        scannerWrapper.style.display = 'none';
        resultContainer.classList.remove('hidden');
    };

    /**
     * Effekt einer Karte anwenden
     */
    const applyCardEffect = (card) => {
        if (card.type === 'schaden') {
            gameState.bossHp -= card.wert;
            
            bossHpBarFill.classList.add('hp-bar-flash');
            setTimeout(() => bossHpBarFill.classList.remove('hp-bar-flash'), 400);
            
            showFeedback(`${card.name} fügt ${card.wert} Schaden zu!`, "success");
        } else if (card.type === 'heilung') {
            // Heilung geht nun auf den Spieler (max 30)
            gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + card.wert);
            showFeedback(`Heilung: +${card.wert} Leben für dich!`, "success");
        }

        updateUI();
        checkWinLoss();
    };

    /**
     * Prüfung auf Sieg oder Niederlage
     */
    const checkWinLoss = () => {
        if (gameState.bossHp <= 0) {
            endGame(true);
        } else if (gameState.playerHp <= 0) {
            endGame(false);
        }
    };

    /**
     * Spiel beenden
     */
    const endGame = (won) => {
        isGameOver = true;
        
        // Scanner dauerhaft stoppen
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(console.error);
        }

        gameOverTitle.textContent = won ? "SIEG!" : "NIEDERLAGE!";
        gameOverTitle.style.color = won ? "var(--hp-color)" : "var(--damage-color)";
        gameOverMessage.textContent = won 
            ? "Du hast Mr. Puppet erfolgreich besiegt!" 
            : "Du wurdest von Mr. Puppet überwältigt...";
        
        gameOverScreen.classList.remove('hidden');
        scannerWrapper.style.display = 'none';
        resultContainer.classList.add('hidden');
    };

    const resetScannerUI = () => {
        if (isGameOver) return;

        resultContainer.classList.add('hidden');
        scannerWrapper.style.display = 'flex';
        scannedResultDisplay.textContent = '';

        if (html5QrCode) {
            html5QrCode.resume();
        }
    };

    // Event Listener
    scanNextBtn.addEventListener('click', resetScannerUI);
    
    endTurnBtn.addEventListener('click', () => {
        handleBossTurn();
    });

    retryBtn.addEventListener('click', () => {
        resetGameState();
        initScanner(); // Scanner neu starten
    });

    // Start
    initScanner();
    loadDatabase();
});
