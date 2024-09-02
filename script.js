let panelCount = 0; 
let recognitions = {}; 
let selectedVoice;
let currentTabIndex = 1;
let tabPanels = {}; 
let tabs = []; 

const toggleButton = document.getElementById('theme-toggle');
const icon = document.getElementById('icon');

// Recuperar el tema almacenado
const currentTheme = localStorage.getItem('theme');

// Aplicar el tema almacenado si existe
if (currentTheme) {
  document.body.classList.add(currentTheme);
  icon.textContent = currentTheme === 'light-mode' ? 'bedtime' : 'sunny';
} else {
  icon.textContent = 'sunny'; // Icono predeterminado si no hay tema guardado
}

// Función para cambiar el tema
toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const newTheme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
  icon.textContent = newTheme === 'light-mode' ? 'bedtime' : 'sunny';
  
  // Guardar el tema en localStorage
  localStorage.setItem('theme', newTheme);
});

function adjustTabContainerHeight(expand = false) {
    const tabContainer = document.querySelector('.tab-container');
    const savedTabs = JSON.parse(localStorage.getItem('tabs')) || []; // Cargar pestañas desde localStorage
    const tabs = document.querySelectorAll('.tab-container .tab');

    if (savedTabs.length > 0 || tabs.length > 0) {
        const tabHeight = tabs.length > 0 ? tabs[0].offsetHeight + 10 : 40; // Altura de una pestaña más margen
        const containerWidth = tabContainer.clientWidth;
        const tabWidth = tabs.length > 0 ? tabs[0].offsetWidth + 10 : 100; // Ancho de una pestaña más margen

        const tabsPerRow = Math.floor(containerWidth / tabWidth); // Cuántas pestañas caben por fila
        const rows = Math.ceil(savedTabs.length / tabsPerRow); // Número de filas necesarias

        const maxHeight = rows * tabHeight - 10; // Altura total basada en filas

        if (!expand) {
            tabContainer.style.height = '40px'; // Inicia contraído con altura de 40px
            tabContainer.style.maxHeight = `${maxHeight}px`; // Limita la altura máxima al inicio
        } else {
            tabContainer.style.height = `${maxHeight}px`; // Expande la altura cuando se requiera
            tabContainer.style.maxHeight = `${maxHeight}px`; // Ajusta la altura máxima para permitir expansión manual
        }
    } else {
        tabContainer.style.height = '40px'; // Altura mínima cuando no hay pestañas
        tabContainer.style.maxHeight = '40px';
    }
}

// Configurar el botón de agregar pestaña y ajustar altura al cargar la página
window.onload = function() {
    loadTabsFromLocalStorage();
    adjustTabContainerHeight(); // Inicia el contenedor contraído al cargar la página

    if (tabs.length > 0) {
        showTabContent(document.querySelector(`.tab[data-tab-index="${tabs[0].index}"]`));
    }

    // Configurar el botón de agregar pestaña
    const addTabBtn = document.querySelector('.add-tab-btn');
    addTabBtn.addEventListener('click', () => {
        addTab();  // Agregar una nueva pestaña al hacer clic en el botón
        adjustTabContainerHeight(true);  // Expande el contenedor al agregar una pestaña
    });

    // Expande el contenedor si hay pestañas almacenadas en localStorage
    if (savedTabs.length > 0) {
        adjustTabContainerHeight(true);
    }
};

function loadTabsFromLocalStorage() {
    const savedTabs = JSON.parse(localStorage.getItem('tabs')) || [];
    savedTabs.forEach(tabData => {
        addTab(tabData.index, tabData.name, false);
    });
}


function toggleTabContainerHeight() {
    const tabContainer = document.getElementById('tabContainer');
    if (tabContainer.style.height === '30px' || tabContainer.style.height === '') {
        tabContainer.style.height = '200px'; // Expande el contenedor
    } else {
        tabContainer.style.height = '30px'; // Colapsa el contenedor
    }
}

