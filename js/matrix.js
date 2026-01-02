/**
 * 玩转线性代数 - 矩阵模块
 * 
 * 提供矩阵类和矩阵相关操作
 */

// 矩阵管理器 - 管理多个矩阵
const MatrixManager = {
    matrices: [],
    nextId: 1,
    
    // 矩阵命名索引
    nameIndex: 0,
    
    // 预置矩阵模板
    presets: {
        '2D': [
            { 
                name: 'I', 
                matrix: [[1, 0], [0, 1]],
                description: '单位矩阵'
            },
            { 
                name: 'Rot90', 
                matrix: [[0, -1], [1, 0]],
                description: '旋转90°'
            },
            { 
                name: 'Rot45', 
                matrix: [[0.707, -0.707], [0.707, 0.707]],
                description: '旋转45°'
            },
            { 
                name: 'FlipX', 
                matrix: [[-1, 0], [0, 1]],
                description: '水平翻转'
            },
            { 
                name: 'FlipY', 
                matrix: [[1, 0], [0, -1]],
                description: '垂直翻转'
            },
            { 
                name: 'ShearX', 
                matrix: [[1, 1], [0, 1]],
                description: '水平剪切'
            },
            { 
                name: 'ShearY', 
                matrix: [[1, 0], [1, 1]],
                description: '垂直剪切'
            },
            { 
                name: 'Scale2', 
                matrix: [[2, 0], [0, 2]],
                description: '放大2倍'
            },
            { 
                name: 'Scale0.5', 
                matrix: [[0.5, 0], [0, 0.5]],
                description: '缩小0.5倍'
            },
            { 
                name: 'StretchX', 
                matrix: [[2, 0], [0, 1]],
                description: '水平拉伸'
            },
            { 
                name: 'ProjX', 
                matrix: [[1, 0], [0, 0]],
                description: '投影到X轴'
            },
            { 
                name: 'ProjY', 
                matrix: [[0, 0], [0, 1]],
                description: '投影到Y轴'
            },
            { 
                name: 'Attractor', 
                matrix: [[0.8, 0], [0, 0.5]],
                description: '吸引子'
            },
            { 
                name: 'Repeller', 
                matrix: [[1.5, 0], [0, 1.2]],
                description: '排斥子'
            },
            { 
                name: 'SaddlePoint', 
                matrix: [[2.0, 0], [0, 0.5]],
                description: '鞍点'
            },
            { 
                name: 'Spiral', 
                matrix: [[0.8, 0.5], [-0.1, 1.0]],
                description: '螺旋'
            }
        ],
        '3D': [
            { 
                name: 'I', 
                matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                description: '单位矩阵'
            },
            { 
                name: 'RotZ90', 
                matrix: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
                description: '绕Z轴旋转90°'
            },
            { 
                name: 'Scale2', 
                matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]],
                description: '放大2倍'
            },
            { 
                name: 'ProjXY', 
                matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 0]],
                description: '投影到XY平面'
            },
            { 
                name: 'ProjXZ', 
                matrix: [[1, 0, 0], [0, 0, 0], [0, 0, 1]],
                description: '投影到XZ平面'
            },
            { 
                name: 'ProjYZ', 
                matrix: [[0, 0, 0], [0, 1, 0], [0, 0, 1]],
                description: '投影到YZ平面'
            }
        ]
    },

    /**
     * 获取下一个矩阵名称（A, B, C, ..., Z, AA, AB, ...）
     */
    getNextName() {
        let index = this.nameIndex++;
        let name = '';
        do {
            name = String.fromCharCode(65 + (index % 26)) + name;
            index = Math.floor(index / 26) - 1;
        } while (index >= 0);
        return name;
    },

    /**
     * 添加矩阵
     * @param {number[][]} matrix - 矩阵数据
     * @param {string} name - 名称
     * @param {string} description - 描述
     * @returns {object} 添加的矩阵对象
     */
    addMatrix(matrix, name = null, description = '') {
        const id = this.nextId++;
        const matrixObj = {
            id: id,
            matrix: matrix.map(row => [...row]),
            name: name || this.getNextName(),
            description: description,
            visible: true,
            is3D: matrix.length === 3  // 标记矩阵维度（3x3为3D，2x2为2D）
        };
        this.matrices.push(matrixObj);
        this.save(); // 保存到localStorage
        return matrixObj;
    },

    /**
     * 删除矩阵
     * @param {number} id - 矩阵ID
     */
    removeMatrix(id) {
        const index = this.matrices.findIndex(m => m.id === id);
        if (index !== -1) {
            this.matrices.splice(index, 1);
            this.save(); // 保存到localStorage
        }
    },

    /**
     * 获取矩阵
     * @param {number} id - 矩阵ID
     * @returns {object|null} 矩阵对象
     */
    getMatrix(id) {
        return this.matrices.find(m => m.id === id) || null;
    },

    /**
     * 获取所有矩阵
     * @param {string} mode - 模式过滤 ('2D' 或 '3D')，如果不提供则返回所有矩阵
     * @returns {object[]} 矩阵数组
     */
    getAllMatrices(mode = null) {
        let filtered = this.matrices;
        
        // 根据模式过滤
        if (mode) {
            filtered = filtered.filter(matrix => {
                if (mode === '3D') {
                    return matrix.is3D === true;
                } else {
                    return !matrix.is3D;
                }
            });
        }
        
        return filtered;
    },

    /**
     * 清除所有矩阵
     */
    clearAll() {
        this.matrices = [];
        this.nextId = 1;
        this.nameIndex = 0;
        this.save(); // 保存到localStorage
    },

    /**
     * 保存矩阵到localStorage
     */
    save() {
        const data = {
            matrices: this.matrices,
            nextId: this.nextId,
            nameIndex: this.nameIndex
        };
        localStorage.setItem('matrices', JSON.stringify(data));
    },

    /**
     * 从localStorage加载矩阵
     * @returns {boolean} 是否成功加载
     */
    load() {
        const saved = localStorage.getItem('matrices');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.matrices = data.matrices || [];
                this.nextId = data.nextId || 1;
                this.nameIndex = data.nameIndex || 0;
                return this.matrices.length > 0;
            } catch (e) {
                console.error('加载矩阵数据失败:', e);
                return false;
            }
        }
        return false;
    },

    /**
     * 获取预置矩阵列表
     * @param {string} mode - '2D' 或 '3D'
     * @returns {object[]} 预置矩阵数组
     */
    getPresets(mode) {
        return this.presets[mode] || [];
    },

    /**
     * 格式化矩阵显示
     * @param {number[][]} matrix - 矩阵
     * @returns {string} 格式化的字符串
     */
    formatMatrix(matrix) {
        return matrix.map(row => 
            '[' + row.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(', ') + ']'
        ).join('\n');
    },

    /**
     * 格式化为简短显示
     * @param {number[][]} matrix - 矩阵
     * @returns {string} 简短格式化字符串
     */
    formatShort(matrix) {
        const size = matrix.length;
        return `${size}×${size}`;
    },

    // 兼容旧代码的方法
    matrix2D: [[1, 0], [0, 1]],
    matrix3D: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],

    /**
     * 获取当前矩阵（根据模式）
     * @param {string} mode - '2D' 或 '3D'
     * @returns {number[][]} 当前矩阵
     */
    getCurrentMatrix(mode) {
        return mode === '3D' ? this.matrix3D : this.matrix2D;
    },

    /**
     * 重置为单位矩阵
     * @param {string} mode - '2D' 或 '3D'
     */
    reset(mode) {
        if (mode === '3D') {
            this.matrix3D = [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ];
        } else {
            this.matrix2D = [
                [1, 0],
                [0, 1]
            ];
        }
    },

    /**
     * 从HTML输入读取2D矩阵
     * @returns {number[][]} 2x2矩阵
     */
    readMatrix2DFromInputs() {
        const m00 = parseFloat(document.getElementById('m00').value) || 0;
        const m01 = parseFloat(document.getElementById('m01').value) || 0;
        const m10 = parseFloat(document.getElementById('m10').value) || 0;
        const m11 = parseFloat(document.getElementById('m11').value) || 0;
        
        return [
            [m00, m01],
            [m10, m11]
        ];
    },

    /**
     * 从HTML输入读取3D矩阵
     * @returns {number[][]} 3x3矩阵
     */
    readMatrix3DFromInputs() {
        const matrix = [];
        for (let i = 0; i < 3; i++) {
            const row = [];
            for (let j = 0; j < 3; j++) {
                const value = parseFloat(document.getElementById(`m3d${i}${j}`).value) || 0;
                row.push(value);
            }
            matrix.push(row);
        }
        return matrix;
    },

    /**
     * 将矩阵写入HTML输入
     * @param {number[][]} matrix - 矩阵
     * @param {string} mode - '2D' 或 '3D'
     */
    writeMatrixToInputs(matrix, mode) {
        if (mode === '2D') {
            document.getElementById('m00').value = matrix[0][0];
            document.getElementById('m01').value = matrix[0][1];
            document.getElementById('m10').value = matrix[1][0];
            document.getElementById('m11').value = matrix[1][1];
        } else {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    document.getElementById(`m3d${i}${j}`).value = matrix[i][j];
                }
            }
        }
    }
};

