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
    '霾': 'mai',
    '阴': 'yin',
    '雾': 'wu',
    '大到暴雨': 'crazyrain',
    '阵雨': 'zhenyu'
}

// 获取当前天气数据
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
        console.log(result.data)
        document.querySelector('#txt-cur-location').innerHTML = `${result.data.location[0].adm1} ${result.data.location[0].adm2}`
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


    })

    // 获取交通数据

}

// 获取小时天气数据
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

let tempMax = [], tempMin = []
// 获取未来7天天气预报
function getSevenDaysWeather(locationID) {
    // 先获取昨天天气数据
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
    }).then(yesterdayResult => {
        // console.log('昨天天气数据:', yesterdayResult.data)

        // 处理昨天数据
        const weatherObj = yesterdayResult.data;
        const chineseWeather = weatherObj.weatherHourly[6].text.trim();
        const englishKey = weatherMap[chineseWeather] || 'default';
        const chineseWeatherNight = weatherObj.weatherHourly[23].text.trim();
        const englishKeyNight = weatherMap[chineseWeatherNight] || 'default';

        tempMax[0] = weatherObj.weatherDaily.tempMax;
        tempMin[0] = weatherObj.weatherDaily.tempMin;

        const yesterdayStr = `
            <li class="item first" style="width: 92px">
                <p class="day">昨天</p>
                <p class="date">${weatherObj.weatherDaily.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2月$3日")}</p>
                <div class="ct-daytime">
                    <p class="weather">${weatherObj.weatherHourly[6].text}</p>
                    <img class="icon" src="../image/${englishKey}.png" alt="${weatherObj.weatherHourly[6].text}" title="${weatherObj.weatherHourly[6].text}">
                </div>
                <div class="ct-night">
                    <img class="icon" src="../image/${englishKeyNight}-night.png" alt="${weatherObj.weatherHourly[23].text}" title="${weatherObj.weatherHourly[23].text}">
                    <p class="weather">${weatherObj.weatherHourly[23].text}</p>
                </div>
                <p class="wind">${weatherObj.weatherHourly[13].windDir} ${weatherObj.weatherHourly[13].windScale}级</p>
            </li>
        `;

        // 获取未来7天天气预报
        return axios({
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
        }).then(forecastResult => {
            // console.log('未来7天天气数据:', forecastResult.data.daily);

            // 处理未来7天数据
            let i = 1
            const arrSevenDaysStr = forecastResult.data.daily.map((item, index) => {
                const dayText = index === 0 ? '今天' : index === 1 ? '明天' : index === 2 ? '后天' : `周${['日', '一', '二', '三', '四', '五', '六'][new Date(item.fxDate).getDay()]}`;

                const chineseDay = item.textDay.trim();
                const englishDayKey = weatherMap[chineseDay] || 'default';
                const chineseNight = item.textNight.trim();
                const englishNightKey = weatherMap[chineseNight] || 'default';

                tempMax[i] = item.tempMax
                tempMin[i++] = item.tempMin

                return `
                    <li class="item" style="width: 92px">
                        <p class="day">${dayText}</p>
                        <p class="date">${item.fxDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2月$3日")}</p>
                        <div class="ct-daytime">
                            <p class="weather">${item.textDay}</p>
                            <img class="icon" src="../image/${englishDayKey}.png" alt="${item.textDay}" title="${item.textDay}">
                        </div>
                        <div class="ct-night">
                            <img class="icon" src="../image/${englishNightKey}-night.png" alt="${item.textNight}" title="${item.textNight}">
                            <p class="weather">${item.textNight}</p>
                        </div>
                        <p class="wind">${item.windDirDay} ${item.windScaleDay}级</p>
                    </li>
                `;
            }).join('');
            // console.log(tempMax, tempMin)
            // 合并并更新DOM
            document.querySelector('#ls-weather-day').innerHTML = yesterdayStr + arrSevenDaysStr;
            const Max = tempMax.map(Number);
            const Min = tempMin.map(Number);
            // console.log(Max, Min);
            // 绘制图表
            drawTemperatureChart('myCanvas', Max, Min, {
                xOffset: -4,
                margin: 15,
                tension: 0.5,
                yAxisStep: 3,
                showPointValues: true,
                pointValueOffset: -15,
                columnCount: 8
            });
        });
    }).catch(error => {
        console.error('获取天气数据失败:', error);
        document.querySelector('#ls-weather-day').innerHTML = `<li class="error">天气数据加载失败，请刷新重试</li>`;
    });
}

