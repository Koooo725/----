// 控制热门城市表单显示与隐藏
const i_location = document.querySelector('#i-location')
i_location.addEventListener('click', () => {
    document.querySelector('#ct-hot-city').style.display = 'inline-block'
})
document.addEventListener('click', e => {
    if (e.target !== i_location) {
        document.querySelector('#ct-hot-city').style.display = 'none'
    }
})

// 控制搜表列表的显示与隐藏
const ls_match = document.querySelector('#ls-match')
i_location.addEventListener('input', e => {
    if (e.target.value.length > 0) {
        ls_match.style.display = 'block'
        document.querySelector('#ct-hot-city').style.display = 'none'
    } else {
        ls_match.style.display = 'none'
    }
})
document.querySelector('#i-location').addEventListener('blur', e => {
    setTimeout(() => {
        ls_match.style.display = 'none'
    }, 500);
})

// 切换每小时天气预报
let moveLength = 0
const hourWeather = document.querySelector('#ct-weather')
document.querySelector('#btn-next').addEventListener('click', () => {
    moveLength -= 1100
    if (moveLength <= -1400) {
        moveLength = -1400
    }
    hourWeather.style.transform = `translateX(${moveLength}px)`
})
document.querySelector('#btn-prev').addEventListener('click', () => {
    moveLength += 1100
    if (moveLength >= 0) {
        moveLength = 0
    }
    hourWeather.style.transform = `translateX(${moveLength}px)`
})


// 点击切换生活指数
document.querySelector('#ct-living-index .ct-page-ctrl #btn-next').addEventListener('click', () => {
    document.querySelector('#ct-content').style.marginLeft = '-440px'
})
document.querySelector('#ct-living-index .ct-page-ctrl #btn-prev').addEventListener('click', () => {
    document.querySelector('#ct-content').style.marginLeft = '0'
})

// 搜索城市
document.querySelector('#i-location').addEventListener('input', e => {
    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: e.target.value,
            range: 'cn',
            lang: 'zh'
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(result => {
        // console.log(result.data)
        const liStr = result.data.location.map(item => {
            const fullText = `${item.adm1}-${item.adm2}-${item.name}`;

            if (e.target.value) {
                const regex = new RegExp(e.target.value, 'gi');
                const highlightedText = fullText.replace(
                    regex,
                    match => `<span style="color: #1a5ff3ff;">${match}</span>`
                );
                return `<li data-id="${item.id}">${highlightedText}</li>`;
            } else {
                return `<li data-id="${item.id}">${fullText}</li>`;
            }
        })
        document.querySelector('#ls-match').innerHTML = liStr.join('')
        document.addEventListener('click', () => {
            e.target.value = ''
        })
    })
})

