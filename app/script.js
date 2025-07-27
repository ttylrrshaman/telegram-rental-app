document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Развернуть приложение на весь экран
    tg.enableClosingConfirmation(); // Запрос подтверждения при закрытии
    
    // Получаем данные пользователя
    const userData = tg.initDataUnsafe;
    const userId = userData.user?.id;
    
    // Элементы интерфейса
    const balanceEl = document.getElementById('balance');
    const skinsContainer = document.getElementById('skins-container');
    const loader = document.getElementById('loader');
    
    // Базовый URL API - замените на ваш реальный адрес
    const API_BASE = 'http://localhost:5000';
    
    // Функция показа уведомления
    function showNotification(message, isSuccess = true) {
        const notification = document.createElement('div');
        notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Загрузка баланса пользователя
    async function loadBalance() {
        try {
            const response = await fetch(`${API_BASE}/api/balance?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            balanceEl.textContent = data.balance.toFixed(2);
        } catch (error) {
            console.error('Error loading balance:', error);
            showNotification('Failed to load balance', false);
        }
    }

    // Загрузка доступных скинов
    async function loadSkins() {
        try {
            loader.style.display = 'block';
            skinsContainer.innerHTML = '';
            
            const response = await fetch(`${API_BASE}/api/skins`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const skins = await response.json();
            
            if (skins.length === 0) {
                skinsContainer.innerHTML = '<div class="no-skins">No available skins at the moment</div>';
                return;
            }
            
            skins.forEach(skin => {
                const skinCard = document.createElement('div');
                skinCard.className = 'skin-card';
                skinCard.innerHTML = `
                    <div class="skin-image" style="background-image: url('${skin.image_url || 'https://via.placeholder.com/300x180?text=CS2+Skin'}')"></div>
                    <div class="skin-info">
                        <h3 class="skin-name">${skin.name}</h3>
                        <div class="skin-price">$${skin.price.toFixed(2)}/day</div>
                        <button class="rent-btn" data-id="${skin.id}">RENT NOW</button>
                    </div>
                `;
                skinsContainer.appendChild(skinCard);
            });
            
            // Добавляем обработчики для кнопок аренды
            document.querySelectorAll('.rent-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const skinId = btn.dataset.id;
                    const skinName = btn.closest('.skin-card').querySelector('.skin-name').textContent;
                    
                    // Подтверждение аренды
                    const confirmRent = confirm(`Rent "${skinName}" for $${btn.previousElementSibling.textContent.split('$')[1]}?`);
                    if (!confirmRent) return;
                    
                    try {
                        const response = await fetch(`${API_BASE}/api/rent`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                user_id: userId,
                                skin_id: skinId
                            })
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            showNotification('Skin rented successfully!');
                            // Обновляем данные
                            await loadBalance();
                            await loadSkins();
                        } else {
                            showNotification(result.message || 'Rental failed', false);
                        }
                    } catch (error) {
                        console.error('Error renting skin:', error);
                        showNotification('Error renting skin', false);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading skins:', error);
            showNotification('Failed to load skins', false);
        } finally {
            loader.style.display = 'none';
        }
    }

    // Инициализация приложения
    try {
        await Promise.all([loadBalance(), loadSkins()]);
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Initialization failed', false);
    }
    
    // Обновление данных каждые 30 секунд
    setInterval(async () => {
        await loadBalance();
        await loadSkins();
    }, 30000);
    
    // Обработчик для кнопки закрытия в Telegram
    tg.BackButton.onClick(() => {
        tg.close();
    });
    
    // Показываем кнопку "Назад" в интерфейсе
    tg.BackButton.show();
});