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
        },
        matrix_linear_system: {
            title: '方程组解集',
            description: '2D: 显示直线方程组的解集 | 3D: 显示平面方程组的解集',
            needsOneMatrix: true,
            needsOptionalVector: true,  // 可选的特解向量
            modes: ['2D', '3D']
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

        // 需要选择矩阵的操作（先显示矩阵选择）
        if (config.needsOneMatrix) {
            const matrices = MatrixManager.getAllMatrices(mode);
            if (matrices.length === 0) {
                html += `<div class="alert alert-warning mt-2 py-2">请先添加矩阵</div>`;
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

        // 可选的特解向量（用于方程组解集）
        if (config.needsOptionalVector) {
            const vectorsFiltered = VectorManager.vectors.filter(v => {
                if (mode === '3D') {
                    return v.is3D === true;
                } else {
                    return !v.is3D;
                }
            });
            
            let vectorOptions = '<option value="" selected>零向量（默认）</option>';
            vectorsFiltered.forEach(v => {
                vectorOptions += `<option value="${v.id}">${v.name}</option>`;
            });

            html += `
                <div class="mt-2">
                    <label class="form-label">选择向量（可选）</label>
                    <select class="form-select form-select-sm" id="paramOptionalVector">
                        ${vectorOptions}
                    </select>
                </div>
                <div class="mt-2">
                    <label class="form-label">向量用途</label>
                    <div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vectorUsage" id="vectorUsageSpecial" value="special" checked>
                            <label class="form-check-label" for="vectorUsageSpecial">
                                特解向量（解的一个特殊情况）
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vectorUsage" id="vectorUsageB" value="b">
                            <label class="form-check-label" for="vectorUsageB">
                                向量 $b$（$Ax=b$ 中等号右边的向量）
                            </label>
                        </div>
                    </div>
                </div>
            `;
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
                case 'matrix_linear_system':
                    return this.executeLinearSystemSolution();
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
            latex: `${matrix.name}^n \\cdot ${sourceName}, n=0,1,...,${iterations - 1}`
        };
    },

    /**
     * 方程组解集
     * 2D模式：显示直线方程组（每行对应一条直线）
     * 3D模式：显示平面方程组（每行对应一个平面）
     */
    executeLinearSystemSolution() {
        const matrix = this.getSelectedMatrix('paramMatrix1');
        if (!matrix) return { success: false, message: '请选择系数矩阵' };
        
        const A = matrix.matrix; // m x n 矩阵
        const m = A.length;      // 方程数（行数）
        const n = A[0].length;   // 变量数（列数）
        
        // 检查矩阵维度
        const expectedCols = this.currentMode === '2D' ? 2 : 3;
        if (n !== expectedCols) {
            return { 
                success: false, 
                message: `${this.currentMode}模式下系数矩阵应为 m×${expectedCols}，当前为 ${m}×${n}` 
            };
        }
        
        // 获取向量用途选择
        const vectorUsageSpecial = document.getElementById('vectorUsageSpecial');
        const isSpecialSolution = vectorUsageSpecial && vectorUsageSpecial.checked;
        
        // 获取向量（可选）
        const optionalVectorSelect = document.getElementById('paramOptionalVector');
        let b;  // 等号右边的向量
        let vectorName = null;  // 用于命名前缀
        let isNonZeroVector = false;  // 是否为非零向量
        
        if (optionalVectorSelect && optionalVectorSelect.value) {
            const vectorId = parseInt(optionalVectorSelect.value);
            const vector = VectorManager.getVector(vectorId);
            if (vector) {
                vectorName = vector.name;
                isNonZeroVector = vector.components.some(c => Math.abs(c) > 1e-10);
                
                if (isSpecialSolution) {
                    // 作为特解向量：计算 b = A * x
                    if (vector.components.length !== n) {
                        return { 
                            success: false, 
                            message: `特解向量维度(${vector.components.length})与矩阵列数(${n})不匹配` 
                        };
                    }
                    b = this.multiplyMatrixVector(A, vector.components);
                } else {
                    // 作为向量b：直接使用
                    if (vector.components.length !== m) {
                        return { 
                            success: false, 
                            message: `向量b维度(${vector.components.length})与矩阵行数(${m})不匹配` 
                        };
                    }
                    b = vector.components;
                }
            } else {
                b = new Array(m).fill(0);
            }
        } else {
            // 未选择向量，使用零向量
            if (isSpecialSolution) {
                b = this.multiplyMatrixVector(A, new Array(n).fill(0));
            } else {
                b = new Array(m).fill(0);
            }
        }
        
        // 生成直线/平面并添加到图案列表
        const addedShapes = [];
        const equations = [];
        const FAR_DISTANCE = 1000; // 用于计算足够远的点
        
        for (let i = 0; i < m; i++) {
            const coeffs = A[i]; // 第i行系数
            const bi = b[i];     // 等号右边的值
            
            // 检查系数是否全为0
            const allZero = coeffs.every(c => Math.abs(c) < 1e-10);
            if (allZero) continue; // 跳过零行
            
            if (this.currentMode === '2D') {
                // 2D模式：创建直线 a1*x + a2*y = b
                const [a1, a2] = coeffs;
                const linePoints = this.computeLinePoints(a1, a2, bi, FAR_DISTANCE);
                
                if (linePoints) {
                    // 命名：如果有非零向量，添加向量名前缀
                    const baseLineName = `L${addedShapes.length + 1}`;
                    const lineName = isNonZeroVector ? `${vectorName}+${baseLineName}` : baseLineName;
                    const newShape = ShapeManager.addShape(linePoints, null, lineName, false);
                    addedShapes.push(newShape);
                    
                    // 格式化方程
                    equations.push(this.formatEquation2D(a1, a2, bi));
                }
            } else {
                // 3D模式：创建平面 a1*x + a2*y + a3*z = b
                const [a1, a2, a3] = coeffs;
                const planeShape = this.createPlaneShape(a1, a2, a3, bi, FAR_DISTANCE);
                
                if (planeShape) {
                    // 命名：如果有非零向量，添加向量名前缀
                    const basePlaneName = `P${addedShapes.length + 1}`;
                    const planeName = isNonZeroVector ? `${vectorName}+${basePlaneName}` : basePlaneName;
                    const newShape = ShapeManager.addShape3D(
                        planeShape.points, 
                        null, 
                        planeName, 
                        false,
                        'plane',  // 标记为平面类型
                        { 
                            a: a1, b: a2, c: a3, d: bi,  // 平面方程参数
                            u: planeShape.u,  // 第一个基向量
                            v: planeShape.v,  // 第二个基向量
                            p0: planeShape.p0  // 平面上的一个基点
                        }
                    );
                    addedShapes.push(newShape);
                    
                    // 格式化方程
                    equations.push(this.formatEquation3D(a1, a2, a3, bi));
                }
            }
        }
        
        if (addedShapes.length === 0) {
            return { success: false, message: '无法生成有效的直线/平面（系数矩阵可能为零）' };
        }
        
        // 更新UI
        addedShapes.forEach(shape => {
            App.updateShapeList({ addedId: shape.id });
        });
        App.updateOperationParams();
        Visualization.render();
        
        // 格式化 LaTeX 输出
        const systemType = this.currentMode === '2D' ? '直线' : '平面';
        const latexEqs = equations.join(' \\\\ ');
        
        return {
            success: true,
            message: `已生成 ${addedShapes.length} 条${systemType}`,
            result: equations.join('\n'),
            latex: `\\begin{cases} ${latexEqs} \\end{cases}`
        };
    },

    /**
     * 计算2D直线的两个端点（用于绘制无限长直线）
     * 直线方程: a1*x + a2*y = b
     */
    computeLinePoints(a1, a2, b, farDistance) {
        const points = [];
        
        if (Math.abs(a2) > 1e-10) {
            // 非竖直线：用两个很远的x值计算对应的y
            // y = (b - a1*x) / a2
            const x1 = -farDistance;
            const y1 = (b - a1 * x1) / a2;
            const x2 = farDistance;
            const y2 = (b - a1 * x2) / a2;
            points.push([x1, y1], [x2, y2]);
        } else if (Math.abs(a1) > 1e-10) {
            // 竖直线：x = b / a1
            const x = b / a1;
            points.push([x, -farDistance], [x, farDistance]);
        } else {
            // 系数全为0，无法确定直线
            return null;
        }
        
        return points;
    },

    /**
     * 创建3D平面的点集（用于绘制）
     * 平面方程: a*x + b*y + c*z = d
     */
    createPlaneShape(a, b, c, d, farDistance) {
        // 找到平面的法向量
        const normal = [a, b, c];
        const normalLen = Math.sqrt(a*a + b*b + c*c);
        
        if (normalLen < 1e-10) return null;
        
        // 找到平面上的一个点
        let p0;
        if (Math.abs(c) > 1e-10) {
            p0 = [0, 0, d / c];
        } else if (Math.abs(b) > 1e-10) {
            p0 = [0, d / b, 0];
        } else if (Math.abs(a) > 1e-10) {
            p0 = [d / a, 0, 0];
        } else {
            return null;
        }
        
        // 找到平面上的两个正交基向量
        // 使用 Gram-Schmidt 正交化
        let u, v;
        
        // 选择一个不与法向量平行的向量
        let temp = [1, 0, 0];
        if (Math.abs(a) > Math.abs(b) && Math.abs(a) > Math.abs(c)) {
            temp = [0, 1, 0];
        }
        
        // u = temp - (temp·n/|n|²) * n
        const dotTN = temp[0]*a + temp[1]*b + temp[2]*c;
        const nLen2 = normalLen * normalLen;
        u = [
            temp[0] - (dotTN / nLen2) * a,
            temp[1] - (dotTN / nLen2) * b,
            temp[2] - (dotTN / nLen2) * c
        ];
        const uLen = Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]);
        u = [u[0]/uLen, u[1]/uLen, u[2]/uLen];
        
        // v = n × u (叉积)
        v = [
            (b * u[2] - c * u[1]) / normalLen,
            (c * u[0] - a * u[2]) / normalLen,
            (a * u[1] - b * u[0]) / normalLen
        ];
        
        // 生成平面的四个角点
        const gridSize = farDistance / 2;
        const points = [
            [p0[0] - gridSize*u[0] - gridSize*v[0], p0[1] - gridSize*u[1] - gridSize*v[1], p0[2] - gridSize*u[2] - gridSize*v[2]],
            [p0[0] + gridSize*u[0] - gridSize*v[0], p0[1] + gridSize*u[1] - gridSize*v[1], p0[2] + gridSize*u[2] - gridSize*v[2]],
            [p0[0] + gridSize*u[0] + gridSize*v[0], p0[1] + gridSize*u[1] + gridSize*v[1], p0[2] + gridSize*u[2] + gridSize*v[2]],
            [p0[0] - gridSize*u[0] + gridSize*v[0], p0[1] - gridSize*u[1] + gridSize*v[1], p0[2] - gridSize*u[2] + gridSize*v[2]]
        ];
        
        return { points, u, v, p0 };
    },

    /**
     * 格式化2D方程为字符串
     */
    formatEquation2D(a1, a2, b) {
        let eq = '';
        
        // x项
        if (Math.abs(a1) > 1e-10) {
            if (Math.abs(a1 - 1) < 1e-10) {
                eq += 'x';
            } else if (Math.abs(a1 + 1) < 1e-10) {
                eq += '-x';
            } else {
                eq += `${this.formatNumber(a1)}x`;
            }
        }
        
        // y项
        if (Math.abs(a2) > 1e-10) {
            if (eq && a2 > 0) eq += ' + ';
            else if (eq && a2 < 0) eq += ' - ';
            else if (a2 < 0) eq += '-';
            
            const absA2 = Math.abs(a2);
            if (Math.abs(absA2 - 1) < 1e-10) {
                eq += 'y';
            } else {
                eq += `${this.formatNumber(absA2)}y`;
            }
        }
        
        // 等号右边
        eq += ` = ${this.formatNumber(b)}`;
        
        return eq;
    },

    /**
     * 格式化3D方程为字符串
     */
    formatEquation3D(a1, a2, a3, b) {
        let eq = '';
        
        // x项
        if (Math.abs(a1) > 1e-10) {
            if (Math.abs(a1 - 1) < 1e-10) {
                eq += 'x';
            } else if (Math.abs(a1 + 1) < 1e-10) {
                eq += '-x';
            } else {
                eq += `${this.formatNumber(a1)}x`;
            }
        }
        
        // y项
        if (Math.abs(a2) > 1e-10) {
            if (eq && a2 > 0) eq += ' + ';
            else if (eq && a2 < 0) eq += ' - ';
            else if (a2 < 0) eq += '-';
            
            const absA2 = Math.abs(a2);
            if (Math.abs(absA2 - 1) < 1e-10) {
                eq += 'y';
            } else {
                eq += `${this.formatNumber(absA2)}y`;
            }
        }
        
        // z项
        if (Math.abs(a3) > 1e-10) {
            if (eq && a3 > 0) eq += ' + ';
            else if (eq && a3 < 0) eq += ' - ';
            else if (a3 < 0) eq += '-';
            
            const absA3 = Math.abs(a3);
            if (Math.abs(absA3 - 1) < 1e-10) {
                eq += 'z';
            } else {
                eq += `${this.formatNumber(absA3)}z`;
            }
        }
        
        // 等号右边
        eq += ` = ${this.formatNumber(b)}`;
        
        return eq;
    },

    /**
     * 格式化数字（移除不必要的小数位）
     */
    formatNumber(n) {
        if (Number.isInteger(n)) return n.toString();
        const rounded = Math.round(n * 1000) / 1000;
        return rounded.toString();
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