// 绘制温度图表
function drawTemperatureChart(canvasId, highTemps, lowTemps, options = {}) { // 获取Canvas元素 const canvas = document.getElementById(canvasId); if (!canvas) { console.error('未找到指定ID的canvas元素'); return; }
    const canvas = document.getElementById(canvasId)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        console.error(' 无法获取 2D 绘图上下文 ')
        return
    }

    // 设置默认配置
    const config = {
        highColor: '#f5b811ff',
        lowColor: '#94beefff',
        pointRadius: 4,
        lineWidth: 3,
        axisColor: 'white',
        labelColor: 'white',
        gridColor: 'white',
        numberColor: '#344655',
        columnCount: 8,
        xOffset: 10,
        margin: 10,
        // Y 轴刻度控制变量
        yAxisTicks: 5,
        yAxisStep: null,
        yAxisValues: null,
        tension: 0.4,
        // 新增配置
        showPointValues: true, // 是否显示数据点数值
        pointValueOffset: -15, // 数值相对于点的垂直偏移
        ...options
    };

    // 获取 Canvas 尺寸
    const width = canvas.width
    const height = canvas.height

    // 清除画布
    ctx.clearRect(0, 0, width, height)

    // 数据点数量
    const dataPoints = Math.max(highTemps.length, lowTemps.length)
    if (dataPoints === 0) {
        console.warn(' 没有数据可绘制 ')
        return
    }

    // 计算有效绘图区
    const validWidth = width - config.margin * 2
    const validHeight = height - config.margin * 2

    // 计算每列的宽度
    const columnWidth = validWidth / (config.columnCount)

    // 计算温度范围
    const allTemps = [...highTemps, ...lowTemps].filter(t => typeof t === 'number')
    // 1. 先获取原始温度范围
    const rawMin = Math.min(...allTemps)
    const rawMax = Math.max(...allTemps)

    // 2. 计算要添加的范围padding（例如20%）
    const rangePadding = (rawMax - rawMin) * 0.2

    // 3. 应用padding得到最终的轴范围
    const minTemp = rawMin - rangePadding
    const maxTemp = rawMax + rangePadding
    const tempRange = maxTemp - minTemp || 1

    // 计算 Y 轴刻度值
    function getYAxisValues() {
        // 优先使用自定义刻度值
        if (Array.isArray(config.yAxisValues) && config.yAxisValues.length > 0) {
            return config.yAxisValues.sort((a, b) => a - b)
        }

        // 使用固定间隔
        if (typeof config.yAxisStep === 'number' && config.yAxisStep > 0) {
            const values = [];
            // 从低于最低温度的最近刻度开始
            let start = Math.floor(minTemp / config.yAxisStep) * config.yAxisStep
            // 到高于最高温度的最近刻度结束
            let end = Math.ceil(maxTemp / config.yAxisStep) * config.yAxisStep

            for (let val = start; val <= end; val += config.yAxisStep) {
                values.push(val)
            }
            return values
        }

        // 默认自动计算
        const values = [];
        const step = tempRange / config.yAxisTicks;
        for (let i = 0; i <= config.yAxisTicks; i++) {
            values.push(minTemp + i * step)
        }
        return values
    }

    const yAxisValues = getYAxisValues()

    // 边界检查函数
    function clampX(x) {
        return Math.max(config.margin, Math.min(x, width - config.margin))
    }

    function clampY(y) {
        return Math.max(config.margin, Math.min(y, height - config.margin))
    }

    // 温度值转 Y 坐标
    function tempToY(temp) {
        const ratio = (temp - minTemp) / tempRange
        return config.margin + validHeight - (ratio * validHeight)
    }

    // 绘制网格线
    function drawGrid() {
        // 水平网格线
        ctx.strokeStyle = config.gridColor
        ctx.lineWidth = 1

        yAxisValues.forEach(temp => {
            const y = clampY(tempToY(temp))
            ctx.beginPath()
            ctx.moveTo(config.margin, y)
            ctx.lineTo(width - config.margin, y)
            ctx.stroke()
        });

        // 垂直网格线
        for (let i = 0; i < config.columnCount; i++) {
            const x = clampX(config.margin + (i + 0.5) * columnWidth + config.xOffset)
            ctx.beginPath()
            ctx.moveTo(x, config.margin)
            ctx.lineTo(x, height - config.margin)
            ctx.stroke()
        }
    }

    // 绘制坐标轴
    function drawAxes() {
        // X 轴
        ctx.beginPath()
        ctx.strokeStyle = config.axisColor
        ctx.lineWidth = 1
        ctx.moveTo(config.margin, height - config.margin)
        ctx.lineTo(width - config.margin, height - config.margin)
        ctx.stroke()

        // Y 轴
        ctx.beginPath()
        ctx.moveTo(config.margin, config.margin)
        ctx.lineTo(config.margin, height - config.margin)
        ctx.stroke()
    }

    // 绘制刻度和标签
    function drawLabels() {
        // X 轴刻度和标签
        ctx.fillStyle = config.labelColor
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'

        for (let i = 0; i < config.columnCount; i++) {
            const x = clampX(config.margin + (i + 0.5) * columnWidth + config.xOffset)
            // 刻度线
            ctx.beginPath()
            ctx.strokeStyle = config.axisColor
            ctx.moveTo(x, height - config.margin)
            ctx.lineTo(x, height - config.margin + 5)
            ctx.stroke()

            // 标签
            ctx.fillText(i + 1, x, height - config.margin + 15)
        }

        // Y 轴刻度和标签
        ctx.textAlign = 'right'

        yAxisValues.forEach(temp => {
            const y = clampY(tempToY(temp))
            // 刻度线
            ctx.beginPath()
            ctx.strokeStyle = config.axisColor
            ctx.moveTo(config.margin, y)
            ctx.lineTo(config.margin - 5, y)
            ctx.stroke()

            // 温度标签
            ctx.fillStyle = config.labelColor
            ctx.fillText(temp.toFixed(0) + '°', config.margin - 10, y + 4)
        })
    }

    // 绘制光滑曲线
    function drawSmoothLine(data, color) {
        const points = []
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i] !== 'number') continue

            const x = clampX(config.margin + (i + 0.5) * columnWidth + config.xOffset)
            const y = clampY(tempToY(data[i]))
            points.push({ x, y, value: data[i] })
        }

        if (points.length < 2) return

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = config.lineWidth

        // 绘制光滑曲线
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1]
            const p1 = points[i]
            const p2 = points[i + 1]
            const p3 = points[i + 2] || p2

            const cp1x = p1.x + (p2.x - p0.x) / 6 * config.tension
            const cp1y = p1.y + (p2.y - p0.y) / 6 * config.tension
            const cp2x = p2.x - (p3.x - p1.x) / 6 * config.tension
            const cp2y = p2.y - (p3.y - p1.y) / 6 * config.tension

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }

        ctx.stroke()

        // 绘制数据点和数值
        // points.forEach(point => {
        //     // 绘制数据点
        //     ctx.fillStyle = color;
        //     ctx.beginPath();
        //     ctx.arc(point.x, point.y, config.pointRadius, 0, Math.PI * 2);
        //     ctx.fill();

        //     // 绘制数据点数值
        //     if (config.showPointValues) {
        //         ctx.fillStyle = config.numberColor;
        //         ctx.font = '22px PingFang SC, Microsoft YaHei, Arial';
        //         ctx.textAlign = 'center';
        //         ctx.fillText(
        //             point.value + '°',
        //             point.x,
        //             point.y + config.pointValueOffset
        //         )
        //     }
        // })
        points.forEach((point, i) => {
            // 绘制数据点
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, config.pointRadius, 0, Math.PI * 2);
            ctx.fill();

            // 绘制数据点数值
            if (config.showPointValues) {
                // 如果是第一个点，使用特殊颜色，否则使用默认颜色
                const textColor = (i === 0) ? '#c3c0c0ff' : config.numberColor; // 第一个点红色，其他默认
                ctx.fillStyle = textColor;
                ctx.font = '22px PingFang SC, Microsoft YaHei, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    point.value + '°',
                    point.x,
                    point.y + config.pointValueOffset
                );
            }
        });
    }

    // 执行绘制流程
    drawGrid();
    drawAxes();
    drawLabels();
    drawSmoothLine(lowTemps, config.lowColor);
    drawSmoothLine(highTemps, config.highColor);
}