// 点击城市获取数据
// 如果有定位的话，注册点击事件的时候要注意层级z-index！
document.addEventListener('click', (e) => {
    if (e.target.closest('#ls-match li')) {
        const cityID = e.target.dataset.id
        // console.log('点击的城市ID:', cityID)
        getCurrentWeather(cityID)
        getHourWeather(cityID)
        getSevenDaysWeather(cityID)
        getLifeIndex(cityID)
        document.querySelector('#txt-location').innerHTML = `${e.target.dataset.adm1} ${e.target.dataset.adm2}`

        // 处理历史数据
        const newRecord = {
            id: e.target.dataset.id,
            name: e.target.dataset.name,
            adm1: e.target.dataset.adm1,
            adm2: e.target.dataset.adm2
        }
        document.querySelector('#ct-history').style.display = 'block'
        const updateHistory = historyManager.addRecord(newRecord)
        renderHistory(updateHistory)
    }

    // 处理热门城市点击
    if (e.target.closest('#ls-hot-city .opts')) {
        axios({
            url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
            method: 'GET',
            params: {
                key: 'f921a06325ca426b87162dcab439a0f3',
                location: e.target.closest('.opts').dataset.city,
                range: 'cn',
                lang: 'zh'
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(result => {
            // console.log(result.data.location[0].id)
            const cityID = result.data.location[0].id
            getCurrentWeather(cityID)
            getHourWeather(cityID)
            getSevenDaysWeather(cityID)
            getLifeIndex(cityID)
            document.querySelector('#txt-cur-location').innerHTML = `${result.data.location[0].adm1} ${result.data.location[0].adm2}`

            document.querySelector('#ct-history').style.display = 'block'
            const newRecord = {
                id: result.data.location[0].id,
                name: result.data.location[0].name,
                adm1: result.data.location[0].adm1,
                adm2: result.data.location[0].adm2,
            }
            const updateHistory = historyManager.addRecord(newRecord)
            renderHistory(updateHistory)
        })
    }
})

// 当前定位点击切换城市
document.addEventListener('click', (e) => {
    if (e.target.closest('#cur-location')) {
        console.log(e.target)
        const cityID = e.target.dataset.id
        getCurrentWeather(cityID)
        getHourWeather(cityID)
        getSevenDaysWeather(cityID)
        getLifeIndex(cityID)
        document.querySelector('#txt-cur-location').innerHTML = `${e.target.dataset.adm1} ${e.target.dataset.adm2}`

    }
})



// 处理历史记录
document.querySelector('#btn-clean').addEventListener('click', () => {
    // 要清除本地存储中的数据 而不只是页面中的数据 所以这里不能只是传入一个空数组
    const emptyHistory = historyManager.clearHistory()
    renderHistory(emptyHistory)
    document.querySelector('#ct-history').style.display = 'none'
})
const historyManager = {
    getHistory() {
        return JSON.parse(localStorage.getItem('cityHistory')) || [];
    },

    addRecord(record) {
        let history = this.getHistory()
        // filter会保留满足条件的项
        history = history.filter(item => item.id !== record.id)
        history.push(record)
        if (history.length > 4) {
            // slice函数保留最后四个数
            history = history.slice(-4)
        }
        localStorage.setItem('cityHistory', JSON.stringify(history))
        return history

    },

    clearHistory() {
        localStorage.removeItem('cityHistory');
        return [];
    }
}
function renderHistory(history) {
    // 反转数组‘
    const reverseHistory = [...history].reverse()
    document.querySelector('#ls-history').innerHTML = reverseHistory.map(item => {
        return `
        <li class="history-item" data-id="${item.id}" data-adm1="${item.adm1}" data-adm2="${item.adm2}">
            ${item.name}
        </li>`

    }).join('')

    const history_item = document.querySelectorAll('.history-item')
    history_item.forEach(item => {
        item.addEventListener('click', () => {
            const cityID = item.dataset.id
            getCurrentWeather(cityID)
            getHourWeather(cityID)
            getSevenDaysWeather(cityID)
            getLifeIndex(cityID)
            document.querySelector('#txt-cur-location').innerHTML = `${item.dataset.adm1} ${item.dataset.adm2}`
        })
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const savedHistory = historyManager.getHistory();
    renderHistory(savedHistory);
})


// 关注列表
document.querySelector('#btn-attention').addEventListener('click', async () => {
    const savedCity = JSON.parse(localStorage.getItem('savedCity') || '[]')
    const currentCityText = document.querySelector('#txt-cur-location').innerText.trim()
    const cityName = currentCityText.split(' ')[1]

    const isAlreadyFollowed = savedCity.some(city => city.adm2 === cityName)
    if (isAlreadyFollowed) return

    if (savedCity.length >= 5) {
        document.querySelector('#tips-attention-size').style.display = 'block'
        setTimeout(() => {
            document.querySelector('#tips-attention-size').style.display = 'none'
        }, 2500);
        return
    }
    document.querySelector('#btn-attention').innerHTML = `[已关注]`;

    try {
        const geoRes = await axios({
            url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
            params: {
                key: 'f921a06325ca426b87162dcab439a0f3',
                location: document.querySelector('#txt-cur-location').innerText
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const weatherRes = await axios({
            url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/weather/3d',
            params: {
                key: 'f921a06325ca426b87162dcab439a0f3',
                location: geoRes.data.location[0].id
            }
        })
        document.querySelector('#tips-attention').style.display = 'none'
        const geo = geoRes.data.location[0]
        const weather = weatherRes.data.daily[0]
        const chineseWeather = weather.textDay
        const englishKey = weatherMap[chineseWeather] || 'default'

        // 将数据存储在本地中
        const cityData = {
            id: geo.id,
            adm1: geo.adm1,
            adm2: geo.adm2,
            name: geo.name,
            weather: {
                textDay: weather.textDay,
                tempMax: weather.tempMax,
                tempMin: weather.tempMin,
                icon: englishKey
            }
        }
        saveCityToLocalStorage(cityData)
        renderCity(cityData)
    } catch (error) {
        console.error("请求失败:", error)
    }
})
function saveCityToLocalStorage(cityData) {
    const savedCity = JSON.parse(localStorage.getItem('savedCity') || '[]')

    const isExist = savedCity.some(city => city.id === cityData.id)
    if (!isExist) {
        savedCity.push(cityData)
        localStorage.setItem('savedCity', JSON.stringify(savedCity))
    }
}
function renderCity(cityData) {
    const defaultCityId = localStorage.getItem('defaultCityId');
    // 将两者都转为字符串（如果cityData.id是数字，转为字符串后比较）
    const isDefault = defaultCityId !== null && String(defaultCityId) === String(cityData.id);

    // 拼接HTML（保持结构不变，依赖isDefault的正确判断）
    const attentionStr = `
        <li class="city" data-id="${cityData.id}" ...> 
            <div class="ct-location"> 
                <p class="location">${cityData.adm2}</p> 
                <!-- 默认标记：仅默认城市显示 -->
                <p class="mark ${isDefault ? '' : 'hidden'}">默认</p> 
                <!-- 设为默认按钮：非默认城市显示 -->
                <a class="btn btn-set-default ${isDefault ? 'hidden' : ''}">设为默认</a>  
                <!-- 取消默认按钮：默认城市显示 -->
                <a class="btn btn-cancel ${isDefault ? '' : 'hidden'}">取消默认</a> 
            </div>
                <img class="icon" src="image/${cityData.weather.icon}.png" alt="${cityData.weather.textDay}"> 
            <p class="weather">${cityData.weather.textDay}</p> 
            <p class="temperature">${cityData.weather.tempMax}°/${cityData.weather.tempMin}°</p> 
            <a href="javascript:;" class="btn btn-delete"></a> 
        </li>`
    document.querySelector('#ls-attention').innerHTML += attentionStr;
    bindDeleteEvents()
    bindSetDefaultEvents()
    bindCancelDefaultEvents()
}
function bindCancelDefaultEvents() {
    const cancelBtns = document.querySelectorAll('.btn-cancel');
    cancelBtns.forEach(btn => {
        btn.removeEventListener('click', handleCancelDefault);
        btn.addEventListener('click', handleCancelDefault);
    })
}
function handleCancelDefault() {
    const cityLi = this.closest('.city');
    if (!cityLi) return;

    // 清除本地存储的默认城市ID
    localStorage.removeItem('defaultCityId');

    // 刷新所有城市项的显示状态（重新渲染关注列表）
    refreshCityList();
}
function refreshCityList() {
    const savedCities = JSON.parse(localStorage.getItem('savedCity') || '[]');
    // 清空现有列表
    document.querySelector('#ls-attention').innerHTML = '';
    // 重新渲染所有城市（会根据新的默认状态显示标记）
    savedCities.forEach(city => renderCity(city));
}
document.addEventListener('DOMContentLoaded', () => {
    loadSaveCity()
    checkCurrentCityStatus()
    observeCityTextChange()
    // bindDeleteEvents()
    initWeather()
})
function handleSetDefault() {
    const cityLi = this.closest('.city');
    if (!cityLi) return;

    const defaultCityId = cityLi.dataset.id; // 获取当前要设为默认的城市ID
    const savedCities = JSON.parse(localStorage.getItem('savedCity') || '[]');
    const defaultCity = savedCities.find(city => city.id === defaultCityId);

    if (!defaultCity) return; // 容错：如果城市不存在则终止

    // 1. 存储默认城市ID到本地
    localStorage.setItem('defaultCityId', defaultCityId);

    // 2. 立即更新页面显示的城市名称
    document.querySelector('#txt-cur-location').innerHTML = `${defaultCity.adm1} ${defaultCity.adm2}`;
    const locationStr = `<p id="cur-location" class="match" 
        data-province="${defaultCity.adm1}" 
        data-city="${defaultCity.adm2}" 
        data-id="${defaultCity.id}"
        style="display: block;">
        ${defaultCity.adm2}
    </p>`;
    document.querySelector('#cur-location').innerHTML = locationStr;

    // 3. 重新调用天气接口，传入默认城市ID，实时更新天气数据
    getCurrentWeather(defaultCityId);
    getHourWeather(defaultCityId);
    getSevenDaysWeather(defaultCityId);
    getLifeIndex(defaultCityId)

    refreshCityList()
}
function initWeather() {
    // 先检查本地存储中是否有默认城市ID
    const defaultCityId = localStorage.getItem('defaultCityId');

    if (defaultCityId) {
        // 有默认城市：直接使用默认城市ID获取天气
        getCurrentWeather(defaultCityId);
        getHourWeather(defaultCityId);
        getSevenDaysWeather(defaultCityId);
        getLifeIndex(defaultCityId);

        // 补充：获取默认城市的名称并更新页面显示
        const savedCities = JSON.parse(localStorage.getItem('savedCity') || '[]');
        const defaultCity = savedCities.find(city => city.id === defaultCityId);
        if (defaultCity) {
            document.querySelector('#txt-cur-location').innerHTML = `${defaultCity.adm1} ${defaultCity.adm2}`
            const locationStr = `<p id="cur-location" class="match" 
                data-province="${defaultCity.adm1}" 
                data-city="${defaultCity.adm2}" 
                data-id="${defaultCity.id}"
                style="display: block;">
                ${defaultCity.adm2}
            </p>`;
            document.querySelector('#cur-location').innerHTML = locationStr;
        }
    } else {
        // 无默认城市：使用原定位逻辑
        fetch('http://ip-api.com/json')
            .then(response => response.json())
            .then(data => {
                const lat = data.lat.toFixed(2);
                const lon = data.lon.toFixed(2);

                axios({
                    url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
                    method: 'GET',
                    params: {
                        key: 'f921a06325ca426b87162dcab439a0f3',
                        location: `${lon},${lat}`
                    }
                }).then(result => {
                    const cObj = result.data.location[0];
                    document.querySelector('#txt-cur-location').innerHTML = `${cObj.adm1} ${cObj.adm2}`;
                    const locationStr = `<p id="cur-location" class="match" data-province="${cObj.adm1}" data-city="${cObj.adm2}" data-id="${cObj.id}" style="display: block;">${cObj.adm2}</p>`;
                    document.querySelector('#cur-location').innerHTML = locationStr;

                    // 使用定位城市ID获取天气
                    getCurrentWeather(cObj.id);
                    getHourWeather(cObj.id);
                    getSevenDaysWeather(cObj.id);
                    getLifeIndex(cObj.id);
                });
            });
    }
}
function bindDeleteEvents() {
    // 保证每个删除按钮只有一个点击事件
    const btn_delete = document.querySelectorAll('.btn-delete')
    btn_delete.forEach(btn => {
        btn.removeEventListener('click', handleDelete)
        btn.addEventListener('click', handleDelete)
    })

}
function bindSetDefaultEvents() {
    const defaultBtns = document.querySelectorAll('.btn-set-default');
    defaultBtns.forEach(btn => {
        btn.removeEventListener('click', handleSetDefault);
        btn.addEventListener('click', handleSetDefault);
    })
}
function handleDelete() {
    const cityLi = this.closest('.city')
    if (!cityLi) return
    const cityId = cityLi.dataset.id;
    const savedCities = JSON.parse(localStorage.getItem('savedCity') || '[]')
    // console.log('当前城市id', cityId)
    const updatedCities = savedCities.filter(city => city.id !== cityId)
    localStorage.setItem('savedCity', JSON.stringify(updatedCities))

    cityLi.remove()
    const tipsElement = document.querySelector('#tips-attention');
    if (updatedCities.length === 0) {
        tipsElement.style.display = 'block';
    }
    checkCurrentCityStatus()
}
function observeCityTextChange() {
    const target = document.querySelector('#txt-cur-location')
    if (!target) return
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            checkCurrentCityStatus()
        })
    })
    observer.observe(target, {
        childList: true,
        subtree: true,
        characterData: true
    })
}
function checkCurrentCityStatus() {
    const locationEl = document.querySelector('#txt-cur-location')
    const attentionBtn = document.querySelector('#btn-attention')

    const currentCityText = locationEl.innerText.trim()
    const cityName = currentCityText.split(' ')[1]
    if (!cityName) {
        console.warn('无法提取城市名:', currentCityText);
        return;
    }
    const savedCities = JSON.parse(localStorage.getItem('savedCity') || '[]')
    const isFollowed = savedCities.some(savedCity => {
        return savedCity.adm2 === cityName;
    })
    attentionBtn.innerHTML = isFollowed ? '[已关注]' : '[添加关注]'
}
function loadSaveCity() {
    const savedCity = JSON.parse(localStorage.getItem('savedCity') || '[]')
    const tipsElement = document.querySelector('#tips-attention')

    tipsElement.style.display = 'block'
    if (savedCity.length > 0) {
        tipsElement.style.display = 'none'
        savedCity.forEach(city => {
            renderCity(city)
        })
    } else {
        tipsElement.style.display = 'block'
    }
}