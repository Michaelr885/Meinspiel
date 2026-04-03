/**
 * Tablet QR Scanner - Milestone 1
 * Modular Vanilla JS für einfache Integration von Spiellogiken (Bosskämpfe, JSON DB)
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elemente referenzieren
    const readerElement = document.getElementById('reader');
    const resultContainer = document.getElementById('result-container');
    const scannedResultDisplay = document.getElementById('scanned-result');
    const scanNextBtn = document.getElementById('scan-next-btn');
    const scannerWrapper = document.getElementById('scanner-wrapper');

    let html5QrCode;

    /**
     * Scanner Initialisierung
     * Konfiguration für Frontkamera und Tablet-Accessibility
     */
    const initScanner = () => {
        html5QrCode = new Html5Qrcode("reader");
        
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
        };

        const config = { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.333334 // 4:3 für Standard Tablets
        };

        // Kamera starten mit Priorität auf Frontkamera (user)
        html5QrCode.start(
            { facingMode: "user" }, 
            config, 
            qrCodeSuccessCallback
        ).catch((err) => {
            console.error("Scanner konnte nicht gestartet werden:", err);
            // Fallback auf Umgebungskamera, falls Frontkamera blockiert oder nicht vorhanden ist
            fallbackToEnvironmentCamera(config, qrCodeSuccessCallback);
        });
    };

    /**
     * Fallback Logik für Kameras
     */
    const fallbackToEnvironmentCamera = (config, callback) => {
        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            callback
        ).catch((err) => {
            alert("Kamera-Zugriff verweigert oder keine Kamera gefunden.");
        });
    };

    /**
     * Logik nach erfolgreichem Scan
     * @param {string} decodedText Die im QR-Code enthaltene ID
     */
    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log(`Scan erfolgreich: ${decodedText}`);
        
        // 1. Scanner pausieren (verhindert Mehrfachscans)
        html5QrCode.pause(true); // true = Video-Feed einfrieren

        // 2. Ergebnis anzeigen
        scannedResultDisplay.textContent = decodedText;
        
        // 3. UI Update (Scanner ausblenden, Ergebnis einblenden)
        scannerWrapper.style.display = 'none';
        resultContainer.classList.remove('hidden');

        // Spätere Erweiterung: Hier können wir unsere JSON-Boss-Daten laden
        // matchQRCodeWithBossData(decodedText);
    };

    /**
     * Scanner zurücksetzen für nächste Karte
     */
    const resetScanner = () => {
        // 1. UI zurücksetzen
        resultContainer.classList.add('hidden');
        scannerWrapper.style.display = 'block';
        scannedResultDisplay.textContent = '';

        // 2. Scanner fortfahren
        if (html5QrCode) {
            html5QrCode.resume();
        }
    };

    // Event Listener für den Action-Button
    scanNextBtn.addEventListener('click', () => {
        resetScanner();
    });

    // Starten der Anwendung
    initScanner();
});