function addPanel(panelData = null) {
    panelCount++;
    const container = document.getElementById('notepadContainer');
    const newPanel = document.createElement('div');
    newPanel.className = 'notepad-container';
    newPanel.setAttribute('data-panel-id', panelCount);
    newPanel.innerHTML = `
        <div class="notepad-header">
            <input type="text" class="notepad-title" value="${panelData ? panelData.title : 'My Notepad'}" />
            <div class="symbol-container">
                <input type="checkbox" id="symbol-toggle${panelCount * 2 - 1}" class="symbol-toggle micToggle" />
                <label for="symbol-toggle${panelCount * 2 - 1}" class="symbol-toggleee" style="--symbol: 'mic'; --symbol-checked: 'mic_off';"></label>

                <input type="checkbox" id="symbol-toggle${panelCount * 2}" class="symbol-toggle voiceToggle" />
                <label for="symbol-toggle${panelCount * 2}" class="symbol-toggleee" style="--symbol: 'play_arrow'; --symbol-checked: 'pause';"></label>
                <button class="copy-btn" onclick="copyPanelText(${panelCount})"></button>
                <button class="zoom-btn" onclick="openLightbox(${panelCount})"></button>
                <button class="delete-btn" onclick="showDeleteConfirmation(${panelCount})"></button>
            </div>
        </div>
        <textarea class="notepad-textarea" placeholder="Start typing your notes here...">${panelData ? panelData.content : ''}</textarea>
    `;
    
    container.insertBefore(newPanel, container.firstChild);
    
    initializePanelFunctions(panelCount);

    if (!panelData) {
        savePanelToLocalStorage(currentTabIndex);
    }
}

function copyText(textarea) {
    textarea.select();
    document.execCommand('copy');

    // Mostrar la alerta de texto copiado
    const copyAlert = document.getElementById('copyAlert');
    copyAlert.style.display = 'block';

    // Ocultar la alerta después de 2 segundos
    setTimeout(() => {
        copyAlert.style.display = 'none';
    }, 2000);
}

function copyPanelText(panelId) {
    const textarea = document.querySelector(`.notepad-container[data-panel-id="${panelId}"] .notepad-textarea`);
    copyText(textarea);
}

function copyLightboxText() {
    const textarea = document.getElementById('lightbox-textarea');
    copyText(textarea);
}


