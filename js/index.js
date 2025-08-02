// axios.defaults.baseURL = 'https://nk2k5mxenn.re.qweatherapi.com';
// const token = 'eyJhbGciOiJFZERTQSIsImtpZCI6IkM4R1lQN1VQM0cifQ.eyJzdWIiOiI0SEtSMktWOUdKIiwiaWF0IjoxNzU0MDMwMTMyLCJleHAiOjE3NTQxMTAxMzJ9.UVSP_It8m2GcFXXJH2SUF8kQtLKz8_TodONiSfttx9oeBUOSJ6RhdaH1I-IBTOur3rWlVuyLWNXnBnPysXD9CQ'
// axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
const weatherMap = {
    '晴': 'qing',
    '多云': 'duoyun',
    '暴雨': 'crazyrain',
    '大雨': 'hugerain',
    '雷阵雨': 'leizhenrain',
    '中雨': 'middlerain',
    '小雨': 'smallrain',
    '日出': 'sunrise',
    '日落': 'sunset',
    '霾': 'wumai',
    '阴': 'yin',
    '': '',
    '': '',
    '': ''
}
/**
 * 目标1：定位用户城市
 *  1.1 封装渲染函数
 *  1.2 获取用户定位，初始化页面
 */

function getCurrentWeather(locationID) {
    // 获取现在的天气数据
    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/weather/now',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: locationID
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(result => {
        // console.log(result.data);
        const wObj = result.data.now
        document.querySelector('#txt-pub-time').innerHTML = `中央气象台${wObj.obsTime.split('T')[1].split('+')[0]}发布`
        const hour = parseInt(wObj.obsTime.split('T')[1].split('+')[0].split(':')[0]);
        const weatherIcon = document.querySelector('#ct-current-weather .icon');
        if (hour >= 5 && hour <= 19) {
            weatherIcon.src = "../image/day.png";
        } else {
            weatherIcon.src = "../image/night.png";
        }
        document.querySelector('#txt-temperature').innerHTML = `${wObj.temp}°`
        document.querySelector('#txt-name').innerHTML = `${wObj.text}`
        document.querySelector('#txt-wind').innerHTML = `${wObj.windDir} ${wObj.windScale}级`
        document.querySelector('#txt-humidity').innerHTML = `湿度 ${wObj.humidity}%`
        document.querySelector('#txt-kPa').innerHTML = `气压 ${wObj.pressure}hPa`


    }).catch(error => {
        console.error('Error fetching current weather:', error);
    })

    // 获取经度和纬度，空气质量
    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: locationID
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(result => {
        // console.log(result.data)
        const lat = Number(result.data.location[0].lat).toFixed(2);
        const lon = Number(result.data.location[0].lon).toFixed(2);
        return axios({
            url: `https://nk2k5mxenn.re.qweatherapi.com/airquality/v1/current/${lat}/${lon}`,
            params: {
                key: 'f921a06325ca426b87162dcab439a0f3'
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
    }).then(result => {
        // console.log(result.data.indexes[0])
        const arrapi = result.data.indexes[0]
        document.querySelector('.info-aqi').innerHTML = `${arrapi.aqi} ${arrapi.category}`
        document.querySelector('.info-aqi').style.backgroundColor = `rgb(${arrapi.color.red},${arrapi.color.green},${arrapi.color.blue})`
        document.querySelector('.air-level1 .header').style.backgroundColor = `rgb(${arrapi.color.red},${arrapi.color.green},${arrapi.color.blue})`
        document.querySelector('.air-level1 .header').innerHTML = `空气质量指数 ${arrapi.aqi} ${arrapi.category}`
        const pm25Title = [...document.querySelectorAll('.titl')].find(
            el => el.textContent.trim() === "PM2.5"
        );
        const pm25Value = pm25Title.previousElementSibling;
        pm25Value.textContent = ``; // 修改值

    })

    // 获取交通数据

}


// 获取每小时天气数据
async function getHourWeather(locationID) {
    try {
        const [hourlyRes, sunRes] = await Promise.all([
            axios({
                url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/weather/24h',
                params: {
                    key: 'f921a06325ca426b87162dcab439a0f3',
                    location: locationID
                }
            }),
            axios({
                url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/astronomy/sun',
                params: {
                    key: 'f921a06325ca426b87162dcab439a0f3',
                    location: locationID,
                    date: new Date().toISOString().slice(0, 10).replace(/-/g, '')
                }
            })
        ])

        let hourlyData = hourlyRes.data.hourly;
        const sunData = sunRes.data;


        const sunriseTime = sunData.sunrise.split('T')[1].substring(0, 5);
        const sunsetTime = sunData.sunset.split('T')[1].substring(0, 5);

        // console.log("日出时间:", sunriseTime);
        // console.log("日落时间:", sunsetTime);
        // console.log("原始小时数据:", hourlyData.map(item => item.fxTime.split('T')[1].substring(0, 5)));

        // 1. 检查日出/日落时间是否已存在（严格匹配）
        const hasExactSunrise = hourlyData.some(item =>
            item.fxTime.split('T')[1].substring(0, 5) === sunriseTime
        );
        const hasExactSunset = hourlyData.some(item =>
            item.fxTime.split('T')[1].substring(0, 5) === sunsetTime
        );

        // 2. 如果不存在，则插入日出/日落数据
        if (!hasExactSunrise) {
            // 找到日出应该插入的位置（在前后两个时间点之间）
            let insertIndex = -1;
            for (let i = 0; i < hourlyData.length - 1; i++) {
                const currentTime = hourlyData[i].fxTime.split('T')[1].substring(0, 5);
                const nextTime = hourlyData[i + 1].fxTime.split('T')[1].substring(0, 5);

                if (currentTime <= sunriseTime && sunriseTime <= nextTime) {
                    insertIndex = i + 1;
                    break;
                }
            }

            const sunriseItem = {
                fxTime: `2025-08-02T${sunriseTime}:00`,
                text: '日出',
                temp: '日出',
                icon: 'sunrise'
            };

            if (insertIndex === -1) {
                // 如果没找到合适位置（比如日出时间比所有时间都早或都晚）
                if (hourlyData.length > 0 && sunriseTime < hourlyData[0].fxTime.split('T')[1].substring(0, 5)) {
                    hourlyData.unshift(sunriseItem); // 插入到开头
                } else {
                    hourlyData.push(sunriseItem); // 插入到末尾
                }
            } else {
                hourlyData.splice(insertIndex, 0, sunriseItem); // 插入到中间合适位置
            }
        }

        if (!hasExactSunset) {
            // 同样的逻辑处理日落时间
            let insertIndex = -1;
            for (let i = 0; i < hourlyData.length - 1; i++) {
                const currentTime = hourlyData[i].fxTime.split('T')[1].substring(0, 5);
                const nextTime = hourlyData[i + 1].fxTime.split('T')[1].substring(0, 5);

                if (currentTime <= sunsetTime && sunsetTime <= nextTime) {
                    insertIndex = i + 1;
                    break;
                }
            }

            const sunsetItem = {
                fxTime: `2025-08-02T${sunsetTime}:00`,
                text: '日落',
                temp: '日落',
                icon: 'sunset'
            };

            if (insertIndex === -1) {
                if (hourlyData.length > 0 && sunsetTime < hourlyData[0].fxTime.split('T')[1].substring(0, 5)) {
                    hourlyData.unshift(sunsetItem);
                } else {
                    hourlyData.push(sunsetItem);
                }
            } else {
                hourlyData.splice(insertIndex, 0, sunsetItem);
            }
        }

        // console.log("处理后数据:", hourlyData.map(item => ({
        //     time: item.fxTime.split('T')[1].substring(0, 5),
        //     text: item.text,
        //     temp: item.temp
        // })));
        // 4. 渲染数据
        const hourWeatherStr = hourlyData.map(item => {
            const hourTime = item.fxTime.split('T')[1].substring(0, 5);
            const chineseWeather = item.text;

            const englishKey = weatherMap[chineseWeather] || 'default';
            const isSunrise = hourTime === sunriseTime;
            const isSunset = hourTime === sunsetTime;

            // 使用天气图标，但如果是日出日落则显示文字
            const tempText = isSunrise ? '日出' : isSunset ? '日落' : item.temp + '°';

            return `
                <li class="item ${isSunrise ? 'sunrise' : ''} ${isSunset ? 'sunset' : ''}">
                    <p class="txt-time">${hourTime}</p>
                    <img src="../image/${englishKey}.png" 
                        alt="${chineseWeather}" 
                        title="${chineseWeather}" 
                        class="icon">
                    <p class="txt-degree">${tempText}</p>
                </li>
            `;
        }).join('');

        document.querySelector('#ls-weather-hour').innerHTML = hourWeatherStr;

        // 添加数据来源说明
        document.getElementById('txt-source').textContent = `数据来源于和风天气`

    } catch (error) {
        console.error('获取天气数据失败:', error);
        document.querySelector('#ls-weather-hour').innerHTML = `
            <li class="error">天气数据加载失败，请刷新重试</li>
        `;
    }
}
// // 辅助函数：在正确位置插入特殊时间点（日出/日落） 封装成一个函数，解决问题更高效
// function insertSpecialTime(data, time, type) {
//     const timeStr = time.split('T')[1].substring(0, 5); // 提取 "HH:MM"
//     const exists = data.some(item => item.fxTime.includes(timeStr));

//     if (exists) return; // 如果已有该时间点，不再插入

//     const newItem = {
//         fxTime: `2025-08-02T${timeStr}:00`,
//         text: type === 'sunrise' ? '日出' : '日落',
//         temp: type === 'sunrise' ? '日出' : '日落',
//         icon: type
//     };

//     // 找到插入位置（保持原有顺序）
//     let insertAt = data.findIndex(item => {
//         const itemTime = item.fxTime.split('T')[1].substring(0, 5);
//         return itemTime > timeStr;
//     });

//     if (insertAt === -1) {
//         data.push(newItem); // 插入末尾
//     } else {
//         data.splice(insertAt, 0, newItem); // 插入中间
//     }
// }

// 使用示例
// insertSpecialTime(hourlyData, sunData.sunrise, 'sunrise');
// insertSpecialTime(hourlyData, sunData.sunset, 'sunset');







// 7日天气预报
// console.log(new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10).replace(/-/g, ''))





// 
function getSevenDaysWeather(locationID) {
    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/historical/weather',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: locationID,
            date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10).replace(/-/g, '')
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(result => {
        console.log(result.data)
        const weatherObj = result.data
        document.querySelector('#ls-weather-day .first .date').innerHTML = `${weatherObj.weatherDaily.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2月$3日")}`
        document.querySelector('.ct-daytime .weather').innerHTML = `${weatherObj.weatherHourly[6].text}`
        const chineseWeather = `${weatherObj.weatherHourly[6].text}`
        const englishKey = weatherMap[chineseWeather] || 'default';
        document.querySelector('.ct-daytime .icon').src = `../image/${englishKey}.png`
        document.querySelector('.ct-daytime .icon').alt = `${weatherObj.weatherHourly[6].text}`
        document.querySelector('.ct-daytime .icon').title = `${weatherObj.weatherHourly[6].text}`

        document.querySelector('.ct-night .weather').innerHTML = `${weatherObj.weatherHourly[23].text}`
        const chineseWeather2 = `${weatherObj.weatherHourly[23].text}`
        const englishKey2 = weatherMap[chineseWeather2] || 'default';
        document.querySelector('.ct-night .icon').src = `../image/${englishKey2}-night.png`
        document.querySelector('.ct-night .icon').alt = `${weatherObj.weatherHourly[23].text}`
        document.querySelector('.ct-night .icon').title = `${weatherObj.weatherHourly[23].text}`

        document.querySelector('#ls-weather-day .first .wind').innerHTML = `${weatherObj.weatherHourly[13].windDir} ${weatherObj.weatherHourly[13].windScale}级`


    })


    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/weather/7d',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: locationID
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
}
getSevenDaysWeather(101010100)


fetch('http://ip-api.com/json')
    .then(response => response.json())
    .then(data => {
        // console.log(data.lat.toFixed(2))
        // console.log(data.lon.toFixed(2))

        const lat = data.lat.toFixed(2)
        const lon = data.lon.toFixed(2)

        axios({
            url: 'https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup',
            method: 'GET',
            params: {
                key: 'f921a06325ca426b87162dcab439a0f3',
                location: `${lon},${lat}`
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(result => {
            // console.log(result.data.location)
            const cObj = result.data.location
            document.querySelector('#txt-cur-location').innerHTML = `${cObj[0].adm1} ${cObj[0].adm2}`
            getCurrentWeather(cObj[0].id)
            getHourWeather(cObj[0].id)
        })
    })


