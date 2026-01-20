/**
 * 玩转线性代数 - 可视化管理模块
 * 
 * 协调 2D (Canvas) 和 3D (Three.js) 两个渲染器
 * 
 * 注意：此文件经过拆分，具体的渲染器实现请参考：
 * - renderer2d.js: 2D Canvas 渲染
 * - renderer3d.js: 3D Three.js 渲染
 */

// ============================================
// 可视化配置
// ============================================
const VisualizationConfig = {
    mode: '2D',
    showGrid: true,
    showAxes: true,
    showLabels: true,
    showZGrids: false, // 3D模式下显示YZ和ZX平面的网格
    showAxisGridSurface: false, // 3D模式下显示标准坐标轴网格面
    showSubspaceGridSurface: true, // 3D模式下显示子空间网格面
    coordRange: 10, // 默认2D模式下为10
    animationSpeed: 1,
    
    // 颜色（会根据主题更新）
    colors: {
        background: '#fafafa',
        grid: '#e0e0e0',
        gridStrong: '#bdbdbd',
        axis: '#333333',
        axisX: '#e74c3c',
        axisY: '#27ae60',
        axisZ: '#3498db',
        text: '#333333'
    },

    /**
     * 更新模式
     * @param {string} mode - '2D' 或 '3D'
     */
    updateMode(mode) {
        this.mode = mode;
        // 根据模式设置coordRange
        this.coordRange = mode === '3D' ? 20 : 10;
    },

    /**
     * 更新主题颜色
     * @param {string} theme - 'light' 或 'dark'
     */
    updateTheme(theme) {
        if (theme === 'dark') {
            this.colors = {
                background: '#0a0a1a',
                grid: '#2a2a4a',
                gridStrong: '#3a3a5a',
                axis: '#888888',
                axisX: '#e74c3c',
                axisY: '#27ae60',
                axisZ: '#3498db',
                text: '#e8e8e8'
            };
        } else {
            this.colors = {
                background: '#fafafa',
                grid: '#e0e0e0',
                gridStrong: '#bdbdbd',
                axis: '#333333',
                axisX: '#e74c3c',
                axisY: '#27ae60',
                axisZ: '#3498db',
                text: '#333333'
            };
        }
    }
};

// ============================================
// 动画控制器
// ============================================
const AnimationController = {
    isAnimating: false,
    animationId: null,
    
    /**
     * 执行变换动画
     * @param {object[]} startStates - 起始状态 [{id, components}]
     * @param {object[]} endStates - 结束状态 [{id, components}]
     * @param {number} duration - 持续时间（毫秒）
     * @param {function} onComplete - 完成回调
     */
    animateTransform(startStates, endStates, duration = 1000, onComplete = null) {
        if (this.isAnimating) {
            this.stopAnimation();
        }
        
        this.isAnimating = true;
        const startTime = performance.now();
        const adjustedDuration = duration / VisualizationConfig.animationSpeed;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / adjustedDuration, 1);
            
            // 使用缓动函数
            const eased = this.easeInOutCubic(progress);
            
            // 更新每个向量的位置
            startStates.forEach((start, index) => {
                const end = endStates[index];
                const vector = VectorManager.getVector(start.id);
                if (vector) {
                    vector.components = start.components.map((val, i) => {
                        return val + (end.components[i] - val) * eased;
                    });
                }
            });
            
            // 渲染
            if (VisualizationConfig.mode === '2D') {
                Renderer2D.render();
            } else {
                Renderer3D.render();
            }
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) onComplete();
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    },
    
    /**
     * 停止动画
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;
    },
    
    /**
     * 缓动函数 - ease in out cubic
     */
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
};

// ============================================
// 主可视化管理器
// ============================================
const Visualization = {
    currentRenderer: null,

    /**
     * 初始化可视化系统
     */
    init() {
        Renderer2D.init();
        // 3D渲染器延迟初始化（切换到3D模式时）
        this.currentRenderer = Renderer2D;
    },

    /**
     * 切换显示模式
     * @param {string} mode - '2D' 或 '3D'
     */
    setMode(mode) {
        VisualizationConfig.updateMode(mode);
        
        const canvas2D = document.getElementById('canvas2D');
        const container3D = document.getElementById('container3D');
        const hint2D = document.getElementById('hint2D');
        const hint3D = document.getElementById('hint3D');
        
        if (mode === '3D') {
            canvas2D.style.display = 'none';
            container3D.style.display = 'block';
            hint2D.style.display = 'none';
            hint3D.style.display = 'inline';
            
            // 初始化3D渲染器（如果还没初始化）
            if (!Renderer3D.scene) {
                Renderer3D.init();
            } else {
                // 重新创建网格以应用新的coordRange
                Renderer3D.createGrid();
            }
            Renderer3D.resize();
            Renderer3D.render();
            this.currentRenderer = Renderer3D;
        } else {
            canvas2D.style.display = 'block';
            container3D.style.display = 'none';
            hint2D.style.display = 'inline';
            hint3D.style.display = 'none';
            
            Renderer2D.resize();
            Renderer2D.render();
            this.currentRenderer = Renderer2D;
        }
    },

    /**
     * 渲染当前场景
     */
    render() {
        if (VisualizationConfig.mode === '2D') {
            Renderer2D.render();
        } else {
            Renderer3D.render();
        }
    },

    /**
     * 更新设置
     */
    updateSettings(settings) {
        Object.assign(VisualizationConfig, settings);
        
        // 更新3D场景
        if (Renderer3D.scene) {
            Renderer3D.createGrid();
            Renderer3D.createAxes();
            Renderer3D.updateBackground();
        }
        
        this.render();
    },

    /**
     * 更新主题
     */
    updateTheme(theme) {
        VisualizationConfig.updateTheme(theme);
        
        if (Renderer3D.scene) {
            Renderer3D.createGrid();
            Renderer3D.createAxes();
            Renderer3D.updateBackground();
        }
        
        this.render();
    },

    /**
     * 重置视图
     */
    resetView() {
        if (VisualizationConfig.mode === '2D') {
            Renderer2D.resetView();
        } else {
            Renderer3D.resetView();
        }
    }
};

// 导出模块
window.VisualizationConfig = VisualizationConfig;
window.Renderer2D = Renderer2D;
window.Renderer3D = Renderer3D;
window.AnimationController = AnimationController;
window.Visualization = Visualization;
