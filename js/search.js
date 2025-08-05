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


    document.querySelectorAll('.history-item').forEach(item => {
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
