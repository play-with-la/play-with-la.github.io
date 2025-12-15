/**
 * 玩转线性代数 - 向量模块
 * 
 * 提供向量类和向量相关操作
 */

// 向量管理器 - 管理所有向量
const VectorManager = {
    vectors: [],
    nextId: 1,
    colorPalette: [
        '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
        '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'
    ],
    colorIndex: 0,

    /**
     * 获取下一个默认颜色
     */
    getNextColor() {
        const color = this.colorPalette[this.colorIndex];
        this.colorIndex = (this.colorIndex + 1) % this.colorPalette.length;
        return color;
    },

    /**
     * 添加向量
     * @param {number[]} components - 向量分量 [x, y] 或 [x, y, z]
     * @param {string} color - 颜色
     * @param {string} name - 名称
     * @returns {object} 添加的向量对象
     */
    addVector(components, color = null, name = null) {
        const id = this.nextId++;
        const vector = {
            id: id,
            components: [...components],
            originalComponents: [...components], // 保存原始值用于动画
            color: color || this.getNextColor(),
            name: name || `v${id}`,
            visible: true,
            is3D: components.length === 3  // 标记向量维度
        };
        this.vectors.push(vector);
        this.save(); // 保存到localStorage
        return vector;
    },

    /**
     * 删除向量
     * @param {number} id - 向量ID
     */
    removeVector(id) {
        const index = this.vectors.findIndex(v => v.id === id);
        if (index !== -1) {
            this.vectors.splice(index, 1);
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 获取向量
     * @param {number} id - 向量ID
     * @returns {object|null} 向量对象
     */
    getVector(id) {
        return this.vectors.find(v => v.id === id) || null;
    },

    /**
     * 更新向量分量
     * @param {number} id - 向量ID
     * @param {number[]} components - 新的分量
     */
    updateVector(id, components) {
        const vector = this.getVector(id);
        if (vector) {
            vector.components = [...components];
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 清除所有向量
     */
    clearAll() {
        this.vectors = [];
        this.nextId = 1;
        this.colorIndex = 0;
        this.save(); // 保存到localStorage
    },

    /**
     * 保存向量到localStorage
     */
    save() {
        const data = {
            vectors: this.vectors,
            nextId: this.nextId,
            colorIndex: this.colorIndex
        };
        localStorage.setItem('vectors', JSON.stringify(data));
    },

    /**
     * 从localStorage加载向量
     * @returns {boolean} 是否成功加载
     */
    load() {
        const saved = localStorage.getItem('vectors');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.vectors = (data.vectors || []).map(v => ({
                    ...v,
                    // 确保旧数据有默认值
                    visible: v.visible !== undefined ? v.visible : true,
                    is3D: v.is3D !== undefined ? v.is3D : (v.components && v.components.length === 3)
                }));
                this.nextId = data.nextId || 1;
                this.colorIndex = data.colorIndex || 0;
                return this.vectors.length > 0;
            } catch (e) {
                console.error('加载向量数据失败:', e);
                return false;
            }
        }
        return false;
    },

    /**
     * 获取所有可见向量
     * @param {string} mode - 模式过滤 ('2D' 或 '3D')，如果不提供则返回所有可见向量
     * @returns {object[]} 可见向量数组
     */
    getVisibleVectors(mode = null) {
        let filtered = this.vectors.filter(v => v.visible);
        
        // 根据模式过滤
        if (mode) {
            filtered = filtered.filter(vector => {
                if (mode === '3D') {
                    return vector.is3D === true;
                } else {
                    return !vector.is3D;
                }
            });
        }
        
        return filtered;
    },

    /**
     * 切换向量可见性
     * @param {number} id - 向量ID
     */
    toggleVisibility(id) {
        const vector = this.getVector(id);
        if (vector) {
            vector.visible = !vector.visible;
            this.save(); // 保存状态到localStorage
        }
    },

    /**
     * 保存所有向量的当前状态（用于动画）
     */
    saveCurrentState() {
        this.vectors.forEach(v => {
            v.originalComponents = [...v.components];
        });
    },

    /**
     * 恢复所有向量到原始状态
     */
    restoreOriginalState() {
        this.vectors.forEach(v => {
            v.components = [...v.originalComponents];
        });
    }
};

// 向量运算工具
const VectorOperations = {
    /**
     * 向量加法
     * @param {number[]} v1 - 第一个向量
     * @param {number[]} v2 - 第二个向量
     * @returns {number[]} 结果向量
     */
    add(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error('向量维度不匹配');
        }
        return v1.map((val, i) => val + v2[i]);
    },

    /**
     * 向量减法
     * @param {number[]} v1 - 第一个向量
     * @param {number[]} v2 - 第二个向量
     * @returns {number[]} 结果向量
     */
    subtract(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error('向量维度不匹配');
        }
        return v1.map((val, i) => val - v2[i]);
    },

    /**
     * 标量乘法
     * @param {number[]} v - 向量
     * @param {number} scalar - 标量
     * @returns {number[]} 结果向量
     */
    scale(v, scalar) {
        return v.map(val => val * scalar);
    },

    /**
     * 点积
     * @param {number[]} v1 - 第一个向量
     * @param {number[]} v2 - 第二个向量
     * @returns {number} 点积结果
     */
    dot(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error('向量维度不匹配');
        }
        return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    },

    /**
     * 叉积 (仅适用于3D向量)
     * @param {number[]} v1 - 第一个向量
     * @param {number[]} v2 - 第二个向量
     * @returns {number[]} 叉积结果向量
     */
    cross(v1, v2) {
        if (v1.length !== 3 || v2.length !== 3) {
            throw new Error('叉积仅适用于3D向量');
        }
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    },

    /**
     * 向量模长
     * @param {number[]} v - 向量
     * @returns {number} 模长
     */
    magnitude(v) {
        return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    },

    /**
     * 单位化向量
     * @param {number[]} v - 向量
     * @returns {number[]} 单位向量
     */
    normalize(v) {
        const mag = this.magnitude(v);
        if (mag === 0) {
            throw new Error('零向量无法单位化');
        }
        return v.map(val => val / mag);
    },

    /**
     * 向量投影 (v1投影到v2上)
     * @param {number[]} v1 - 要投影的向量
     * @param {number[]} v2 - 投影目标向量
     * @returns {number[]} 投影向量
     */
    project(v1, v2) {
        const dotProduct = this.dot(v1, v2);
        const v2MagSquared = this.dot(v2, v2);
        if (v2MagSquared === 0) {
            throw new Error('无法投影到零向量');
        }
        const scalar = dotProduct / v2MagSquared;
        return this.scale(v2, scalar);
    },

    /**
     * 计算两向量夹角 (弧度)
     * @param {number[]} v1 - 第一个向量
     * @param {number[]} v2 - 第二个向量
     * @returns {number} 夹角（弧度）
     */
    angle(v1, v2) {
        const dotProduct = this.dot(v1, v2);
        const mag1 = this.magnitude(v1);
        const mag2 = this.magnitude(v2);
        if (mag1 === 0 || mag2 === 0) {
            throw new Error('零向量无法计算夹角');
        }
        const cosAngle = Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)));
        return Math.acos(cosAngle);
    },

    /**
     * 线性组合
     * @param {number[][]} vectors - 向量数组
     * @param {number[]} scalars - 标量数组
     * @returns {number[]} 线性组合结果
     */
    linearCombination(vectors, scalars) {
        if (vectors.length !== scalars.length) {
            throw new Error('向量数量和标量数量不匹配');
        }
        if (vectors.length === 0) {
            throw new Error('至少需要一个向量');
        }
        const dim = vectors[0].length;
        const result = new Array(dim).fill(0);
        for (let i = 0; i < vectors.length; i++) {
            for (let j = 0; j < dim; j++) {
                result[j] += vectors[i][j] * scalars[i];
            }
        }
        return result;
    },

    /**
     * 检查向量是否线性无关 (使用math.js)
     * @param {number[][]} vectors - 向量数组
     * @returns {boolean} 是否线性无关
     */
    areLinearlyIndependent(vectors) {
        if (vectors.length === 0) return true;
        if (vectors.length === 1) {
            return this.magnitude(vectors[0]) > 1e-10;
        }
        
        // 构建矩阵并计算秩
        const matrix = math.matrix(vectors);
        const transposed = math.transpose(matrix);
        
        try {
            // 使用QR分解来判断秩
            const dim = vectors[0].length;
            const numVectors = vectors.length;
            
            if (numVectors > dim) {
                return false; // 向量数量超过维度，必然线性相关
            }
            
            // 计算行列式或使用其他方法判断
            if (numVectors === dim) {
                const det = math.det(transposed);
                return Math.abs(det) > 1e-10;
            }
            
            // 对于向量数量小于维度的情况，检查是否有零向量或平行向量
            for (let i = 0; i < vectors.length; i++) {
                if (this.magnitude(vectors[i]) < 1e-10) {
                    return false;
                }
                for (let j = i + 1; j < vectors.length; j++) {
                    // 检查是否平行
                    const v1Norm = this.normalize(vectors[i]);
                    const v2Norm = this.normalize(vectors[j]);
                    const dot = Math.abs(this.dot(v1Norm, v2Norm));
                    if (dot > 1 - 1e-10) {
                        return false;
                    }
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 格式化向量为字符串
     * @param {number[]} v - 向量
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化字符串
     */
    format(v, decimals = 2) {
        const formatted = v.map(val => val.toFixed(decimals)).join(', ');
        return `(${formatted})`;
    },

    /**
     * 格式化向量为LaTeX字符串
     * @param {number[]} v - 向量
     * @param {number} decimals - 小数位数
     * @returns {string} LaTeX字符串
     */
    formatLatex(v, decimals = 2) {
        const formatted = v.map(val => val.toFixed(decimals)).join(' \\\\ ');
        return `\\begin{pmatrix} ${formatted} \\end{pmatrix}`;
    }
};

// 导出模块
window.VectorManager = VectorManager;
window.VectorOperations = VectorOperations;
