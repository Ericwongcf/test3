// 状态管理
const state = {
    step: 1,
    prizeCount: 10,
    isSpinning: false,
    currentRotation: 0,
    prizes: [] // { name: '', probability: 0 }
};

// 预定义颜色数组
const sectorColors = [
    '#fee2e2', '#dbeafe', '#d1fae5', '#fef3c7', '#ede9fe', 
    '#ffedd5', '#e0e7ff', '#fce7f3', '#dcfce7', '#fae8ff'
];

// DOM 元素
const elements = {
    step1: document.getElementById('step1-setup'),
    step2: document.getElementById('step2-config'),
    step3: document.getElementById('step3-game'),
    prizeCountSelect: document.getElementById('prizeCountSelect'),
    step1NextBtn: document.getElementById('step1NextBtn'),
    dynamicConfigItems: document.getElementById('dynamicConfigItems'),
    validationMessage: document.getElementById('validationMessage'),
    step2PrevBtn: document.getElementById('step2PrevBtn'),
    step2NextBtn: document.getElementById('step2NextBtn'),
    wheel: document.getElementById('wheel'),
    drawButton: document.getElementById('drawButton'),
    resultDisplay: document.getElementById('resultDisplay'),
    restartBtn: document.getElementById('restartBtn')
};

// --- Step 1: 设置数量 ---

elements.step1NextBtn.addEventListener('click', () => {
    const count = parseInt(elements.prizeCountSelect.value, 10);
    if (count >= 3 && count <= 10) {
        state.prizeCount = count;
        // 初始化奖品数据
        const defaultProb = Math.floor(100 / count);
        const remainder = 100 - (defaultProb * count);
        
        state.prizes = Array.from({ length: count }, (_, i) => ({
            name: `奖品 ${i + 1}`,
            probability: i === count - 1 ? defaultProb + remainder : defaultProb
        }));

        renderStep2();
        switchStep(2);
    }
});

// --- Step 2: 配置奖品 ---

function renderStep2() {
    elements.dynamicConfigItems.innerHTML = '';
    
    state.prizes.forEach((prize, index) => {
        const div = document.createElement('div');
        div.className = 'config-item';
        div.innerHTML = `
            <label>
                <span>奖品名称：</span>
                <input type="text" class="prize-name" data-index="${index}" value="${prize.name}" placeholder="奖品 ${index + 1}">
            </label>
            <label>
                <span>中奖概率：</span>
                <input type="number" class="prize-probability" data-index="${index}" value="${prize.probability}" min="0" max="100" step="1">
                <span class="unit">%</span>
            </label>
        `;
        elements.dynamicConfigItems.appendChild(div);
    });

    // 绑定输入事件
    const nameInputs = elements.dynamicConfigItems.querySelectorAll('.prize-name');
    const probInputs = elements.dynamicConfigItems.querySelectorAll('.prize-probability');

    nameInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.prizes[index].name = e.target.value;
        });
    });

    probInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.prizes[index].probability = parseInt(e.target.value) || 0;
            validateProbabilities();
        });
    });

    validateProbabilities();
}

function validateProbabilities() {
    const total = state.prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
    const isValid = total === 100;
    
    elements.validationMessage.className = 'validation-message ' + (isValid ? 'success' : 'error');
    elements.validationMessage.textContent = isValid 
        ? '概率配置正确 (100%)' 
        : `总概率需为100%，当前总和：${total}%`;
    
    elements.step2NextBtn.disabled = !isValid;
    return isValid;
}

elements.step2PrevBtn.addEventListener('click', () => {
    switchStep(1);
});

elements.step2NextBtn.addEventListener('click', () => {
    if (validateProbabilities()) {
        renderStep3();
        switchStep(3);
    }
});

// --- Step 3: 转盘抽奖 ---

