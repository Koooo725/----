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

