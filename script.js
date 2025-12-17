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
    // 指针位于转盘顶部（270度方向，或者说-90度方向，但在CSS中，默认0度是12点钟方向）
    // 我们的CSS rotate是从12点钟顺时针开始的。
    // 指针是固定的，位于div的中心上方（top: 50%, left: 50%），但实际上pointer的css是 absolute, top: 50%, left: 50%, transform: translate(-50%, -50%)。
    // 等等，CSS中 pointer 的 border-top 指向下方。
    // .pointer { border-top: 40px solid #ef4444; ... } 这是一个倒三角形，尖端向下。
    // 如果 pointer 在 wheel-container 的中心，那它应该是指向 wheel 的中心？
    // 查看 style.css:
    // .wheel-container { position: relative; width: 400px; height: 400px; }
    // .pointer { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); ... }
    // 原来的设计 pointer 似乎是在转盘中心？
    // 如果 pointer 在中心，那它指向哪里？
    // 通常转盘的指针在外部指向内部，或者在内部指向外部。
    // 让我们假设 pointer 是在转盘中心，尖端指向某个方向？
    // 或者是 pointer 在转盘上方（z-index: 10），如果不动的话，它指向哪里？
    // border-left/right transparent, border-top colored => 这是一个倒三角，尖端向下。
    // 如果它在 center (top 50%, left 50%)，那它指向的是转盘的下半部分？
    // 这看起来不太对。通常指针在顶部指向上方，或者在顶部指向下方。
    
    // 让我们回顾一下 CSS。
    // .wheel-sector 的 transform-origin 是 50% 50%。
    // clip-path 生成的扇形是向上的（50% 50% -> 33% 0% -> 66% 0%）。
    // 所以 0 度的扇形（index 0）是在 12 点钟方向。
    // 指针 .pointer 在 center。
    // 如果 pointer 是一个倒三角（尖端向下），那它指向 6 点钟方向。
    // 但通常转盘的指针是在转盘边缘指向中心，或者中心指向边缘。
    // 如果 pointer 在中心且尖端向下，那它指向的是 6 点钟位置的扇形。
    
    // 如果我们要让 index 0 (12点钟方向的扇形) 停在指针位置 (如果是 12 点钟)，
    // 那指针应该在 12 点钟位置，或者指针在中心指向上方。
    // 现有的 pointer 样式是 border-top 有颜色，说明是倒三角，尖端向下。
    // 如果我们想让指针指向上方（12点钟），应该用 border-bottom 有颜色。
    // 或者，我们假设指针是固定的，比如在 12 点钟位置。
    // 但 style.css 里 pointer 是 top: 50%, left: 50%。这说明它在转盘中心。
    // 如果它在中心且指向下，那它指的是 6 点钟方向的奖品。
    // 但是，通常大家习惯看 12 点钟方向的奖品。
    
    // 假设用户希望指针指向 12 点钟方向。
    // 我们需要修改 pointer 的样式，或者修改计算逻辑。
    // 如果 pointer 保持不变（在中心，指向下），那我们应该计算让目标扇形转到 6 点钟位置。
    // 目标扇形初始在 sectorCenters[i]。
    // 要转到 180 度（6点钟）。
    // adjustment = (180 - targetCenter) % 360。
    
    // 如果用户觉得“指针没有指向中奖部分”，可能是因为现在的计算是让扇形转到 0 度（12点钟），
    // 但指针却指向了 6 点钟（如果是倒三角在中心）。
    // 或者指针根本就不明显指向哪里。
    
    // 让我们先调整 pointer 的样式，让它明显指向 12 点钟方向（上方）。
    // 修改 style.css 中的 pointer，改为正三角形（尖端向上）。
    // border-bottom: 40px solid #ef4444; border-top: none;
    // 这样它在中心指向上方。
    
    // 既然我只能改 js，或者我可以改 css。用户说“指针没有指向中奖的部分”。
    // 我应该同时检查 CSS 和 JS。
    
    // 在 JS 中，之前的逻辑是：
    // adjustment = (360 - targetCenter) % 360;
    // 这意味着目标扇形会被转到 0 度（12点钟位置）。
    // 如果指针指向 12 点钟，那就对了。
    
    // 让我们看看 style.css 里的 pointer。
    // border-top: 40px solid #ef4444; => 倒三角，尖端向下。
    // 位置 top: 50%, left: 50%。
    // 所以指针在中心，指向 6 点钟。
    // 而代码把中奖扇形转到了 12 点钟。
    // 所以相差 180 度。
    
    // 修正方案：
    // 1. 修改 CSS，让指针指向上方（12点钟）。
    // 2. 或者修改 JS，让中奖扇形转到 6 点钟。
    
    // 通常转盘指针是在外部顶部的。
    // 如果 pointer 在 .wheel-container (400x400) 内部。
    // 如果我想让它像个正常的转盘，指针应该在顶部边缘，指向中心。
    // 或者在中心，指向边缘。
    
    // 既然 pointer 在 center，且是倒三角，那它看起来像是一个固定的箭头指向下方。
    // 假如我们想让它指向 12 点钟的奖品，那它应该是正三角（指向上）。
    
    // 让我们修改 CSS 让指针指向上方（12点钟），这样符合 (360 - targetCenter) 的逻辑。
    // 同时，如果 pointer 在中心，指向上方，那它会遮住文字吗？
    // 文字在 sector 的 top: 15%。也就是离中心 85% 的半径处。
    // pointer 在中心。应该不会遮住。
    
    // 另一种可能是，用户认为指针应该在转盘外部。
    // 但目前的结构 pointer 在 wheel-container 里。
    
    // 最简单的修复：
    // 修改 JS，让中奖区域转到指针指向的位置（目前是 6 点钟，180度）。
    // adjustment = (180 - targetCenter) % 360;
    
    // 但是，倒三角（尖端向下）在中心，指向 6 点钟，感觉有点怪。通常是“向上看”。
    // 如果我把指针改成指向上方（12点钟），可能更符合直觉。
    // 让我们修改 CSS。
    
    // 等等，如果 pointer 是 border-top 有颜色，它是倒三角 V。
    // 如果它在中心，尖端指向圆心？不，它本身就在圆心。
    // 它的尖端是 (50%, 50% + 20px) 吗？
    // border-left: 20px transparent, border-right: 20px transparent.
    // border-top: 40px solid red.
    // 这是一个 40x40 的盒子（内容0）。
    // 它的上方是宽的，下方是尖的。
    // 既然它在 top: 50%, left: 50%, translate(-50%, -50%)。
    // 它的中心在转盘中心。
    // 它的尖端在中心偏下 20px 的位置。
    // 它的宽边在中心偏上 20px 的位置。
    // 这看起来像是一个指向下方的箭头。
    
    // 无论如何，现在的计算是转到 0 度（12点钟）。
    // 指针指向 6 点钟（下方）。
    // 所以确实反了。
    
    // 我决定：
    // 1. 修改 CSS，把指针移到转盘顶部边缘，指向下方（指向转盘中心）。这是最常见的转盘样式。
    //    .pointer { top: 0; ... }
    //    这样它就指向 12 点钟位置了。
    //    此时 JS 的逻辑 (转到 0 度) 就是正确的。
    
    // 让我们看看 style.css
    // .wheel-container { width: 400px; height: 400px; ... }
    // .pointer { top: 50%; left: 50%; ... }
    
    // 如果我把 pointer 移到 top: 0 甚至 top: -20px，并保持倒三角（指向下），那它就完美指向 12 点钟位置的奖品了。
    
    // 方案：修改 style.css 中的 .pointer 样式。
    
    const adjustment = (360 - targetCenter) % 360;
    
    // 为了视觉效果，至少转5圈以上
    const baseRotation = 360 * 5;
    
    // 最终角度 = 当前角度 + 基础圈数 + 调整角度
    const finalAngle = currentRotation + baseRotation + adjustment;
    
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