// 矩阵运算工具
const MatrixOperations = {
    /**
     * 矩阵乘法
     * @param {number[][]} A - 第一个矩阵
     * @param {number[][]} B - 第二个矩阵
     * @returns {number[][]} 结果矩阵
     */
    multiply(A, B) {
        const result = math.multiply(A, B);
        return result.toArray ? result.toArray() : result;
    },

    /**
     * 矩阵与向量相乘
     * @param {number[][]} matrix - 矩阵
     * @param {number[]} vector - 向量
     * @returns {number[]} 结果向量
     */
    multiplyVector(matrix, vector) {
        const result = math.multiply(matrix, vector);
        return result.toArray ? result.toArray() : result;
    },

    /**
     * 计算行列式
     * @param {number[][]} matrix - 矩阵
     * @returns {number} 行列式值
     */
    determinant(matrix) {
        return math.det(matrix);
    },

    /**
     * 计算逆矩阵
     * @param {number[][]} matrix - 矩阵
     * @returns {number[][]} 逆矩阵
     */
    inverse(matrix) {
        const det = this.determinant(matrix);
        if (Math.abs(det) < 1e-10) {
            throw new Error('矩阵不可逆（行列式为0）');
        }
        const result = math.inv(matrix);
        return result.toArray ? result.toArray() : result;
    },

    /**
     * 矩阵转置
     * @param {number[][]} matrix - 矩阵
     * @returns {number[][]} 转置矩阵
     */
    transpose(matrix) {
        const result = math.transpose(matrix);
        return result.toArray ? result.toArray() : result;
    },

    /**
     * 计算特征值和特征向量
     * @param {number[][]} matrix - 矩阵
     * @returns {object} { eigenvalues, eigenvectors }
     */
    eigen(matrix) {
        const result = math.eigs(matrix);
        
        // 处理特征值（可能是复数）
        const eigenvalues = result.values.toArray ? result.values.toArray() : result.values;
        
        // 处理特征向量
        const eigenvectorsMatrix = result.eigenvectors;
        const eigenvectors = [];
        
        if (eigenvectorsMatrix) {
            for (let i = 0; i < eigenvectorsMatrix.length; i++) {
                const ev = eigenvectorsMatrix[i];
                eigenvectors.push({
                    value: ev.value,
                    vector: ev.vector.toArray ? ev.vector.toArray() : ev.vector
                });
            }
        }
        
        return {
            eigenvalues: eigenvalues,
            eigenvectors: eigenvectors
        };
    },

    /**
     * 计算矩阵的迹
     * @param {number[][]} matrix - 矩阵
     * @returns {number} 迹
     */
    trace(matrix) {
        return math.trace(matrix);
    },

    /**
     * 计算矩阵的秩
     * @param {number[][]} matrix - 矩阵
     * @returns {number} 秩
     */
    rank(matrix) {
        // 使用SVD分解来计算秩
        try {
            const svd = math.svd ? math.svd(matrix) : null;
            if (svd) {
                const singularValues = svd.S;
                let rank = 0;
                for (let i = 0; i < singularValues.length; i++) {
                    if (Math.abs(singularValues[i]) > 1e-10) {
                        rank++;
                    }
                }
                return rank;
            }
        } catch (e) {
            // 备用方法：使用高斯消元
            const m = matrix.map(row => [...row]);
            const rows = m.length;
            const cols = m[0].length;
            let rank = 0;
            
            for (let col = 0; col < cols && rank < rows; col++) {
                // 找主元
                let pivotRow = -1;
                for (let row = rank; row < rows; row++) {
                    if (Math.abs(m[row][col]) > 1e-10) {
                        pivotRow = row;
                        break;
                    }
                }
                
                if (pivotRow === -1) continue;
                
                // 交换行
                [m[rank], m[pivotRow]] = [m[pivotRow], m[rank]];
                
                // 消元
                for (let row = rank + 1; row < rows; row++) {
                    const factor = m[row][col] / m[rank][col];
                    for (let j = col; j < cols; j++) {
                        m[row][j] -= factor * m[rank][j];
                    }
                }
                
                rank++;
            }
            
            return rank;
        }
        return Math.min(matrix.length, matrix[0].length);
    },

    /**
     * 创建旋转矩阵
     * @param {number} angle - 角度（弧度）
     * @param {string} mode - '2D' 或 '3D'
     * @param {string} axis - 旋转轴 ('x', 'y', 'z')，仅3D模式
     * @returns {number[][]} 旋转矩阵
     */
    createRotationMatrix(angle, mode = '2D', axis = 'z') {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        if (mode === '2D') {
            return [
                [cos, -sin],
                [sin, cos]
            ];
        } else {
            switch (axis.toLowerCase()) {
                case 'x':
                    return [
                        [1, 0, 0],
                        [0, cos, -sin],
                        [0, sin, cos]
                    ];
                case 'y':
                    return [
                        [cos, 0, sin],
                        [0, 1, 0],
                        [-sin, 0, cos]
                    ];
                case 'z':
                default:
                    return [
                        [cos, -sin, 0],
                        [sin, cos, 0],
                        [0, 0, 1]
                    ];
            }
        }
    },

    /**
     * 创建缩放矩阵
     * @param {number} sx - x方向缩放
     * @param {number} sy - y方向缩放
     * @param {number} sz - z方向缩放（3D）
     * @param {string} mode - '2D' 或 '3D'
     * @returns {number[][]} 缩放矩阵
     */
    createScaleMatrix(sx, sy, sz = 1, mode = '2D') {
        if (mode === '2D') {
            return [
                [sx, 0],
                [0, sy]
            ];
        } else {
            return [
                [sx, 0, 0],
                [0, sy, 0],
                [0, 0, sz]
            ];
        }
    },

    /**
     * 创建剪切矩阵
     * @param {number} shx - x方向剪切
     * @param {number} shy - y方向剪切
     * @param {string} mode - '2D' 或 '3D'
     * @returns {number[][]} 剪切矩阵
     */
    createShearMatrix(shx, shy, mode = '2D') {
        if (mode === '2D') {
            return [
                [1, shx],
                [shy, 1]
            ];
        } else {
            return [
                [1, shx, 0],
                [shy, 1, 0],
                [0, 0, 1]
            ];
        }
    },

    /**
     * 创建反射矩阵
     * @param {string} axis - 反射轴 ('x', 'y', 'origin')
     * @param {string} mode - '2D' 或 '3D'
     * @returns {number[][]} 反射矩阵
     */
    createReflectionMatrix(axis, mode = '2D') {
        if (mode === '2D') {
            switch (axis) {
                case 'x':
                    return [[1, 0], [0, -1]];
                case 'y':
                    return [[-1, 0], [0, 1]];
                case 'origin':
                    return [[-1, 0], [0, -1]];
                default:
                    return [[1, 0], [0, 1]];
            }
        } else {
            switch (axis) {
                case 'x':
                    return [[1, 0, 0], [0, -1, 0], [0, 0, -1]];
                case 'y':
                    return [[-1, 0, 0], [0, 1, 0], [0, 0, -1]];
                case 'z':
                    return [[-1, 0, 0], [0, -1, 0], [0, 0, 1]];
                case 'origin':
                    return [[-1, 0, 0], [0, -1, 0], [0, 0, -1]];
                default:
                    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            }
        }
    },

    /**
     * 格式化矩阵为字符串
     * @param {number[][]} matrix - 矩阵
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化字符串
     */
    format(matrix, decimals = 2) {
        return matrix.map(row => 
            '[' + row.map(val => val.toFixed(decimals)).join(', ') + ']'
        ).join('\n');
    },

    /**
     * 格式化矩阵为LaTeX字符串
     * @param {number[][]} matrix - 矩阵
     * @param {number} decimals - 小数位数
     * @returns {string} LaTeX字符串
     */
    formatLatex(matrix, decimals = 2) {
        const rows = matrix.map(row => 
            row.map(val => val.toFixed(decimals)).join(' & ')
        ).join(' \\\\ ');
        return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
    },

    /**
     * 格式化复数特征值
     * @param {*} value - 特征值（可能是复数）
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化字符串
     */
    formatEigenvalue(value, decimals = 4) {
        if (typeof value === 'number') {
            return value.toFixed(decimals);
        }
        if (value.re !== undefined && value.im !== undefined) {
            const re = value.re.toFixed(decimals);
            const im = value.im.toFixed(decimals);
            if (Math.abs(value.im) < 1e-10) {
                return re;
            }
            if (Math.abs(value.re) < 1e-10) {
                return `${im}i`;
            }
            return value.im >= 0 ? `${re} + ${im}i` : `${re} - ${Math.abs(value.im).toFixed(decimals)}i`;
        }
        return String(value);
    }
};

// 导出模块
window.MatrixManager = MatrixManager;
window.MatrixOperations = MatrixOperations;
