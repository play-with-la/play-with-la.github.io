/**
 * 玩转线性代数 - 2D 渲染器模块
 * 
 * 提供2D Canvas渲染功能
 */

// ============================================
// 2D 可视化渲染器
// ============================================
const Renderer2D = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    // 视图变换参数
    panX: 0,
    panY: 0,
    scale: 1,
    
    // 拖拽状态
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    
    // 向量拖拽状态
    draggedVector: null,
    isOverVector: false,
    hoverVector: null,
    vectorHitRadius: 15, // 向量端点点击检测半径（像素）
    
    // 图案绘制状态
    isDrawingShape: false,
    currentShapePoints: [],
    currentShapeClosed: false, // 当前绘制的图案是否闭合
    
    // 图案拖拽状态
    draggedShape: null,
    draggedShapePointIndex: -1, // -1表示拖拽整个图案
    hoverShape: null,
    hoverShapePointIndex: -1,
    shapePointHitRadius: 8,
    shapeEdgeHitDistance: 6,
    lastDragWorldPos: null,
    
    // 平行四边形动画状态
    animation: null,

    // 触摸缩放状态
    isPinching: false,
    lastPinchDistance: 0,
    pinchCenterX: 0,
    pinchCenterY: 0,

    /**
     * 初始化2D渲染器
     */
    init() {
        this.canvas = document.getElementById('canvas2D');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        this.setupEventListeners();
        
        window.addEventListener('resize', () => this.resize());
    },

    /**
     * 调整画布大小
     */
    resize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        // 设置高DPI支持
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);
        
        // 计算初始缩放
        this.scale = Math.min(this.width, this.height) / (VisualizationConfig.coordRange * 4);
        
        this.render();
    },

    /**
     * 检测鼠标是否在向量端点附近
     */
    getVectorAtPosition(screenX, screenY) {
        const vectors = VectorManager.getVisibleVectors('2D');
        for (let i = vectors.length - 1; i >= 0; i--) {
            const v = vectors[i];
            if (v.components.length >= 2) {
                const endPoint = this.worldToScreen(v.components[0], v.components[1]);
                const dx = screenX - endPoint.x;
                const dy = screenY - endPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.vectorHitRadius) {
                    return v;
                }
            }
        }
        return null;
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标按下
        this.canvas.addEventListener('mousedown', (e) => {
            // 如果正在绘制图案，不处理拖拽
            if (this.isDrawingShape) return;
            
            // 先检测图案
            const shapeHit = this.getShapeAtPosition(e.offsetX, e.offsetY);
            if (shapeHit) {
                this.draggedShape = shapeHit.shape;
                this.draggedShapePointIndex = shapeHit.pointIndex;
                this.lastDragWorldPos = this.screenToWorld(e.offsetX, e.offsetY);
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            
            // 再检测向量
            const vector = this.getVectorAtPosition(e.offsetX, e.offsetY);
            if (vector) {
                this.draggedVector = vector;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            
            // 开始拖拽画布
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        // 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            // 更新坐标显示
            const coords = this.screenToWorld(e.offsetX, e.offsetY);
            document.getElementById('cursorCoords').textContent = 
                `坐标: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
            
            // 如果正在绘制图案，不处理其他悬停
            if (this.isDrawingShape) {
                return;
            }
            
            // 拖拽图案
            if (this.draggedShape) {
                const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
                
                if (this.draggedShapePointIndex >= 0) {
                    // 拖拽单个点
                    ShapeManager.updatePoint(
                        this.draggedShape.id,
                        this.draggedShapePointIndex,
                        worldPos.x,
                        worldPos.y
                    );
                } else {
                    // 拖拽整个图案
                    const dx = worldPos.x - this.lastDragWorldPos.x;
                    const dy = worldPos.y - this.lastDragWorldPos.y;
                    ShapeManager.translateShape(this.draggedShape.id, dx, dy);
                    this.lastDragWorldPos = worldPos;
                }
                
                this.render();
                return;
            }
            
            if (this.draggedVector) {
                // 拖拽向量
                const worldCoords = this.screenToWorld(e.offsetX, e.offsetY);
                this.draggedVector.components[0] = worldCoords.x;
                this.draggedVector.components[1] = worldCoords.y;
                this.render();
                
                // 拖拽时只更新坐标显示，不更新整个向量列表（避免闪烁）
                const vectorItem = document.querySelector(`.vector-item[data-id="${this.draggedVector.id}"] .vector-coords`);
                if (vectorItem) {
                    vectorItem.textContent = VectorOperations.format(this.draggedVector.components);
                }
                
                // 同步更新空间管理卡片中的基向量列表坐标
                const basisVectorOption = document.querySelector(`.basis-vector-option[data-vector-id="${this.draggedVector.id}"] .vector-coords-text`);
                if (basisVectorOption) {
                    const coords = this.draggedVector.components.map(c => c.toFixed(1)).join(', ');
                    basisVectorOption.textContent = `(${coords})`;
                }
            } else if (this.isDragging) {
                // 拖拽平移画布
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.render();
            } else {
                // 检测图案悬停
                const shapeHit = this.getShapeAtPosition(e.offsetX, e.offsetY);
                if (shapeHit) {
                    this.canvas.style.cursor = shapeHit.pointIndex >= 0 ? 'grab' : 'move';
                    if (this.hoverShape !== shapeHit.shape || this.hoverShapePointIndex !== shapeHit.pointIndex) {
                        this.hoverShape = shapeHit.shape;
                        this.hoverShapePointIndex = shapeHit.pointIndex;
                        this.hoverVector = null;
                        this.render();
                    }
                    return;
                } else if (this.hoverShape) {
                    this.hoverShape = null;
                    this.hoverShapePointIndex = -1;
                    this.render();
                }
                
                // 检测向量悬停
                const vector = this.getVectorAtPosition(e.offsetX, e.offsetY);
                if (vector) {
                    this.canvas.style.cursor = 'grab';
                    if (this.hoverVector !== vector) {
                        this.hoverVector = vector;
                        this.render();
                    }
                } else {
                    this.canvas.style.cursor = 'default';
                    if (this.hoverVector) {
                        this.hoverVector = null;
                        this.render();
                    }
                }
            }
        });

        // 鼠标释放
        this.canvas.addEventListener('mouseup', () => {
            if (this.draggedShape) {
                this.draggedShape = null;
                this.draggedShapePointIndex = -1;
                this.lastDragWorldPos = null;
            }
            
            if (this.draggedVector) {
                // 保存向量状态
                VectorManager.saveCurrentState();
                VectorManager.save(); // 保存到localStorage
                
                // 拖拽结束后只更新坐标显示，不重建整个列表
                const vectorItem = document.querySelector(`.vector-item[data-id="${this.draggedVector.id}"] .vector-coords`);
                if (vectorItem) {
                    vectorItem.textContent = VectorOperations.format(this.draggedVector.components);
                }
                
                // 同步更新空间管理卡片中的基向量列表坐标
                const basisVectorOption = document.querySelector(`.basis-vector-option[data-vector-id="${this.draggedVector.id}"] .vector-coords-text`);
                if (basisVectorOption) {
                    const coords = this.draggedVector.components.map(c => c.toFixed(1)).join(', ');
                    basisVectorOption.textContent = `(${coords})`;
                }
                
                this.draggedVector = null;
            }
            this.isDragging = false;
            
            // 更新光标
            if (this.hoverShape) {
                this.canvas.style.cursor = this.hoverShapePointIndex >= 0 ? 'grab' : 'move';
            } else if (this.hoverVector) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = this.isDrawingShape ? 'crosshair' : 'default';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.draggedVector = null;
            this.draggedShape = null;
            this.hoverVector = null;
            this.hoverShape = null;
            this.canvas.style.cursor = 'default';
        });

        // 点击事件（用于绘制图案）
        let lastClickTime = 0;
        this.canvas.addEventListener('click', (e) => {
            if (this.isDrawingShape) {
                // 检测是否是双击的第二次点击，如果是则忽略
                const now = Date.now();
                if (now - lastClickTime < 300) {
                    // 这是双击的第二次点击，忽略
                    return;
                }
                lastClickTime = now;
                
                const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
                
                // 检测是否接近第一个点（用于闭合）
                if (ShapeManager.isNearFirstPoint(this.currentShapePoints, worldPos.x, worldPos.y)) {
                    // 自动闭合，不添加最后一个点
                    this.currentShapeClosed = true;
                    this.finishDrawingShape();
                    return;
                }
                
                this.currentShapePoints.push([worldPos.x, worldPos.y]);
                this.render();
            }
        });

        // 双击事件（完成绘制图案）
        this.canvas.addEventListener('dblclick', (e) => {
            if (this.isDrawingShape) {
                // 双击会触发两次click，第一次click已经添加了一个点，需要移除
                if (this.currentShapePoints.length > 0) {
                    this.currentShapePoints.pop();
                }
                this.finishDrawingShape();
            }
        });

        // 滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            
            // 以鼠标位置为中心缩放
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            
            const worldBefore = this.screenToWorld(mouseX, mouseY);
            this.scale *= zoomFactor;
            this.scale = Math.max(5, Math.min(250, this.scale));
            const worldAfter = this.screenToWorld(mouseX, mouseY);
            
            this.panX += (worldAfter.x - worldBefore.x) * this.scale;
            this.panY -= (worldAfter.y - worldBefore.y) * this.scale;
            
            this.render();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.isDrawingShape) {
                if (e.key === 'Enter') {
                    this.finishDrawingShape();
                } else if (e.key === 'Escape') {
                    this.cancelDrawingShape();
                }
            }
        });

        // ============================================
        // 触摸事件支持
        // ============================================

        // 触摸开始
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // 双指触摸 - 开始缩放
            if (e.touches.length === 2) {
                this.isPinching = true;
                this.isDragging = false;
                this.draggedVector = null;
                this.draggedShape = null;
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const rect = this.canvas.getBoundingClientRect();
                
                // 计算两指间距离
                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
                
                // 计算两指中心点（相对于canvas）
                this.pinchCenterX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                this.pinchCenterY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                return;
            }
            
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const offsetX = touch.clientX - rect.left;
            const offsetY = touch.clientY - rect.top;
            
            // 如果正在绘制图案，不处理拖拽
            if (this.isDrawingShape) {
                // 触摸添加点
                const worldPos = this.screenToWorld(offsetX, offsetY);
                
                // 检测是否接近第一个点（用于闭合）
                if (ShapeManager.isNearFirstPoint(this.currentShapePoints, worldPos.x, worldPos.y)) {
                    this.currentShapeClosed = true;
                    this.finishDrawingShape();
                    return;
                }
                
                this.currentShapePoints.push([worldPos.x, worldPos.y]);
                this.render();
                return;
            }
            
            // 先检测图案
            const shapeHit = this.getShapeAtPosition(offsetX, offsetY);
            if (shapeHit) {
                this.draggedShape = shapeHit.shape;
                this.draggedShapePointIndex = shapeHit.pointIndex;
                this.lastDragWorldPos = this.screenToWorld(offsetX, offsetY);
                return;
            }
            
            // 再检测向量
            const vector = this.getVectorAtPosition(offsetX, offsetY);
            if (vector) {
                this.draggedVector = vector;
                return;
            }
            
            // 开始拖拽画布
            this.isDragging = true;
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
        }, { passive: false });

        // 触摸移动
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            // 双指缩放
            if (e.touches.length === 2 && this.isPinching) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const rect = this.canvas.getBoundingClientRect();
                
                // 计算新的两指间距离
                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                const newDistance = Math.sqrt(dx * dx + dy * dy);
                
                if (this.lastPinchDistance > 0) {
                    // 计算缩放因子
                    const zoomFactor = newDistance / this.lastPinchDistance;
                    
                    // 更新中心点
                    const newCenterX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                    const newCenterY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                    
                    // 以捏合中心为基准缩放
                    const worldBefore = this.screenToWorld(this.pinchCenterX, this.pinchCenterY);
                    this.scale *= zoomFactor;
                    this.scale = Math.max(5, Math.min(250, this.scale));
                    const worldAfter = this.screenToWorld(this.pinchCenterX, this.pinchCenterY);
                    
                    this.panX += (worldAfter.x - worldBefore.x) * this.scale;
                    this.panY -= (worldAfter.y - worldBefore.y) * this.scale;
                    
                    // 同时支持双指平移
                    this.panX += newCenterX - this.pinchCenterX;
                    this.panY += newCenterY - this.pinchCenterY;
                    
                    this.pinchCenterX = newCenterX;
                    this.pinchCenterY = newCenterY;
                    
                    this.render();
                }
                
                this.lastPinchDistance = newDistance;
                return;
            }
            
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const offsetX = touch.clientX - rect.left;
            const offsetY = touch.clientY - rect.top;
            
            // 更新坐标显示
            const coords = this.screenToWorld(offsetX, offsetY);
            document.getElementById('cursorCoords').textContent = 
                `坐标: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`;
            
            // 如果正在绘制图案，只更新预览
            if (this.isDrawingShape) {
                this.render();
                return;
            }
            
            // 拖拽图案
            if (this.draggedShape) {
                const worldPos = this.screenToWorld(offsetX, offsetY);
                
                if (this.draggedShapePointIndex >= 0) {
                    // 拖拽单个点
                    ShapeManager.updatePoint(
                        this.draggedShape.id,
                        this.draggedShapePointIndex,
                        worldPos.x,
                        worldPos.y
                    );
                } else {
                    // 拖拽整个图案
                    const dx = worldPos.x - this.lastDragWorldPos.x;
                    const dy = worldPos.y - this.lastDragWorldPos.y;
                    ShapeManager.translateShape(this.draggedShape.id, dx, dy);
                    this.lastDragWorldPos = worldPos;
                }
                
                this.render();
                return;
            }
            
            if (this.draggedVector) {
                // 拖拽向量
                const worldCoords = this.screenToWorld(offsetX, offsetY);
                this.draggedVector.components[0] = worldCoords.x;
                this.draggedVector.components[1] = worldCoords.y;
                this.render();
                
                // 拖拽时只更新坐标显示
                const vectorItem = document.querySelector(`.vector-item[data-id="${this.draggedVector.id}"] .vector-coords`);
                if (vectorItem) {
                    vectorItem.textContent = VectorOperations.format(this.draggedVector.components);
                }
                
                // 同步更新空间管理卡片中的基向量列表坐标
                const basisVectorOption = document.querySelector(`.basis-vector-option[data-vector-id="${this.draggedVector.id}"] .vector-coords-text`);
                if (basisVectorOption) {
                    const coords = this.draggedVector.components.map(c => c.toFixed(1)).join(', ');
                    basisVectorOption.textContent = `(${coords})`;
                }
            } else if (this.isDragging) {
                // 拖拽平移画布
                const dx = touch.clientX - this.lastMouseX;
                const dy = touch.clientY - this.lastMouseY;
                this.panX += dx;
                this.panY += dy;
                this.lastMouseX = touch.clientX;
                this.lastMouseY = touch.clientY;
                this.render();
            }
        }, { passive: false });

        // 触摸结束
        this.canvas.addEventListener('touchend', (e) => {
            // 重置捏合缩放状态
            if (e.touches.length < 2) {
                this.isPinching = false;
                this.lastPinchDistance = 0;
            }
            
            if (this.draggedShape) {
                this.draggedShape = null;
                this.draggedShapePointIndex = -1;
                this.lastDragWorldPos = null;
            }
            
            if (this.draggedVector) {
                // 保存向量状态
                VectorManager.saveCurrentState();
                VectorManager.save(); // 保存到localStorage
                
                // 拖拽结束后只更新坐标显示
                const vectorItem = document.querySelector(`.vector-item[data-id="${this.draggedVector.id}"] .vector-coords`);
                if (vectorItem) {
                    vectorItem.textContent = VectorOperations.format(this.draggedVector.components);
                }
                
                // 同步更新空间管理卡片中的基向量列表坐标
                const basisVectorOption = document.querySelector(`.basis-vector-option[data-vector-id="${this.draggedVector.id}"] .vector-coords-text`);
                if (basisVectorOption) {
                    const coords = this.draggedVector.components.map(c => c.toFixed(1)).join(', ');
                    basisVectorOption.textContent = `(${coords})`;
                }
                
                this.draggedVector = null;
            }
            this.isDragging = false;
        });

        // 触摸取消
        this.canvas.addEventListener('touchcancel', () => {
            this.isDragging = false;
            this.draggedVector = null;
            this.draggedShape = null;
            this.isPinching = false;
            this.lastPinchDistance = 0;
        });
    },

    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        const centerX = this.width / 2 + this.panX;
        const centerY = this.height / 2 + this.panY;
        return {
            x: (screenX - centerX) / this.scale,
            y: (centerY - screenY) / this.scale
        };
    },

    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        const centerX = this.width / 2 + this.panX;
        const centerY = this.height / 2 + this.panY;
        return {
            x: centerX + worldX * this.scale,
            y: centerY - worldY * this.scale
        };
    },

    /**
     * 渲染场景
     */
    render() {
        const ctx = this.ctx;
        const config = VisualizationConfig;
        
        // 清空画布
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制网格
        if (config.showGrid) {
            this.drawGrid();
        }
        
        // 绘制子空间网格
        this.drawSubspaceGrids();
        
        // 绘制坐标轴
        if (config.showAxes) {
            this.drawAxes();
        }
        
        // 绘制所有2D图案
        const shapes = ShapeManager.getVisibleShapes('2D');
        shapes.forEach(shape => {
            const isHovered = (shape === this.hoverShape);
            // 轨迹动画进行中时，跳过对应图案的常规绘制，改由动画层绘制
            const animatingTrace = this.animation && this.animation.type === 'trace' && this.animation.shapeId === shape.id;
            if (!animatingTrace) {
                this.drawShape(shape, isHovered);
            }
        });
        
        // 绘制正在绘制的图案
        if (this.isDrawingShape && this.currentShapePoints.length > 0) {
            this.drawCurrentShape();
        }
        
        // 绘制所有向量
        const vectors = VectorManager.getVisibleVectors('2D');
        vectors.forEach(v => {
            if (v.components.length >= 2) {
                const isHovered = (v === this.hoverVector) || (v === this.draggedVector);
                this.drawVector(v.components[0], v.components[1], v.color, v.name, isHovered);
            }
        });
        
        // 绘制动画
        if (this.animation) {
            if (this.animation.type === 'projection') {
                this.drawProjectionAnimation();
            } else if (this.animation.type === 'trace') {
                this.drawTraceAnimation();
            } else {
                this.drawParallelogramAnimation();
            }
        }
    },
    
    /**
     * 启动平行四边形动画
     */
    startParallelogramAnimation(v1, v2, result, isSubtract = false, onComplete = null) {
        this.animation = {
            v1: v1,
            v2: v2,
            result: result,
            isSubtract: isSubtract,
            progress: 0,
            startTime: Date.now(),
            duration: 2000 / VisualizationConfig.animationSpeed,
            showResultVector: false,
            onComplete: onComplete
        };
        this.animateParallelogram();
    },

    /**
     * 启动轨迹绘制动画
     * @param {object} shape - 轨迹图案
     * @param {number[][]} points - 轨迹点数组
     */
    startTraceAnimation(shape, points) {
        // 仅在2D模式下动画
        if (VisualizationConfig.mode !== '2D') {
            this.animation = null;
            this.render();
            return;
        }

        this.animation = {
            type: 'trace',
            shapeId: shape.id,
            points: points,
            color: shape.color,
            startTime: Date.now(),
            duration: 2000 / VisualizationConfig.animationSpeed
        };
        this.animateTrace();
    },
    
    /**
     * 动画循环
     */
    animateParallelogram() {
        if (!this.animation) return;
        
        const elapsed = Date.now() - this.animation.startTime;
        this.animation.progress = Math.min(elapsed / this.animation.duration, 1);
        
        this.render();
        
        if (this.animation.progress < 1) {
            requestAnimationFrame(() => this.animateParallelogram());
        } else {
            // 动画完成，显示结果向量
            this.animation.showResultVector = true;
            if (this.animation.onComplete) {
                this.animation.onComplete();
            }
            this.render();
            
            // 保持显示一段时间后清除动画
            setTimeout(() => {
                this.animation = null;
                this.render();
            }, 1500);
        }
    },

    /**
     * 轨迹动画循环
     */
    animateTrace() {
        if (!this.animation || this.animation.type !== 'trace') return;

        const elapsed = Date.now() - this.animation.startTime;
        this.animation.progress = Math.min(elapsed / this.animation.duration, 1);

        this.render();

        if (this.animation.progress < 1) {
            requestAnimationFrame(() => this.animateTrace());
        } else {
            this.animation = null;
            this.render();
        }
    },
    
    /**
     * 绘制平行四边形动画
     */
    drawParallelogramAnimation() {
        const ctx = this.ctx;
        const anim = this.animation;
        const progress = this.easeInOutCubic(anim.progress);
        
        const v1End = this.worldToScreen(anim.v1[0], anim.v1[1]);
        const v2End = this.worldToScreen(anim.v2[0], anim.v2[1]);
        const resultEnd = this.worldToScreen(anim.result[0], anim.result[1]);
        
        // 设置虚线样式
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1.5;
        
        if (anim.isSubtract) {
            // 减法：v1 - v2 = result
            // 第一条虚线：从 v2 端点到 v1 端点
            const animatedX1 = v2End.x + (v1End.x - v2End.x) * progress;
            const animatedY1 = v2End.y + (v1End.y - v2End.y) * progress;
            
            ctx.beginPath();
            ctx.moveTo(v2End.x, v2End.y);
            ctx.lineTo(animatedX1, animatedY1);
            ctx.stroke();
            
            // 第二条虚线：从 v1 端点到结果点（平行于第一条虚线）
            if (progress > 0.3) {
                const lineProgress = (progress - 0.3) / 0.7;
                const animatedX2 = v1End.x + (resultEnd.x - v1End.x) * lineProgress;
                const animatedY2 = v1End.y + (resultEnd.y - v1End.y) * lineProgress;
                
                ctx.beginPath();
                ctx.moveTo(v1End.x, v1End.y);
                ctx.lineTo(animatedX2, animatedY2);
                ctx.stroke();
            }
        } else {
            // 加法：绘制平行四边形
            // 第一条边：从 v1 端点平移 v2
            const p3x = anim.v1[0] + anim.v2[0];
            const p3y = anim.v1[1] + anim.v2[1];
            const p3 = this.worldToScreen(p3x, p3y);
            
            // 从 v1 端点绘制到 结果点
            const animatedX1 = v1End.x + (p3.x - v1End.x) * progress;
            const animatedY1 = v1End.y + (p3.y - v1End.y) * progress;
            
            ctx.beginPath();
            ctx.moveTo(v1End.x, v1End.y);
            ctx.lineTo(animatedX1, animatedY1);
            ctx.stroke();
            
            // 从 v2 端点绘制到 结果点
            const animatedX2 = v2End.x + (p3.x - v2End.x) * progress;
            const animatedY2 = v2End.y + (p3.y - v2End.y) * progress;
            
            ctx.beginPath();
            ctx.moveTo(v2End.x, v2End.y);
            ctx.lineTo(animatedX2, animatedY2);
            ctx.stroke();
        }
        
        // 恢复实线
        ctx.setLineDash([]);
    },

    /**
     * 绘制轨迹动画（逐段显现，并在末端绘制箭头）
     */
    drawTraceAnimation() {
        const anim = this.animation;
        if (!anim || anim.type !== 'trace') return;

        const ctx = this.ctx;
        const pts = anim.points;
        if (!pts || pts.length < 2) return;

        const totalSegments = pts.length - 1;
        const progress = anim.progress || 0;
        const exactPos = progress * totalSegments;
        const fullSegments = Math.floor(exactPos);
        const partialT = exactPos - fullSegments;

        ctx.save();
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        const startScreen = this.worldToScreen(pts[0][0], pts[0][1]);
        ctx.moveTo(startScreen.x, startScreen.y);

        // 已完成的整段
        for (let i = 0; i < fullSegments; i++) {
            const p = this.worldToScreen(pts[i + 1][0], pts[i + 1][1]);
            ctx.lineTo(p.x, p.y);
        }

        // 部分段
        let arrowPos = startScreen;
        if (fullSegments < totalSegments) {
            const a = pts[fullSegments];
            const b = pts[fullSegments + 1];
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const px = a[0] + dx * partialT;
            const py = a[1] + dy * partialT;
            const pScreen = this.worldToScreen(px, py);
            ctx.lineTo(pScreen.x, pScreen.y);
            arrowPos = pScreen;
        } else {
            const last = pts[pts.length - 1];
            arrowPos = this.worldToScreen(last[0], last[1]);
        }

        ctx.stroke();

        // 绘制节点
        ctx.fillStyle = anim.color;
        const maxIndex = Math.min(fullSegments + 1, pts.length - 1);
        for (let i = 0; i <= maxIndex; i++) {
            const p = pts[i];
            const ps = this.worldToScreen(p[0], p[1]);
            ctx.beginPath();
            ctx.arc(ps.x, ps.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 每段箭头：已完成段在段中点，使用屏幕坐标方向
        for (let i = 0; i < fullSegments; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            const aS = this.worldToScreen(a[0], a[1]);
            const bS = this.worldToScreen(b[0], b[1]);
            const dx = bS.x - aS.x;
            const dy = bS.y - aS.y;
            const midX = (a[0] + b[0]) / 2;
            const midY = (a[1] + b[1]) / 2;
            const ms = this.worldToScreen(midX, midY);
            this.drawArrowhead(ms.x, ms.y, Math.atan2(dy, dx), anim.color);
        }

        // 当前部分段箭头（使用屏幕坐标方向）
        if (fullSegments < totalSegments) {
            const a = pts[fullSegments];
            const b = pts[fullSegments + 1];
            const aS = this.worldToScreen(a[0], a[1]);
            const bS = this.worldToScreen(b[0], b[1]);
            const screenAngle = Math.atan2(bS.y - aS.y, bS.x - aS.x);
            this.drawArrowhead(arrowPos.x, arrowPos.y, screenAngle, anim.color);
        } else if (pts.length >= 2) {
            const prev = pts[pts.length - 2];
            const last = pts[pts.length - 1];
            const prevS = this.worldToScreen(prev[0], prev[1]);
            const lastS = this.worldToScreen(last[0], last[1]);
            const screenAngle = Math.atan2(lastS.y - prevS.y, lastS.x - prevS.x);
            this.drawArrowhead(arrowPos.x, arrowPos.y, screenAngle, anim.color);
        }

        ctx.restore();
    },
    
    /**
     * 缓动函数
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    /**
     * 启动投影动画
     */
    startProjectionAnimation(v1, v2, result, onComplete = null) {
        this.animation = {
            type: 'projection',
            v1: v1,
            v2: v2,
            result: result,
            progress: 0,
            startTime: Date.now(),
            duration: 2000 / VisualizationConfig.animationSpeed,
            onComplete: onComplete
        };
        this.animateProjection();
    },
    
    /**
     * 投影动画循环
     */
    animateProjection() {
        if (!this.animation || this.animation.type !== 'projection') return;
        
        const elapsed = Date.now() - this.animation.startTime;
        this.animation.progress = Math.min(elapsed / this.animation.duration, 1);
        
        this.render();
        
        if (this.animation.progress < 1) {
            requestAnimationFrame(() => this.animateProjection());
        } else {
            // 动画完成，添加结果向量
            if (this.animation.onComplete) {
                this.animation.onComplete();
            }
            this.render();
            
            // 保持显示一段时间后清除动画
            setTimeout(() => {
                this.animation = null;
                this.render();
            }, 1500);
        }
    },
    
    /**
     * 绘制投影动画
     */
    drawProjectionAnimation() {
        const ctx = this.ctx;
        const anim = this.animation;
        const progress = this.easeInOutCubic(anim.progress);
        
        const origin = this.worldToScreen(0, 0);
        const v1End = this.worldToScreen(anim.v1[0], anim.v1[1]);
        const v2End = this.worldToScreen(anim.v2[0], anim.v2[1]);
        const resultEnd = this.worldToScreen(anim.result[0], anim.result[1]);
        
        // 阶段1 (0-0.4): 绘制从原点沿v2方向的延长虚线
        if (progress <= 0.4) {
            const phase1Progress = progress / 0.4;
            
            // 计算v2方向上的延长线终点（延长到超过投影点）
            const v2Len = Math.sqrt(anim.v2[0] * anim.v2[0] + anim.v2[1] * anim.v2[1]);
            const resultLen = Math.sqrt(anim.result[0] * anim.result[0] + anim.result[1] * anim.result[1]);
            const extendLen = Math.max(resultLen * 1.3, v2Len * 1.2);
            const extendX = (anim.v2[0] / v2Len) * extendLen;
            const extendY = (anim.v2[1] / v2Len) * extendLen;
            const extendEnd = this.worldToScreen(extendX, extendY);
            
            ctx.setLineDash([6, 3]);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            
            const animatedX = origin.x + (extendEnd.x - origin.x) * phase1Progress;
            const animatedY = origin.y + (extendEnd.y - origin.y) * phase1Progress;
            
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(animatedX, animatedY);
            ctx.stroke();
        } else {
            // 保持显示延长线
            const v2Len = Math.sqrt(anim.v2[0] * anim.v2[0] + anim.v2[1] * anim.v2[1]);
            const resultLen = Math.sqrt(anim.result[0] * anim.result[0] + anim.result[1] * anim.result[1]);
            const extendLen = Math.max(resultLen * 1.3, v2Len * 1.2);
            const extendX = (anim.v2[0] / v2Len) * extendLen;
            const extendY = (anim.v2[1] / v2Len) * extendLen;
            const extendEnd = this.worldToScreen(extendX, extendY);
            
            ctx.setLineDash([6, 3]);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(extendEnd.x, extendEnd.y);
            ctx.stroke();
        }
        
        // 阶段2 (0.3-0.7): 绘制从v1端点到投影点的垂线
        if (progress > 0.3 && progress <= 0.7) {
            const phase2Progress = (progress - 0.3) / 0.4;
            
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            
            const animatedX = v1End.x + (resultEnd.x - v1End.x) * phase2Progress;
            const animatedY = v1End.y + (resultEnd.y - v1End.y) * phase2Progress;
            
            ctx.beginPath();
            ctx.moveTo(v1End.x, v1End.y);
            ctx.lineTo(animatedX, animatedY);
            ctx.stroke();
        } else if (progress > 0.7) {
            // 保持显示垂线
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(v1End.x, v1End.y);
            ctx.lineTo(resultEnd.x, resultEnd.y);
            ctx.stroke();
            
            // 绘制直角标记
            const perpSize = 8;
            const v1ToResult = { x: resultEnd.x - v1End.x, y: resultEnd.y - v1End.y };
            const len = Math.sqrt(v1ToResult.x * v1ToResult.x + v1ToResult.y * v1ToResult.y);
            if (len > 0) {
                const perpDir = { x: v1ToResult.x / len, y: v1ToResult.y / len };
                // v2方向
                const v2Dir = { x: v2End.x - origin.x, y: v2End.y - origin.y };
                const v2Len = Math.sqrt(v2Dir.x * v2Dir.x + v2Dir.y * v2Dir.y);
                if (v2Len > 0) {
                    v2Dir.x /= v2Len;
                    v2Dir.y /= v2Len;
                    
                    ctx.setLineDash([]);
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(resultEnd.x + perpDir.x * perpSize, resultEnd.y + perpDir.y * perpSize);
                    ctx.lineTo(resultEnd.x + perpDir.x * perpSize + v2Dir.x * perpSize, resultEnd.y + perpDir.y * perpSize + v2Dir.y * perpSize);
                    ctx.lineTo(resultEnd.x + v2Dir.x * perpSize, resultEnd.y + v2Dir.y * perpSize);
                    ctx.stroke();
                }
            }
        }
        
        // 阶段3 (0.6-1.0): 高亮投影点
        if (progress > 0.6) {
            const phase3Progress = (progress - 0.6) / 0.4;
            
            ctx.setLineDash([]);
            ctx.fillStyle = '#9b59b6';
            ctx.globalAlpha = phase3Progress;
            ctx.beginPath();
            ctx.arc(resultEnd.x, resultEnd.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        ctx.setLineDash([]);
    },

    /**
     * 绘制网格
     */
    drawGrid() {
        const ctx = this.ctx;
        const config = VisualizationConfig;
        
        // 计算当前视图的可见范围（世界坐标）
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.width, this.height);
        
        const minX = Math.floor(topLeft.x) - 1;
        const maxX = Math.ceil(bottomRight.x) + 1;
        const minY = Math.floor(bottomRight.y) - 1;
        const maxY = Math.ceil(topLeft.y) + 1;
        
        const step = 1;
        
        ctx.lineWidth = 0.5;
        
        // 绘制垂直线
        for (let i = minX; i <= maxX; i += step) {
            // 主网格线（每5个单位）
            if (i % 5 === 0) {
                ctx.strokeStyle = config.colors.gridStrong;
                ctx.lineWidth = 1;
            } else {
                ctx.strokeStyle = config.colors.grid;
                ctx.lineWidth = 0.5;
            }
            
            const vStart = this.worldToScreen(i, minY);
            const vEnd = this.worldToScreen(i, maxY);
            ctx.beginPath();
            ctx.moveTo(vStart.x, vStart.y);
            ctx.lineTo(vEnd.x, vEnd.y);
            ctx.stroke();
        }
        
        // 绘制水平线
        for (let i = minY; i <= maxY; i += step) {
            if (i % 5 === 0) {
                ctx.strokeStyle = config.colors.gridStrong;
                ctx.lineWidth = 1;
            } else {
                ctx.strokeStyle = config.colors.grid;
                ctx.lineWidth = 0.5;
            }
            
            const hStart = this.worldToScreen(minX, i);
            const hEnd = this.worldToScreen(maxX, i);
            ctx.beginPath();
            ctx.moveTo(hStart.x, hStart.y);
            ctx.lineTo(hEnd.x, hEnd.y);
            ctx.stroke();
        }
    },

    /**
     * 绘制坐标轴
     */
    drawAxes() {
        const ctx = this.ctx;
        const config = VisualizationConfig;
        
        // 计算当前视图的可见范围（世界坐标）
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.width, this.height);
        
        const minX = topLeft.x - 1;
        const maxX = bottomRight.x + 1;
        const minY = bottomRight.y - 1;
        const maxY = topLeft.y + 1;
        
        // X轴 - 使用主题色
        ctx.strokeStyle = config.colors.axis;
        ctx.lineWidth = 3.5;
        const xStart = this.worldToScreen(minX, 0);
        const xEnd = this.worldToScreen(maxX, 0);
        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.stroke();
        
        // X轴箭头（只在可见区域内绘制）
        if (maxX > 0) {
            this.drawArrowhead(this.worldToScreen(maxX, 0).x, this.worldToScreen(maxX, 0).y, 0, config.colors.axis);
        }
        
        // Y轴 - 使用主题色
        ctx.strokeStyle = config.colors.axis;
        const yStart = this.worldToScreen(0, minY);
        const yEnd = this.worldToScreen(0, maxY);
        ctx.beginPath();
        ctx.moveTo(yStart.x, yStart.y);
        ctx.lineTo(yEnd.x, yEnd.y);
        ctx.stroke();
        
        // Y轴箭头（只在可见区域内绘制）
        if (maxY > 0) {
            this.drawArrowhead(this.worldToScreen(0, maxY).x, this.worldToScreen(0, maxY).y, -Math.PI / 2, config.colors.axis);
        }
        
        // 绘制刻度标签
        if (config.showLabels) {
            this.drawAxisLabels();
        }
    },

    // 归一化方向向量，避免零长度
    normalizeDir(x, y) {
        const len = Math.sqrt(x * x + y * y) || 1;
        return { x: x / len, y: y / len };
    },

    /**
     * 绘制箭头
     */
    drawArrowhead(x, y, angle, color) {
        const ctx = this.ctx;
        const size = 10;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size / 2);
        ctx.lineTo(-size, size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    /**
     * 绘制坐标轴标签
     */
    drawAxisLabels() {
        const ctx = this.ctx;
        const config = VisualizationConfig;
        
        ctx.fillStyle = config.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // 计算当前视图的可见范围（世界坐标）
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.width, this.height);
        
        const minX = Math.floor(topLeft.x);
        const maxX = Math.ceil(bottomRight.x);
        const minY = Math.floor(bottomRight.y);
        const maxY = Math.ceil(topLeft.y);
        
        // X轴标签
        for (let i = minX; i <= maxX; i += 1) {
            if (i === 0) continue;
            // 只在偶数位置显示标签，避免太密集
            if (i % 2 !== 0) continue;
            const pos = this.worldToScreen(i, 0);
            ctx.fillText(i.toString(), pos.x, pos.y + 5);
        }
        
        // Y轴标签
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = minY; i <= maxY; i += 1) {
            if (i === 0) continue;
            if (i % 2 !== 0) continue;
            const pos = this.worldToScreen(0, i);
            ctx.fillText(i.toString(), pos.x - 5, pos.y);
        }
        
        // 原点标签
        const origin = this.worldToScreen(0, 0);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('O', origin.x - 5, origin.y + 5);
        
        // 轴名称 - 在可见区域的边缘显示
        const xLabelPos = this.worldToScreen(maxX - 0.5, 0);
        const yLabelPos = this.worldToScreen(0, maxY - 0.5);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = config.colors.axis;
        ctx.font = 'bold 14px Arial';
        ctx.fillText('x', xLabelPos.x - 15, xLabelPos.y - 15);
        ctx.fillText('y', yLabelPos.x + 10, yLabelPos.y + 15);
    },

    /**
     * 绘制向量
     */
    drawVector(x, y, color, name = '', isHovered = false) {
        const ctx = this.ctx;
        const start = this.worldToScreen(0, 0);
        const end = this.worldToScreen(x, y);
        
        // 计算向量角度
        const angle = Math.atan2(start.y - end.y, end.x - start.x);
        
        // 悬停时绘制高亮效果
        if (isHovered) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // 绘制向量线
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // 绘制箭头
        this.drawArrowhead(end.x, end.y, -angle, color);
        
        // 绘制端点圆圈（悬停时显示，表示可拖拽）
        if (isHovered) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // 绘制名称标签
        if (name) {
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            
            // 标签位置偏移
            const labelOffset = 10;
            const labelX = end.x + labelOffset * Math.cos(angle - Math.PI / 4);
            const labelY = end.y - labelOffset * Math.sin(angle - Math.PI / 4);
            
            ctx.fillText(name, labelX, labelY);
        }
    },

    /**
     * 绘制图案
     */
    drawShape(shape, isHovered = false) {
        const ctx = this.ctx;
        const points = ShapeManager.getPoints(shape);
        
        if (points.length === 0) return;
        
        // 特殊处理：shapeType='line' 的直线（无限延伸绘制）
        if (shape.shapeType === 'line' && points.length === 2) {
            this.drawInfiniteLine(shape, points, isHovered);
            return;
        }
        
        // 转换为屏幕坐标
        const screenPoints = points.map(p => this.worldToScreen(p[0], p[1]));
        
        // 判断是否闭合
        const isClosed = ShapeManager.isClosed(shape);
        
        // 如果闭合，绘制填充
        if (isClosed && points.length >= 3) {
            ctx.fillStyle = shape.color;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) {
                ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // 绘制边
        if (points.length >= 2) {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) {
                ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            }
            if (isClosed) {
                ctx.closePath();
            }
            ctx.stroke();

            // 轨迹类图案在每段中点绘制方向箭头
            const isTrace = shape.name && shape.name.startsWith('trace_');
            if (isTrace) {
                for (let i = 0; i < points.length - 1; i++) {
                    const a = points[i];
                    const b = points[i + 1];
                    // 计算屏幕坐标方向（Y轴翻转）
                    const aS = this.worldToScreen(a[0], a[1]);
                    const bS = this.worldToScreen(b[0], b[1]);
                    const dx = bS.x - aS.x;
                    const dy = bS.y - aS.y;
                    const midX = (a[0] + b[0]) / 2;
                    const midY = (a[1] + b[1]) / 2;
                    const midS = this.worldToScreen(midX, midY);
                    // 使用屏幕坐标方向计算角度
                    const angle = Math.atan2(dy, dx);
                    this.drawArrowhead(midS.x, midS.y, angle, shape.color);
                }
            }
        }
        
        // 绘制点
        const pointRadius = isHovered ? 5 : 4;
        ctx.fillStyle = shape.color;
        for (let i = 0; i < screenPoints.length; i++) {
            const isPointHovered = isHovered && this.hoverShapePointIndex === i;
            ctx.beginPath();
            ctx.arc(screenPoints[i].x, screenPoints[i].y, isPointHovered ? 7 : pointRadius, 0, Math.PI * 2);
            ctx.fill();
            
            if (isPointHovered) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // 绘制名称标签
        if (shape.name && screenPoints.length > 0) {
            // 找到图案的中心点
            let centerX = 0, centerY = 0;
            for (const p of screenPoints) {
                centerX += p.x;
                centerY += p.y;
            }
            centerX /= screenPoints.length;
            centerY /= screenPoints.length;
            
            ctx.fillStyle = shape.color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(shape.name, centerX, centerY - 10);
        }
    },

    /**
     * 绘制无限长直线（shapeType='line'）
     * @param {object} shape - 图案对象
     * @param {Array} points - 两个控制点
     * @param {boolean} isHovered - 是否悬停
     */
    drawInfiniteLine(shape, points, isHovered = false) {
        const ctx = this.ctx;
        const [p1, p2] = points;
        const [x1, y1] = p1;
        const [x2, y2] = p2;
        
        // 计算直线方程参数
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // 计算延伸到画布边缘的点
        const FAR_DISTANCE = 1000;  // 足够大的距离
        let extendedPoints;
        
        if (Math.abs(dx) < 1e-10) {
            // 竖直线
            extendedPoints = [
                [x1, -FAR_DISTANCE],
                [x1, FAR_DISTANCE]
            ];
        } else {
            // 非竖直线：使用参数方程延伸
            // x = x1 + t * dx, y = y1 + t * dy
            const t1 = -FAR_DISTANCE / Math.sqrt(dx * dx + dy * dy);
            const t2 = FAR_DISTANCE / Math.sqrt(dx * dx + dy * dy);
            extendedPoints = [
                [x1 + t1 * dx, y1 + t1 * dy],
                [x1 + t2 * dx, y1 + t2 * dy]
            ];
        }
        
        // 转换为屏幕坐标
        const screenExtended = extendedPoints.map(p => this.worldToScreen(p[0], p[1]));
        const screenPoints = points.map(p => this.worldToScreen(p[0], p[1]));
        
        // 绘制无限延伸的直线
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(screenExtended[0].x, screenExtended[0].y);
        ctx.lineTo(screenExtended[1].x, screenExtended[1].y);
        ctx.stroke();
        
        // 绘制两个控制点（可拖拽）
        const pointRadius = isHovered ? 6 : 5;
        ctx.fillStyle = shape.color;
        for (let i = 0; i < screenPoints.length; i++) {
            const isPointHovered = isHovered && this.hoverShapePointIndex === i;
            ctx.beginPath();
            ctx.arc(screenPoints[i].x, screenPoints[i].y, isPointHovered ? 8 : pointRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 控制点边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // 绘制名称标签
        if (shape.name && screenPoints.length > 0) {
            // 标签位置：两点中间
            const midX = (screenPoints[0].x + screenPoints[1].x) / 2;
            const midY = (screenPoints[0].y + screenPoints[1].y) / 2;
            
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            // 文字
            ctx.fillStyle = shape.color;
            ctx.fillText(shape.name, midX, midY - 5);
        }
    },

    /**
     * 绘制正在绘制中的图案
     */
    drawCurrentShape() {
        const ctx = this.ctx;
        const points = this.currentShapePoints;
        
        if (points.length === 0) return;
        
        const color = document.getElementById('shapeColor').value || '#e74c3c';
        const screenPoints = points.map(p => this.worldToScreen(p[0], p[1]));
        
        // 绘制边
        if (points.length >= 2) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) {
                ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 绘制点
        ctx.fillStyle = color;
        for (const sp of screenPoints) {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 如果有足够的点，在第一个点周围绘制闭合提示圈
        if (points.length >= 2) {
            const firstPoint = screenPoints[0];
            const closeRadius = ShapeManager.closeThreshold * this.scale;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(firstPoint.x, firstPoint.y, closeRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    },

    /**
     * 检测鼠标位置的图案（点或边）
     * @returns {object|null} { shape, pointIndex } 或 null
     */
    getShapeAtPosition(screenX, screenY) {
        const shapes = ShapeManager.getVisibleShapes('2D');
        
        // 从后往前检测（后添加的在上层）
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            const points = ShapeManager.getPoints(shape);
            const screenPoints = points.map(p => this.worldToScreen(p[0], p[1]));
            
            // 先检测点
            for (let j = 0; j < screenPoints.length; j++) {
                const dx = screenX - screenPoints[j].x;
                const dy = screenY - screenPoints[j].y;
                if (Math.sqrt(dx * dx + dy * dy) <= this.shapePointHitRadius) {
                    return { shape: shape, pointIndex: j };
                }
            }
            
            // 再检测边
            if (screenPoints.length >= 2) {
                for (let j = 0; j < screenPoints.length - 1; j++) {
                    const p1 = screenPoints[j];
                    const p2 = screenPoints[j + 1];
                    const dist = this.pointToLineDistance(screenX, screenY, p1.x, p1.y, p2.x, p2.y);
                    if (dist <= this.shapeEdgeHitDistance) {
                        return { shape: shape, pointIndex: -1 };
                    }
                }
            }
        }
        
        return null;
    },

    /**
     * 计算点到线段的距离
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let t = -1;
        if (lenSq !== 0) {
            t = dot / lenSq;
        }
        
        let xx, yy;
        
        if (t < 0) {
            xx = x1;
            yy = y1;
        } else if (t > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + t * C;
            yy = y1 + t * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 开始绘制图案
     */
    startDrawingShape() {
        this.isDrawingShape = true;
        this.currentShapePoints = [];
        document.getElementById('shapeDrawingHint').style.display = 'block';
        document.getElementById('startDrawShapeBtn').innerHTML = '<i class="bi bi-x-circle"></i> 取消绘制';
        document.getElementById('startDrawShapeBtn').classList.remove('btn-outline-primary');
        document.getElementById('startDrawShapeBtn').classList.add('btn-warning');
        this.canvas.style.cursor = 'crosshair';
    },

    /**
     * 完成绘制图案
     */
    finishDrawingShape() {
        if (this.currentShapePoints.length > 0) {
            const color = document.getElementById('shapeColor').value || '#e74c3c';
            const name = document.getElementById('shapeName').value || null;
            const closed = this.currentShapeClosed || false;
            const newShape = ShapeManager.addShape(this.currentShapePoints, color, name, closed);
            
            // 更新UI
            if (window.App) {
                App.updateShapeList({ addedId: newShape.id });
                App.updateOperationParams(); // 刷新功能函数UI
            }
            
            // 更新颜色选择器
            document.getElementById('shapeColor').value = ShapeManager.getNextColor();
            document.getElementById('shapeName').value = '';
        }
        
        this.currentShapeClosed = false;
        this.cancelDrawingShape();
        this.render();
    },

    /**
     * 取消绘制图案
     */
    cancelDrawingShape() {
        this.isDrawingShape = false;
        this.currentShapePoints = [];
        this.currentShapeClosed = false;
        document.getElementById('shapeDrawingHint').style.display = 'none';
        document.getElementById('startDrawShapeBtn').innerHTML = '<i class="bi bi-pencil"></i> 手动绘制图案';
        document.getElementById('startDrawShapeBtn').classList.remove('btn-warning');
        document.getElementById('startDrawShapeBtn').classList.add('btn-outline-primary');
        this.canvas.style.cursor = 'default';
        this.render();
    },

    /**
     * 重置视图
     */
    resetView() {
        this.panX = 0;
        this.panY = 0;
        this.scale = Math.min(this.width, this.height) / (VisualizationConfig.coordRange * 4);
        this.render();
    },

    /**
     * 绘制子空间网格
     * 子空间由基向量定义，网格线沿基向量方向延伸
     */
    drawSubspaceGrids() {
        const ctx = this.ctx;
        const subspaces = SubspaceManager.getVisibleSubspaces('2D');
        
        if (subspaces.length === 0) return;
        
        // 计算画布边界对应的世界坐标范围
        const centerX = this.width / 2 + this.panX;
        const centerY = this.height / 2 + this.panY;
        const worldLeft = -centerX / this.scale;
        const worldRight = (this.width - centerX) / this.scale;
        const worldTop = centerY / this.scale;
        const worldBottom = -(this.height - centerY) / this.scale;
        
        // 计算需要的范围（确保覆盖整个画布）
        const maxRange = Math.max(
            Math.abs(worldLeft), Math.abs(worldRight),
            Math.abs(worldTop), Math.abs(worldBottom)
        ) * 2;
        
        subspaces.forEach(subspace => {
            const basisVectors = SubspaceManager.getBasisVectors(subspace);
            if (basisVectors.length === 0) return;
            
            ctx.save();
            ctx.strokeStyle = subspace.color;
            ctx.globalAlpha = 0.3;
            
            if (basisVectors.length === 1) {
                // 1D子空间：画一条穿过原点的直线，加粗显示，使用基向量的颜色
                ctx.strokeStyle = basisVectors[0].color;
                ctx.lineWidth = 2.5;
                const v = basisVectors[0].components;
                const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                if (length > 1e-10) {
                    // 计算需要多长才能穿过整个画布
                    const t = maxRange / length;
                    const p1 = this.worldToScreen(-v[0] * t, -v[1] * t);
                    const p2 = this.worldToScreen(v[0] * t, v[1] * t);
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            } else if (basisVectors.length === 2) {
                // 2D子空间：绘制平行四边形网格
                const v1 = basisVectors[0].components;
                const v2 = basisVectors[1].components;
                const color1 = basisVectors[0].color;
                const color2 = basisVectors[1].color;
                
                // 计算需要多少条网格线覆盖整个画布
                const gridCount = Math.ceil(maxRange / Math.min(
                    Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]),
                    Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1])
                )) + 5;
                
                // 沿v1方向的线（从原点沿v1方向） - 加粗显示，使用基向量1的颜色
                ctx.strokeStyle = color1;
                ctx.lineWidth = 2.5;
                for (let i = 0; i <= gridCount; i++) {
                    const startX = -i * v1[0];
                    const startY = -i * v1[1];
                    const endX = i * v1[0];
                    const endY = i * v1[1];
                    
                    const p1 = this.worldToScreen(startX, startY);
                    const p2 = this.worldToScreen(endX, endY);
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                
                // 沿v2方向的线（从原点沿v2方向） - 加粗显示，使用基向量2的颜色
                ctx.strokeStyle = color2;
                ctx.lineWidth = 2.5;
                for (let i = 0; i <= gridCount; i++) {
                    const startX = -i * v2[0];
                    const startY = -i * v2[1];
                    const endX = i * v2[0];
                    const endY = i * v2[1];
                    
                    const p1 = this.worldToScreen(startX, startY);
                    const p2 = this.worldToScreen(endX, endY);
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                
                // 平行于v1的网格线（细线），使用子空间颜色
                ctx.strokeStyle = subspace.color;
                ctx.lineWidth = 1;
                for (let i = -gridCount; i <= gridCount; i++) {
                    if (i === 0) continue; // 跳过已经绘制的中心线
                    const startX = i * v1[0] - gridCount * v2[0];
                    const startY = i * v1[1] - gridCount * v2[1];
                    const endX = i * v1[0] + gridCount * v2[0];
                    const endY = i * v1[1] + gridCount * v2[1];
                    
                    const p1 = this.worldToScreen(startX, startY);
                    const p2 = this.worldToScreen(endX, endY);
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                
                // 平行于v2的网格线（细线）
                ctx.lineWidth = 1;
                for (let i = -gridCount; i <= gridCount; i++) {
                    if (i === 0) continue; // 跳过已经绘制的中心线
                    const startX = i * v2[0] - gridCount * v1[0];
                    const startY = i * v2[1] - gridCount * v1[1];
                    const endX = i * v2[0] + gridCount * v1[0];
                    const endY = i * v2[1] + gridCount * v1[1];
                    
                    const p1 = this.worldToScreen(startX, startY);
                    const p2 = this.worldToScreen(endX, endY);
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
    }
};

// 导出模块
window.Renderer2D = Renderer2D;
