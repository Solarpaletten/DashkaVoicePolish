// 🎤 Диагностика и исправление проблем с микрофоном

// Добавьте эти функции в ваш веб-интерфейс

async function diagnoseMicrophone() {
    const status = document.getElementById('status');
    
    try {
        // Проверка поддержки API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('API getUserMedia не поддерживается');
        }
        
        status.textContent = '🔍 Диагностика микрофона...';
        
        // Проверка разрешений
        const permissions = await navigator.permissions.query({name: 'microphone'});
        console.log('Разрешения микрофона:', permissions.state);
        
        if (permissions.state === 'denied') {
            throw new Error('Доступ к микрофону запрещен в настройках браузера');
        }
        
        // Попытка получить доступ
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // Успех!
        status.textContent = '✅ Микрофон работает!';
        
        // Останавливаем поток
        stream.getTracks().forEach(track => track.stop());
        
        return true;
        
    } catch (error) {
        console.error('Ошибка микрофона:', error);
        
        let errorMessage = '❌ Микрофон недоступен: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Доступ запрещен. Разрешите микрофон в браузере.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'Микрофон не найден. Проверьте подключение.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Микрофон не поддерживается. Попробуйте HTTPS.';
        } else {
            errorMessage += error.message;
        }
        
        status.textContent = errorMessage;
        
        // Показываем инструкции по исправлению
        showMicrophoneInstructions(error);
        
        return false;
    }
}

function showMicrophoneInstructions(error) {
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 400px;
        z-index: 1000;
        text-align: center;
    `;
    
    let content = '<h3>🎤 Исправление микрофона</h3>';
    
    if (location.protocol !== 'https:') {
        content += `
            <p><strong>Рекомендация:</strong> Используйте HTTPS</p>
            <p><a href="https://${location.hostname}:8443" style="color: #4CAF50;">
                Перейти на HTTPS версию
            </a></p>
        `;
    }
    
    content += `
        <h4>Инструкции по браузерам:</h4>
        <p><strong>Chrome:</strong> Нажмите 🔒 в адресной строке → Разрешения → Микрофон</p>
        <p><strong>Safari:</strong> Настройки → Веб-сайты → Микрофон</p>
        <p><strong>iPhone:</strong> Настройки → Safari → Микрофон</p>
        <button onclick="this.parentElement.remove()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
        ">Понятно</button>
    `;
    
    instructions.innerHTML = content;
    document.body.appendChild(instructions);
}

// Альтернативная функция записи без Speech Recognition
async function startManualRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            
            // Здесь можно отправить аудио на сервер для распознавания
            // Или использовать Web Speech API, если доступен
            
            updateStatus('🎤 Аудио записано, но нужен сервис распознавания');
        };
        
        mediaRecorder.start();
        updateStatus('🎤 Идет запись (ручной режим)...');
        
        // Остановка через 5 секунд
        setTimeout(() => {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        }, 5000);
        
    } catch (error) {
        console.error('Ошибка ручной записи:', error);
        updateStatus('❌ Ошибка записи: ' + error.message);
    }
}

// Проверка совместимости при загрузке
window.addEventListener('load', () => {
    // Добавляем кнопку диагностики
    const diagnosticBtn = document.createElement('button');
    diagnosticBtn.textContent = '🔍 Диагностика микрофона';
    diagnosticBtn.className = 'test-btn';
    diagnosticBtn.onclick = diagnoseMicrophone;
    
    const testButtons = document.querySelector('.test-buttons');
    if (testButtons) {
        testButtons.appendChild(diagnosticBtn);
    }
    
    // Автоматическая проверка
    setTimeout(diagnoseMicrophone, 2000);
});