function renderStep3() {
    elements.wheel.innerHTML = '';
    const count = state.prizeCount;
    const anglePerSector = 360 / count;
    
    // 计算 Clip Path
    // 使用足够大的三角形覆盖扇形区域
    // 顶点在中心 (50%, 50%)
    // 对于 > 2 的数量，我们计算顶部边缘的两个点
    const halfAngle = anglePerSector / 2;
    const tanVal = Math.tan(halfAngle * Math.PI / 180);
    const xOffset = 50 * tanVal; // 这里的50是指50%
    // 偏移量
    const x1 = 50 - xOffset;
    const x2 = 50 + xOffset;
    const clipPath = `polygon(50% 50%, ${x1}% 0%, ${x2}% 0%)`;

    state.prizes.forEach((prize, index) => {
        const sector = document.createElement('div');
        sector.className = 'wheel-sector';
        sector.style.backgroundColor = sectorColors[index % sectorColors.length];
        sector.style.transform = `rotate(${index * anglePerSector}deg)`;
        sector.style.clipPath = clipPath;
        
        // 调整文字
        const textSpan = document.createElement('span');
        textSpan.className = 'sector-text';
        textSpan.textContent = prize.name;
        // 动态调整文字大小以适应扇形
        if (count > 8) textSpan.style.fontSize = '12px';
        
        sector.appendChild(textSpan);
        elements.wheel.appendChild(sector);
    });

    // 重置状态
    state.isSpinning = false;
    state.currentRotation = 0;
    elements.wheel.style.transition = 'none';
    elements.wheel.style.transform = 'rotate(0deg)';
    elements.drawButton.disabled = false;
    elements.drawButton.textContent = '开始抽奖';
    elements.resultDisplay.textContent = '准备就绪，祝您好运！';
    elements.resultDisplay.className = 'result-display';
}

function calculateWinner() {
    const random = Math.floor(Math.random() * 100);
    let cumulative = 0;
    
    for (let i = 0; i < state.prizes.length; i++) {
        cumulative += state.prizes[i].probability;
        if (random < cumulative) {
            return i;
        }
    }
    return state.prizes.length - 1;
}

function spinWheel(winnerIndex) {
    state.isSpinning = true;
    elements.drawButton.disabled = true;
    elements.drawButton.textContent = '抽奖中...';
    elements.resultDisplay.textContent = '';
    elements.resultDisplay.classList.remove('winner');

    const count = state.prizeCount;
    const anglePerSector = 360 / count;
    
    // 目标扇形的中心角度
    // 扇形 i 的范围是 [i*angle, (i+1)*angle]
    // 中心是 i*angle + angle/2
    const sectorCenter = (winnerIndex * anglePerSector) + (anglePerSector / 2);
    
    // 我们要让这个中心转到 0 度（顶部）
    // 逆时针旋转 sectorCenter 度 => 顺时针旋转 (360 - sectorCenter)
    const targetAdjustment = (360 - sectorCenter) % 360;
    
    // 随机偏移：在扇形范围内，留 1 度边距
    // 范围 +/- (halfAngle - 1)
    const halfAngle = anglePerSector / 2;
    const safeZone = halfAngle - 2; // 留2度边距更安全
    const randomOffset = (Math.random() * safeZone * 2) - safeZone;

    // 基础旋转
    const baseRotation = 360 * 8; // 8圈
    
    // 计算当前角度的模
    const currentMod = state.currentRotation % 360;
    
    // 计算需要的增量
    let diff = targetAdjustment - currentMod;
    if (diff < 0) diff += 360;
    
    const finalAngle = state.currentRotation + baseRotation + diff + randomOffset;
    
    // 动画
    elements.wheel.style.transition = 'transform 6s cubic-bezier(0.25, 1, 0.5, 1)';
    elements.wheel.style.transform = `rotate(${finalAngle}deg)`;
    
    state.currentRotation = finalAngle;

    setTimeout(() => {
        state.isSpinning = false;
        elements.drawButton.disabled = false;
        elements.drawButton.textContent = '开始抽奖';
        
        const prizeName = state.prizes[winnerIndex].name;
        elements.resultDisplay.textContent = `恭喜您抽中：【${prizeName}】`;
        elements.resultDisplay.classList.add('winner');
    }, 6000);
}

elements.drawButton.addEventListener('click', () => {
    if (state.isSpinning) return;
    const winnerIndex = calculateWinner();
    spinWheel(winnerIndex);
});

elements.restartBtn.addEventListener('click', () => {
    if (confirm('确定要重新配置吗？当前的配置将会丢失。')) {
        switchStep(1);
    }
});

// --- 通用 ---

function switchStep(stepNumber) {
    state.step = stepNumber;
    
    elements.step1.classList.add('hidden');
    elements.step2.classList.add('hidden');
    elements.step3.classList.add('hidden');
    
    if (stepNumber === 1) elements.step1.classList.remove('hidden');
    if (stepNumber === 2) elements.step2.classList.remove('hidden');
    if (stepNumber === 3) elements.step3.classList.remove('hidden');
}

// 初始化
switchStep(1);
