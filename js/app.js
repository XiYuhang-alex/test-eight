// 全局变量
let currentData = null;
let chartInstance = null;

// 页面加载完毕后执行
document.addEventListener('DOMContentLoaded', () => {
    fetch('../data/data.json')
        .then(response => response.json())
        .then(data => {
            currentData = data;
            renderSummary(data.summary);
            renderLogs(data.logs);
            renderChart(data.energyData.daily); // 默认显示“本周”固定数据
        })
        .catch(error => console.error('加载数据失败:', error));

    document.querySelector('#time-filter').addEventListener('change', filterLogs);
    document.querySelector('#status-filter').addEventListener('change', filterLogs);
});

// 渲染首页四个统计卡片
function renderSummary(summary) {
    const container = document.querySelector('#summary-cards');
    if (!container) return;
    container.innerHTML = `
        <div class="col-md-3"><div class="card p-3 text-center">本周平均睡眠<br><span class="fs-4 fw-bold">${summary.avgSleep}</span> 小时</div></div>
        <div class="col-md-3"><div class="card p-3 text-center">早八出勤率<br><span class="fs-4 fw-bold">${summary.earlyClassRate}</span> %</div></div>
        <div class="col-md-3"><div class="card p-3 text-center">连续早睡天数<br><span class="fs-4 fw-bold">${summary.continuousEarlySleep}</span> 天</div></div>
        <div class="col-md-3"><div class="card p-3 text-center">本周总学习时长<br><span class="fs-4 fw-bold">${summary.totalStudyHours}</span> 小时</div></div>
    `;
}

// 渲染日志列表
function renderLogs(logs) {
    const list = document.querySelector('#log-list');
    if (!list) return;
    list.innerHTML = '';
    if (logs.length === 0) {
        list.innerHTML = '<li class="list-group-item">没有符合条件的记录</li>';
        return;
    }
    logs.forEach(log => {
        const badgeClass = log.status === 'good' ? 'bg-success' : log.status === 'tired' ? 'bg-warning text-dark' : 'bg-danger';
        list.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div><span class="fw-bold">${log.date}</span> · 睡眠 ${log.sleepHours} 小时 · ${log.note}</div>
                <span class="badge ${badgeClass}">${log.status}</span>
            </li>
        `;
    });
}

// 筛选逻辑（列表+图表联动）
function filterLogs() {
    if (!currentData) return;
    
    const timeFilter = document.querySelector('#time-filter').value;
    const statusFilter = document.querySelector('#status-filter').value;
    
    let filteredLogs = currentData.logs;

    // 1. 按时间段筛选列表
    if (timeFilter === 'week') {
        filteredLogs = filteredLogs.filter(log => log.date >= "2026-09-13" && log.date <= "2026-09-19");
    } else if (timeFilter === 'month') {
        filteredLogs = filteredLogs.filter(log => log.date.includes('2026-09'));
    }
    
    // 2. 按状态筛选
    if (statusFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === statusFilter);
    }
    
    renderLogs(filteredLogs);
    
    // 3. 图表联动
    if (timeFilter === 'week') {
        renderChart(currentData.energyData.daily); // 显示本周7天数据
    } else {
        renderChart(currentData.energyData.weekly); // 显示本月4周数据
    }
}

// 渲染 ECharts 图表
function renderChart(chartData) {
    const chartDom = document.querySelector('#usage-chart');
    if (!chartDom) return;
    
    if (chartInstance) {
        chartInstance.dispose();
    }
    chartInstance = echarts.init(chartDom);
    
    const option = {
        title: { text: '精力值趋势分析', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: chartData.categories },
        yAxis: { type: 'value', name: '精力值（1-10）' },
        series: [{
            name: '精力值',
            type: 'line',
            data: chartData.values,
            smooth: true,
            itemStyle: { color: '#4e73df' }
        }]
    };
    chartInstance.setOption(option);
}