function initializePanelFunctions(panelId) {
    const micToggle = document.getElementById(`symbol-toggle${panelId * 2 - 1}`);
    const voiceToggle = document.getElementById(`symbol-toggle${panelId * 2}`);
    const textarea = document.querySelector(`.notepad-container[data-panel-id="${panelId}"] .notepad-textarea`);
    const titleInput = document.querySelector(`.notepad-container[data-panel-id="${panelId}"] .notepad-title`);
    const micLabel = micToggle.nextElementSibling;
    const voiceLabel = voiceToggle.nextElementSibling;

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = true; 
        recognition.recognitionTimeout = 60000; 
    
        recognitions[panelId] = recognition;
    
        recognition.onstart = () => {
            micToggle.checked = true;
            if (document.getElementById('lightbox').style.display === 'flex') {
                document.getElementById('lightbox-symbol-toggle1').checked = true;
            }
        };
    
        recognition.onresult = (event) => {
            // Obtener el resultado del reconocimiento
            const result = event.results[0][0].transcript.trim();
            
            // Convertir a minúsculas y eliminar signos de puntuación
            const sanitizedResult = result.toLowerCase().replace(/[.¡¿?!,;:(){}\[\]"'~`@#$%^&*_+=<>|\\/]/g, '');
    
            if (document.getElementById('lightbox').style.display === 'flex') {
                const lightboxTextarea = document.getElementById('lightbox-textarea');
                insertTextAtCursor(lightboxTextarea, sanitizedResult);
                textarea.value = lightboxTextarea.value; 
            } else {
                insertTextAtCursor(textarea, sanitizedResult);
            }
            savePanelToLocalStorage(currentTabIndex);
        };
    
        recognition.onend = () => {
            if (micToggle.checked) {
                recognition.start();  // Reiniciar inmediatamente después de que termine
            } else {
                if (document.getElementById('lightbox').style.display === 'flex') {
                    document.getElementById('lightbox-symbol-toggle1').nextElementSibling.classList.remove('listening');
                }
            }
        };
    
        micToggle.addEventListener('change', () => {
            if (micToggle.checked) {
                recognition.start();
            } else {
                recognition.stop();
            }
        });
    
        // Función para reiniciar el reconocimiento de manera más precisa
        const preciseRestartRecognition = () => {
            if (micToggle.checked && recognition) {
                recognition.abort();  // Abort, para reiniciar de inmediato
                setTimeout(() => recognition.start(), 20);  // Reducido a 20 ms para un reinicio más rápido
            }
        };
    
        // Escucha los eventos de selección de texto y entrada de texto para reiniciar
        textarea.addEventListener('selectionchange', preciseRestartRecognition);
        textarea.addEventListener('input', preciseRestartRecognition);
    
        if (document.getElementById('lightbox').style.display === 'flex') {
            const lightboxTextarea = document.getElementById('lightbox-textarea');
            lightboxTextarea.addEventListener('selectionchange', preciseRestartRecognition);
            lightboxTextarea.addEventListener('input', preciseRestartRecognition);
        }
    } else {
        alert('El reconocimiento de voz no está soportado en este navegador.');
    }
    

    voiceToggle.addEventListener('change', () => {
        if (voiceToggle.checked) {
            const textToRead = textarea.value.trim();

            if (textToRead) {
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'es-ES';
                utterance.voice = selectedVoice;
                utterance.onend = () => {
                    voiceToggle.checked = false;
                    if (document.getElementById('lightbox').style.display === 'flex') {
                        document.getElementById('lightbox-symbol-toggle2').checked = false;
                    }
                };
                speechSynthesis.speak(utterance);
            } else {
                voiceToggle.checked = false;
                if (document.getElementById('lightbox').style.display === 'flex') {
                    document.getElementById('lightbox-symbol-toggle2').checked = false;
                }
            }
        } else {
            speechSynthesis.cancel();
            if (document.getElementById('lightbox').style.display === 'flex') {
                document.getElementById('lightbox-symbol-toggle2').checked = false;
            }
        }
    });

    if (document.getElementById('lightbox').style.display === 'flex') {
        document.getElementById('lightbox-symbol-toggle2').addEventListener('change', () => {
            if (voiceToggle.checked !== document.getElementById('lightbox-symbol-toggle2').checked) {
                voiceToggle.checked = document.getElementById('lightbox-symbol-toggle2').checked;
                voiceToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    const lightboxTextarea = document.getElementById('lightbox-textarea');
    textarea.addEventListener('input', () => {
        if (document.getElementById('lightbox').style.display === 'flex') {
            const activePanelId = document.getElementById('lightbox').getAttribute('data-active-panel-id');
            if (activePanelId == panelId) { 
                lightboxTextarea.value = textarea.value;
            }
        }
        savePanelToLocalStorage(currentTabIndex);
    });
    lightboxTextarea.addEventListener('input', () => {
        const activePanelId = document.getElementById('lightbox').getAttribute('data-active-panel-id');
        if (activePanelId == panelId) { 
            textarea.value = lightboxTextarea.value;
            savePanelToLocalStorage(currentTabIndex);
        }
    });

    titleInput.addEventListener('input', () => {
        savePanelToLocalStorage(currentTabIndex);
    });
}


function insertTextAtCursor(textarea, text) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeValue = textarea.value.substring(0, startPos);
    const afterValue = textarea.value.substring(endPos, textarea.value.length);

    textarea.value = beforeValue + text + afterValue;
    textarea.selectionStart = textarea.selectionEnd = startPos + text.length;
}

function showDeleteConfirmation(panelId) {
    const panel = document.querySelector(`.notepad-container[data-panel-id="${panelId}"]`);

    const confirmationDialog = document.createElement('div');
    confirmationDialog.className = 'confirmation-dialog';
    confirmationDialog.innerHTML = `
        <p>¿Estás seguro de que quieres eliminar este panel?</p>
        <button class="confirm-delete-btn">Eliminar</button>
        <button class="cancel-delete-btn">Cancelar</button>
    `;

    panel.appendChild(confirmationDialog);

    confirmationDialog.querySelector('.confirm-delete-btn').addEventListener('click', () => {
        deletePanel(panelId);
        confirmationDialog.remove();
    });

    confirmationDialog.querySelector('.cancel-delete-btn').addEventListener('click', () => {
        confirmationDialog.remove();
    });
}

function deletePanel(panelId) {
    const panel = document.querySelector(`.notepad-container[data-panel-id="${panelId}"]`);
    panel.remove();
    savePanelToLocalStorage(currentTabIndex); 
}

function stopRecognition(panelId) {
    const micToggle = document.getElementById(`symbol-toggle${panelId * 2 - 1}`);
    micToggle.checked = false;
    if (document.getElementById('lightbox').style.display === 'flex') {
        document.getElementById('lightbox-symbol-toggle1').checked = false;
    }
}

function setSelectedVoice() {
    const voices = speechSynthesis.getVoices();
    selectedVoice = voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('Google') && voice.name.includes('español (Latinoamérica)')) ||
                    voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('Microsoft') && voice.name.includes('español (México)')) ||
                    voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('español')) ||
                    voices.find(voice => voice.lang.startsWith('es'));
}

speechSynthesis.onvoiceschanged = setSelectedVoice;

function openLightbox(panelId) {
    const textarea = document.querySelector(`.notepad-container[data-panel-id="${panelId}"] .notepad-textarea`);
    const lightboxTextarea = document.getElementById('lightbox-textarea');
    lightboxTextarea.value = textarea.value;

    const titleInput = document.querySelector(`.notepad-container[data-panel-id="${panelId}"] .notepad-title`);
    const lightboxTitleInput = document.querySelector('.lightbox-notepad-title');
    lightboxTitleInput.value = titleInput.value;

    const micToggle = document.getElementById(`symbol-toggle${panelId * 2 - 1}`);
    const lightboxMicToggle = document.getElementById('lightbox-symbol-toggle1');
    lightboxMicToggle.checked = micToggle.checked;

    const voiceToggle = document.getElementById(`symbol-toggle${panelId * 2}`);
    const lightboxVoiceToggle = document.getElementById('lightbox-symbol-toggle2');
    lightboxVoiceToggle.checked = voiceToggle.checked;

    lightboxTitleInput.addEventListener('input', () => {
        titleInput.value = lightboxTitleInput.value;
        savePanelToLocalStorage(currentTabIndex);
    });

    lightboxMicToggle.onchange = () => {
        micToggle.checked = lightboxMicToggle.checked;
        micToggle.dispatchEvent(new Event('change'));
    };

    lightboxVoiceToggle.onchange = () => {
        voiceToggle.checked = lightboxVoiceToggle.checked;
        voiceToggle.dispatchEvent(new Event('change'));
    };

    document.getElementById('lightbox').setAttribute('data-active-panel-id', panelId); 
    document.getElementById('lightbox').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lightbox').removeAttribute('data-active-panel-id'); 
}

function savePanelToLocalStorage(tabIndex) {
    const panels = [];
    document.querySelectorAll('.notepad-container').forEach(panel => {
        const panelId = panel.getAttribute('data-panel-id');
        const title = panel.querySelector('.notepad-title').value;
        const content = panel.querySelector('.notepad-textarea').value;
        panels.push({ panelId, title, content });
    });
    tabPanels[tabIndex] = panels;
    localStorage.setItem(`panels_tab_${tabIndex}`, JSON.stringify(panels));
}

function loadPanelsFromLocalStorage(tabIndex) {
    const panels = JSON.parse(localStorage.getItem(`panels_tab_${tabIndex}`)) || [];
    panels.reverse().forEach(panelData => { 
        addPanel(panelData);
    });
    panelCount = panels.length; 
}

function saveTabsToLocalStorage() {
    localStorage.setItem('tabs', JSON.stringify(tabs));
}

function loadTabsFromLocalStorage() {
    const savedTabs = JSON.parse(localStorage.getItem('tabs')) || [];
    savedTabs.forEach(tabData => {
        addTab(tabData.index, tabData.name, false);
    });
}

function addTab(index = null, name = 'Nueva pestaña', save = true) {
    const tabContainer = document.getElementById('tabContainer');
    const tabIndex = index || tabs.length + 1;
    const newTab = document.createElement('div');
    newTab.classList.add('tab');
    newTab.setAttribute('data-tab-index', tabIndex);
    newTab.setAttribute('onclick', 'showTabContent(this)'); 
    newTab.setAttribute('ondblclick', 'enableEdit(this)'); 
    newTab.innerHTML = `
        <input type="text" value="${name}" readonly ondblclick="enableEdit(this)">
        <button class="delete-tab" onclick="confirmDelete(this)"></button>
    `;
    tabContainer.insertBefore(newTab, tabContainer.querySelector('.add-tab'));

    tabs.push({ index: tabIndex, name: name });

    if (save) {
        saveTabsToLocalStorage();
    }
}

function enableEdit(tab) {
    const input = tab.querySelector('input[type="text"]');
    input.readOnly = false;
    input.classList.add('editing');  // Añadir la clase editing para mostrar el marco
    input.focus();
    input.select();

    input.addEventListener('blur', () => {
        input.readOnly = true;
        input.classList.remove('editing');  // Quitar la clase editing cuando termine la edición
        const tabIndex = tab.getAttribute('data-tab-index');
        const tabName = input.value;
        tabs = tabs.map(t => t.index == tabIndex ? { index: t.index, name: tabName } : t);
        saveTabsToLocalStorage();
    });

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            input.readOnly = true;
            input.classList.remove('editing');  // Quitar la clase editing al presionar Enter
            input.blur();
        }
    });
}