// 获取生活指数
function getLifeIndex(locationID) {
    axios({
        url: 'https://nk2k5mxenn.re.qweatherapi.com/v7/indices/1d',
        method: 'GET',
        params: {
            key: 'f921a06325ca426b87162dcab439a0f3',
            location: locationID,
            type: '0'
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(result => {
        // console.log(result.data.daily)
        const arrLifeIndex = result.data.daily;
        document.querySelector('.item .ct-sub .chuanyi').innerHTML = `穿衣&nbsp;${arrLifeIndex[2].category}`
        document.querySelector('.item .ct-detail .chuanyi').innerHTML = `${arrLifeIndex[2].text}`
        document.querySelector('.item .ct-sub .yusan').innerHTML = `太阳镜&nbsp;${arrLifeIndex[11].category}`
        document.querySelector('.item .ct-detail .yusan').innerHTML = `${arrLifeIndex[11].text})`
        document.querySelector('.item .ct-sub .ganmao').innerHTML = `感冒&nbsp;${arrLifeIndex[8].category}`
        document.querySelector('.item .ct-detail .ganmao').innerHTML = `${arrLifeIndex[8].text}`
        document.querySelector('.item .ct-sub .xiche').innerHTML = `洗车&nbsp;${arrLifeIndex[1].category}`
        document.querySelector('.item .ct-detail .xiche').innerHTML = `${arrLifeIndex[1].text}`
        document.querySelector('.item .ct-sub .yundong').innerHTML = `运动&nbsp;${arrLifeIndex[0].category}`
        document.querySelector('.item .ct-detail .yundong').innerHTML = `${arrLifeIndex[0].text}`
        document.querySelector('.item .ct-sub .fangshai').innerHTML = `防晒&nbsp;${arrLifeIndex[15].category}`
        document.querySelector('.item .ct-detail .fangshai').innerHTML = `${arrLifeIndex[15].text}`
        document.querySelector('.item .ct-sub .diaoyu').innerHTML = `钓鱼&nbsp;${arrLifeIndex[3].category}`
        document.querySelector('.item .ct-detail .diaoyu').innerHTML = `${arrLifeIndex[3].text}`
        document.querySelector('.item .ct-sub .lvyou').innerHTML = `旅游&nbsp;${arrLifeIndex[5].category}`
        document.querySelector('.item .ct-detail .lvyou').innerHTML = `${arrLifeIndex[5].text}`
        document.querySelector('.item .ct-sub .jiaotong').innerHTML = `交通&nbsp;${arrLifeIndex[14].category}`
        document.querySelector('.item .ct-detail .jiaotong').innerHTML = `${arrLifeIndex[14].text}`
        document.querySelector('.item .ct-sub .wuran').innerHTML = `空气污染扩散条件&nbsp;${arrLifeIndex[9].category}`
        document.querySelector('.item .ct-detail .wuran').innerHTML = `${arrLifeIndex[9].text}`
        document.querySelector('.item .ct-sub .shushidu').innerHTML = `舒适度&nbsp;${arrLifeIndex[7].category}`
        document.querySelector('.item .ct-detail .shushidu').innerHTML = `${arrLifeIndex[7].text}`
        document.querySelector('.item .ct-sub .liangshai').innerHTML = `晾晒&nbsp;${arrLifeIndex[13].category}`
        document.querySelector('.item .ct-detail .liangshai').innerHTML = `${arrLifeIndex[13].text}`

    })
}


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
                location: `${lon},${lat} `
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(result => {
            // console.log(result.data.location)
            const cObj = result.data.location
            document.querySelector('#txt-cur-location').innerHTML = `${cObj[0].adm1} ${cObj[0].adm2}`
            const locationStr = `<p id="cur-location" class="match" data-province="${cObj[0].adm1}" data-city="${cObj[0].adm2}" data-id="${cObj[0].id}"
                            style="display: block;">
                            ${cObj[0].adm2}</p>`
            document.querySelector('#cur-location').innerHTML = locationStr
            getCurrentWeather(cObj[0].id)
            getHourWeather(cObj[0].id)
            getSevenDaysWeather(cObj[0].id)
            getLifeIndex(cObj[0].id)
        })
    })


