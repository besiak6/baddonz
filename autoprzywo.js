// ==UserScript==
// @name        Auto Przywo
// @version     1.1
// @author      besiak
// @match       https://*.margonem.pl/*
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    const SETTINGS_KEY = "baddonz-settings-ap";

    const DEFAULT_SETTINGS = {
        enabled: true,
        windowPosition: { left: '0', top: '0' },
        windowOpacity: 2,
        windowVisible: true,
        blockedNicks: []
    };

    let currentSettings = {};

    function loadSettings() {
        try {
            const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
            return { ...DEFAULT_SETTINGS, ...storedSettings };
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
        } catch (e) {
        }
    }

    function setupAutoPrzywoLogic() {
        if (typeof mAlert !== 'undefined') {
            const originalAlert = mAlert;
            mAlert = function () {
                if (currentSettings.enabled && arguments[0] !== undefined && typeof arguments[0] === 'string') {
                    const message = arguments[0];
                    if (message.includes("przyzywa do siebie swoją drużynę")) {
                        const nickMatch = message.match(/Gracz (.+?) przyzywa/);
                        if (nickMatch && nickMatch[1]) {
                            const summonedNick = nickMatch[1].trim();
                            const isBlocked = currentSettings.blockedNicks.some(blockedNick =>
                                blockedNick.toLowerCase() === summonedNick.toLowerCase()
                            );

                            if (isBlocked) {
                                return originalAlert.apply(this, arguments);
                            }
                        }

                        _g("party&a=acceptsummon&answer=1");
                        if (typeof closeModal === "function") {
                            closeModal();
                        }
                        return;
                    }
                }
                return originalAlert.apply(this, arguments);
            };
        }
    }

    function updateVisibilityOfBlockedNicksSection() {
        const blockedNicksSection = document.getElementById("ap-blocked-nicks-section");
        if (blockedNicksSection) {
            blockedNicksSection.style.display = currentSettings.enabled ? 'flex' : 'none';
        }
    }

    function createUI() {
        const windowHtml = `
            <div class="baddonz-window" id="ap-wnd" style="position: absolute; z-index: 500;">
                <div class="baddonz-window-header">
                    <div class="baddonz-window-controls left">
                        <div class="baddonz-icon baddonz-opacity-button" id="ap-opacity-btn"></div>
                    </div>
                    <div class="baddonz-window-title">Auto Przywo</div>
                    <div class="baddonz-window-controls right">
                        <div class="baddonz-icon baddonz-close-button" id="ap-close-button"></div>
                    </div>
                </div>
                <div class="baddonz-window-body baddonz-flex column" style="gap: 5px;">
                    <div class="baddonz-label-wrapper" style="justify-content: flex-start; align-items: center; gap: 5px;">
                        <div class="baddonz-checkbox" id="ap-checkbox"></div>
                        <div class="baddonz-text" style="padding: 0;">Auto Przywo</div>
                    </div>

                    <div id="ap-blocked-nicks-section" class="baddonz-flex column" style="gap: 5px; margin-top: 5px;">
                        <hr style="width: 100%; border-color: #303030; margin: 0;">
                        <div class="baddonz-text" style="padding: 0;">Nie akceptuj automatycznie od:</div>
                        <div class="baddonz-input-plus">
                            <input type="text" class="baddonz-input" id="ap-blocked-nick-input" placeholder="Wpisz nick" maxlength="20">
                            <button class="baddonz-button" id="ap-add-nick-btn">+</button>
                        </div>
                        <div class="ap-scroll-container" id="ap-blocked-nicks-list">
                        </div>
                    </div>
                </div>
            </div>
            <div class=".baddonz-enable-wnd.baddonz_enable_wnd_AP" style="display: none;"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', windowHtml);

        const apWindow = document.getElementById("ap-wnd");
        const apCloseButton = document.getElementById("ap-close-button");
        const apOpacityButton = document.getElementById("ap-opacity-btn");
        const apTitleBar = apWindow.querySelector(".baddonz-window-title");
        const apCheckbox = document.getElementById("ap-checkbox");
        const apToggleButton = document.querySelector(".baddonz-enable-wnd.baddonz_enable_wnd_AP");
        const apBlockedNickInput = document.getElementById("ap-blocked-nick-input");
        const apAddNickBtn = document.getElementById("ap-add-nick-btn");
        const apBlockedNicksList = document.getElementById("ap-blocked-nicks-list");

        apWindow.style.left = currentSettings.windowPosition.left;
        apWindow.style.top = currentSettings.windowPosition.top;

        const opacityClasses = ['opacity-0', 'opacity-1', 'opacity-2', 'opacity-3', 'opacity-4'];
        apWindow.classList.add(opacityClasses[currentSettings.windowOpacity]);

        apWindow.style.display = currentSettings.windowVisible ? 'flex' : 'none';

        if (currentSettings.enabled) {
            apCheckbox.classList.add('active');
        }

        const updateScrollbarPadding = () => {
            const isScrollbarVisible = apBlockedNicksList.scrollHeight > apBlockedNicksList.clientHeight;
            if (isScrollbarVisible) {
                apBlockedNicksList.style.paddingRight = '6px';
            } else {
                apBlockedNicksList.style.paddingRight = '0';
            }
        };

        const renderBlockedNicks = () => {
            apBlockedNicksList.innerHTML = '';
            currentSettings.blockedNicks.forEach((nick, index) => {
                const nickEntry = document.createElement('div');
                nickEntry.style.cssText = `
                    position: relative;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    margin-bottom: 3px;
                    padding-top: 2px;
                `;
                nickEntry.innerHTML = `
                    <input type="text" class="baddonz-input ap-nick-display" value="${nick}" readonly data-index="${index}" maxlength="20">
                    <span class="ap-remove-nick-x" data-index="${index}">&times;</span>
                `;
                apBlockedNicksList.appendChild(nickEntry);
            });
            saveSettings();
            updateScrollbarPadding();
        };

        const addBlockedNick = () => {
            const nick = apBlockedNickInput.value.trim();
            if (nick && !currentSettings.blockedNicks.some(n => n.toLowerCase() === nick.toLowerCase())) {
                currentSettings.blockedNicks.push(nick);
                apBlockedNickInput.value = '';
                renderBlockedNicks();
                apBlockedNicksList.scrollTop = apBlockedNicksList.scrollHeight;
            }
        };

        const removeBlockedNick = (indexToRemove) => {
            currentSettings.blockedNicks.splice(indexToRemove, 1);
            renderBlockedNicks();
        };

        const editBlockedNick = (inputElement, index) => {
            const originalNick = currentSettings.blockedNicks[index];
            inputElement.readOnly = false;
            inputElement.focus();

            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);

            const handleBlur = () => {
                inputElement.readOnly = true;
                const newNick = inputElement.value.trim();
                if (newNick && newNick.toLowerCase() !== originalNick.toLowerCase()) {
                    const isDuplicate = currentSettings.blockedNicks.some((n, i) =>
                        i !== index && n.toLowerCase() === newNick.toLowerCase()
                    );
                    if (!isDuplicate) {
                        currentSettings.blockedNicks[index] = newNick;
                    } else {
                        inputElement.value = originalNick;
                    }
                } else if (!newNick) {
                    removeBlockedNick(index);
                } else {
                    inputElement.value = originalNick;
                }
                saveSettings();
                inputElement.removeEventListener('blur', handleBlur);
                inputElement.removeEventListener('keydown', handleKeyDown);
                updateScrollbarPadding();
            };

            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    inputElement.blur();
                }
            };

            inputElement.addEventListener('blur', handleBlur);
            inputElement.addEventListener('keydown', handleKeyDown);
        };

        let isDragging = false;
        let offsetX, offsetY;

        apTitleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - apWindow.getBoundingClientRect().left;
            offsetY = e.clientY - apWindow.getBoundingClientRect().top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            const maxX = window.innerWidth - apWindow.offsetWidth;
            const maxY = window.innerHeight - apWindow.offsetHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            apWindow.style.left = `${newX}px`;
            apWindow.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                currentSettings.windowPosition.left = apWindow.style.left;
                currentSettings.windowPosition.top = apWindow.style.top;
                saveSettings();
            }
        });

        apCloseButton.addEventListener('click', () => {
            apWindow.style.display = 'none';
            currentSettings.windowVisible = false;
            saveSettings();
        });

        apOpacityButton.addEventListener('click', () => {
            apWindow.classList.remove(...opacityClasses);
            currentSettings.windowOpacity = (currentSettings.windowOpacity + 1) % opacityClasses.length;
            apWindow.classList.add(opacityClasses[currentSettings.windowOpacity]);
            saveSettings();
        });

        apCheckbox.addEventListener('click', () => {
            apCheckbox.classList.toggle('active');
            currentSettings.enabled = apCheckbox.classList.contains('active');
            saveSettings();
            updateVisibilityOfBlockedNicksSection();
        });

        apToggleButton.addEventListener('click', () => {
            if (apWindow.style.display === 'none') {
                apWindow.style.display = 'flex';
            } else {
                apWindow.style.display = 'none';
            }
            currentSettings.windowVisible = apWindow.style.display !== 'none';
            saveSettings();
        });

        apAddNickBtn.addEventListener('click', addBlockedNick);
        apBlockedNickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addBlockedNick();
            }
        });

        apBlockedNicksList.addEventListener('wheel', (e) => {
            e.preventDefault();
            apBlockedNicksList.scrollTop += e.deltaY;
        }, { passive: false });

        apBlockedNicksList.addEventListener('click', (e) => {
            if (e.target.classList.contains('ap-remove-nick-x')) {
                const indexToRemove = parseInt(e.target.dataset.index);
                removeBlockedNick(indexToRemove);
            } else if (e.target.classList.contains('ap-nick-display')) {
                const indexToEdit = parseInt(e.target.dataset.index);
                editBlockedNick(e.target, indexToEdit);
            }
        });

        if (typeof $ === 'function' && typeof $.fn.tip === 'function') {
            $(apCloseButton).tip('Zamknij');
            $(apOpacityButton).tip('Zmień przezroczystość okienka');
            $(apCheckbox).tip('Automatyczna akceptacja przywołania');
            $(apAddNickBtn).tip('Dodaj nick do czarnej listy');
        }

        renderBlockedNicks();
        updateVisibilityOfBlockedNicksSection();
    }

    const init = () => {
        if (!window.Engine || !window.Engine.allInit || (typeof window.__build !== "object" && typeof window.__bootNI === "undefined")) {
            setTimeout(init, 500);
            return;
        }
        currentSettings = loadSettings();
        setupAutoPrzywoLogic();
        createUI();
    };
    init();
})();