function showTabContent(tab) {
    const tabIndex = tab.getAttribute('data-tab-index');
    currentTabIndex = tabIndex;
    document.getElementById('notepadContainer').innerHTML = ''; 
    loadPanelsFromLocalStorage(tabIndex);
}

let tabToDelete = null;

function confirmDelete(element) {
    tabToDelete = element.parentElement;
    document.getElementById('dialog').style.display = 'flex';
}

function deleteConfirmed() {
    if (tabToDelete) {
        const tabIndex = tabToDelete.getAttribute('data-tab-index');
        localStorage.removeItem(`panels_tab_${tabIndex}`); 
        tabs = tabs.filter(tab => tab.index !== parseInt(tabIndex));
        saveTabsToLocalStorage();
        tabToDelete.remove();
        if (currentTabIndex == tabIndex) {
            document.getElementById('notepadContainer').innerHTML = ''; 
        }
    }
    document.getElementById('dialog').style.display = 'none';
}

function cancelDelete() {
    tabToDelete = null;
    document.getElementById('dialog').style.display = 'none';
}

function showClearStorageConfirmation() {
    const confirmationDialog = document.createElement('div');
    confirmationDialog.className = 'confirmation-dialog';
    confirmationDialog.innerHTML = `
        <p>¿Estás seguro de que quieres limpiar todo el almacenamiento?</p>
        <button class="confirm-clear-btn">Limpiar</button>
        <button class="cancel-clear-btn">Cancelar</button>
    `;

    document.body.appendChild(confirmationDialog);

    confirmationDialog.querySelector('.confirm-clear-btn').addEventListener('click', () => {
        localStorage.clear(); 
        document.querySelectorAll('.notepad-container').forEach(panel => panel.remove());
        confirmationDialog.remove();
        document.querySelectorAll('.tab').forEach(tab => tab.remove());
        localStorage.removeItem('tabs');
    });

    confirmationDialog.querySelector('.cancel-clear-btn').addEventListener('click', () => {
        confirmationDialog.remove();
    });
}

