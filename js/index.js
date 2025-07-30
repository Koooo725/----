axios.defaults.baseURL = 'https://nk2k5mxenn.re.qweatherapi.com'; // 基础URL
axios.defaults.headers.common['X-QW-Api-Key'] = '3a608e671e3b4a2e8af5ad917015b49d'; // 设置公共请求头


// 1. 获取当前天气
function getCurrentWeather() {
    axios({
        url: '/geo/v2/city/lookup',
        method: 'GET',
        params: {
            location: 'beij'
        }
    }).then(result => {
        console.log(result.data);
    }).catch(error => {
        console.error('Error fetching current weather:', error);
    })
}
getCurrentWeather(); // 北京市的城市ID   


// // 配置请求参数
// const config = {
//     method: 'get', // 请求方法（GET/POST等）
//     url: 'https://https://nk2k5mxenn.re.qweatherapi.com/geo/v2/city/lookup', // API 地址
//     params: { location: 'beij' }, // 查询参数（自动拼接到URL）
//     headers: {
//         'Authorization': 'Bearer eyJhbGciOiJFZERTQSIsImtpZCI6IlRLUE05RVRDQTIifQ.eyJzdWIiOiI0RzJENEVQOVZKIiwiaWF0IjoxNzUzNzkxNzMwLCJleHAiOjE3NTM3OTI2MzB9.v6x0WX_Z08dgMZf-Iipz56IBTnvXccY_82MgevwbWkIprQ7UUEwaV9ILAOAsPgM-u89PsBE-KDi0WC3U0iMyBw', // 替换为你的Token
//         'Accept-Encoding': 'gzip, deflate, br' // --compressed 等效
//     }
// };

// // 发送请求
// axios(config)
//     .then(response => {
//         console.log('API Response:', response.data);
//     })
//     .catch(error => {
//         console.error('Request Failed:', error.response?.data || error.message);
//     });