// otchlan.js
// Ten skrypt wymaga załadowania BaddonWindow.js przez główny UserScript.

(function() {
    if (typeof BaddonWindow === 'undefined') {
        console.error('BaddonWindow class is not loaded. Make sure BaddonWindow.js is loaded before otchlan.js');
        return;
    }

    let isAutoBattleEnabled = false;
    let isFastBattleEnabled = false;
    let battleLoopInterval = null;

    // Funkcje pomocnicze
    async function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const waitForAccept = async () => {
        while (document.querySelector(".choose-eq").style.display !== "block") {
            await sleep(500); // Zmniejszyłem interwał dla szybszej reakcji
        }
    };

    const waitForBattleStart = async () => {
        // Zakładam, że Engine.battle.show zmienia się na true po rozpoczęciu bitwy
        while (typeof Engine === 'undefined' || !Engine.battle || !Engine.battle.show) {
            await sleep(500);
        }
    };

    const waitForBattleEnd = async () => {
        // Zakładam, że Engine.battle.endBattle zmienia się na true po zakończeniu bitwy
        while (typeof Engine === 'undefined' || !Engine.battle || !Engine.battle.endBattle) {
            await sleep(500);
        }
    };

    // Główna logika automatycznej walki
    const startBattleLoop = async () => {
        if (battleLoopInterval) {
            clearInterval(battleLoopInterval);
        }

        battleLoopInterval = setInterval(async () => {
            if (!isAutoBattleEnabled) {
                clearInterval(battleLoopInterval);
                battleLoopInterval = null;
                console.log("Auto-walka Otchłań: Wyłączona.");
                return;
            }

            let isInQueue = document.querySelector(".matchmaking-timer") && document.querySelector(".matchmaking-timer").style.display === "block";

            if (!isInQueue) {
                console.log("Otchłań: Nie w kolejce, próbuję dołączyć...");
                _g("match&a=signin");
            } else {
                let foundOpponent = document.querySelector("#matchmaking-timer"); // Sprawdź, czy timer jest widoczny, co sugeruje znalezienie przeciwnika
                if (foundOpponent !== null) {
                    console.log("Otchłań: Znaleziono przeciwnika, akceptuję...");
                    _g("match&a=accept_opp&ans=1");
                    await waitForAccept(); // Czekaj na akceptację

                    _g("match&a=prepared");
                    await waitForBattleStart(); // Czekaj na start bitwy

                    if (isFastBattleEnabled) {
                        console.log("Otchłań: Szybka walka włączona.");
                        _g("fight&a=f"); // Szybka walka
                    } else {
                        console.log("Otchłań: Szybka walka wyłączona, czekam na koniec.");
                    }

                    await waitForBattleEnd(); // Czekaj na koniec bitwy
                    console.log("Otchłań: Bitwa zakończona.");
                    _g("fight&a=exit");
                    await sleep(200);
                    _g("fight&a=nextmatch"); // Przejdź do następnego meczu
                }
            }
            await sleep(1500); // Odczekaj przed kolejnym sprawdzeniem/cyklem
        }, 3000); // Główny interwał sprawdzania co 3 sekundy
    };


    // Tworzenie zawartości okna Otchłani
    const otchlanContent = document.createElement('div');
    otchlanContent.innerHTML = `
        <div class="baddon-flex column" style="gap: 10px; padding: 10px;">
            <div class="baddon-label-wrapper">
                <input type="checkbox" id="otchlan-auto-battle-checkbox" class="baddon-checkbox">
                <label for="otchlan-auto-battle-checkbox">Zapisywanie i walka włączone</label>
            </div>
            <div class="baddon-label-wrapper">
                <input type="checkbox" id="otchlan-fast-battle-checkbox" class="baddon-checkbox">
                <label for="otchlan-fast-battle-checkbox">Szybka Walka</label>
            </div>
        </div>
    `;

    // Inicjalizacja okna Otchłani za pomocą BaddonWindow
    const otchlanWindow = new BaddonWindow('otchlan-window', 'Otchłań', otchlanContent, {
        className: 'otch', // Dodatkowa klasa do specyficznego stylizowania Otchłani
        minWidth: '250px',
        minHeight: '120px'
    });

    // Obsługa checkboxów
    const autoBattleCheckbox = otchlanContent.querySelector('#otchlan-auto-battle-checkbox');
    const fastBattleCheckbox = otchlanContent.querySelector('#otchlan-fast-battle-checkbox');

    // Wczytanie stanu z localStorage
    isAutoBattleEnabled = localStorage.getItem('baddon-otchlan-autoBattle') === 'true';
    isFastBattleEnabled = localStorage.getItem('baddon-otchlan-fastBattle') === 'true';

    autoBattleCheckbox.checked = isAutoBattleEnabled;
    fastBattleCheckbox.checked = isFastBattleEnabled;

    if (isAutoBattleEnabled) {
        startBattleLoop();
    }

    autoBattleCheckbox.addEventListener('change', () => {
        isAutoBattleEnabled = autoBattleCheckbox.checked;
        localStorage.setItem('baddon-otchlan-autoBattle', isAutoBattleEnabled);
        if (isAutoBattleEnabled) {
            startBattleLoop();
            console.log("Auto-walka Otchłań: Włączona.");
        } else {
            if (battleLoopInterval) {
                clearInterval(battleLoopInterval);
                battleLoopInterval = null;
            }
            console.log("Auto-walka Otchłań: Wyłączona.");
        }
    });

    fastBattleCheckbox.addEventListener('change', () => {
        isFastBattleEnabled = fastBattleCheckbox.checked;
        localStorage.setItem('baddon-otchlan-fastBattle', isFastBattleEnabled);
        console.log("Szybka Walka Otchłań: ", isFastBattleEnabled ? "Włączona" : "Wyłączona");
    });

})();
