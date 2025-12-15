/**
 * 玩转线性代数 - 主应用模块
 * 
 * 整合所有模块，处理用户交互
 */

// ES Module: 引用全局对象
const { VectorManager, VectorOperations, MatrixManager, ShapeManager, SubspaceManager,
        VisualizationConfig, Visualization, Renderer2D, executeOperation } = window;

// 应用状态
const AppState = {
    mode: '2D',
    theme: 'light',
    // 3D图案编辑状态
    shapeEditState: {
        isEditing: false,
        editingShapeId: null,
        originalParams: null
    }
};

// 应用初始化
const App = {
    /**
     * 初始化应用
     */
    init() {
        console.log('线性代数交互式学习系统 - 初始化中...');
        
        // 恢复保存的主题
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            AppState.theme = savedTheme;
            document.body.classList.remove('theme-light', 'theme-dark');
            document.body.classList.add(`theme-${savedTheme}`);
            // 更新单选按钮状态
            const themeRadio = document.getElementById(savedTheme === 'dark' ? 'themeDark' : 'themeLight');
            if (themeRadio) themeRadio.checked = true;
        }
        
        // 恢复保存的显示模式
        const savedMode = localStorage.getItem('displayMode');
        if (savedMode && (savedMode === '2D' || savedMode === '3D')) {
            AppState.mode = savedMode;
            // 更新单选按钮状态
            const modeRadio = document.getElementById(savedMode === '3D' ? 'mode3D' : 'mode2D');
            if (modeRadio) modeRadio.checked = true;
            
            // 切换输入界面和系统设置开关
            if (savedMode === '3D') {
                document.getElementById('vector2DInput').style.display = 'none';
                document.getElementById('vector3DInput').style.display = 'block';
                document.getElementById('matrix2DInput').style.display = 'none';
                document.getElementById('matrix3DInput').style.display = 'block';
                // 切换系统设置开关显示
                document.getElementById('showLabelsSwitch').style.display = 'none';
                document.getElementById('showZGridsSwitch').style.display = 'block';
            } else {
                // 2D模式确保显示正确的开关
                document.getElementById('showLabelsSwitch').style.display = 'block';
                document.getElementById('showZGridsSwitch').style.display = 'none';
            }
        }
        
        // 初始化可视化系统（使用恢复的模式）
        Visualization.init();
        if (savedMode) {
            Visualization.setMode(savedMode);
        }
        
        // 应用保存的主题到可视化
        if (savedTheme) {
            VisualizationConfig.updateTheme(savedTheme);
        }
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 恢复系统设置（在模式切换和事件绑定之后）
        this.loadSystemSettings();
        
        // 更新预置矩阵（根据恢复的模式）
        this.updateMatrixPresets();
        
        // 更新预置图形（根据恢复的模式）
        this.updateShapePresets();
        
        // 从localStorage加载数据，如果没有则添加示例向量
        this.loadSavedData();
        
        // 重置操作选择下拉框（防止浏览器自动填充）
        document.getElementById('operationSelect').selectedIndex = 0;
        
        // 重置预置矩阵下拉框
        document.getElementById('matrixPresetSelect').selectedIndex = 0;
        
        // 重置矩阵运算下拉框
        document.getElementById('matrixOperationSelect').selectedIndex = 0;
        
        // 初始化操作列表
        this.updateOperationList();
        
        // 初始化操作参数UI
        this.updateOperationParams();
        
        // 初始渲染
        Visualization.render();
        
        console.log('初始化完成!');
    },

    /**
     * 从localStorage加载保存的数据
     */
    loadSavedData() {
        // 尝试加载向量
        const hasVectors = VectorManager.load();
        // 尝试加载矩阵
        const hasMatrices = MatrixManager.load();
        // 尝试加载图案
        const hasShapes = ShapeManager.load();
        
        // 更新向量列表
        this.updateVectorList();
        
        // 更新矩阵列表
        if (hasMatrices) {
            this.updateMatrixList();
        }
        
        // 更新图案列表（会根据当前模式自动过滤显示）
        if (hasShapes) {
            this.updateShapeList();
        }

        // 尝试加载子空间
        SubspaceManager.load();
        
        // 更新子空间列表（同时会更新向量选择下拉框）
        this.updateSubspaceList();
    },

    /**
     * 绑定所有事件监听器
     */
    bindEventListeners() {
        // ============================================
        // 系统设置
        // ============================================
        
        // 2D/3D 模式切换
        document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchMode(e.target.value);
            });
        });

        // 网格显示
        document.getElementById('showGrid').addEventListener('change', (e) => {
            VisualizationConfig.showGrid = e.target.checked;
            Visualization.render();
            this.saveSystemSettings();
        });

        // 坐标轴显示
        document.getElementById('showAxes').addEventListener('change', (e) => {
            VisualizationConfig.showAxes = e.target.checked;
            Visualization.render();
            this.saveSystemSettings();
        });

        // 刻度标签显示
        document.getElementById('showLabels').addEventListener('change', (e) => {
            VisualizationConfig.showLabels = e.target.checked;
            Visualization.render();
            this.saveSystemSettings();
        });

        // Z轴网格显示
        document.getElementById('showZGrids').addEventListener('change', (e) => {
            VisualizationConfig.showZGrids = e.target.checked;
            Visualization.render();
            this.saveSystemSettings();
        });

        // 动画速度
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            VisualizationConfig.animationSpeed = speed;
            document.getElementById('speedValue').textContent = speed.toFixed(1);
            this.saveSystemSettings();
        });

        // 重置视图按钮
        document.getElementById('resetViewBtn').addEventListener('click', () => {
            Visualization.resetView();
        });

        // 颜色主题
        document.querySelectorAll('input[name="colorTheme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchTheme(e.target.value);
            });
        });

        // ============================================
        // 向量管理
        // ============================================

        // 添加向量按钮
        document.getElementById('addVectorBtn').addEventListener('click', () => {
            this.addVectorFromInputs();
        });

        // 清除所有向量按钮
        document.getElementById('clearVectorsBtn').addEventListener('click', () => {
            VectorManager.clearAll();
            SubspaceManager.clearAll(); // 所有子空间都依赖向量，一起清除
            this.updateVectorList();
            this.updateSubspaceVectorSelect();
            this.updateSubspaceList();
            this.updateOperationParams();
            Visualization.render();
        });

        // 向量输入框回车键添加和聚焦全选
        ['vectorX', 'vectorY', 'vectorX3D', 'vectorY3D', 'vectorZ3D'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addVectorFromInputs();
                    }
                });
                // 聚焦时全选内容
                input.addEventListener('focus', () => {
                    input.select();
                });
            }
        });

        // 矩阵输入框聚焦全选
        document.querySelectorAll('.matrix-cell').forEach(input => {
            input.addEventListener('focus', () => {
                input.select();
            });
        });

        // 其他数字输入框聚焦全选
        ['paramscalar'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('focus', () => {
                    input.select();
                });
            }
        });

        // ============================================
        // 矩阵管理
        // ============================================

        // 预置矩阵选择
        document.getElementById('matrixPresetSelect').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index) && index >= 0) {
                const preset = MatrixManager.getPresets(AppState.mode)[index];
                if (preset) {
                    // 填充到输入框
                    MatrixManager.writeMatrixToInputs(preset.matrix, AppState.mode);
                    document.getElementById('matrixName').value = preset.name;
                }
            }
            // 不再重置选择，保持当前选中项
        });

        // 添加矩阵按钮
        document.getElementById('addMatrixBtn').addEventListener('click', () => {
            const matrix = AppState.mode === '3D' 
                ? MatrixManager.readMatrix3DFromInputs() 
                : MatrixManager.readMatrix2DFromInputs();
            const name = document.getElementById('matrixName').value || null;
            const newMatrix = MatrixManager.addMatrix(matrix, name);
            
            this.updateMatrixList({ addedId: newMatrix.id });
            this.updateMatrixOperationParams(); // 刷新矩阵运算UI
            this.updateOperationParams(); // 刷新功能函数UI
            document.getElementById('matrixName').value = '';
            
            // 重置输入框为单位矩阵
            MatrixManager.reset(AppState.mode);
            MatrixManager.writeMatrixToInputs(
                AppState.mode === '3D' ? MatrixManager.matrix3D : MatrixManager.matrix2D, 
                AppState.mode
            );
        });

        // 清除所有矩阵按钮
        document.getElementById('clearMatricesBtn').addEventListener('click', () => {
            MatrixManager.clearAll();
            this.updateMatrixList();
            this.updateMatrixOperationParams();
            this.updateOperationParams(); // 刷新功能函数UI
        });

        // 矩阵运算选择
        document.getElementById('matrixOperationSelect').addEventListener('change', () => {
            this.updateMatrixOperationParams();
        });

        // 执行矩阵运算按钮
        document.getElementById('executeMatrixOpBtn').addEventListener('click', () => {
            this.executeMatrixOperation();
        });

        // 初始化预置矩阵下拉框
        this.updateMatrixPresets();
        
        // 初始化矩阵运算参数
        this.updateMatrixOperationParams();

        // ============================================
        // 功能函数
        // ============================================

        // 操作选择下拉框
        document.getElementById('operationSelect').addEventListener('change', () => {
            this.updateOperationParams();
        });

        // 执行操作按钮
        document.getElementById('executeOperationBtn').addEventListener('click', () => {
            const operation = document.getElementById('operationSelect').value;
            const result = Operations.execute(operation, AppState.mode);
            Operations.showResult(result);
            
            // 更新向量列表（如果操作添加了新向量）
            this.updateVectorList();
            this.updateSubspaceVectorSelect(); // 更新空间管理标签页中的向量列表
            this.updateOperationParams();
        });

        // ============================================
        // 图案管理
        // ============================================

        // 开始绘制图案按钮
        document.getElementById('startDrawShapeBtn').addEventListener('click', () => {
            if (Renderer2D.isDrawingShape) {
                Renderer2D.cancelDrawingShape();
            } else {
                Renderer2D.startDrawingShape();
            }
        });

        // 清除所有图案按钮
        document.getElementById('clearShapesBtn').addEventListener('click', () => {
            ShapeManager.clearAll();
            this.updateShapeList();
            this.updateOperationParams(); // 刷新功能函数UI
            Visualization.render();
        });

        // 预置图形选择变化时显示参数
        document.getElementById('shapePresetSelect').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (isNaN(index) || index < 0) {
                document.getElementById('shapeParamsContainer').style.display = 'none';
                return;
            }

            const presets = ShapeManager.get3DPresets();
            if (index >= presets.length) return;

            const preset = presets[index];
            this.updateShapeParams(preset);
        });

        // 添加预置图形按钮
        document.getElementById('addPresetShapeBtn').addEventListener('click', () => {
            // 判断是编辑模式还是添加模式
            if (AppState.shapeEditState.isEditing) {
                this.saveShapeEdit();
                return;
            }

            const select = document.getElementById('shapePresetSelect');
            const index = parseInt(select.value);
            if (isNaN(index) || index < 0) return;

            const presets = ShapeManager.get3DPresets();
            if (index >= presets.length) return;

            const preset = presets[index];
            
            // 收集参数
            const params = {};
            preset.params.forEach(param => {
                const input = document.getElementById(`shapeParam_${param.name}`);
                params[param.name] = parseFloat(input.value) || param.default;
            });

            const points = preset.generator(params);
            const color = document.getElementById('shapeColor3D').value;
            const customName = document.getElementById('shapeName3D').value.trim();
            const name = customName || preset.name;

            // 确定shapeType（使用英文key）
            const typeMap = {
                '球体': 'sphere',
                '椭球': 'ellipsoid',
                '正方体': 'cube',
                '长方体': 'box',
                '圆柱': 'cylinder',
                '圆锥': 'cone'
            };
            const shapeType = typeMap[preset.name];

            ShapeManager.addShape3D(points, color, name, false, shapeType, params);
            this.updateShapeList({ addedId: ShapeManager.shapes[ShapeManager.shapes.length - 1].id });
            this.updateOperationParams();
            Visualization.render();

            // 清空输入，切换颜色
            document.getElementById('shapeName3D').value = '';
            document.getElementById('shapeColor3D').value = ShapeManager.getNextColor();
            select.selectedIndex = 0;
            document.getElementById('shapeParamsContainer').style.display = 'none';
        });

        // ======== 子空间管理事件绑定 ========
        
        // 添加子空间按钮
        document.getElementById('addSubspaceBtn').addEventListener('click', () => {
            const select = document.getElementById('subspaceVectorSelect');
            const selectedOptions = Array.from(select.selectedOptions);
            const basisVectorIds = selectedOptions.map(opt => parseInt(opt.value));
            
            if (basisVectorIds.length === 0) {
                alert('请选择至少一个基向量');
                return;
            }
            
            // 在2D模式下最多2个，3D模式下最多3个
            const is3DMode = AppState.mode === '3D';
            const maxBasis = is3DMode ? 3 : 2;
            if (basisVectorIds.length > maxBasis) {
                alert(`${is3DMode ? '3D' : '2D'}模式下最多选择${maxBasis}个基向量`);
                return;
            }
            
            const color = document.getElementById('subspaceColor').value;
            const name = document.getElementById('subspaceName').value.trim() || null;
            
            const result = SubspaceManager.addSubspace(basisVectorIds, color, name, AppState.mode === '3D');
            if (result) {
                this.updateSubspaceList();
                Visualization.render();
                
                // 清空输入
                document.getElementById('subspaceName').value = '';
                document.getElementById('subspaceColor').value = SubspaceManager.getNextColor();
                // 清除选中状态
                Array.from(select.options).forEach(opt => opt.selected = false);
            } else {
                alert('所选向量线性相关，无法构成基');
            }
        });
        
        // 清除所有子空间按钮
        document.getElementById('clearSubspacesBtn').addEventListener('click', () => {
            SubspaceManager.clearAll();
            this.updateSubspaceList();
            Visualization.render();
        });

        // 子空间列表点击事件代理
        document.getElementById('subspaceList').addEventListener('click', (e) => {
            const target = e.target;
            const item = target.closest('.subspace-item');
            if (!item) return;
            
            const id = parseInt(item.dataset.id);
            
            // 可见性切换 - 检查是否点击了toggle-visibility按钮或其内部图标
            if (target.closest('.toggle-visibility')) {
                SubspaceManager.toggleVisibility(id);
                this.updateSubspaceList();
                Visualization.render();
            }
            
            // 删除子空间 - 检查是否点击了delete-item按钮或其内部图标
            if (target.closest('.delete-item')) {
                SubspaceManager.removeSubspace(id);
                this.updateSubspaceList();
                Visualization.render();
            }
        });
    },

    /**
     * 加载系统设置
     */
    loadSystemSettings() {
        const settings = localStorage.getItem('systemSettings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                
                // 恢复显示网格设置
                if (parsed.showGrid !== undefined) {
                    VisualizationConfig.showGrid = parsed.showGrid;
                    document.getElementById('showGrid').checked = parsed.showGrid;
                }
                
                // 恢复显示坐标轴设置
                if (parsed.showAxes !== undefined) {
                    VisualizationConfig.showAxes = parsed.showAxes;
                    document.getElementById('showAxes').checked = parsed.showAxes;
                }
                
                // 恢复显示刻度标签设置
                if (parsed.showLabels !== undefined) {
                    VisualizationConfig.showLabels = parsed.showLabels;
                    document.getElementById('showLabels').checked = parsed.showLabels;
                }
                
                // 恢复显示Z轴网格设置
                if (parsed.showZGrids !== undefined) {
                    VisualizationConfig.showZGrids = parsed.showZGrids;
                    document.getElementById('showZGrids').checked = parsed.showZGrids;
                }
                
                // 恢复动画速度设置
                if (parsed.animationSpeed !== undefined) {
                    VisualizationConfig.animationSpeed = parsed.animationSpeed;
                    document.getElementById('animationSpeed').value = parsed.animationSpeed;
                    document.getElementById('speedValue').textContent = parsed.animationSpeed.toFixed(1);
                }
                
                // 重新渲染
                Visualization.render();
            } catch (e) {
                console.error('加载系统设置失败:', e);
            }
        }
    },

    /**
     * 保存系统设置
     */
    saveSystemSettings() {
        const settings = {
            showGrid: VisualizationConfig.showGrid,
            showAxes: VisualizationConfig.showAxes,
            showLabels: VisualizationConfig.showLabels,
            showZGrids: VisualizationConfig.showZGrids,
            animationSpeed: VisualizationConfig.animationSpeed
        };
        localStorage.setItem('systemSettings', JSON.stringify(settings));
    },

    /**
     * 切换2D/3D模式
     */
    switchMode(mode) {
        AppState.mode = mode;
        
        // 保存到localStorage
        localStorage.setItem('displayMode', mode);
        
        // 切换向量输入界面和系统设置开关
        if (mode === '3D') {
            document.getElementById('vector2DInput').style.display = 'none';
            document.getElementById('vector3DInput').style.display = 'block';
            document.getElementById('matrix2DInput').style.display = 'none';
            document.getElementById('matrix3DInput').style.display = 'block';
            // 切换系统设置开关，并确保状态正确
            document.getElementById('showLabelsSwitch').style.display = 'none';
            const showZGridsSwitch = document.getElementById('showZGridsSwitch');
            showZGridsSwitch.style.display = 'block';
            // 确保开关状态与配置同步
            document.getElementById('showZGrids').checked = VisualizationConfig.showZGrids;
        } else {
            document.getElementById('vector2DInput').style.display = 'block';
            document.getElementById('vector3DInput').style.display = 'none';
            document.getElementById('matrix2DInput').style.display = 'block';
            document.getElementById('matrix3DInput').style.display = 'none';
            // 切换系统设置开关，并确保状态正确
            const showLabelsSwitch = document.getElementById('showLabelsSwitch');
            showLabelsSwitch.style.display = 'block';
            document.getElementById('showZGridsSwitch').style.display = 'none';
            // 确保开关状态与配置同步
            document.getElementById('showLabels').checked = VisualizationConfig.showLabels;
        }

        // 保留向量和矩阵，不清除
        this.updateVectorList();
        this.updateMatrixList();
        this.updateMatrixPresets();
        
        // 图案不清除，只是根据模式过滤显示
        // 更新图案列表（会自动根据模式过滤）
        this.updateShapeList();
        
        // 更新子空间列表（会自动根据模式过滤）
        this.updateSubspaceList();
        
        // 更新预置图形
        this.updateShapePresets();
        
        // 切换可视化模式
        Visualization.setMode(mode);
        
        // 更新操作列表
        this.updateOperationList();
        
        // 更新操作参数
        this.updateOperationParams();
    },

    /**
     * 切换颜色主题
     */
    switchTheme(theme) {
        AppState.theme = theme;
        
        // 保存到localStorage
        localStorage.setItem('theme', theme);
        
        // 切换body类
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        
        // 更新可视化颜色
        Visualization.updateTheme(theme);
    },

    /**
     * 从输入框添加向量
     */
    addVectorFromInputs() {
        const mode = AppState.mode;
        let components;
        
        if (mode === '3D') {
            const x = parseFloat(document.getElementById('vectorX3D').value) || 0;
            const y = parseFloat(document.getElementById('vectorY3D').value) || 0;
            const z = parseFloat(document.getElementById('vectorZ3D').value) || 0;
            components = [x, y, z];
        } else {
            const x = parseFloat(document.getElementById('vectorX').value) || 0;
            const y = parseFloat(document.getElementById('vectorY').value) || 0;
            components = [x, y];
        }

        const color = document.getElementById('vectorColor').value;
        const name = document.getElementById('vectorName').value || null;

        const newVector = VectorManager.addVector(components, color, name);
        
        // 更新UI，传递新添加的向量ID以触发动画
        this.updateVectorList({ addedId: newVector.id });
        this.updateOperationParams();
        this.updateSubspaceVectorSelect();
        
        // 清空名称输入
        document.getElementById('vectorName').value = '';
        
        // 更新颜色选择器为下一个颜色
        document.getElementById('vectorColor').value = VectorManager.getNextColor();
        
        // 渲染
        Visualization.render();
    },

    /**
     * 更新向量列表UI
     */
    updateVectorList(options = {}) {
        const container = document.getElementById('vectorList');
        const vectors = VectorManager.vectors.filter(v => {
            if (AppState.mode === '3D') {
                return v.is3D === true;
            } else {
                return !v.is3D;
            }
        });
        const { animate = true, addedId = null, removedId = null } = options;

        if (vectors.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-2 vector-list-empty">暂无向量</div>';
            return;
        }

        // 如果是删除操作，先播放删除动画
        if (removedId !== null) {
            const itemToRemove = container.querySelector(`.vector-item[data-id="${removedId}"]`);
            if (itemToRemove) {
                itemToRemove.classList.add('removing');
                setTimeout(() => this.rebuildVectorList(container, vectors, null), 200);
                return;
            }
        }

        this.rebuildVectorList(container, vectors, animate ? addedId : null);
    },

    /**
     * 重建向量列表
     */
    rebuildVectorList(container, vectors, addedId) {
        container.innerHTML = vectors.map(v => `
            <div class="vector-item${addedId === v.id ? ' adding' : ''}" data-id="${v.id}">
                <div class="vector-info">
                    <span class="vector-color" style="background-color: ${v.color};"></span>
                    <span class="vector-name" title="双击重命名">${v.name}</span>
                    <span class="vector-coords" title="双击编辑">${VectorOperations.format(v.components)}</span>
                </div>
                <div class="vector-actions">
                    <button class="btn btn-outline-secondary btn-sm toggle-visibility" 
                            title="${v.visible ? '隐藏' : '显示'}">
                        <i class="bi bi-${v.visible ? 'eye' : 'eye-slash'}"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-vector" title="删除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定向量操作按钮事件
        container.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const vectorItem = e.target.closest('.vector-item');
                const id = parseInt(vectorItem.dataset.id);
                VectorManager.toggleVisibility(id);
                
                // 只更新图标，不重建整个列表
                const icon = vectorItem.querySelector('.toggle-visibility i');
                const vector = VectorManager.getVector(id);
                if (icon && vector) {
                    icon.className = `bi bi-${vector.visible ? 'eye' : 'eye-slash'}`;
                    btn.title = vector.visible ? '隐藏' : '显示';
                }
                
                Visualization.render();
            });
        });

        container.querySelectorAll('.delete-vector').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.closest('.vector-item').dataset.id);
                
                // 删除引用该向量的子空间
                const deletedSubspaceIds = SubspaceManager.onVectorDeleted(id);
                if (deletedSubspaceIds.length > 0) {
                    this.updateSubspaceList();
                }
                
                VectorManager.removeVector(id);
                this.updateVectorList({ removedId: id });
                this.updateSubspaceVectorSelect();
                this.updateOperationParams();
                this.updateSubspaceVectorSelect();
                Visualization.render();
            });
        });

        // 绑定双击编辑坐标事件
        container.querySelectorAll('.vector-coords').forEach(coordsSpan => {
            coordsSpan.addEventListener('dblclick', (e) => {
                const vectorItem = e.target.closest('.vector-item');
                const id = parseInt(vectorItem.dataset.id);
                this.editVectorCoords(id, coordsSpan);
            });
        });

        // 绑定双击重命名事件
        container.querySelectorAll('.vector-name').forEach(nameSpan => {
            nameSpan.addEventListener('dblclick', (e) => {
                const vectorItem = e.target.closest('.vector-item');
                const id = parseInt(vectorItem.dataset.id);
                this.editItemName(id, nameSpan, 'vector');
            });
        });
    },

    /**
     * 编辑向量坐标
     */
    editVectorCoords(vectorId, coordsSpan) {
        const vector = VectorManager.getVector(vectorId);
        if (!vector) return;

        const is3D = AppState.mode === '3D';
        const originalText = coordsSpan.textContent;
        
        // 创建输入框
        const inputContainer = document.createElement('div');
        inputContainer.className = 'vector-edit-inputs d-flex gap-1';
        inputContainer.style.cssText = 'min-width: 0; flex: 1;';
        
        const inputs = [];
        const labels = is3D ? ['x', 'y', 'z'] : ['x', 'y'];
        
        labels.forEach((label, i) => {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control form-control-sm';
            input.style.cssText = 'width: 50px; padding: 2px 4px; font-size: 12px;';
            input.value = vector.components[i].toFixed(2);
            input.placeholder = label;
            inputs.push(input);
            inputContainer.appendChild(input);
        });

        // 替换坐标显示为输入框
        coordsSpan.style.display = 'none';
        coordsSpan.parentNode.insertBefore(inputContainer, coordsSpan.nextSibling);

        // 聚焦第一个输入框并选中
        inputs[0].focus();
        inputs[0].select();

        // 保存编辑
        const saveEdit = () => {
            const newComponents = inputs.map(input => parseFloat(input.value) || 0);
            VectorManager.updateVector(vector.id, newComponents); // 使用updateVector来保存
            VectorManager.saveCurrentState();
            
            // 移除输入框，恢复显示
            inputContainer.remove();
            coordsSpan.style.display = '';
            coordsSpan.textContent = VectorOperations.format(vector.components);
            
            Visualization.render();
        };

        // 取消编辑
        const cancelEdit = () => {
            inputContainer.remove();
            coordsSpan.style.display = '';
            coordsSpan.textContent = originalText;
        };

        // 绑定事件
        inputs.forEach((input, index) => {
            // 聚焦时全选
            input.addEventListener('focus', () => input.select());
            
            // 回车保存，Escape取消
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                } else if (e.key === 'Tab' && !e.shiftKey && index === inputs.length - 1) {
                    // 最后一个输入框按Tab时保存
                    e.preventDefault();
                    saveEdit();
                }
            });

            // 失去焦点时检查是否应该保存
            input.addEventListener('blur', (e) => {
                // 延迟检查，看焦点是否移到了其他输入框
                setTimeout(() => {
                    const focusedElement = document.activeElement;
                    if (!inputs.includes(focusedElement)) {
                        saveEdit();
                    }
                }, 100);
            });
        });
    },

    /**
     * 编辑项目名称（向量、矩阵、图案通用）
     * @param {number} id - 项目ID
     * @param {HTMLElement} nameSpan - 名称显示元素
     * @param {string} type - 类型: 'vector', 'matrix', 'shape'
     */
    editItemName(id, nameSpan, type) {
        // 获取对应的管理器和项目
        let item, manager, updateFunc;
        switch (type) {
            case 'vector':
                manager = VectorManager;
                item = manager.getVector(id);
                updateFunc = () => {
                    this.updateOperationParams();
                    Visualization.render();
                };
                break;
            case 'matrix':
                manager = MatrixManager;
                item = manager.getMatrix(id);
                updateFunc = () => {
                    this.updateMatrixOperationParams();
                    this.updateOperationParams();
                };
                break;
            case 'shape':
                manager = ShapeManager;
                item = manager.getShape(id);
                updateFunc = () => {
                    this.updateOperationParams();
                    Visualization.render();
                };
                break;
            default:
                return;
        }
        
        if (!item) return;
        
        const originalName = item.name;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control form-control-sm';
        input.style.cssText = 'width: 60px; padding: 2px 4px; font-size: 12px;';
        input.value = originalName;
        
        // 替换名称显示为输入框
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
        
        // 聚焦并选中
        input.focus();
        input.select();
        
        // 保存编辑
        const saveEdit = () => {
            const newName = input.value.trim() || originalName;
            item.name = newName;
            
            // 移除输入框，恢复显示
            input.remove();
            nameSpan.style.display = '';
            nameSpan.textContent = newName;
            
            // 保存到localStorage（如果是向量）
            if (type === 'vector') {
                VectorManager.save();
            } else if (type === 'matrix') {
                MatrixManager.save();
            } else if (type === 'shape') {
                ShapeManager.save();
            }
            
            // 调用更新函数
            updateFunc();
        };
        
        // 取消编辑
        const cancelEdit = () => {
            input.remove();
            nameSpan.style.display = '';
        };
        
        // 绑定事件
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        input.addEventListener('blur', () => {
            saveEdit();
        });
    },

    /**
     * 更新操作参数UI
     */
    /**
     * 更新操作选择列表（根据当前模式）
     */
    updateOperationList() {
        const select = document.getElementById('operationSelect');
        const currentValue = select.value;
        
        // 获取当前模式可用的操作
        const availableOps = Operations.getAvailableOperations(AppState.mode);
        
        // 按类别分组
        const vectorOps = availableOps.filter(op => op.key.startsWith('vector_'));
        const matrixOps = availableOps.filter(op => op.key.startsWith('matrix_'));
        
        // 重新构建选项
        let html = '<option value="" disabled selected>-- 选择操作 --</option>';
        
        if (vectorOps.length > 0) {
            html += '<optgroup label="向量运算">';
            vectorOps.forEach(op => {
                html += `<option value="${op.key}">${op.title}</option>`;
            });
            html += '</optgroup>';
        }
        
        if (matrixOps.length > 0) {
            html += '<optgroup label="矩阵变换">';
            matrixOps.forEach(op => {
                html += `<option value="${op.key}">${op.title}</option>`;
            });
            html += '</optgroup>';
        }
        
        select.innerHTML = html;
        
        // 尝试恢复之前的选择（如果还在可用列表中）
        if (currentValue && availableOps.find(op => op.key === currentValue)) {
            select.value = currentValue;
        }
    },

    updateOperationParams() {
        const operation = document.getElementById('operationSelect').value;
        const paramsContainer = document.getElementById('operationParams');
        
        // 保存当前选择状态
        const savedSelections = {
            paramMatrix1: document.getElementById('paramMatrix1')?.value,
            paramVector1: document.getElementById('paramVector1')?.value,
            paramVector2: document.getElementById('paramVector2')?.value,
            paramShape1: document.getElementById('paramShape1')?.value,
            paramVectorOrShape1: document.getElementById('paramVectorOrShape1')?.value
        };
        
        paramsContainer.innerHTML = Operations.generateParamsUI(operation, AppState.mode);
        
        // 恢复选择状态（如果选项仍然存在）
        Object.entries(savedSelections).forEach(([id, value]) => {
            if (value) {
                const select = document.getElementById(id);
                if (select) {
                    const option = select.querySelector(`option[value="${value}"]`);
                    if (option) {
                        select.value = value;
                    }
                }
            }
        });
        
        // 隐藏结果区域
        document.getElementById('operationResult').style.display = 'none';
    },

    /**
     * 更新图案列表UI
     */
    updateShapeList(options = {}) {
        const container = document.getElementById('shapeList');
        const allShapes = ShapeManager.shapes;
        const { addedId = null, removedId = null } = options;

        // 根据当前模式过滤图案
        const shapes = allShapes.filter(shape => {
            if (AppState.mode === '3D') {
                return shape.is3D === true;
            } else {
                return !shape.is3D;
            }
        });

        if (shapes.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-2">暂无图案</div>';
            return;
        }

        // 如果是删除操作，先播放删除动画
        if (removedId !== null) {
            const itemToRemove = container.querySelector(`.shape-item[data-id="${removedId}"]`);
            if (itemToRemove) {
                itemToRemove.classList.add('removing');
                setTimeout(() => this.rebuildShapeList(container, shapes, null), 200);
                return;
            }
        }

        this.rebuildShapeList(container, shapes, addedId);
    },

    /**
     * 重建图案列表
     */
    rebuildShapeList(container, shapes, addedId) {
        container.innerHTML = shapes.map(s => {
            // 只有3D图案且有shapeType和params时才显示编辑按钮
            const canEdit = s.is3D && s.shapeType && s.params;
            return `
            <div class="shape-item${addedId === s.id ? ' adding' : ''}" data-id="${s.id}">
                <div class="shape-info">
                    <span class="shape-color" style="background-color: ${s.color};"></span>
                    <span class="shape-name" title="双击重命名">${s.name}</span>
                </div>
                <div class="shape-actions">
                    ${canEdit ? `<button class="btn btn-outline-primary btn-sm edit-shape" title="编辑">
                        <i class="bi bi-pencil"></i>
                    </button>` : ''}
                    <button class="btn btn-outline-secondary btn-sm toggle-visibility" 
                            title="${s.visible ? '隐藏' : '显示'}">
                        <i class="bi bi-${s.visible ? 'eye' : 'eye-slash'}"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-shape" title="删除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');

        // 绑定编辑按钮事件
        container.querySelectorAll('.edit-shape').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.closest('.shape-item').dataset.id);
                this.startEditingShape(id);
            });
        });

        // 绑定事件
        container.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const shapeItem = e.target.closest('.shape-item');
                const id = parseInt(shapeItem.dataset.id);
                ShapeManager.toggleVisibility(id);
                
                // 只更新图标
                const icon = shapeItem.querySelector('.toggle-visibility i');
                const shape = ShapeManager.getShape(id);
                if (icon && shape) {
                    icon.className = `bi bi-${shape.visible ? 'eye' : 'eye-slash'}`;
                    btn.title = shape.visible ? '隐藏' : '显示';
                }
                
                Visualization.render();
            });
        });

        container.querySelectorAll('.delete-shape').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.closest('.shape-item').dataset.id);
                ShapeManager.removeShape(id);
                this.updateShapeList({ removedId: id });
                this.updateOperationParams(); // 更新功能函数中的图案选择
                Visualization.render();
            });
        });

        // 绑定双击重命名事件（只在名称上双击时重命名）
        container.querySelectorAll('.shape-name').forEach(nameSpan => {
            nameSpan.addEventListener('dblclick', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const shapeItem = e.target.closest('.shape-item');
                const id = parseInt(shapeItem.dataset.id);
                this.editItemName(id, nameSpan, 'shape');
            });
        });

        // 绑定shape-item的双击事件（进入编辑模式）
        container.querySelectorAll('.shape-item').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                // 如果双击的是名称或按钮，不处理
                if (e.target.closest('.shape-name') || e.target.closest('button')) {
                    return;
                }
                const id = parseInt(item.dataset.id);
                const shape = ShapeManager.getShape(id);
                // 只有3D图案且可编辑时才进入编辑模式
                if (shape && shape.is3D && shape.shapeType && shape.params) {
                    this.startEditingShape(id);
                }
            });
        });
    },

    /**
     * 更新子空间向量选择下拉框
     */
    updateSubspaceVectorSelect() {
        const select = document.getElementById('subspaceVectorSelect');
        if (!select) return;
        
        // 根据当前模式过滤向量
        const is3DMode = AppState.mode === '3D';
        const vectors = VectorManager.vectors.filter(v => {
            if (is3DMode) {
                return v.is3D === true;
            } else {
                return !v.is3D;
            }
        });
        
        if (vectors.length === 0) {
            select.innerHTML = '<option disabled>暂无向量</option>';
            return;
        }
        
        select.innerHTML = vectors.map(v => {
            const coords = v.components.map(c => c.toFixed(1)).join(', ');
            return `<option value="${v.id}">${v.name} (${coords})</option>`;
        }).join('');
    },

    /**
     * 更新子空间列表UI
     */
    updateSubspaceList() {
        const container = document.getElementById('subspaceList');
        if (!container) return;
        
        // 同时更新向量选择下拉框
        this.updateSubspaceVectorSelect();
        
        // 根据当前模式过滤子空间
        const is3DMode = AppState.mode === '3D';
        const allSubspaces = SubspaceManager.subspaces;
        const subspaces = allSubspaces.filter(s => {
            if (is3DMode) {
                return s.is3D === true;
            } else {
                return !s.is3D;
            }
        });
        
        if (subspaces.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-2">暂无子空间</div>';
            return;
        }
        
        container.innerHTML = subspaces.map(s => {
            // 获取基向量名称
            const basisNames = s.basisVectorIds.map(id => {
                const v = VectorManager.getVector(id);
                return v ? v.name : '?';
            }).join(', ');
            
            const dimensionText = s.basisVectorIds.length === 1 ? '1D' : 
                                  s.basisVectorIds.length === 2 ? '2D' : '3D';
            
            return `
            <div class="subspace-item" data-id="${s.id}">
                <div class="subspace-info">
                    <span class="subspace-color" style="background-color: ${s.color};"></span>
                    <span class="subspace-name" title="基向量: ${basisNames}">${s.name} (${dimensionText})</span>
                </div>
                <div class="item-controls">
                    <button class="btn btn-outline-secondary btn-sm toggle-visibility" 
                            title="${s.visible ? '隐藏' : '显示'}">
                        <i class="bi bi-${s.visible ? 'eye' : 'eye-slash'}"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-item" title="删除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    },

    /**
     * 添加示例向量
     */
    addExampleVectors() {
        if (AppState.mode === '3D') {
            VectorManager.addVector([3, 2, 1], '#e74c3c', 'a');
            VectorManager.addVector([1, 3, 2], '#3498db', 'b');
        } else {
            VectorManager.addVector([3, 2], '#e74c3c', 'a');
            VectorManager.addVector([1, 3], '#3498db', 'b');
        }
        
        this.updateVectorList();
        Visualization.render();
    },

    /**
     * 更新预置矩阵下拉框
     */
    updateMatrixPresets() {
        const select = document.getElementById('matrixPresetSelect');
        const presets = MatrixManager.getPresets(AppState.mode);
        
        // 下拉列表显示中文描述
        select.innerHTML = '<option value="">-- 选择预置矩阵 --</option>' +
            presets.map((p, i) => `<option value="${i}">${p.description}</option>`).join('');
    },

    /**
     * 更新预置图形下拉框
     */
    updateShapePresets() {
        const presetsContainer = document.getElementById('shape3DPresets');
        const drawingContainer = document.getElementById('shape2DDrawing');
        const select = document.getElementById('shapePresetSelect');
        
        if (AppState.mode === '3D') {
            // 显示3D预置图形，隐藏2D绘制
            presetsContainer.style.display = 'block';
            drawingContainer.style.display = 'none';
            const presets = ShapeManager.get3DPresets();
            select.innerHTML = '<option value="">-- 选择预置图形 --</option>' +
                presets.map((p, i) => `<option value="${i}">${p.description}</option>`).join('');
            
            // 隐藏参数容器
            document.getElementById('shapeParamsContainer').style.display = 'none';
        } else {
            // 隐藏3D预置图形，显示2D绘制
            presetsContainer.style.display = 'none';
            drawingContainer.style.display = 'block';
        }
    },

    /**
     * 更新图形参数输入UI
     */
    updateShapeParams(preset) {
        const container = document.getElementById('shapeParams');
        const paramsContainer = document.getElementById('shapeParamsContainer');
        
        if (!preset || !preset.params || preset.params.length === 0) {
            paramsContainer.style.display = 'none';
            return;
        }

        paramsContainer.style.display = 'block';
        
        // 生成参数输入框
        let html = '';
        preset.params.forEach(param => {
            html += `
                <div class="row g-2 mb-2 align-items-center">
                    <div class="col-4">
                        <label class="form-label mb-0"><small>${param.label}:</small></label>
                    </div>
                    <div class="col-8">
                        <input type="number" 
                               class="form-control form-control-sm" 
                               id="shapeParam_${param.name}" 
                               value="${param.default}"
                               min="${param.min}"
                               max="${param.max}"
                               step="${param.step}">
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    /**
     * 开始编辑3D图案
     * @param {number} shapeId - 图案ID
     */
    startEditingShape(shapeId) {
        const shape = ShapeManager.getShape(shapeId);
        if (!shape || !shape.is3D || !shape.shapeType || !shape.params) {
            return;
        }

        // 保存编辑状态
        AppState.shapeEditState = {
            isEditing: true,
            editingShapeId: shapeId,
            originalParams: JSON.parse(JSON.stringify(shape.params)) // 深拷贝
        };

        // 获取预置图形定义
        const preset = ShapeManager.getPresetByType(shape.shapeType);
        if (!preset) {
            return;
        }

        // 在下拉框中选中对应的图形
        const presets = ShapeManager.get3DPresets();
        const presetIndex = presets.findIndex(p => p.name === preset.name);
        const select = document.getElementById('shapePresetSelect');
        select.value = presetIndex;

        // 显示参数UI并填充当前值
        this.updateShapeParams(preset);
        
        // 填充参数值
        preset.params.forEach(param => {
            const input = document.getElementById(`shapeParam_${param.name}`);
            if (input && shape.params[param.name] !== undefined) {
                input.value = shape.params[param.name];
            }
        });

        // 填充颜色和名称
        document.getElementById('shapeColor3D').value = shape.color;
        document.getElementById('shapeName3D').value = shape.name;

        // 修改按钮文本和功能
        const addBtn = document.getElementById('addPresetShapeBtn');
        addBtn.textContent = '保存修改';
        addBtn.classList.remove('btn-primary');
        addBtn.classList.add('btn-success');

        // 添加取消按钮（如果还没有）
        let cancelBtn = document.getElementById('cancelEditShapeBtn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelEditShapeBtn';
            cancelBtn.className = 'btn btn-outline-secondary btn-sm flex-grow-1';
            cancelBtn.textContent = '取消';
            addBtn.parentNode.appendChild(cancelBtn);
            
            cancelBtn.addEventListener('click', () => {
                this.cancelEditingShape();
            });
        }
        cancelBtn.style.display = 'block';

        // 绑定实时预览
        this.bindShapeParamsPreview(preset);

        // 滚动到预置图形区域
        document.getElementById('shape3DPresets').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * 退出编辑模式（不恢复参数，只清理UI）
     */
    exitEditingMode() {
        // 清理状态
        AppState.shapeEditState = {
            isEditing: false,
            editingShapeId: null,
            originalParams: null
        };

        // 恢复按钮
        const addBtn = document.getElementById('addPresetShapeBtn');
        addBtn.textContent = '添加预置图形';
        addBtn.classList.remove('btn-success');
        addBtn.classList.add('btn-primary');

        // 隐藏取消按钮
        const cancelBtn = document.getElementById('cancelEditShapeBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // 重置选择
        const select = document.getElementById('shapePresetSelect');
        select.selectedIndex = 0;
        document.getElementById('shapeParamsContainer').style.display = 'none';

        // 重置颜色和名称
        document.getElementById('shapeName3D').value = '';
        document.getElementById('shapeColor3D').value = ShapeManager.getNextColor();

        // 移除实时预览监听
        this.removeShapeParamsPreview();
    },

    /**
     * 取消编辑3D图案（恢复原始参数）
     */
    cancelEditingShape() {
        // 如果正在编辑，恢复原始参数
        if (AppState.shapeEditState.isEditing && AppState.shapeEditState.editingShapeId) {
            const shapeId = AppState.shapeEditState.editingShapeId;
            const originalParams = AppState.shapeEditState.originalParams;
            
            if (originalParams) {
                // 使用原始参数重新生成图案
                ShapeManager.updateShape3D(shapeId, originalParams);
            }
        }

        // 退出编辑模式
        this.exitEditingMode();

        // 重新渲染
        Visualization.render();
    },

    /**
     * 保存3D图案修改
     */
    saveShapeEdit() {
        if (!AppState.shapeEditState.isEditing) {
            return;
        }

        const shapeId = AppState.shapeEditState.editingShapeId;
        const shape = ShapeManager.getShape(shapeId);
        if (!shape) {
            return;
        }

        // 获取预置定义
        const preset = ShapeManager.getPresetByType(shape.shapeType);
        if (!preset) {
            return;
        }

        // 收集新参数
        const newParams = {};
        preset.params.forEach(param => {
            const input = document.getElementById(`shapeParam_${param.name}`);
            newParams[param.name] = parseFloat(input.value) || param.default;
        });

        // 收集颜色和名称
        const newColor = document.getElementById('shapeColor3D').value;
        const newName = document.getElementById('shapeName3D').value.trim();

        // 更新图案
        ShapeManager.updateShape3D(shapeId, newParams);
        
        // 更新颜色和名称
        if (newColor) {
            shape.color = newColor;
        }
        if (newName) {
            shape.name = newName;
        }
        ShapeManager.save();
        
        // 退出编辑模式（不恢复参数，只清理UI状态）
        this.exitEditingMode();
        
        // 更新列表和渲染
        this.updateShapeList();
        Visualization.render();
    },

    /**
     * 绑定参数实时预览
     */
    bindShapeParamsPreview(preset) {
        preset.params.forEach(param => {
            const input = document.getElementById(`shapeParam_${param.name}`);
            if (input) {
                input.addEventListener('input', this.handleShapeParamChange);
            }
        });
    },

    /**
     * 移除参数实时预览
     */
    removeShapeParamsPreview() {
        const container = document.getElementById('shapeParams');
        if (!container) return;
        
        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.removeEventListener('input', this.handleShapeParamChange);
        });
    },

    /**
     * 处理参数变化（实时预览）
     */
    handleShapeParamChange: function() {
        if (!AppState.shapeEditState.isEditing) {
            return;
        }

        const shapeId = AppState.shapeEditState.editingShapeId;
        const shape = ShapeManager.getShape(shapeId);
        if (!shape) {
            return;
        }

        // 获取预置定义
        const preset = ShapeManager.getPresetByType(shape.shapeType);
        if (!preset) {
            return;
        }

        // 收集当前参数
        const params = {};
        preset.params.forEach(param => {
            const input = document.getElementById(`shapeParam_${param.name}`);
            params[param.name] = parseFloat(input.value) || param.default;
        });

        // 临时更新图案（不保存）
        const points = preset.generator(params);
        shape.matrix = [
            points.map(p => p[0]),
            points.map(p => p[1]),
            points.map(p => p[2] || 0)
        ];

        // 重新渲染
        Visualization.render();
    },

    /**
     * 更新矩阵列表UI
     */
    updateMatrixList(options = {}) {
        const container = document.getElementById('matrixList');
        const matrices = MatrixManager.getAllMatrices(AppState.mode);
        const { addedId = null, removedId = null } = options;

        if (matrices.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-2">暂无矩阵</div>';
            return;
        }

        // 如果是删除操作，先播放删除动画
        if (removedId !== null) {
            const itemToRemove = container.querySelector(`.matrix-item[data-id="${removedId}"]`);
            if (itemToRemove) {
                itemToRemove.classList.add('removing');
                setTimeout(() => this.rebuildMatrixList(container, matrices, null), 200);
                return;
            }
        }

        this.rebuildMatrixList(container, matrices, addedId);
    },

    /**
     * 重建矩阵列表
     */
    rebuildMatrixList(container, matrices, addedId) {
        container.innerHTML = matrices.map(m => {
            // 格式化矩阵值为提示框内容
            const matrixStr = m.matrix.map(row => 
                '[' + row.map(v => typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(3)) : v).join(', ') + ']'
            ).join('\n');
            
            return `
            <div class="matrix-item${addedId === m.id ? ' adding' : ''}" data-id="${m.id}" data-matrix="${encodeURIComponent(matrixStr)}">
                <div class="matrix-info">
                    <span class="matrix-name" title="双击重命名">${m.name}</span>
                    <span class="matrix-size">${m.matrix.length}×${m.matrix.length}</span>
                    ${m.description ? `<span class="matrix-desc">${m.description}</span>` : ''}
                </div>
                <div class="matrix-actions">
                    <button class="btn btn-outline-danger btn-sm delete-matrix" title="删除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');

        const tooltip = document.getElementById('matrixTooltip');
        const tooltipPre = tooltip.querySelector('pre');

        // 绑定悬停事件显示全局提示框
        container.querySelectorAll('.matrix-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const matrixStr = decodeURIComponent(item.dataset.matrix);
                tooltipPre.textContent = matrixStr;
                
                // 计算位置 - 在鼠标正上方
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
                tooltip.style.transform = 'translate(-50%, -100%)';
                tooltip.classList.add('visible');
            });
            
            item.addEventListener('mousemove', (e) => {
                // 跟随鼠标移动
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
            });
            
            item.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });

        // 绑定删除事件
        container.querySelectorAll('.delete-matrix').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 隐藏提示框
                tooltip.classList.remove('visible');
                const id = parseInt(e.target.closest('.matrix-item').dataset.id);
                MatrixManager.removeMatrix(id);
                this.updateMatrixList({ removedId: id });
                this.updateMatrixOperationParams();
                this.updateOperationParams(); // 更新功能函数中的矩阵选择
            });
        });

        // 绑定双击重命名事件
        container.querySelectorAll('.matrix-name').forEach(nameSpan => {
            nameSpan.addEventListener('dblclick', (e) => {
                // 隐藏提示框
                tooltip.classList.remove('visible');
                const matrixItem = e.target.closest('.matrix-item');
                const id = parseInt(matrixItem.dataset.id);
                this.editItemName(id, nameSpan, 'matrix');
            });
        });
    },

    /**
     * 更新矩阵运算参数UI
     */
    updateMatrixOperationParams() {
        const operation = document.getElementById('matrixOperationSelect').value;
        const container = document.getElementById('matrixOperationParams');
        const matrices = MatrixManager.getAllMatrices();
        
        if (!operation) {
            container.innerHTML = '';
            return;
        }
        
        if (matrices.length === 0) {
            container.innerHTML = '<div class="alert alert-warning py-2"><small>请先添加矩阵</small></div>';
            return;
        }
        
        const matrixOptions = '<option value="" disabled selected>-- 选择 --</option>' +
            matrices.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        let html = '';
        
        switch (operation) {
            case 'add':
            case 'subtract':
                html = `
                    <div class="row g-2">
                        <div class="col-5">
                            <select class="form-select form-select-sm" id="matrixOpA">${matrixOptions}</select>
                        </div>
                        <div class="col-2 text-center align-self-center">
                            <small>${operation === 'add' ? '+' : '−'}</small>
                        </div>
                        <div class="col-5">
                            <select class="form-select form-select-sm" id="matrixOpB">${matrixOptions}</select>
                        </div>
                    </div>
                `;
                break;
            case 'scalar':
                html = `
                    <div class="row g-2">
                        <div class="col-4">
                            <input type="number" class="form-control form-control-sm" id="matrixOpScalar" value="2" step="0.1">
                        </div>
                        <div class="col-2 text-center align-self-center">
                            <small>×</small>
                        </div>
                        <div class="col-6">
                            <select class="form-select form-select-sm" id="matrixOpA">${matrixOptions}</select>
                        </div>
                    </div>
                `;
                break;
            case 'multiply2':
                html = `
                    <div class="row g-2">
                        <div class="col-5">
                            <select class="form-select form-select-sm" id="matrixOpA">${matrixOptions}</select>
                        </div>
                        <div class="col-2 text-center align-self-center">
                            <small>×</small>
                        </div>
                        <div class="col-5">
                            <select class="form-select form-select-sm" id="matrixOpB">${matrixOptions}</select>
                        </div>
                    </div>
                `;
                break;
            case 'multiply3':
                html = `
                    <div class="row g-2 mb-1">
                        <div class="col-4">
                            <select class="form-select form-select-sm" id="matrixOpA">${matrixOptions}</select>
                        </div>
                        <div class="col-1 text-center align-self-center p-0">
                            <small>×</small>
                        </div>
                        <div class="col-3">
                            <select class="form-select form-select-sm" id="matrixOpB">${matrixOptions}</select>
                        </div>
                        <div class="col-1 text-center align-self-center p-0">
                            <small>×</small>
                        </div>
                        <div class="col-3">
                            <select class="form-select form-select-sm" id="matrixOpC">${matrixOptions}</select>
                        </div>
                    </div>
                `;
                break;
        }
        
        container.innerHTML = html;
    },

    /**
     * 执行矩阵运算
     */
    executeMatrixOperation() {
        const operation = document.getElementById('matrixOperationSelect').value;
        const resultDiv = document.getElementById('matrixOperationResult');
        
        if (!operation) {
            resultDiv.innerHTML = '<div class="alert alert-warning py-2"><small>请选择运算类型</small></div>';
            resultDiv.style.display = 'block';
            return;
        }
        
        const getMatrix = (id) => {
            const select = document.getElementById(id);
            if (!select || !select.value) return null;
            return MatrixManager.getMatrix(parseInt(select.value));
        };
        
        let result, resultName;
        
        try {
            switch (operation) {
                case 'add': {
                    const A = getMatrix('matrixOpA');
                    const B = getMatrix('matrixOpB');
                    if (!A || !B) {
                        throw new Error('请选择两个矩阵');
                    }
                    if (A.matrix.length !== B.matrix.length) {
                        throw new Error('矩阵维度不匹配');
                    }
                    result = this.matrixAdd(A.matrix, B.matrix);
                    resultName = `${A.name}+${B.name}`;
                    break;
                }
                case 'subtract': {
                    const A = getMatrix('matrixOpA');
                    const B = getMatrix('matrixOpB');
                    if (!A || !B) {
                        throw new Error('请选择两个矩阵');
                    }
                    if (A.matrix.length !== B.matrix.length) {
                        throw new Error('矩阵维度不匹配');
                    }
                    result = this.matrixSubtract(A.matrix, B.matrix);
                    resultName = `${A.name}-${B.name}`;
                    break;
                }
                case 'scalar': {
                    const A = getMatrix('matrixOpA');
                    const scalar = parseFloat(document.getElementById('matrixOpScalar')?.value);
                    if (!A) {
                        throw new Error('请选择矩阵');
                    }
                    if (isNaN(scalar)) {
                        throw new Error('请输入有效的标量');
                    }
                    result = this.matrixScalar(A.matrix, scalar);
                    resultName = `${scalar}${A.name}`;
                    break;
                }
                case 'multiply2': {
                    const A = getMatrix('matrixOpA');
                    const B = getMatrix('matrixOpB');
                    if (!A || !B) {
                        throw new Error('请选择两个矩阵');
                    }
                    result = this.matrixMultiply(A.matrix, B.matrix);
                    resultName = `${A.name}${B.name}`;
                    break;
                }
                case 'multiply3': {
                    const A = getMatrix('matrixOpA');
                    const B = getMatrix('matrixOpB');
                    const C = getMatrix('matrixOpC');
                    if (!A || !B || !C) {
                        throw new Error('请选择三个矩阵');
                    }
                    const AB = this.matrixMultiply(A.matrix, B.matrix);
                    result = this.matrixMultiply(AB, C.matrix);
                    resultName = `${A.name}${B.name}${C.name}`;
                    break;
                }
                default:
                    throw new Error('未知运算');
            }
            
            // 添加结果矩阵到列表
            const newMatrix = MatrixManager.addMatrix(result, resultName);
            this.updateMatrixList({ addedId: newMatrix.id });
            this.updateMatrixOperationParams();
            this.updateOperationParams();
            
            resultDiv.innerHTML = `<div class="alert alert-success py-2"><small><i class="bi bi-check-circle"></i> 已添加矩阵 ${newMatrix.name}</small></div>`;
            resultDiv.style.display = 'block';
            
            // 3秒后隐藏结果
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 3000);
            
        } catch (e) {
            resultDiv.innerHTML = `<div class="alert alert-danger py-2"><small><i class="bi bi-exclamation-circle"></i> ${e.message}</small></div>`;
            resultDiv.style.display = 'block';
        }
    },

    /**
     * 矩阵加法
     */
    matrixAdd(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    },

    /**
     * 矩阵减法
     */
    matrixSubtract(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    },

    /**
     * 标量乘法
     */
    matrixScalar(A, k) {
        return A.map(row => row.map(val => val * k));
    },

    /**
     * 矩阵乘法
     */
    matrixMultiply(A, B) {
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
    }
};

// ============================================
// 页面加载完成后初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出模块
window.App = App;
window.AppState = AppState;
