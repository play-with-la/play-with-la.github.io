/**
 * 玩转线性代数 - 子空间模块
 * 
 * 管理由基向量定义的子空间
 * 子空间由一组线性无关的向量作为基，绘制相应的网格
 */

// 子空间管理器
const SubspaceManager = {
    subspaces: [],
    nextId: 1,
    
    // 预设颜色（与向量/图案不同的颜色组）
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'],
    colorIndex: 0,
    
    // 子空间命名索引
    nameIndex: 0,

    /**
     * 获取下一个子空间名称（S1, S2, ...）
     */
    getNextName() {
        return 'subspace_' + (++this.nameIndex);
    },

    /**
     * 获取下一个颜色
     */
    getNextColor() {
        const color = this.colors[this.colorIndex % this.colors.length];
        this.colorIndex++;
        return color;
    },

    /**
     * 检查向量组是否线性无关
     * @param {Array} vectors - 向量数组，每个向量是 {components: [x, y, z?]}
     * @returns {boolean} 是否线性无关
     */
    areLinearlyIndependent(vectors) {
        if (vectors.length === 0) return false;
        if (vectors.length === 1) {
            // 单个非零向量是线性无关的
            const v = vectors[0].components;
            return v.some(c => c !== 0);
        }
        
        const dim = vectors[0].components.length;
        
        if (vectors.length > dim) {
            // 向量数量超过维度，必定线性相关
            return false;
        }
        
        if (vectors.length === 2) {
            // 两个向量：检查是否共线（叉积为0）
            const v1 = vectors[0].components;
            const v2 = vectors[1].components;
            
            if (dim === 2) {
                // 2D: 检查行列式
                const det = v1[0] * v2[1] - v1[1] * v2[0];
                return Math.abs(det) > 1e-10;
            } else {
                // 3D: 检查叉积是否为零向量
                const cross = [
                    v1[1] * v2[2] - v1[2] * v2[1],
                    v1[2] * v2[0] - v1[0] * v2[2],
                    v1[0] * v2[1] - v1[1] * v2[0]
                ];
                return cross.some(c => Math.abs(c) > 1e-10);
            }
        }
        
        if (vectors.length === 3 && dim === 3) {
            // 三个3D向量：检查行列式
            const v1 = vectors[0].components;
            const v2 = vectors[1].components;
            const v3 = vectors[2].components;
            
            const det = v1[0] * (v2[1] * v3[2] - v2[2] * v3[1])
                      - v1[1] * (v2[0] * v3[2] - v2[2] * v3[0])
                      + v1[2] * (v2[0] * v3[1] - v2[1] * v3[0]);
            
            return Math.abs(det) > 1e-10;
        }
        
        return false;
    },

    /**
     * 添加子空间
     * @param {number[]} basisVectorIds - 基向量的ID数组
     * @param {string} color - 颜色
     * @param {string} name - 名称
     * @param {boolean} is3D - 是否是3D模式
     * @returns {object|null} 添加的子空间对象，如果向量线性相关则返回null
     */
    addSubspace(basisVectorIds, color = null, name = null, is3D = false) {
        // 获取基向量
        const vectors = basisVectorIds.map(id => window.VectorManager.getVector(id)).filter(v => v);
        
        if (vectors.length === 0) {
            console.error('未找到有效的基向量');
            return null;
        }
        
        // 检查线性无关性
        if (!this.areLinearlyIndependent(vectors)) {
            console.error('所选向量线性相关，无法构成基');
            return null;
        }
        
        const id = this.nextId++;
        
        const subspace = {
            id: id,
            name: name || this.getNextName(),
            color: color || this.getNextColor(),
            visible: true,
            basisVectorIds: basisVectorIds,
            is3D: is3D
        };
        
        this.subspaces.push(subspace);
        this.save();
        return subspace;
    },

    /**
     * 删除子空间
     * @param {number} id - 子空间ID
     */
    removeSubspace(id) {
        const index = this.subspaces.findIndex(s => s.id === id);
        if (index !== -1) {
            this.subspaces.splice(index, 1);
            this.save();
        }
    },

    /**
     * 获取子空间
     * @param {number} id - 子空间ID
     * @returns {object|null} 子空间对象
     */
    getSubspace(id) {
        return this.subspaces.find(s => s.id === id) || null;
    },

    /**
     * 获取子空间的基向量
     * @param {object} subspace - 子空间对象
     * @returns {object[]} 基向量数组
     */
    getBasisVectors(subspace) {
        return subspace.basisVectorIds
            .map(id => window.VectorManager.getVector(id))
            .filter(v => v);
    },

    /**
     * 切换子空间可见性
     * @param {number} id - 子空间ID
     */
    toggleVisibility(id) {
        const subspace = this.getSubspace(id);
        if (subspace) {
            subspace.visible = !subspace.visible;
            this.save();
        }
    },

    /**
     * 获取可见子空间
     * @param {string} mode - 模式过滤 ('2D' 或 '3D')
     * @returns {object[]} 可见子空间数组
     */
    getVisibleSubspaces(mode = null) {
        let filtered = this.subspaces.filter(s => s.visible);
        
        if (mode) {
            filtered = filtered.filter(subspace => {
                if (mode === '3D') {
                    return subspace.is3D === true;
                } else {
                    return !subspace.is3D;
                }
            });
        }
        
        return filtered;
    },

    /**
     * 当向量被删除时，删除引用该向量的所有子空间
     * @param {number} vectorId - 被删除的向量ID
     * @returns {number[]} 被删除的子空间ID数组
     */
    onVectorDeleted(vectorId) {
        const deletedIds = [];
        
        this.subspaces = this.subspaces.filter(subspace => {
            if (subspace.basisVectorIds.includes(vectorId)) {
                deletedIds.push(subspace.id);
                return false;
            }
            return true;
        });
        
        if (deletedIds.length > 0) {
            this.save();
        }
        
        return deletedIds;
    },

    /**
     * 检查子空间是否有效（所有基向量都存在且线性无关）
     * @param {object} subspace - 子空间对象
     * @returns {boolean} 是否有效
     */
    isValid(subspace) {
        const vectors = this.getBasisVectors(subspace);
        return vectors.length === subspace.basisVectorIds.length && 
               this.areLinearlyIndependent(vectors);
    },

    /**
     * 清除所有子空间
     */
    clearAll() {
        this.subspaces = [];
        this.nextId = 1;
        this.colorIndex = 0;
        this.nameIndex = 0;
        this.save();
    },

    /**
     * 保存子空间到localStorage
     */
    save() {
        const data = {
            subspaces: this.subspaces,
            nextId: this.nextId,
            colorIndex: this.colorIndex,
            nameIndex: this.nameIndex
        };
        localStorage.setItem('subspaces', JSON.stringify(data));
    },

    /**
     * 从localStorage加载子空间
     * @returns {boolean} 是否成功加载
     */
    load() {
        const saved = localStorage.getItem('subspaces');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.subspaces = (data.subspaces || []).map(s => ({
                    ...s,
                    // 确保旧数据有默认值
                    visible: s.visible !== undefined ? s.visible : true
                }));
                this.nextId = data.nextId || 1;
                this.colorIndex = data.colorIndex || 0;
                this.nameIndex = data.nameIndex || 0;
                return this.subspaces.length > 0;
            } catch (e) {
                console.error('加载子空间数据失败:', e);
                return false;
            }
        }
        return false;
    },

    /**
     * 格式化基向量名称
     * @param {object} subspace - 子空间对象
     * @returns {string} 格式化的基向量名称，如 "(a, b)"
     */
    formatBasisNames(subspace) {
        const vectors = this.getBasisVectors(subspace);
        const names = vectors.map(v => v.name);
        return '(' + names.join(', ') + ')';
    }
};

// 导出模块
window.SubspaceManager = SubspaceManager;
