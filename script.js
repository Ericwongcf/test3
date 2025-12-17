// 获取DOM元素
const prizeNameInputs = document.querySelectorAll('.prize-name');
const prizeProbabilityInputs = document.querySelectorAll('.prize-probability');
const validationMessage = document.getElementById('validationMessage');
const drawButton = document.getElementById('drawButton');
const resultDisplay = document.getElementById('resultDisplay');
const wheel = document.getElementById('wheel');
const wheelSectors = document.querySelectorAll('.wheel-sector');

// 状态管理
let isSpinning = false;
let currentRotation = 0;

// 初始化：更新转盘显示
function updateWheelDisplay() {
    prizeNameInputs.forEach((input, index) => {
        const text = input.value.trim() || `奖品 ${index + 1}`;
        wheelSectors[index].querySelector('.sector-text').textContent = text;
    });
}

// 实时校验概率
function validateProbabilities() {
    let total = 0;
    let hasError = false;
    let errorMessage = '';

    prizeProbabilityInputs.forEach((input, index) => {
        const value = input.value.trim();
        const numValue = parseInt(value, 10);

        // 清除之前的错误样式
        input.classList.remove('error');

        // 检查是否为空
        if (value === '') {
            input.classList.add('error');
            hasError = true;
            errorMessage = '请输入0-100的整数';
            return;
        }

        // 检查是否为有效数字
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            input.classList.add('error');
            hasError = true;
            errorMessage = '请输入0-100的整数';
            return;
        }

        // 检查是否为整数
        if (numValue !== parseFloat(value)) {
            input.classList.add('error');
            hasError = true;
            errorMessage = '请输入0-100的整数';
            return;
        }

        total += numValue;
    });

    // 显示校验结果
    validationMessage.className = 'validation-message';
    if (hasError) {
        validationMessage.classList.add('error');
        validationMessage.textContent = errorMessage;
        drawButton.disabled = true;
        drawButton.textContent = '请配置正确概率';
        return false;
    } else if (total === 100) {
        validationMessage.classList.add('success');
        validationMessage.textContent = '概率配置正确';
        drawButton.disabled = false;
        drawButton.textContent = '开始抽奖';
        return true;
    } else {
        validationMessage.classList.add('error');
        validationMessage.textContent = `10个奖品概率总和需为100%，当前总和：${total}%`;
        drawButton.disabled = true;
        drawButton.textContent = '请配置正确概率';
        return false;
    }
}

// 根据概率计算中奖奖品
function calculateWinner() {
    const probabilities = [];
    let cumulative = 0;

    prizeProbabilityInputs.forEach(input => {
        const prob = parseInt(input.value, 10);
        cumulative += prob;
        probabilities.push(cumulative);
    });

    // 生成0-99的随机数
    const random = Math.floor(Math.random() * 100);

    // 确定落在哪个区间
    for (let i = 0; i < probabilities.length; i++) {
        const prevProb = i === 0 ? 0 : probabilities[i - 1];
        if (random >= prevProb && random < probabilities[i]) {
            return i;
        }
    }

    // 默认返回最后一个（防止边界情况）
    return probabilities.length - 1;
}

// 计算转盘停止角度
function calculateStopAngle(prizeIndex) {
    // 每个扇形的中心角度（从顶部0度开始，顺时针）
    // 10个扇形，每个36度，中心分别为 0, 36, 72, ...
    const sectorCenters = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    const targetCenter = sectorCenters[prizeIndex];
    
    // 计算让扇形中心对准指针的角度
    // 指针位于转盘顶部（12点钟方向），即0度位置
    // 目标是将 targetCenter 转到 0 度
    // 需要逆时针旋转 targetCenter 度，或者顺时针旋转 (360 - targetCenter) 度
    const targetAdjustment = (360 - targetCenter) % 360;
    
    // 增加随机偏移，让指针停在扇形内的随机位置，避免每次都停在正中心
    // 扇形宽度36度，我们在 +/- 14度范围内随机（留点边距）
    const randomOffset = Math.floor(Math.random() * 29) - 14; 

    // 为了视觉效果，至少转5圈以上
    const baseRotation = 360 * 5;
    
    // 计算当前的旋转余数（归一化到0-360）
    const currentMod = currentRotation % 360;
    
    // 计算需要再转多少度才能到达目标调整角度
    // 我们希望 (currentRotation + diff) % 360 === targetAdjustment
    let diff = targetAdjustment - currentMod;
    
    // 确保是顺时针旋转（diff必须为正）
    if (diff < 0) {
        diff += 360;
    }
    
    // 加上基础圈数和随机偏移
    // 注意：randomOffset 是相对中心的偏移，直接加在最后即可
    // 但要小心，如果加上 randomOffset 后变成了逆时针（负数），虽然 CSS 处理 rotate 负数没问题，
    // 但为了逻辑统一，我们确保整体增量是正的。
    // baseRotation 很大，所以不会有问题。
    
    const finalAngle = currentRotation + baseRotation + diff + randomOffset;
    
    return finalAngle;
}

// 转盘转动动画
function spinWheel(prizeIndex) {
    isSpinning = true;
    drawButton.disabled = true;
    drawButton.textContent = '抽奖中...';
    resultDisplay.textContent = '';
    resultDisplay.classList.remove('winner');

    // 计算停止角度
    const stopAngle = calculateStopAngle(prizeIndex);
    
    // 设置转盘最终角度
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = `rotate(${stopAngle}deg)`;
    
    // 更新当前旋转角度（保存完整角度，用于下次计算）
    currentRotation = stopAngle;

    // 转动完成后显示结果
    setTimeout(() => {
        isSpinning = false;
        drawButton.disabled = false;
        drawButton.textContent = '开始抽奖';
        
        // 显示中奖结果
        const prizeName = prizeNameInputs[prizeIndex].value.trim() || `奖品 ${prizeIndex + 1}`;
        resultDisplay.textContent = `恭喜您抽中：【${prizeName}】`;
        resultDisplay.classList.add('winner');
    }, 4000);
}

// 开始抽奖
function startDraw() {
    if (isSpinning || !validateProbabilities()) {
        return;
    }

    const winnerIndex = calculateWinner();
    spinWheel(winnerIndex);
}

// 绑定事件监听器
prizeNameInputs.forEach(input => {
    input.addEventListener('input', updateWheelDisplay);
    input.addEventListener('blur', updateWheelDisplay);
});

prizeProbabilityInputs.forEach(input => {
    input.addEventListener('input', validateProbabilities);
    input.addEventListener('blur', validateProbabilities);
    
    // 限制只能输入数字
    input.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char) && e.which !== 8 && e.which !== 0) {
            e.preventDefault();
        }
    });
});

drawButton.addEventListener('click', startDraw);

// 初始化
updateWheelDisplay();
validateProbabilities();

