/**
 * 玩转线性代数 - 图案模块
 * 
 * 管理由点组成的图案（点、线段、多边形）
 * 每个图案存储为列向量矩阵
 */

// 图案管理器
const ShapeManager = {
    shapes: [],
    nextId: 1,
    
    // 预设颜色
    colors: ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22', '#34495e'],
    colorIndex: 0,
    
    // 图案命名索引（A, B, C, ...）
    nameIndex: 0,

    // 闭合检测的距离阈值（世界坐标）
    closeThreshold: 0.05,

    /**
     * 获取下一个图案名称（shapeA, shapeB, ..., shapeZ, shapeAA, shapeAB, ...）
     */
    getNextName() {
        let index = this.nameIndex++;
        let name = '';
        do {
            name = String.fromCharCode(65 + (index % 26)) + name;
            index = Math.floor(index / 26) - 1;
        } while (index >= 0);
        return 'shape' + name;
    },

    /**
     * 添加图案
     * @param {number[][]} points - 点数组 [[x1,y1], [x2,y2], ...]
     * @param {string} color - 颜色
     * @param {string} name - 名称
     * @param {boolean} closed - 是否闭合
     * @returns {object} 添加的图案对象
     */
    addShape(points, color = null, name = null, closed = false) {
        const id = this.nextId++;
        
        // 将点数组转换为列向量矩阵格式
        // matrix[0] = [x1, x2, x3, ...] (所有x坐标)
        // matrix[1] = [y1, y2, y3, ...] (所有y坐标)
        const matrix = [
            points.map(p => p[0]),  // x坐标行
            points.map(p => p[1])   // y坐标行
        ];
        
        const shape = {
            id: id,
            matrix: matrix,
            color: color || this.getNextColor(),
            name: name || this.getNextName(),
            visible: true,
            closed: closed  // 是否闭合
        };
        
        this.shapes.push(shape);
        this.save(); // 保存到localStorage
        return shape;
    },

    /**
     * 删除图案
     * @param {number} id - 图案ID
     */
    removeShape(id) {
        const index = this.shapes.findIndex(s => s.id === id);
        if (index !== -1) {
            this.shapes.splice(index, 1);
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 获取图案
     * @param {number} id - 图案ID
     * @returns {object|null} 图案对象
     */
    getShape(id) {
        return this.shapes.find(s => s.id === id) || null;
    },

    /**
     * 获取图案的点数组
     * @param {object} shape - 图案对象
     * @returns {number[][]} 点数组 [[x1,y1], [x2,y2], ...]
     */
    getPoints(shape) {
        const points = [];
        const numPoints = shape.matrix[0].length;
        for (let i = 0; i < numPoints; i++) {
            points.push([shape.matrix[0][i], shape.matrix[1][i]]);
        }
        return points;
    },

    /**
     * 更新图案的单个点
     * @param {number} shapeId - 图案ID
     * @param {number} pointIndex - 点索引
     * @param {number} x - 新x坐标
     * @param {number} y - 新y坐标
     */
    updatePoint(shapeId, pointIndex, x, y) {
        const shape = this.getShape(shapeId);
        if (shape && pointIndex >= 0 && pointIndex < shape.matrix[0].length) {
            shape.matrix[0][pointIndex] = x;
            shape.matrix[1][pointIndex] = y;
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 平移整个图案
     * @param {number} shapeId - 图案ID
     * @param {number} dx - x方向偏移
     * @param {number} dy - y方向偏移
     */
    translateShape(shapeId, dx, dy) {
        const shape = this.getShape(shapeId);
        if (shape) {
            for (let i = 0; i < shape.matrix[0].length; i++) {
                shape.matrix[0][i] += dx;
                shape.matrix[1][i] += dy;
            }
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 切换图案可见性
     * @param {number} id - 图案ID
     */
    toggleVisibility(id) {
        const shape = this.getShape(id);
        if (shape) {
            shape.visible = !shape.visible;
            this.save(); // 保存状态到localStorage
        }
    },

    /**
     * 获取可见图案
     * @param {string} mode - 模式过滤 ('2D' 或 '3D')，如果不提供则返回所有可见图案
     * @returns {object[]} 可见图案数组
     */
    getVisibleShapes(mode = null) {
        let filtered = this.shapes.filter(s => s.visible);
        
        // 根据模式过滤
        if (mode) {
            filtered = filtered.filter(shape => {
                if (mode === '3D') {
                    return shape.is3D === true;
                } else {
                    return !shape.is3D;
                }
            });
        }
        
        return filtered;
    },

    /**
     * 清除所有图案
     */
    clearAll() {
        this.shapes = [];
        this.nextId = 1;
        this.colorIndex = 0;
        this.nameIndex = 0;
        this.save(); // 保存到localStorage
    },

    /**
     * 保存图案到localStorage
     */
    save() {
        const data = {
            shapes: this.shapes,
            nextId: this.nextId,
            colorIndex: this.colorIndex,
            nameIndex: this.nameIndex
        };
        localStorage.setItem('shapes', JSON.stringify(data));
    },

    /**
     * 从localStorage加载图案
     * @returns {boolean} 是否成功加载
     */
    load() {
        const saved = localStorage.getItem('shapes');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.shapes = (data.shapes || []).map(s => ({
                    ...s,
                    // 确保旧数据有默认值
                    visible: s.visible !== undefined ? s.visible : true
                }));
                this.nextId = data.nextId || 1;
                this.colorIndex = data.colorIndex || 0;
                this.nameIndex = data.nameIndex || 0;
                return this.shapes.length > 0;
            } catch (e) {
                console.error('加载图案数据失败:', e);
                return false;
            }
        }
        return false;
    },

    /**
     * 获取下一个颜色
     * @returns {string} 颜色值
     */
    getNextColor() {
        const color = this.colors[this.colorIndex % this.colors.length];
        this.colorIndex++;
        return color;
    },

    /**
     * 判断图案是否闭合
     * @param {object} shape - 图案对象
     * @returns {boolean} 是否闭合
     */
    isClosed(shape) {
        return shape.closed === true && shape.matrix[0].length >= 3;
    },

    /**
     * 检测点是否接近第一个点（用于闭合检测）
     * @param {number[][]} points - 已有的点数组
     * @param {number} x - 新点x坐标
     * @param {number} y - 新点y坐标
     * @returns {boolean} 是否接近第一个点
     */
    isNearFirstPoint(points, x, y) {
        if (points.length < 2) return false;
        const dx = Math.abs(x - points[0][0]);
        const dy = Math.abs(y - points[0][1]);
        return dx < this.closeThreshold && dy < this.closeThreshold;
    },

    /**
     * 格式化矩阵显示
     * @param {object} shape - 图案对象
     * @returns {string} 格式化的矩阵字符串
     */
    formatMatrix(shape) {
        const xRow = shape.matrix[0].map(v => v.toFixed(2)).join(', ');
        const yRow = shape.matrix[1].map(v => v.toFixed(2)).join(', ');
        return `[${xRow}]\n[${yRow}]`;
    },

    /**
     * 获取2D预置图形
     * @returns {object[]} 预置图形数组
     */
    get2DPresets() {
        return [
            {
                name: '圆形',
                description: '圆形',
                params: [
                    { name: 'radius', label: '半径', default: 5, min: 0.1, max: 20, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -20, max: 20, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -20, max: 20, step: 0.5 },
                    { name: 'points', label: '点数', default: 80, min: 8, max: 360, step: 1 }
                ],
                generator: (params) => this.generateCircle2D(params.radius, params.points, params.x, params.y)
            }
        ];
    },

    /**
     * 生成2D圆形点
     * @param {number} radius - 半径
     * @param {number} numPoints - 圆周上的点数
     * @param {number} offsetX - X偏移
     * @param {number} offsetY - Y偏移
     * @returns {Array} 点数组
     */
    generateCircle2D(radius, numPoints, offsetX = 0, offsetY = 0) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * 2 * Math.PI) / numPoints;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y]);
        }
        return points;
    },

    /**
     * 获取3D预置图形
     * @returns {object[]} 预置图形数组
     */
    get3DPresets() {
        return [
            {
                name: '球体',
                description: '球体',
                params: [
                    { name: 'radius', label: '半径', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateSphere(params.radius, 96, 64, params.x, params.y, params.z)
            },
            {
                name: '椭球',
                description: '椭球',
                params: [
                    { name: 'radiusX', label: 'X半径', default: 3, min: 0.1, max: 10, step: 0.1 },
                    { name: 'radiusY', label: 'Y半径', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'radiusZ', label: 'Z半径', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateEllipsoid(params.radiusX, params.radiusY, params.radiusZ, 96, 64, params.x, params.y, params.z)
            },
            {
                name: '正方体',
                description: '正方体',
                params: [
                    { name: 'size', label: '边长', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateCube(params.size, params.x, params.y, params.z)
            },
            {
                name: '长方体',
                description: '长方体',
                params: [
                    { name: 'width', label: '宽度', default: 4, min: 0.1, max: 10, step: 0.1 },
                    { name: 'height', label: '高度', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'depth', label: '深度', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateBox(params.width, params.height, params.depth, params.x, params.y, params.z)
            },
            {
                name: '圆柱',
                description: '圆柱',
                params: [
                    { name: 'radius', label: '半径', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'height', label: '高度', default: 4, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateCylinder(params.radius, params.height, 96, params.x, params.y, params.z)
            },
            {
                name: '圆锥',
                description: '圆锥',
                params: [
                    { name: 'radius', label: '底部半径', default: 2, min: 0.1, max: 10, step: 0.1 },
                    { name: 'height', label: '高度', default: 4, min: 0.1, max: 10, step: 0.1 },
                    { name: 'x', label: 'X位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'y', label: 'Y位置', default: 0, min: -10, max: 10, step: 0.5 },
                    { name: 'z', label: 'Z位置', default: 0, min: -10, max: 10, step: 0.5 }
                ],
                generator: (params) => this.generateCone(params.radius, params.height, 96, params.x, params.y, params.z)
            }
        ];
    },

    /**
     * 生成球体点
     */
    generateSphere(radius, segments, rings, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const points = [];
        for (let i = 0; i <= rings; i++) {
            const theta = (i * Math.PI) / rings;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radius * sinTheta * cosPhi + offsetX;
                const y = radius * cosTheta + offsetY;
                const z = radius * sinTheta * sinPhi + offsetZ;
                points.push([x, y, z]);
            }
        }
        return points;
    },

    /**
     * 生成椭球点
     */
    generateEllipsoid(radiusX, radiusY, radiusZ, segments, rings, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const points = [];
        for (let i = 0; i <= rings; i++) {
            const theta = (i * Math.PI) / rings;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let j = 0; j <= segments; j++) {
                const phi = (j * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = radiusX * sinTheta * cosPhi + offsetX;
                const y = radiusY * cosTheta + offsetY;
                const z = radiusZ * sinTheta * sinPhi + offsetZ;
                points.push([x, y, z]);
            }
        }
        return points;
    },

    /**
     * 生成正方体点（带面）
     */
    generateCube(size, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const half = size / 2;
        const points = [];
        const divisions = 8; // 每个面的分割数
        
        // 6个面，每个面生成网格点
        // 前面 (z = -half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -half + (i / divisions) * size + offsetX;
                const y = -half + (j / divisions) * size + offsetY;
                points.push([x, y, -half + offsetZ]);
            }
        }
        
        // 后面 (z = half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -half + (i / divisions) * size + offsetX;
                const y = -half + (j / divisions) * size + offsetY;
                points.push([x, y, half + offsetZ]);
            }
        }
        
        // 左面 (x = -half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const y = -half + (i / divisions) * size + offsetY;
                const z = -half + (j / divisions) * size + offsetZ;
                points.push([-half + offsetX, y, z]);
            }
        }
        
        // 右面 (x = half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const y = -half + (i / divisions) * size + offsetY;
                const z = -half + (j / divisions) * size + offsetZ;
                points.push([half + offsetX, y, z]);
            }
        }
        
        // 底面 (y = -half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -half + (i / divisions) * size + offsetX;
                const z = -half + (j / divisions) * size + offsetZ;
                points.push([x, -half + offsetY, z]);
            }
        }
        
        // 顶面 (y = half)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -half + (i / divisions) * size + offsetX;
                const z = -half + (j / divisions) * size + offsetZ;
                points.push([x, half + offsetY, z]);
            }
        }
        
        return points;
    },

    /**
     * 生成长方体点（带面）
     */
    generateBox(width, height, depth, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const w = width / 2, h = height / 2, d = depth / 2;
        const points = [];
        const divisions = 8; // 每个面的分割数
        
        // 前面 (z = -d)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -w + (i / divisions) * width + offsetX;
                const y = -h + (j / divisions) * height + offsetY;
                points.push([x, y, -d + offsetZ]);
            }
        }
        
        // 后面 (z = d)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -w + (i / divisions) * width + offsetX;
                const y = -h + (j / divisions) * height + offsetY;
                points.push([x, y, d + offsetZ]);
            }
        }
        
        // 左面 (x = -w)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const y = -h + (i / divisions) * height + offsetY;
                const z = -d + (j / divisions) * depth + offsetZ;
                points.push([-w + offsetX, y, z]);
            }
        }
        
        // 右面 (x = w)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const y = -h + (i / divisions) * height + offsetY;
                const z = -d + (j / divisions) * depth + offsetZ;
                points.push([w + offsetX, y, z]);
            }
        }
        
        // 底面 (y = -h)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -w + (i / divisions) * width + offsetX;
                const z = -d + (j / divisions) * depth + offsetZ;
                points.push([x, -h + offsetY, z]);
            }
        }
        
        // 顶面 (y = h)
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -w + (i / divisions) * width + offsetX;
                const z = -d + (j / divisions) * depth + offsetZ;
                points.push([x, h + offsetY, z]);
            }
        }
        
        return points;
    },

    /**
     * 生成圆柱点（侧面平行于Z轴）
     */
    generateCylinder(radius, height, segments, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const points = [];
        const halfHeight = height / 2;
        
        // 底部圆（z = -halfHeight，在XY平面）
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y, -halfHeight + offsetZ]);
        }
        
        // 顶部圆（z = halfHeight，在XY平面）
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y, halfHeight + offsetZ]);
        }
        
        // 侧面点（沿Z轴方向）
        for (let i = 0; i < segments; i += 4) {
            const angle = (i * 2 * Math.PI) / segments;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y, -halfHeight + offsetZ]);
            points.push([x, y, halfHeight + offsetZ]);
        }
        
        return points;
    },

    /**
     * 生成圆锥点（顶点指向Z轴正方向）
     */
    generateCone(radius, height, segments, offsetX = 0, offsetY = 0, offsetZ = 0) {
        const points = [];
        
        // 底部圆（z = 0，在XY平面）
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y, offsetZ]);
        }
        
        // 顶点（指向Z轴正方向）
        const apex = [offsetX, offsetY, height + offsetZ];
        
        // 连接边（从底部圆到顶点）
        for (let i = 0; i < segments; i += 4) {
            const angle = (i * 2 * Math.PI) / segments;
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push([x, y, offsetZ]);
            points.push(apex);
        }
        
        return points;
    },

    /**
     * 添加3D图案（支持3D坐标）
     * @param {number[][]} points - 点数组 [[x1,y1,z1], [x2,y2,z2], ...]
     * @param {string} color - 颜色
     * @param {string} name - 名称
     * @param {boolean} closed - 是否闭合
     * @param {string} shapeType - 图形类型 ('sphere', 'ellipsoid', 'cube', 'box', 'cylinder', 'cone')
     * @param {object} params - 创建参数（如半径、尺寸、位置等）
     * @returns {object} 添加的图案对象
     */
    addShape3D(points, color = null, name = null, closed = false, shapeType = null, params = null) {
        const id = this.nextId++;
        
        // 对于3D图案，矩阵有3行
        // matrix[0] = [x1, x2, x3, ...] (所有x坐标)
        // matrix[1] = [y1, y2, y3, ...] (所有y坐标)
        // matrix[2] = [z1, z2, z3, ...] (所有z坐标)
        const matrix = [
            points.map(p => p[0]),  // x坐标行
            points.map(p => p[1]),  // y坐标行
            points.map(p => p[2] || 0)   // z坐标行
        ];
        
        const shape = {
            id: id,
            matrix: matrix,
            color: color || this.getNextColor(),
            name: name || this.getNextName(),
            visible: true,
            closed: closed,
            is3D: true,  // 标记为3D图案
            shapeType: shapeType,  // 图形类型
            params: params  // 创建参数
        };
        
        this.shapes.push(shape);
        this.save(); // 保存到localStorage
        return shape;
    },

    /**
     * 更新3D图案（重新生成顶点）
     * @param {number} id - 图案ID
     * @param {object} newParams - 新参数
     * @returns {boolean} 是否成功更新
     */
    updateShape3D(id, newParams) {
        const shape = this.getShape(id);
        if (!shape || !shape.is3D || !shape.shapeType) {
            return false;
        }

        // 获取对应的预置图形定义
        const preset = this.getPresetByType(shape.shapeType);
        if (!preset) {
            return false;
        }

        // 使用新参数重新生成顶点
        const points = preset.generator(newParams);
        
        // 更新矩阵
        shape.matrix = [
            points.map(p => p[0]),  // x坐标行
            points.map(p => p[1]),  // y坐标行
            points.map(p => p[2] || 0)   // z坐标行
        ];
        
        // 更新参数
        shape.params = newParams;
        
        this.save(); // 保存到localStorage
        return true;
    },

    /**
     * 根据类型获取预置图形定义
     * @param {string} shapeType - 图形类型
     * @returns {object|null} 预置图形对象
     */
    getPresetByType(shapeType) {
        const presets = this.get3DPresets();
        const typeMap = {
            'sphere': '球体',
            'ellipsoid': '椭球',
            'cube': '正方体',
            'box': '长方体',
            'cylinder': '圆柱',
            'cone': '圆锥'
        };
        const targetName = typeMap[shapeType];
        return presets.find(p => p.name === targetName) || null;
    }
};

// 导出模块
window.ShapeManager = ShapeManager;
