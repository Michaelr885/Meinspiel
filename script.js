/**
 * Tablet QR Scanner - Milestone 2
 * Erweiterte Logik für Boss-Kämpfe und Karten-Matching
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
    const hpBarFill = document.getElementById('hp-bar');
    const hpTextDisplay = document.getElementById('hp-text');
    const bossImage = document.getElementById('boss-image');
    
    // Feedback Elemente
    const toast = document.getElementById('feedback-toast');
    const toastMessage = document.getElementById('toast-message');

    let html5QrCode;
    let database = null;
    let gameState = {
        bossHp: 0,
        bossMaxHp: 0
    };

    /**
     * Datenbank laden
     */
    const loadDatabase = async () => {
        try {
            const response = await fetch('datenbank.json');
            database = await response.json();
            console.log("Datenbank erfolgreich geladen:", database);
            
            // Spiel-Status initialisieren
            gameState.bossHp = database.boss.hp;
            gameState.bossMaxHp = database.boss.maxHp;
            
            updateBossUI();
        } catch (err) {
            console.error("Fehler beim Laden der Datenbank:", err);
            showFeedback("Datenbank-Fehler!", "error");
        }
    };

    /**
     * Boss UI aktualisieren
     */
    const updateBossUI = () => {
        if (!database) return;

        bossNameDisplay.textContent = database.boss.name;
        bossImage.src = database.boss.image;
        
        const hpPercent = (gameState.bossHp / gameState.bossMaxHp) * 100;
        hpBarFill.style.width = `${Math.max(0, hpPercent)}%`;
        hpTextDisplay.textContent = `${Math.max(0, gameState.bossHp)} / ${gameState.bossMaxHp}`;

        // Farbe des Balkens bei niedrigen HP anpassen
        if (hpPercent < 30) {
            hpBarFill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
        } else {
            hpBarFill.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
        }
    };

    /**
     * Feedback anzeigen (Toast)
     */
    const showFeedback = (message, type = 'success') => {
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        
        // Timer für das Ausblenden
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
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
            console.error("Scanner konnte nicht gestartet werden:", err);
            fallbackToEnvironmentCamera(config, qrCodeSuccessCallback);
        });
    };

    const fallbackToEnvironmentCamera = (config, callback) => {
        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            callback
        ).catch((err) => {
            showFeedback("Kamera-Fehler!", "error");
        });
    };

    /**
     * Logik nach erfolgreichem Scan (Milestone 2 Erweiterung)
     */
    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log(`Scan erfolgreich: ${decodedText}`);
        
        // Scanner pausieren
        html5QrCode.pause(true);

        // Abgleich mit Datenbank
        const card = database.cards[decodedText];

        if (card) {
            applyCardEffect(card);
            scannedResultDisplay.textContent = `${card.name} (${card.type})`;
            showFeedback(`${card.name} eingesetzt!`, "success");
        } else {
            scannedResultDisplay.textContent = decodedText;
            showFeedback("Unbekannte Karte gescannt", "error");
        }
        
        // UI Update
        scannerWrapper.style.display = 'none';
        resultContainer.classList.remove('hidden');
    };

    /**
     * Kampf-Logik: Effekt einer Karte anwenden
     */
    const applyCardEffect = (card) => {
        if (card.type === 'schaden') {
            gameState.bossHp -= card.wert;
            
            // Visuelles Feedback: HP-Balken blinkt rot
            hpBarFill.classList.add('hp-bar-flash');
            setTimeout(() => hpBarFill.classList.remove('hp-bar-flash'), 400);
            
            showFeedback(`${card.name} fügt ${card.wert} Schaden zu!`, "success");
        } else if (card.type === 'heilung') {
            gameState.bossHp = Math.min(gameState.bossMaxHp, gameState.bossHp + card.wert);
            showFeedback(`${card.name} heilt ${card.wert} HP!`, "success");
        }

        updateBossUI();

        if (gameState.bossHp <= 0) {
            showFeedback("GEWONNEN! Der Boss wurde besiegt!", "success");
        }
    };

    const resetScanner = () => {
        resultContainer.classList.add('hidden');
        scannerWrapper.style.display = 'block';
        scannedResultDisplay.textContent = '';

        if (html5QrCode) {
            html5QrCode.resume();
        }
    };

    scanNextBtn.addEventListener('click', () => {
        resetScanner();
    });

    // Starten der Anwendung: Erst Datenbank laden, dann Scanner init
    loadDatabase().then(() => {
        initScanner();
    });
});
