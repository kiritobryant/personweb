/**
 * 技能成长轨迹图表类
 * 基于Canvas绘制动态折线图，支持从JSON文件读取数据
 */
class SkillGrowthChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.data = null;
        this.animationProgress = 0;
        this.isAnimating = false;
        
        // 现代化配置
        this.config = {
            padding: { top: 40, right: 40, bottom: 60, left: 80 },
            gridColor: '#f3f4f6',
            textColor: '#374151',
            backgroundColor: '#ffffff',
            lineWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            animationDuration: 2000,
            showGrid: true,
            showLegend: false, // 使用外部图例
            showTooltip: true,
            showMilestones: true,
            // 现代化颜色配置
            colors: [
                '#3b82f6', // 蓝色
                '#ef4444', // 红色
                '#10b981', // 绿色
                '#f59e0b', // 橙色
                '#8b5cf6', // 紫色
                '#06b6d4', // 青色
                '#ec4899'  // 粉色
            ],
            gradientColors: [
                ['#3b82f6', '#1d4ed8'],
                ['#ef4444', '#dc2626'],
                ['#10b981', '#059669'],
                ['#f59e0b', '#d97706'],
                ['#8b5cf6', '#7c3aed'],
                ['#06b6d4', '#0891b2'],
                ['#ec4899', '#db2777']
            ],
            ...options
        };
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // 设置高DPI支持
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
        
        // 计算绘图区域
        this.chartArea = {
            x: this.config.padding.left,
            y: this.config.padding.top,
            width: this.width - this.config.padding.left - this.config.padding.right,
            height: this.height - this.config.padding.top - this.config.padding.bottom
        };
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    async loadData(dataUrl) {
        try {
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            this.processData();
            return this.data;
        } catch (error) {
            console.error('Error loading skill growth data:', error);
            throw error;
        }
    }
    
    processData() {
        if (!this.data || !this.data.skills) return;
        
        // 计算数据范围
        this.maxValue = Math.max(...this.data.skills.flatMap(skill => skill.data));
        this.minValue = Math.min(...this.data.skills.flatMap(skill => skill.data));
        
        // 添加一些边距
        const range = this.maxValue - this.minValue;
        this.maxValue += range * 0.1;
        this.minValue = Math.max(0, this.minValue - range * 0.1);
        
        // 处理时间轴
        this.timeLabels = this.data.timeAxis || [];
    }
    
    draw() {
        if (!this.data) return;
        
        this.clearCanvas();
        
        if (this.config.showGrid) {
            this.drawGrid();
        }
        
        this.drawAxes();
        this.drawSkillLines();
        
        if (this.config.showMilestones) {
            this.drawMilestones();
        }
        
        if (this.config.showLegend) {
            this.drawLegend();
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 添加图表区域的微妙边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        this.ctx.strokeRect(
            this.chartArea.x - 1, 
            this.chartArea.y - 1, 
            this.chartArea.width + 2, 
            this.chartArea.height + 2
        );
    }
    
    drawGrid() {
        if (!this.config.showGrid) return;
        
        this.ctx.strokeStyle = this.config.gridColor;
        this.ctx.lineWidth = 1;
        
        // 水平网格线（只显示主要的）
        const ySteps = 4;
        const yStep = this.chartArea.height / ySteps;
        for (let i = 1; i < ySteps; i++) {
            const y = this.chartArea.y + i * yStep;
            this.ctx.beginPath();
            this.ctx.moveTo(this.chartArea.x, y);
            this.ctx.lineTo(this.chartArea.x + this.chartArea.width, y);
            this.ctx.stroke();
        }
    }
    
    drawAxes() {
        // X轴标签
        this.ctx.fillStyle = this.config.textColor;
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        const xStep = this.chartArea.width / (this.timeLabels.length - 1);
        this.timeLabels.forEach((label, index) => {
            // 只显示部分标签，避免拥挤
            if (index % 2 === 0 || index === this.timeLabels.length - 1) {
                const x = this.chartArea.x + index * xStep;
                const y = this.chartArea.y + this.chartArea.height + 12;
                
                const formattedDate = this.formatDateLabel(label);
                this.ctx.fillText(formattedDate, x, y);
            }
        });
        
        // Y轴标签
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        
        const ySteps = 4;
        const yStep = this.chartArea.height / ySteps;
        const valueStep = (this.maxValue - this.minValue) / ySteps;
        
        for (let i = 0; i <= ySteps; i++) {
            const y = this.chartArea.y + this.chartArea.height - i * yStep;
            const value = this.minValue + i * valueStep;
            this.ctx.fillText(Math.round(value) + '%', this.chartArea.x - 12, y);
        }
        
        // 绘制坐标轴线
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        
        // X轴
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartArea.x, this.chartArea.y + this.chartArea.height);
        this.ctx.lineTo(this.chartArea.x + this.chartArea.width, this.chartArea.y + this.chartArea.height);
        this.ctx.stroke();
        
        // Y轴
        this.ctx.beginPath();
        this.ctx.moveTo(this.chartArea.x, this.chartArea.y);
        this.ctx.lineTo(this.chartArea.x, this.chartArea.y + this.chartArea.height);
        this.ctx.stroke();
    }
    
    formatDateLabel(dateStr) {
        // 将 "2019-09" 格式转换为更易读的格式
        const [year, month] = dateStr.split('-');
        const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        return `${year.slice(2)}年${monthNames[parseInt(month)]}`;
    }
    
    drawSkillLines() {
        if (!this.data.skills) return;
        
        const xStep = this.chartArea.width / (this.timeLabels.length - 1);
        
        this.data.skills.forEach((skill, skillIndex) => {
            // 使用配置的颜色或技能自定义颜色
            const skillColor = skill.color || this.config.colors[skillIndex % this.config.colors.length];
            const gradientColors = this.config.gradientColors[skillIndex % this.config.gradientColors.length];
            
            // 创建渐变效果
            const gradient = this.ctx.createLinearGradient(
                this.chartArea.x, 
                this.chartArea.y, 
                this.chartArea.x + this.chartArea.width, 
                this.chartArea.y + this.chartArea.height
            );
            gradient.addColorStop(0, gradientColors[0]);
            gradient.addColorStop(1, gradientColors[1]);
            
            // 绘制填充区域（渐变背景）
            const fillGradient = this.ctx.createLinearGradient(
                this.chartArea.x, 
                this.chartArea.y, 
                this.chartArea.x, 
                this.chartArea.y + this.chartArea.height
            );
            fillGradient.addColorStop(0, skillColor + '20'); // 20% 透明度
            fillGradient.addColorStop(1, skillColor + '05'); // 5% 透明度
            
            this.ctx.fillStyle = fillGradient;
            this.ctx.beginPath();
            
            skill.data.forEach((value, index) => {
                const x = this.chartArea.x + index * xStep;
                const y = this.getYPosition(value);
                
                // 应用动画进度
                const progress = this.isAnimating ? 
                    Math.min(1, Math.max(0, (this.animationProgress - index * 0.1) / 0.9)) : 1;
                
                if (progress <= 0) return;
                
                if (index === 0) {
                    this.ctx.moveTo(x, this.chartArea.y + this.chartArea.height);
                    this.ctx.lineTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            // 闭合路径
            const lastX = this.chartArea.x + (skill.data.length - 1) * xStep;
            this.ctx.lineTo(lastX, this.chartArea.y + this.chartArea.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // 绘制主线条（带阴影效果）
            this.ctx.shadowColor = skillColor + '40';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = this.config.lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            
            skill.data.forEach((value, index) => {
                const x = this.chartArea.x + index * xStep;
                const y = this.getYPosition(value);
                
                // 应用动画进度
                const progress = this.isAnimating ? 
                    Math.min(1, Math.max(0, (this.animationProgress - index * 0.1) / 0.9)) : 1;
                
                if (progress > 0) {
                    if (index === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            });
            
            this.ctx.stroke();
            
            // 清除阴影效果
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 绘制数据点
            skill.data.forEach((value, index) => {
                const x = this.chartArea.x + index * xStep;
                const y = this.getYPosition(value);
                
                const progress = this.isAnimating ? 
                    Math.min(1, Math.max(0, (this.animationProgress - index * 0.1) / 0.9)) : 1;
                
                if (progress > 0) {
                    // 绘制外圈光晕
                    this.ctx.beginPath();
                    this.ctx.fillStyle = skillColor + '30';
                    this.ctx.arc(x, y, this.config.pointRadius * 1.5 * progress, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // 绘制主要点
                    this.ctx.beginPath();
                    this.ctx.fillStyle = skillColor;
                    this.ctx.arc(x, y, this.config.pointRadius * progress, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // 添加白色边框
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                    
                    // 添加内部高光
                    this.ctx.beginPath();
                    this.ctx.fillStyle = '#ffffff40';
                    this.ctx.arc(x - 1, y - 1, this.config.pointRadius * 0.4 * progress, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            });
        });
    }
    
    drawMilestones() {
        if (!this.data.milestones) return;
        
        const xStep = this.chartArea.width / (this.timeLabels.length - 1);
        
        this.data.milestones.forEach(milestone => {
            const timeIndex = this.timeLabels.indexOf(milestone.date);
            if (timeIndex === -1) return;
            
            const x = this.chartArea.x + timeIndex * xStep;
            
            // 绘制里程碑线
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.chartArea.y);
            this.ctx.lineTo(x, this.chartArea.y + this.chartArea.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // 绘制里程碑标记
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(x, this.chartArea.y - 20, 6, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawLegend() {
        if (!this.data.skills) return;
        
        const legendX = this.chartArea.x + this.chartArea.width + 30;
        const legendY = this.chartArea.y;
        const itemHeight = 65;
        const padding = 20;
        const legendWidth = 280;
        const legendHeight = this.data.skills.length * itemHeight + padding * 2 + 40;
        
        // 绘制图例主背景 - 现代卡片风格
        const gradient = this.ctx.createLinearGradient(legendX, legendY, legendX, legendY + legendHeight);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(248, 250, 252, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(legendX - 10, legendY - 10, legendWidth, legendHeight);
        
        // 绘制图例边框和阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(legendX - 10, legendY - 10, legendWidth, legendHeight);
        this.ctx.shadowColor = 'transparent';
        
        // 绘制图例标题
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillText('技能掌握度', legendX + legendWidth/2 - 10, legendY + 5);
        
        // 绘制分割线
        this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(legendX + 10, legendY + 35);
        this.ctx.lineTo(legendX + legendWidth - 30, legendY + 35);
        this.ctx.stroke();
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        this.data.skills.forEach((skill, index) => {
            const y = legendY + 50 + index * itemHeight;
            const skillColor = skill.color || this.config.colors[index % this.config.colors.length];
            const currentValue = skill.data[skill.data.length - 1];
            const initialValue = skill.data[0];
            const growth = currentValue - initialValue;
            
            // 绘制技能项背景
            this.ctx.fillStyle = skill.backgroundColor || 'rgba(248, 250, 252, 0.5)';
            this.ctx.fillRect(legendX + 5, y - 25, legendWidth - 30, itemHeight - 5);
            
            // 绘制进度条背景
            const progressBarWidth = 120;
            const progressBarHeight = 8;
            const progressX = legendX + 140;
            const progressY = y + 10;
            
            this.ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
            this.ctx.fillRect(progressX, progressY, progressBarWidth, progressBarHeight);
            
            // 绘制进度条
            const progressWidth = (currentValue / 100) * progressBarWidth;
            const progressGradient = this.ctx.createLinearGradient(progressX, progressY, progressX + progressWidth, progressY);
            progressGradient.addColorStop(0, skillColor);
            progressGradient.addColorStop(1, skillColor + 'CC');
            this.ctx.fillStyle = progressGradient;
            this.ctx.fillRect(progressX, progressY, progressWidth, progressBarHeight);
            
            // 绘制技能图标/颜色指示器
            this.ctx.fillStyle = skillColor;
            this.ctx.beginPath();
            this.ctx.arc(legendX + 20, y - 5, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // 添加白色边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制技能名称
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#2d3748';
            this.ctx.fillText(skill.name, legendX + 35, y - 8);
            
            // 绘制技能描述（如果有）
            if (skill.description) {
                this.ctx.font = '11px Arial';
                this.ctx.fillStyle = '#718096';
                const maxWidth = 100;
                const truncatedDesc = skill.description.length > 20 ? 
                    skill.description.substring(0, 20) + '...' : skill.description;
                this.ctx.fillText(truncatedDesc, legendX + 35, y + 8);
            }
            
            // 绘制当前值
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = skillColor;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${currentValue}%`, legendX + legendWidth - 25, y - 8);
            
            // 绘制增长值
            if (growth > 0) {
                this.ctx.font = '12px Arial';
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillText(`+${growth}%`, legendX + legendWidth - 25, y + 8);
            }
            
            this.ctx.textAlign = 'left';
        });
    }
    
    getYPosition(value) {
        const ratio = (value - this.minValue) / (this.maxValue - this.minValue);
        return this.chartArea.y + this.chartArea.height - ratio * this.chartArea.height;
    }
    
    animate() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animationProgress = 0;
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.animationProgress = Math.min(1, elapsed / this.config.animationDuration);
            
            this.draw();
            
            if (this.animationProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    handleMouseMove(event) {
        if (!this.data || !this.data.skills) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const xStep = this.chartArea.width / (this.timeLabels.length - 1);
        let hoveredPoint = null;
        
        // 检查是否悬停在数据点上
        this.data.skills.forEach((skill, skillIndex) => {
            skill.data.forEach((value, index) => {
                const pointX = this.chartArea.x + index * xStep;
                const pointY = this.getYPosition(value);
                
                const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
                
                if (distance <= this.config.pointHoverRadius) {
                    hoveredPoint = {
                        skill: skill,
                        skillIndex: skillIndex,
                        value: value,
                        timeIndex: index,
                        time: this.timeLabels[index],
                        x: pointX,
                        y: pointY
                    };
                }
            });
        });
        
        // 更新鼠标样式
        this.canvas.style.cursor = hoveredPoint ? 'pointer' : 'default';
        
        // 显示工具提示
        if (hoveredPoint) {
            this.showTooltip(hoveredPoint, x, y);
        } else {
            this.hideTooltip();
        }
    }
    
    showTooltip(point, mouseX, mouseY) {
        // 创建或更新工具提示
        let tooltip = document.getElementById('skill-chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'skill-chart-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
            `;
            document.body.appendChild(tooltip);
        }
        
        const skillColor = point.skill.color || this.config.colors[point.skillIndex % this.config.colors.length];
        
        tooltip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${skillColor};"></div>
                <strong>${point.skill.name}</strong>
            </div>
            <div style="color: #ccc;">时间: ${point.time}</div>
            <div style="color: #ccc;">技能值: ${point.value}%</div>
        `;
        
        // 定位工具提示
        const rect = this.canvas.getBoundingClientRect();
        const tooltipX = rect.left + mouseX + 10;
        const tooltipY = rect.top + mouseY - 10;
        
        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('skill-chart-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
        }
        this.canvas.style.cursor = 'default';
    }
    
    handleMouseLeave() {
        this.canvas.style.cursor = 'default';
    }
    
    handleResize() {
        this.setupCanvas();
        this.draw();
    }
    
    // 控制按钮功能方法
    replayAnimation() {
        this.animationProgress = 0;
        this.animate();
    }
    
    toggleGrid() {
        this.config.showGrid = !this.config.showGrid;
        this.draw();
        return this.config.showGrid;
    }
    
    toggleMilestones() {
        this.config.showMilestones = !this.config.showMilestones;
        this.draw();
        return this.config.showMilestones;
    }
    
    exportChart() {
        // 创建一个临时链接来下载图片
        const link = document.createElement('a');
        link.download = 'skill-growth-chart.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    // 公共方法
    async init(dataUrl) {
        await this.loadData(dataUrl);
        this.animate();
    }
    
    updateData(newData) {
        this.data = newData;
        this.processData();
        this.animate();
    }
    
    destroy() {
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        window.removeEventListener('resize', this.handleResize);
        
        // 清理工具提示
        const tooltip = document.getElementById('skill-chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

// 导出类供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillGrowthChart;
} else {
    window.SkillGrowthChart = SkillGrowthChart;
}