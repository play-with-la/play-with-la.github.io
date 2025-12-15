/**
 * 玩转线性代数 - 操作模块
 * 
 * 提供各种线性代数操作的执行和结果展示
 */

// 操作执行器
const Operations = {
    // 操作参数UI配置
    paramConfigs: {
        vector_add: {
            title: '向量加法',
            description: '选择两个向量进行加法运算',
            needsTwoVectors: true,
            modes: ['2D', '3D']
        },
        vector_subtract: {
            title: '向量减法',
            description: '选择两个向量进行减法运算 (v1 - v2)',
            needsTwoVectors: true,
            modes: ['2D', '3D']
        },
        vector_scale: {
            title: '标量乘法',
            description: '选择一个向量，输入标量',
            needsOneVector: true,
            extraParams: [
                { id: 'scalar', label: '标量', type: 'number', default: 2 }
            ],
            modes: ['2D', '3D']
        },
        vector_cross: {
            title: '叉积',
            description: '计算两个3D向量的叉积',
            needsTwoVectors: true,
            modes: ['3D']
        },
        vector_normalize: {
            title: '单位化',
            description: '将选中的向量单位化',
            needsOneVector: true,
            modes: ['2D', '3D']
        },
        vector_projection: {
            title: '向量投影',
            description: '将v1投影到v2上',
            needsTwoVectors: true,
            modes: ['2D', '3D']
        },
        matrix_transform_vector: {
            title: '矩阵变换向量',
            description: '用矩阵左乘向量，得到新向量',
            needsOneMatrix: true,
            needsOneVector: true,
            modes: ['2D', '3D']
        },
        matrix_transform_shape: {
            title: '矩阵变换图案',
            description: '用矩阵左乘图案的坐标矩阵，得到新图案',
            needsOneMatrix: true,
            needsOneShape: true,
            modes: ['2D', '3D']
        },
        matrix_dynamics_trace: {
            title: '动力学轨迹',
            description: '迭代矩阵变换，生成轨迹图案',
            needsOneMatrix: true,
            needsOneVectorOrOneShape: true,
            extraParams: [
                { id: 'iterations', label: '迭代次数', type: 'number', default: 15 }
            ],
            modes: ['2D']
        }
    },

    /**
     * 获取操作参数配置
     * @param {string} operation - 操作名称
     * @returns {object} 参数配置
     */
    getParamConfig(operation) {
        return this.paramConfigs[operation] || { title: operation, description: '' };
    },

    /**
     * 获取当前模式可用的操作列表
     * @param {string} mode - 当前模式 ('2D' 或 '3D')
     * @returns {object[]} 可用操作配置数组
     */
    getAvailableOperations(mode = '2D') {
        const operations = [];
        for (const [key, config] of Object.entries(this.paramConfigs)) {
            if (config.modes && config.modes.includes(mode)) {
                operations.push({ key, ...config });
            }
        }
        return operations;
    },

    /**
     * 生成参数输入UI
     * @param {string} operation - 操作名称
     * @returns {string} HTML字符串
     */
    generateParamsUI(operation, mode = '2D') {
        const config = this.getParamConfig(operation);
        // 根据模式过滤向量
        const vectors = VectorManager.vectors.filter(v => {
            if (mode === '3D') {
                return v.is3D === true;
            } else {
                return !v.is3D;
            }
        });
        let html = `<small class="text-muted">${config.description}</small>`;
        let hasError = false;

        // 需要选择矩阵的操作（先显示矩阵选择）
        if (config.needsOneMatrix) {
            const matrices = MatrixManager.getAllMatrices(mode);
            if (matrices.length === 0) {
                html += `<div class="alert alert-warning mt-2 py-2">请先添加矩阵</div>`;
                hasError = true;
            } else {
                const matrixOptions = matrices.map(m => 
                    `<option value="${m.id}">${m.name} (${m.matrix.length}×${m.matrix.length})</option>`
                ).join('');

                html += `
                    <div class="mt-2">
                        <label class="form-label">选择矩阵</label>
                        <select class="form-select form-select-sm" id="paramMatrix1">
                            <option value="" disabled selected>-- 选择矩阵 --</option>
                            ${matrixOptions}
                        </select>
                    </div>
                `;
            }
        }

        // 需要选择向量的操作
        if (config.needsTwoVectors || config.needsOneVector) {
            if (vectors.length === 0) {
                html += `<div class="alert alert-warning mt-2 py-2">请先添加向量</div>`;
                hasError = true;
            } else {
                const vectorOptions = vectors.map(v => 
                    `<option value="${v.id}">${v.name}</option>`
                ).join('');

                if (config.needsTwoVectors) {
                    html += `
                        <div class="row g-2 mt-2">
                            <div class="col-6">
                                <label class="form-label">向量 1</label>
                                <select class="form-select form-select-sm" id="paramVector1">
                                    <option value="" disabled selected>-- 选择 --</option>
                                    ${vectorOptions}
                                </select>
                            </div>
                            <div class="col-6">
                                <label class="form-label">向量 2</label>
                                <select class="form-select form-select-sm" id="paramVector2">
                                    <option value="" disabled selected>-- 选择 --</option>
                                    ${vectorOptions}
                                </select>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="mt-2">
                            <label class="form-label">选择向量</label>
                            <select class="form-select form-select-sm" id="paramVector1">
                                <option value="" disabled selected>-- 选择向量 --</option>
                                ${vectorOptions}
                            </select>
                        </div>
                    `;
                }
            }
        }

        // 需要选择图案的操作
        if (config.needsOneShape) {
            const shapes = ShapeManager.shapes.filter(s => {
                if (mode === '3D') {
                    return s.is3D === true;
                } else {
                    return !s.is3D;
                }
            });
            if (shapes.length === 0) {
                html += `<div class="alert alert-warning mt-2 py-2">请先添加图案</div>`;
                hasError = true;
            } else {
                const shapeOptions = shapes.map(s => 
                    `<option value="${s.id}">${s.name}</option>`
                ).join('');

                html += `
                    <div class="mt-2">
                        <label class="form-label">选择图案</label>
                        <select class="form-select form-select-sm" id="paramShape1">
                            <option value="" disabled selected>-- 选择图案 --</option>
                            ${shapeOptions}
                        </select>
                    </div>
                `;
            }
        }

        // 需要选择向量或图案的操作
        if (config.needsOneVectorOrOneShape) {
            const vectorsFiltered = VectorManager.vectors.filter(v => {
                if (mode === '3D') {
                    return v.is3D === true;
                } else {
                    return !v.is3D;
                }
            });
            const shapesFiltered = ShapeManager.shapes.filter(s => {
                if (mode === '3D') {
                    return s.is3D === true;
                } else {
                    return !s.is3D;
                }
            });
            const hasVectorOrShape = vectorsFiltered.length > 0 || shapesFiltered.length > 0;
            
            if (!hasVectorOrShape) {
                html += `<div class="alert alert-warning mt-2 py-2">请先添加向量或图案</div>`;
                hasError = true;
            } else {
                let selectOptions = '<option value="" disabled selected>-- 选择向量或图案 --</option>';
                
                // 添加向量选项
                vectorsFiltered.forEach(v => {
                    selectOptions += `<option value="vector_${v.id}">${v.name} (向量)</option>`;
                });
                
                // 添加图案选项
                shapesFiltered.forEach(s => {
                    selectOptions += `<option value="shape_${s.id}">${s.name} (图案)</option>`;
                });

                html += `
                    <div class="mt-2">
                        <label class="form-label">选择向量或图案</label>
                        <select class="form-select form-select-sm" id="paramVectorOrShape1">
                            ${selectOptions}
                        </select>
                    </div>
                `;
            }
        }

        // 额外参数
        if (config.extraParams) {
            config.extraParams.forEach(param => {
                html += `
                    <div class="mt-2">
                        <label class="form-label">${param.label}</label>
                        <input type="${param.type}" class="form-control form-control-sm" 
                               id="param${param.id}" value="${param.default}">
                    </div>
                `;
            });
        }

        // 线性组合需要为每个向量输入标量
        if (config.needsScalars && vectors.length > 0) {
            html += `<div class="mt-2"><label class="form-label">各向量系数</label>`;
            vectors.forEach((v, i) => {
                html += `
                    <div class="input-group input-group-sm mb-1">
                        <span class="input-group-text" style="background-color: ${v.color}; color: white; min-width: 60px;">
                            ${v.name}
                        </span>
                        <input type="number" class="form-control" id="paramScalar${v.id}" value="1">
                    </div>
                `;
            });
            html += `</div>`;
        }

        return html;
    },

    /**
     * 执行操作
     * @param {string} operation - 操作名称
     * @param {string} mode - 当前模式 ('2D' 或 '3D')
     * @returns {object} 执行结果 { success, result, message, latex }
     */
    execute(operation, mode = '2D') {
        this.currentMode = mode; // 保存当前模式供其他方法使用
        if (!operation) {
            return { success: false, message: '请先选择一个操作' };
        }
        try {
            switch (operation) {
                case 'vector_add':
                    return this.executeVectorAdd();
                case 'vector_subtract':
                    return this.executeVectorSubtract();
                case 'vector_scale':
                    return this.executeVectorScale();
                case 'vector_cross':
                    return this.executeVectorCross();
                case 'vector_normalize':
                    return this.executeVectorNormalize();
                case 'vector_projection':
                    return this.executeVectorProjection();
                case 'matrix_transform_vector':
                    return this.executeMatrixTransformVector();
                case 'matrix_transform_shape':
                    return this.executeMatrixTransformShape();
                case 'matrix_dynamics_trace':
                    return this.executeMatrixDynamicsTrace();
                default:
                    return { success: false, message: '未知操作' };
            }
        } catch (e) {
            return { success: false, message: `错误: ${e.message}` };
        }
    },

    // ============================================
    // 向量运算
    // ============================================

    executeVectorAdd() {
        const v1 = this.getSelectedVector('paramVector1');
        const v2 = this.getSelectedVector('paramVector2');
        if (!v1 || !v2) return { success: false, message: '请选择两个向量' };

        const result = VectorOperations.add(v1.components, v2.components);
        const resultName = `${v1.name}+${v2.name}`;
        
        // 启动平行四边形动画，动画结束后添加结果向量
        if (VisualizationConfig.mode === '2D') {
            Renderer2D.startParallelogramAnimation(v1.components, v2.components, result, false, () => {
                const newVector = VectorManager.addVector(result, '#9b59b6', resultName);
                App.updateVectorList({ addedId: newVector.id });
                App.updateOperationParams();
            });
        } else {
            const newVector = VectorManager.addVector(result, '#9b59b6', resultName);
            App.updateVectorList({ addedId: newVector.id });
            Visualization.render();
        }

        return {
            success: true,
            message: `向量加法结果已添加`,
            result: VectorOperations.format(result),
            latex: `${v1.name} + ${v2.name} = ${VectorOperations.formatLatex(result)}`
        };
    },

    executeVectorSubtract() {
        const v1 = this.getSelectedVector('paramVector1');
        const v2 = this.getSelectedVector('paramVector2');
        if (!v1 || !v2) return { success: false, message: '请选择两个向量' };

        const result = VectorOperations.subtract(v1.components, v2.components);
        const resultName = `${v1.name}-${v2.name}`;
        
        // 启动平行四边形动画，动画结束后添加结果向量
        if (VisualizationConfig.mode === '2D') {
            Renderer2D.startParallelogramAnimation(v1.components, v2.components, result, true, () => {
                const newVector = VectorManager.addVector(result, '#e67e22', resultName);
                App.updateVectorList({ addedId: newVector.id });
                App.updateOperationParams();
            });
        } else {
            const newVector = VectorManager.addVector(result, '#e67e22', resultName);
            App.updateVectorList({ addedId: newVector.id });
            Visualization.render();
        }

        return {
            success: true,
            message: `向量减法结果已添加`,
            result: VectorOperations.format(result),
            latex: `${v1.name} - ${v2.name} = ${VectorOperations.formatLatex(result)}`
        };
    },

    executeVectorScale() {
        const v = this.getSelectedVector('paramVector1');
        if (!v) return { success: false, message: '请选择向量' };

        const scalar = parseFloat(document.getElementById('paramscalar')?.value) || 2;
        const result = VectorOperations.scale(v.components, scalar);
        
        const newVector = VectorManager.addVector(result, '#1abc9c', `${scalar}${v.name}`);
        App.updateVectorList({ addedId: newVector.id });
        App.updateOperationParams();
        Visualization.render();

        return {
            success: true,
            message: `标量乘法结果已添加`,
            result: VectorOperations.format(result),
            latex: `${scalar} \\cdot ${v.name} = ${VectorOperations.formatLatex(result)}`
        };
    },

    executeVectorCross() {
        if (VisualizationConfig.mode !== '3D') {
            return { success: false, message: '叉积仅适用于3D模式' };
        }

        const v1 = this.getSelectedVector('paramVector1');
        const v2 = this.getSelectedVector('paramVector2');
        if (!v1 || !v2) return { success: false, message: '请选择两个向量' };

        const result = VectorOperations.cross(v1.components, v2.components);
        
        const newVector = VectorManager.addVector(result, '#f39c12', `${v1.name}×${v2.name}`);
        App.updateVectorList({ addedId: newVector.id });
        App.updateOperationParams();
        Visualization.render();

        return {
            success: true,
            message: `叉积结果已添加`,
            result: VectorOperations.format(result),
            latex: `${v1.name} \\times ${v2.name} = ${VectorOperations.formatLatex(result)}`
        };
    },

    executeVectorNormalize() {
        const v = this.getSelectedVector('paramVector1');
        if (!v) return { success: false, message: '请选择向量' };

        const magnitude = VectorOperations.magnitude(v.components);
        const result = VectorOperations.normalize(v.components);
        
        const newVector = VectorManager.addVector(result, '#3498db', `${v.name}̂`);
        App.updateVectorList({ addedId: newVector.id });
        App.updateOperationParams();
        Visualization.render();

        return {
            success: true,
            message: `单位向量已添加`,
            result: `原模长: ${magnitude.toFixed(4)}, 单位向量: ${VectorOperations.format(result)}`,
            latex: `\\hat{${v.name}} = \\frac{${v.name}}{|${v.name}|} = ${VectorOperations.formatLatex(result)}`
        };
    },

    executeVectorProjection() {
        const v1 = this.getSelectedVector('paramVector1');
        const v2 = this.getSelectedVector('paramVector2');
        if (!v1 || !v2) return { success: false, message: '请选择两个向量' };

        const result = VectorOperations.project(v1.components, v2.components);
        const resultName = `proj_${v2.name}(${v1.name})`;
        
        // 启动投影动画，动画结束后添加结果向量
        if (VisualizationConfig.mode === '2D') {
            Renderer2D.startProjectionAnimation(v1.components, v2.components, result, () => {
                const newVector = VectorManager.addVector(result, '#9b59b6', resultName);
                App.updateVectorList({ addedId: newVector.id });
                App.updateOperationParams();
            });
        } else {
            const newVector = VectorManager.addVector(result, '#9b59b6', resultName);
            App.updateVectorList({ addedId: newVector.id });
            App.updateOperationParams();
            Visualization.render();
        }

        return {
            success: true,
            message: `投影向量已添加`,
            result: VectorOperations.format(result),
            latex: `\\text{proj}_{${v2.name}}(${v1.name}) = ${VectorOperations.formatLatex(result)}`
        };
    },

    // ============================================
    // 矩阵变换
    // ============================================

    /**
     * 矩阵变换向量
     */
    executeMatrixTransformVector() {
        const matrix = this.getSelectedMatrix('paramMatrix1');
        const vector = this.getSelectedVector('paramVector1');
        if (!matrix) return { success: false, message: '请选择矩阵' };
        if (!vector) return { success: false, message: '请选择向量' };

        // 检查维度兼容性
        if (matrix.matrix.length !== vector.components.length) {
            return { success: false, message: `矩阵维度(${matrix.matrix.length})与向量维度(${vector.components.length})不匹配` };
        }

        // 矩阵左乘向量：result = M * v
        const result = this.multiplyMatrixVector(matrix.matrix, vector.components);
        const resultName = `${matrix.name}·${vector.name}`;
        
        const newVector = VectorManager.addVector(result, '#9b59b6', resultName);
        App.updateVectorList({ addedId: newVector.id });
        App.updateOperationParams();
        Visualization.render();

        return {
            success: true,
            message: `变换后的向量已添加`,
            result: VectorOperations.format(result),
            latex: `${matrix.name} \\cdot ${vector.name} = ${VectorOperations.formatLatex(result)}`
        };
    },

    /**
     * 矩阵变换图案
     */
    executeMatrixTransformShape() {
        const matrix = this.getSelectedMatrix('paramMatrix1');
        const shape = this.getSelectedShape('paramShape1');
        if (!matrix) return { success: false, message: '请选择矩阵' };
        if (!shape) return { success: false, message: '请选择图案' };

        // 检查维度兼容性 (2D模式下矩阵是2x2，图案坐标矩阵是2xN)
        if (matrix.matrix.length !== shape.matrix.length) {
            return { success: false, message: `矩阵维度(${matrix.matrix.length})与图案坐标维度(${shape.matrix.length})不匹配` };
        }

        // 矩阵左乘坐标矩阵：newCoords = M * coords
        // shape.matrix 格式: [[x1,x2,...], [y1,y2,...]]
        const newMatrix = this.multiplyMatrixMatrix(matrix.matrix, shape.matrix);
        
        // 将新坐标矩阵转换为点数组
        const newPoints = [];
        const numPoints = newMatrix[0].length;
        for (let i = 0; i < numPoints; i++) {
            if (this.currentMode === '3D' && newMatrix.length === 3) {
                newPoints.push([newMatrix[0][i], newMatrix[1][i], newMatrix[2][i]]);
            } else {
                newPoints.push([newMatrix[0][i], newMatrix[1][i]]);
            }
        }
        
        const resultName = `${matrix.name}·${shape.name}`;
        const newShape = this.currentMode === '3D' && newMatrix.length === 3
            ? ShapeManager.addShape3D(newPoints, null, resultName, shape.closed)
            : ShapeManager.addShape(newPoints, null, resultName, shape.closed);
        App.updateShapeList({ addedId: newShape.id });
        Visualization.render();

        return {
            success: true,
            message: `变换后的图案已添加`,
            result: `新图案 ${resultName} (${numPoints}个顶点)`,
            latex: `${matrix.name} \\cdot ${shape.name} = ${resultName}`
        };
    },

    /**
     * 执行矩阵动力学轨迹
     * 选择矩阵和向量/图案，迭代矩阵乘法15次生成轨迹
     * @returns {object} 执行结果
     */
    executeMatrixDynamicsTrace() {
        const matrix = this.getSelectedMatrix('paramMatrix1');
        const selection = document.getElementById('paramVectorOrShape1')?.value;

        if (!matrix) return { success: false, message: '请选择矩阵' };
        if (!selection) return { success: false, message: '请选择向量或图案' };

        // 解析选择的向量或图案
        const [type, rawId] = selection.split('_');
        const id = parseInt(rawId, 10);
        let initialVector, sourceName;

        if (type === 'vector') {
            const vector = VectorManager.vectors.find(v => v.id === id);
            if (!vector) return { success: false, message: '向量不存在' };
            initialVector = vector.components;
            sourceName = vector.name;
        } else if (type === 'shape') {
            const shape = ShapeManager.shapes.find(s => s.id === id);
            if (!shape) return { success: false, message: '图案不存在' };
            const pts = ShapeManager.getPoints(shape);
            if (!pts.length) return { success: false, message: '图案没有点' };
            // 取第一个点作为初始向量
            initialVector = pts[0];
            sourceName = shape.name;
        } else {
            return { success: false, message: '无效的选择' };
        }

        // 检查维度兼容性
        if (matrix.matrix.length !== initialVector.length) {
            return { success: false, message: `矩阵维度(${matrix.matrix.length})与向量维度(${initialVector.length})不匹配` };
        }

        // 获取迭代次数
        const iterations = parseInt(document.getElementById('paramiterations')?.value) || 15;
        if (iterations < 2 || iterations > 100) {
            return { success: false, message: '迭代次数应在2到100之间' };
        }

        // 迭代生成轨迹点
        const trajectoryPoints = [initialVector.slice()]; // 第一个点是初始向量
        let currentPoint = initialVector.slice();

        for (let i = 0; i < iterations - 1; i++) { // 已有1个点，再迭代(iterations-1)次
            const nextPoint = this.multiplyMatrixVector(matrix.matrix, currentPoint);
            trajectoryPoints.push(nextPoint);
            currentPoint = nextPoint;
        }

        // 创建新的图案
        const resultName = `trace_${sourceName}`;
        const newShape = this.currentMode === '3D' && trajectoryPoints[0].length === 3
            ? ShapeManager.addShape3D(trajectoryPoints, null, resultName, false)
            : ShapeManager.addShape(trajectoryPoints, null, resultName, false);
        App.updateShapeList({ addedId: newShape.id });
        Visualization.render();
        // 启动轨迹绘制动画（仅2D有效）
        if (window.Renderer2D) {
            Renderer2D.startTraceAnimation(newShape, trajectoryPoints);
        }

        return {
            success: true,
            message: `动力学轨迹已生成`,
            result: `轨迹 ${resultName} (${iterations}个顶点)`,
            latex: `${matrix.name}^n \cdot ${sourceName}, n=0,1,...,${iterations - 1}`
        };
    },

    /**
     * 矩阵乘以向量
     * @param {number[][]} matrix - 矩阵
     * @param {number[]} vector - 向量
     * @returns {number[]} 结果向量
     */
    multiplyMatrixVector(matrix, vector) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
            let sum = 0;
            for (let j = 0; j < vector.length; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result.push(sum);
        }
        return result;
    },

    /**
     * 矩阵乘以矩阵
     * @param {number[][]} A - 左矩阵
     * @param {number[][]} B - 右矩阵（可以是坐标矩阵，列数不限）
     * @returns {number[][]} 结果矩阵
     */
    multiplyMatrixMatrix(A, B) {
        const rowsA = A.length;
        const colsA = A[0].length;
        const colsB = B[0].length;
        
        const result = [];
        for (let i = 0; i < rowsA; i++) {
            result[i] = [];
            for (let j = 0; j < colsB; j++) {
                let sum = 0;
                for (let k = 0; k < colsA; k++) {
                    sum += A[i][k] * B[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    },

    // ============================================
    // 辅助方法
    // ============================================

    /**
     * 获取选中的向量
     * @param {string} selectId - 下拉框ID
     * @returns {object|null} 向量对象
     */
    getSelectedVector(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return null;
        const id = parseInt(select.value);
        return VectorManager.getVector(id);
    },

    /**
     * 获取选中的矩阵
     * @param {string} selectId - 下拉框ID
     * @returns {object|null} 矩阵对象
     */
    getSelectedMatrix(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return null;
        const id = parseInt(select.value);
        return MatrixManager.getMatrix(id);
    },

    /**
     * 获取选中的图案
     * @param {string} selectId - 下拉框ID
     * @returns {object|null} 图案对象
     */
    getSelectedShape(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return null;
        const id = parseInt(select.value);
        return ShapeManager.getShape(id);
    },

    /**
     * 显示操作结果
     * @param {object} result - 执行结果
     */
    showResult(result) {
        const resultDiv = document.getElementById('operationResult');
        
        if (!result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-danger mb-0 py-2">
                    <i class="bi bi-exclamation-circle"></i> ${result.message}
                </div>
            `;
        } else {
            let html = `<div class="result-title"><i class="bi bi-check-circle"></i> ${result.message}</div>`;
            
            if (result.result) {
                html += `<div class="result-value">${result.result}</div>`;
            }
            
            if (result.latex) {
                html += `<div class="mt-2" id="latexResult">$${result.latex}$</div>`;
            }
            
            resultDiv.innerHTML = html;
            
            // 触发MathJax渲染
            if (result.latex && window.MathJax) {
                MathJax.typesetPromise([resultDiv]).catch(err => console.log('MathJax error:', err));
            }
        }
        
        resultDiv.style.display = 'block';
    }
};

// 导出模块
window.Operations = Operations;