document.addEventListener('click', function (event) {
    if (currentEditingTab && !currentEditingTab.contains(event.target)) {
        disableEdit(currentEditingTab);
    }
});

document.querySelector('.tab-container').addEventListener('click', function (event) {
    event.stopPropagation();
});

function showClearStorageConfirmation() {
    const cleaningDialog = document.getElementById('cleaningDialog');
    cleaningDialog.style.display = 'flex';
}

function confirmCleaning() {
    localStorage.clear(); 
    document.querySelectorAll('.notepad-container').forEach(panel => panel.remove());
    document.querySelectorAll('.tab').forEach(tab => tab.remove());
    localStorage.removeItem('tabs');

    // Ocultar el diálogo después de confirmar
    const cleaningDialog = document.getElementById('cleaningDialog');
    cleaningDialog.style.display = 'none';

    // Recargar la página para reiniciar todo
    location.reload();
}


function cancelCleaning() {
    // Ocultar el diálogo si se cancela la acción
    const cleaningDialog = document.getElementById('cleaningDialog');
    cleaningDialog.style.display = 'none';
}
function showTabContent(tab) {
    // Eliminar la clase 'selected' de todas las pestañas
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('selected'));
    
    // Añadir la clase 'selected' a la pestaña actualmente seleccionada
    tab.classList.add('selected');

    const tabIndex = tab.getAttribute('data-tab-index');
    currentTabIndex = tabIndex;

    // Limpiar el contenedor de las notas y cargar las notas correspondientes a la pestaña seleccionada
    document.getElementById('notepadContainer').innerHTML = ''; 
    loadPanelsFromLocalStorage(tabIndex);
}
