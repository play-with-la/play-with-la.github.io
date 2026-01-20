/**
 * 玩转线性代数 - 3D 渲染器模块
 * 
 * 提供3D Three.js渲染功能
 */

// 导入 Three.js (ES Modules)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

// ============================================
// 3D 可视化渲染器 (Three.js)
// ============================================
const Renderer3D = {
    container: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // 存储向量对象
    vectorObjects: [],
    gridHelper: null,
    gridHelperYZ: null,
    gridHelperZX: null,
    axesGroup: null,

    /**
     * 初始化3D渲染器
     */
    init() {
        this.container = document.getElementById('container3D');
        
        // 创建场景
        this.scene = new THREE.Scene();
        this.updateBackground();
        
        // 创建相机
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(15, -15, 15); // Z轴向上，从右后上方看
        this.camera.up.set(0, 0, 1); // 设置相机Z轴为向上
        this.camera.lookAt(0, 0, 0);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // 创建轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // 添加光源（用于半透明材质）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        // 添加网格和坐标轴
        this.createGrid();
        this.createAxes();
        
        // 窗口大小调整
        window.addEventListener('resize', () => this.resize());
        
        // 鼠标移动事件
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            // 3D模式下暂不显示精确坐标
            document.getElementById('cursorCoords').textContent = '3D模式';
        });
        
        // 开始动画循环
        this.animate();
    },

    /**
     * 更新背景色
     */
    updateBackground() {
        if (this.scene) {
            this.scene.background = new THREE.Color(VisualizationConfig.colors.background);
        }
    },

    /**
     * 调整渲染器大小
     */
    resize() {
        if (!this.renderer || !this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    /**
     * 创建网格
     */
    createGrid() {
        const config = VisualizationConfig;
        
        // 移除旧网格
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
        if (this.gridHelperYZ) {
            this.scene.remove(this.gridHelperYZ);
        }
        if (this.gridHelperZX) {
            this.scene.remove(this.gridHelperZX);
        }
        
        // XY平面网格（主网格）
        this.gridHelper = new THREE.GridHelper(
            config.coordRange * 2,
            config.coordRange * 2,
            new THREE.Color(config.colors.gridStrong),
            new THREE.Color(config.colors.grid)
        );
        // 旋转90度使网格在XY平面（默认是XZ平面）
        this.gridHelper.rotation.x = Math.PI / 2;
        this.gridHelper.visible = config.showGrid;
        this.scene.add(this.gridHelper);
        
        // YZ平面网格
        this.gridHelperYZ = new THREE.GridHelper(
            config.coordRange * 2,
            config.coordRange * 2,
            new THREE.Color(config.colors.gridStrong),
            new THREE.Color(config.colors.grid)
        );
        // 旋转90度并绕Y轴旋转90度使其在YZ平面
        this.gridHelperYZ.rotation.x = Math.PI / 2;
        this.gridHelperYZ.rotation.z = Math.PI / 2;
        this.gridHelperYZ.visible = config.showGrid && config.showZGrids;
        this.scene.add(this.gridHelperYZ);
        
        // ZX平面网格（即XZ平面）
        this.gridHelperZX = new THREE.GridHelper(
            config.coordRange * 2,
            config.coordRange * 2,
            new THREE.Color(config.colors.gridStrong),
            new THREE.Color(config.colors.grid)
        );
        // 默认就在XZ平面，不需要旋转
        this.gridHelperZX.visible = config.showGrid && config.showZGrids;
        this.scene.add(this.gridHelperZX);
        
        // 创建坐标轴网格面
        this.createAxisGridSurfaces();
    },

    /**
     * 存储坐标轴网格面对象
     */
    axisGridSurfaces: [],

    /**
     * 创建标准坐标轴网格面（半透明平面）
     */
    createAxisGridSurfaces() {
        // 清除旧的网格面
        this.axisGridSurfaces.forEach(obj => this.scene.remove(obj));
        this.axisGridSurfaces = [];
        
        const config = VisualizationConfig;
        const size = config.coordRange * 2;
        
        // XY平面网格面
        const xyGeometry = new THREE.PlaneGeometry(size, size);
        const xyMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const xyPlane = new THREE.Mesh(xyGeometry, xyMaterial);
        xyPlane.visible = config.showAxisGridSurface;
        this.scene.add(xyPlane);
        this.axisGridSurfaces.push(xyPlane);
        
        // YZ平面网格面
        const yzGeometry = new THREE.PlaneGeometry(size, size);
        const yzMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const yzPlane = new THREE.Mesh(yzGeometry, yzMaterial);
        yzPlane.rotation.y = Math.PI / 2;
        yzPlane.visible = config.showAxisGridSurface && config.showZGrids;
        this.scene.add(yzPlane);
        this.axisGridSurfaces.push(yzPlane);
        
        // ZX平面网格面
        const zxGeometry = new THREE.PlaneGeometry(size, size);
        const zxMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const zxPlane = new THREE.Mesh(zxGeometry, zxMaterial);
        zxPlane.rotation.x = Math.PI / 2;
        zxPlane.visible = config.showAxisGridSurface && config.showZGrids;
        this.scene.add(zxPlane);
        this.axisGridSurfaces.push(zxPlane);
    },

    /**
     * 创建坐标轴
     */
    createAxes() {
        const config = VisualizationConfig;
        
        if (this.axesGroup) {
            this.scene.remove(this.axesGroup);
        }
        
        this.axesGroup = new THREE.Group();
        
        const axisLength = config.coordRange * 1.5;
        
        // X轴 (红色) - 水平向右
        this.createAxisLine(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(axisLength, 0, 0),
            config.colors.axisX
        );
        
        // Y轴 (绿色) - 水平向前
        this.createAxisLine(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, axisLength, 0),
            config.colors.axisY
        );
        
        // Z轴 (蓝色) - 竖直向上
        this.createAxisLine(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, axisLength),
            config.colors.axisZ
        );
        
        // 添加轴标签
        if (config.showLabels) {
            this.createAxisLabel('X', new THREE.Vector3(axisLength + 0.5, 0, 0), config.colors.axisX);
            this.createAxisLabel('Y', new THREE.Vector3(0, axisLength + 0.5, 0), config.colors.axisY);
            this.createAxisLabel('Z', new THREE.Vector3(0, 0, axisLength + 0.5), config.colors.axisZ);
        }
        
        this.axesGroup.visible = config.showAxes;
        this.scene.add(this.axesGroup);
    },

    /**
     * 创建圆柱形线段（通用函数）
     * @param {THREE.Vector3} start - 起点
     * @param {THREE.Vector3} end - 终点
     * @param {number|string} colorHex - 颜色
     * @param {number} radius - 圆柱半径，默认0.02
     * @param {number} segments - 圆柱分段数，默认8
     * @returns {THREE.Mesh|null} 圆柱体网格对象
     */
    createCylinderLine(start, end, colorHex, radius = 0.02, segments = 8) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        if (length < 0.001) return null;
        
        // 使用圆柱体绘制粗线
        const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
        const material = new THREE.MeshBasicMaterial({ color: colorHex });
        const cylinder = new THREE.Mesh(geometry, material);
        
        // 圆柱体默认沿Y轴，需要旋转到正确方向
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cylinder.position.copy(midPoint);
        
        // 计算旋转
        const up = new THREE.Vector3(0, 1, 0);
        const dir = direction.clone().normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
        cylinder.quaternion.copy(quaternion);
        
        return cylinder;
    },

    /**
     * 创建坐标轴线（使用圆柱体实现加粗效果）
     */
    createAxisLine(start, end, colorHex) {
        const axisRadius = 0.01; // 坐标轴粗细
        
        // 使用通用函数创建圆柱形线段
        const cylinder = this.createCylinderLine(start, end, colorHex, axisRadius, 8);
        if (cylinder) {
            this.axesGroup.add(cylinder);
        }
        
        // 添加箭头（加大箭头）
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const dir = direction.clone().normalize();
        const arrowHelper = new THREE.ArrowHelper(
            dir,
            start,
            length,
            colorHex,
            0.8,  // 箭头长度
            0.4   // 箭头宽度
        );
        this.axesGroup.add(arrowHelper);
    },

    /**
     * 创建轴标签 (使用精灵)
     */
    createAxisLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        ctx.fillStyle = color;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(1, 1, 1);
        this.axesGroup.add(sprite);
    },

    /**
     * 渲染场景
     */
    render() {
        // 清除旧的向量对象
        this.vectorObjects.forEach(obj => this.scene.remove(obj));
        this.vectorObjects = [];
        
        // 更新网格和坐标轴可见性
        if (this.gridHelper) {
            this.gridHelper.visible = VisualizationConfig.showGrid;
        }
        if (this.gridHelperYZ) {
            this.gridHelperYZ.visible = VisualizationConfig.showGrid && VisualizationConfig.showZGrids;
        }
        if (this.gridHelperZX) {
            this.gridHelperZX.visible = VisualizationConfig.showGrid && VisualizationConfig.showZGrids;
        }
        if (this.axesGroup) {
            this.axesGroup.visible = VisualizationConfig.showAxes;
        }
        
        // 更新坐标轴网格面可见性
        if (this.axisGridSurfaces && this.axisGridSurfaces.length >= 3) {
            // XY平面
            this.axisGridSurfaces[0].visible = VisualizationConfig.showAxisGridSurface;
            // YZ平面
            this.axisGridSurfaces[1].visible = VisualizationConfig.showAxisGridSurface && VisualizationConfig.showZGrids;
            // ZX平面
            this.axisGridSurfaces[2].visible = VisualizationConfig.showAxisGridSurface && VisualizationConfig.showZGrids;
        }
        
        // 绘制所有向量
        const vectors = VectorManager.getVisibleVectors('3D');
        vectors.forEach(v => {
            if (v.components.length >= 3) {
                this.drawVector(
                    v.components[0],
                    v.components[1],
                    v.components[2],
                    v.color,
                    v.name
                );
            }
        });
        
        // 绘制所有3D图形
        const shapes = ShapeManager.getVisibleShapes('3D');
        shapes.forEach(shape => {
            if (shape.matrix.length >= 3) {
                this.drawShape3D(shape);
            }
        });
        
        // 更新子空间网格
        this.updateSubspaceGrids();
    },

    /**
     * 绘制向量（使用圆柱体实现加粗效果）
     */
    drawVector(x, y, z, color, name = '') {
        const origin = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(x, y, z);
        const direction = end.clone().normalize();
        const length = end.length();
        
        if (length < 0.001) return;
        
        const vectorRadius = 0.03; // 向量线段粗细
        const arrowLength = Math.min(length * 0.2, 0.5); // 箭头长度
        const arrowRadius = vectorRadius * 2.5; // 箭头宽度
        
        // 计算圆柱体部分的终点（需要留出箭头的空间）
        const cylinderEnd = origin.clone().add(direction.clone().multiplyScalar(length - arrowLength));
        
        // 创建圆柱形向量线段
        const cylinder = this.createCylinderLine(origin, cylinderEnd, color, vectorRadius, 8);
        if (cylinder) {
            this.scene.add(cylinder);
            this.vectorObjects.push(cylinder);
        }
        
        // 创建箭头（使用圆锥体）
        const coneGeometry = new THREE.ConeGeometry(arrowRadius, arrowLength, 12);
        const coneMaterial = new THREE.MeshBasicMaterial({ color: color });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        
        // 将圆锥放置在向量末端
        cone.position.copy(end.clone().sub(direction.clone().multiplyScalar(arrowLength / 2)));
        
        // 旋转圆锥使其指向向量方向
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
        cone.quaternion.copy(quaternion);
        
        this.scene.add(cone);
        this.vectorObjects.push(cone);
        
        // 添加标签
        if (name) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            
            ctx.fillStyle = color;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 64, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(x * 1.1, y * 1.1, z * 1.1);
            sprite.scale.set(1.5, 0.75, 1);
            
            this.scene.add(sprite);
            this.vectorObjects.push(sprite);
        }
    },

    /**
     * 绘制3D图形
     */
    drawShape3D(shape) {
        const points = [];
        const numPoints = shape.matrix[0].length;
        
        for (let i = 0; i < numPoints; i++) {
            points.push(new THREE.Vector3(
                shape.matrix[0][i],
                shape.matrix[1][i],
                shape.matrix[2][i]
            ));
        }
        
        if (points.length === 0) return;
        
        // 特殊处理：方程组平面（使用基向量绘制网格，复用子空间绘制方法）
        if (shape.shapeType === 'plane' && shape.params && shape.params.u && shape.params.v) {
            const gridExtent = VisualizationConfig.coordRange;  // 使用较小的范围
            this.draw2DSubspaceGrid(
                shape.params.u, 
                shape.params.v, 
                shape.color, 
                gridExtent, 
                false,  // 不绘制基向量轴
                shape.params.p0,  // 以 p0 为原点
                shape.name  // 标签名称
            );
            return;
        }
        
        // 检查所有点是否共面（用于投影后的图形）
        const isCoplanar = this.checkCoplanar(points);
        
        // 尝试创建半透明的面（使用ConvexGeometry）
        if (points.length >= 4) {
            try {
                // 对于大量点，创建凸包网格
                if (points.length > 20 && !isCoplanar) {
                    // 球体、椭球等密集点云，使用凸包（仅当非共面时）
                    const convexGeometry = new ConvexGeometry(points);
                    
                    // 创建半透明的面
                    const meshMaterial = new THREE.MeshPhongMaterial({
                        color: shape.color,
                        transparent: true,
                        opacity: 0.6,
                        side: THREE.DoubleSide,
                        flatShading: true
                    });
                    const mesh = new THREE.Mesh(convexGeometry, meshMaterial);
                    this.scene.add(mesh);
                    this.vectorObjects.push(mesh);
                    
                    // 添加线框
                    const wireframeMaterial = new THREE.LineBasicMaterial({ 
                        color: shape.color,
                        linewidth: 1,
                        transparent: true,
                        opacity: 0.8
                    });
                    const wireframe = new THREE.LineSegments(
                        new THREE.EdgesGeometry(convexGeometry),
                        wireframeMaterial
                    );
                    this.scene.add(wireframe);
                    this.vectorObjects.push(wireframe);
                } else if (points.length > 20 && isCoplanar) {
                    // 共面点（投影后的图形），绘制2D凸包轮廓
                    this.drawCoplanarShape(points, shape.color);
                } else {
                    // 点数较少（立方体、圆锥等），只绘制线框和点
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ 
                        color: shape.color,
                        linewidth: 2
                    });
                    const line = new THREE.Line(geometry, material);
                    
                    this.scene.add(line);
                    this.vectorObjects.push(line);
                    
                    // 添加点标记
                    const pointsMaterial = new THREE.PointsMaterial({ 
                        color: shape.color, 
                        size: 0.3 
                    });
                    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
                    
                    this.scene.add(pointsMesh);
                    this.vectorObjects.push(pointsMesh);
                }
            } catch (e) {
                // 如果凸包创建失败，回退到线框模式
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: shape.color,
                    linewidth: 2
                });
                const line = new THREE.Line(geometry, material);
                
                this.scene.add(line);
                this.vectorObjects.push(line);
            }
        } else {
            // 点数太少，只绘制线框
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: shape.color,
                linewidth: 2
            });
            const line = new THREE.Line(geometry, material);
            
            this.scene.add(line);
            this.vectorObjects.push(line);
        }
        
        // 添加标签
        if (shape.name && points.length > 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            
            ctx.fillStyle = shape.color;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(shape.name, 64, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            
            // 标签位置：第一个点的位置稍微偏移
            sprite.position.set(
                points[0].x * 1.2,
                points[0].y * 1.2,
                points[0].z * 1.2
            );
            sprite.scale.set(1.5, 0.75, 1);
            
            this.scene.add(sprite);
            this.vectorObjects.push(sprite);
        }
    },

    /**
     * 检查点集是否共面
     * @param {THREE.Vector3[]} points - 点集
     * @returns {boolean} 是否共面
     */
    checkCoplanar(points) {
        if (points.length < 4) return true;
        
        // 检查是否所有点在同一平面上
        // 方法：检查某个坐标分量是否完全相同（投影后的情况）
        const threshold = 1e-6;
        
        // 检查X坐标
        const xValues = points.map(p => p.x);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        if (xMax - xMin < threshold) return true;
        
        // 检查Y坐标
        const yValues = points.map(p => p.y);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        if (yMax - yMin < threshold) return true;
        
        // 检查Z坐标
        const zValues = points.map(p => p.z);
        const zMin = Math.min(...zValues);
        const zMax = Math.max(...zValues);
        if (zMax - zMin < threshold) return true;
        
        return false;
    },

    /**
     * 绘制共面点集（投影后的图形）
     * @param {THREE.Vector3[]} points - 共面点集
     * @param {string} color - 颜色
     */
    drawCoplanarShape(points, color) {
        if (points.length < 3) return;
        
        // 确定哪个平面（XY, XZ, YZ）
        const threshold = 1e-6;
        const zValues = points.map(p => p.z);
        const yValues = points.map(p => p.y);
        const xValues = points.map(p => p.x);
        
        const zRange = Math.max(...zValues) - Math.min(...zValues);
        const yRange = Math.max(...yValues) - Math.min(...yValues);
        const xRange = Math.max(...xValues) - Math.min(...xValues);
        
        // 计算2D凸包
        let hullPoints2D = [];
        let zLevel = 0, yLevel = 0, xLevel = 0;
        
        if (zRange < threshold) {
            // XY平面
            zLevel = points[0].z;
            const points2D = points.map(p => ({ x: p.x, y: p.y }));
            hullPoints2D = this.convexHull2D(points2D);
            
            // 转换回3D点并创建形状
            const hullPoints3D = hullPoints2D.map(p => new THREE.Vector3(p.x, p.y, zLevel));
            hullPoints3D.push(hullPoints3D[0]); // 闭合
            
            const geometry = new THREE.BufferGeometry().setFromPoints(hullPoints3D);
            const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const line = new THREE.LineLoop(geometry, material);
            this.scene.add(line);
            this.vectorObjects.push(line);
            
            // 添加填充面
            const shape = new THREE.Shape(hullPoints2D.map(p => new THREE.Vector2(p.x, p.y)));
            const shapeGeometry = new THREE.ShapeGeometry(shape);
            const positions = shapeGeometry.attributes.position.array;
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] = zLevel;
            }
            shapeGeometry.attributes.position.needsUpdate = true;
            
            const meshMaterial = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.DoubleSide 
            });
            const mesh = new THREE.Mesh(shapeGeometry, meshMaterial);
            this.scene.add(mesh);
            this.vectorObjects.push(mesh);
            
        } else if (yRange < threshold) {
            // XZ平面
            yLevel = points[0].y;
            const points2D = points.map(p => ({ x: p.x, y: p.z }));
            hullPoints2D = this.convexHull2D(points2D);
            
            const hullPoints3D = hullPoints2D.map(p => new THREE.Vector3(p.x, yLevel, p.y));
            hullPoints3D.push(hullPoints3D[0]);
            
            const geometry = new THREE.BufferGeometry().setFromPoints(hullPoints3D);
            const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const line = new THREE.LineLoop(geometry, material);
            this.scene.add(line);
            this.vectorObjects.push(line);
            
            // 添加填充面
            const shape = new THREE.Shape(hullPoints2D.map(p => new THREE.Vector2(p.x, p.y)));
            const shapeGeometry = new THREE.ShapeGeometry(shape);
            const positions = shapeGeometry.attributes.position.array;
            const newPositions = new Float32Array(positions.length);
            for (let i = 0; i < positions.length; i += 3) {
                newPositions[i] = positions[i];     // x
                newPositions[i + 1] = yLevel;        // y (固定)
                newPositions[i + 2] = positions[i + 1]; // z
            }
            shapeGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
            
            const meshMaterial = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.DoubleSide 
            });
            const mesh = new THREE.Mesh(shapeGeometry, meshMaterial);
            this.scene.add(mesh);
            this.vectorObjects.push(mesh);
            
        } else if (xRange < threshold) {
            // YZ平面
            xLevel = points[0].x;
            const points2D = points.map(p => ({ x: p.y, y: p.z }));
            hullPoints2D = this.convexHull2D(points2D);
            
            const hullPoints3D = hullPoints2D.map(p => new THREE.Vector3(xLevel, p.x, p.y));
            hullPoints3D.push(hullPoints3D[0]);
            
            const geometry = new THREE.BufferGeometry().setFromPoints(hullPoints3D);
            const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const line = new THREE.LineLoop(geometry, material);
            this.scene.add(line);
            this.vectorObjects.push(line);
            
            // 添加填充面
            const shape = new THREE.Shape(hullPoints2D.map(p => new THREE.Vector2(p.x, p.y)));
            const shapeGeometry = new THREE.ShapeGeometry(shape);
            const positions = shapeGeometry.attributes.position.array;
            const newPositions = new Float32Array(positions.length);
            for (let i = 0; i < positions.length; i += 3) {
                newPositions[i] = xLevel;            // x (固定)
                newPositions[i + 1] = positions[i];  // y
                newPositions[i + 2] = positions[i + 1]; // z
            }
            shapeGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
            
            const meshMaterial = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.DoubleSide 
            });
            const mesh = new THREE.Mesh(shapeGeometry, meshMaterial);
            this.scene.add(mesh);
            this.vectorObjects.push(mesh);
        }
    },

    /**
     * 计算2D凸包（Graham扫描算法）
     * @param {object[]} points - 2D点集 [{x, y}]
     * @returns {object[]} 凸包点集
     */
    convexHull2D(points) {
        if (points.length < 3) return points;
        
        // 复制并排序点
        const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
        
        // 构建下凸包
        const lower = [];
        for (let i = 0; i < sorted.length; i++) {
            while (lower.length >= 2 && this.cross2D(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
                lower.pop();
            }
            lower.push(sorted[i]);
        }
        
        // 构建上凸包
        const upper = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            while (upper.length >= 2 && this.cross2D(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
                upper.pop();
            }
            upper.push(sorted[i]);
        }
        
        // 移除重复的首尾点
        lower.pop();
        upper.pop();
        
        return lower.concat(upper);
    },

    /**
     * 2D叉积（用于凸包计算）
     * @param {object} o - 原点
     * @param {object} a - 点A
     * @param {object} b - 点B
     * @returns {number} 叉积值
     */
    cross2D(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    },

    /**
     * 动画循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * 重置视图
     */
    resetView() {
        this.camera.position.set(15, -15, 15);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    },

    /**
     * 存储子空间网格对象
     */
    subspaceGrids: [],

    /**
     * 绘制子空间网格
     * 1D子空间：一条直线穿过原点
     * 2D子空间：一个平面网格
     * 3D子空间：整个空间（不特别绘制）
     */
    updateSubspaceGrids() {
        // 清除旧的子空间网格
        this.subspaceGrids.forEach(obj => this.scene.remove(obj));
        this.subspaceGrids = [];
        
        const subspaces = SubspaceManager.getVisibleSubspaces('3D');
        const gridExtent = VisualizationConfig.coordRange;  // 使用较小的范围
        
        subspaces.forEach(subspace => {
            const basisVectors = SubspaceManager.getBasisVectors(subspace);
            if (basisVectors.length === 0) return;
            
            const color = new THREE.Color(subspace.color);
            
            if (basisVectors.length === 1) {
                // 1D子空间：画一条直线
                const v = basisVectors[0].components;
                const basisColor = basisVectors[0].color;
                const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
                if (len < 1e-10) return;
                
                const t = gridExtent / len;
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-v[0] * t, -v[1] * t, -v[2] * t),
                    new THREE.Vector3(v[0] * t, v[1] * t, v[2] * t)
                ]);
                const material = new THREE.LineBasicMaterial({ 
                    color: color, 
                    opacity: 0.5, 
                    transparent: true 
                });
                const line = new THREE.Line(geometry, material);
                this.scene.add(line);
                this.subspaceGrids.push(line);
                
                // 绘制基向量作为加粗的坐标轴（使用基向量的颜色）
                this.drawBasisVectorAxis(v, basisColor, gridExtent);
                
            } else if (basisVectors.length === 2) {
                // 2D子空间：画一个平面网格
                const v1 = basisVectors[0].components;
                const v2 = basisVectors[1].components;
                const color1 = basisVectors[0].color;
                const color2 = basisVectors[1].color;
                this.draw2DSubspaceGrid(v1, v2, subspace.color, gridExtent, false);
                // 单独绘制基向量轴，使用各自的颜色
                this.drawBasisVectorAxis(v1, color1, gridExtent);
                this.drawBasisVectorAxis(v2, color2, gridExtent);
                
            } else if (basisVectors.length === 3) {
                // 3D子空间：对两两组合的基向量分别生成网格
                const v1 = basisVectors[0].components;
                const v2 = basisVectors[1].components;
                const v3 = basisVectors[2].components;
                const color1 = basisVectors[0].color;
                const color2 = basisVectors[1].color;
                const color3 = basisVectors[2].color;
                
                // 三个2D平面网格（两两组合），不绘制轴
                this.draw2DSubspaceGrid(v1, v2, subspace.color, gridExtent, false);
                this.draw2DSubspaceGrid(v1, v3, subspace.color, gridExtent, false);
                this.draw2DSubspaceGrid(v2, v3, subspace.color, gridExtent, false);
                
                // 单独绘制三个基向量轴，使用各自的颜色
                this.drawBasisVectorAxis(v1, color1, gridExtent);
                this.drawBasisVectorAxis(v2, color2, gridExtent);
                this.drawBasisVectorAxis(v3, color3, gridExtent);
            }
        });
    },

    /**
     * 绘制基向量作为加粗的坐标轴
     * @param {number[]} v - 基向量分量 [x, y, z]
     * @param {string} colorHex - 颜色
     * @param {number} gridExtent - 网格范围
     */
    drawBasisVectorAxis(v, colorHex, gridExtent) {
        const axisRadius = 0.02;
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (len < 1e-10) return;
        
        const t = gridExtent / len;
        const start = new THREE.Vector3(-v[0] * t, -v[1] * t, -v[2] * t);
        const end = new THREE.Vector3(v[0] * t, v[1] * t, v[2] * t);
        const cylinder = this.createCylinderLine(start, end, colorHex, axisRadius, 8);
        if (cylinder) {
            this.scene.add(cylinder);
            this.subspaceGrids.push(cylinder);
        }
    },

    /**
     * 绘制2D子空间网格（由两个基向量定义的平面）
     * @param {number[]} v1 - 第一个基向量的分量 [x, y, z]
     * @param {number[]} v2 - 第二个基向量的分量 [x, y, z]
     * @param {string} colorHex - 颜色
     * @param {number} gridExtent - 网格范围
     * @param {boolean} drawAxes - 是否绘制加粗的基向量轴
     * @param {number[]} origin - 可选的原点偏移 [x, y, z]，默认为 [0, 0, 0]
     * @param {string} label - 可选的标签名称
     */
    draw2DSubspaceGrid(v1, v2, colorHex, gridExtent, drawAxes = true, origin = null, label = null) {
        const color = new THREE.Color(colorHex);
        const o = origin || [0, 0, 0];  // 默认原点
        
        // 判断是否为方程组平面（有原点偏移的情况），决定使用哪个存储数组
        const isEquationPlane = origin !== null;
        const storageArray = isEquationPlane ? this.vectorObjects : this.subspaceGrids;
        
        const gridCount = Math.ceil(gridExtent / Math.min(
            Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]),
            Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2])
        )) + 2;
        
        const material = new THREE.LineBasicMaterial({ 
            color: color, 
            opacity: isEquationPlane ? 0.4 : 0.3, 
            transparent: true 
        });
        
        // 沿v1方向的线（平行于v2）
        for (let i = -gridCount; i <= gridCount; i++) {
            const points = [
                new THREE.Vector3(
                    o[0] + i * v1[0] - gridCount * v2[0],
                    o[1] + i * v1[1] - gridCount * v2[1],
                    o[2] + i * v1[2] - gridCount * v2[2]
                ),
                new THREE.Vector3(
                    o[0] + i * v1[0] + gridCount * v2[0],
                    o[1] + i * v1[1] + gridCount * v2[1],
                    o[2] + i * v1[2] + gridCount * v2[2]
                )
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            storageArray.push(line);
        }
        
        // 沿v2方向的线（平行于v1）
        for (let i = -gridCount; i <= gridCount; i++) {
            const points = [
                new THREE.Vector3(
                    o[0] + i * v2[0] - gridCount * v1[0],
                    o[1] + i * v2[1] - gridCount * v1[1],
                    o[2] + i * v2[2] - gridCount * v1[2]
                ),
                new THREE.Vector3(
                    o[0] + i * v2[0] + gridCount * v1[0],
                    o[1] + i * v2[1] + gridCount * v1[1],
                    o[2] + i * v2[2] + gridCount * v1[2]
                )
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            storageArray.push(line);
        }
        
        // 绘制基向量作为加粗的坐标轴（延伸到整个网格范围）
        if (drawAxes) {
            const axisRadius = 0.02;
            
            // 第一个基向量轴
            const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
            const t1 = len1 > 1e-10 ? gridExtent / len1 : 0;
            const start1 = new THREE.Vector3(-v1[0] * t1, -v1[1] * t1, -v1[2] * t1);
            const end1 = new THREE.Vector3(v1[0] * t1, v1[1] * t1, v1[2] * t1);
            const cylinder1 = this.createCylinderLine(start1, end1, colorHex, axisRadius, 8);
            if (cylinder1) {
                this.scene.add(cylinder1);
                this.subspaceGrids.push(cylinder1);
            }
            
            // 第二个基向量轴
            const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
            const t2 = len2 > 1e-10 ? gridExtent / len2 : 0;
            const start2 = new THREE.Vector3(-v2[0] * t2, -v2[1] * t2, -v2[2] * t2);
            const end2 = new THREE.Vector3(v2[0] * t2, v2[1] * t2, v2[2] * t2);
            const cylinder2 = this.createCylinderLine(start2, end2, colorHex, axisRadius, 8);
            if (cylinder2) {
                this.scene.add(cylinder2);
                this.subspaceGrids.push(cylinder2);
            }
        }
        
        // 绘制子空间网格面（半透明平面）
        if (VisualizationConfig.showSubspaceGridSurface) {
            // 计算平面的四个角点
            const corner1 = new THREE.Vector3(
                o[0] - gridCount * v1[0] - gridCount * v2[0],
                o[1] - gridCount * v1[1] - gridCount * v2[1],
                o[2] - gridCount * v1[2] - gridCount * v2[2]
            );
            const corner2 = new THREE.Vector3(
                o[0] + gridCount * v1[0] - gridCount * v2[0],
                o[1] + gridCount * v1[1] - gridCount * v2[1],
                o[2] + gridCount * v1[2] - gridCount * v2[2]
            );
            const corner3 = new THREE.Vector3(
                o[0] + gridCount * v1[0] + gridCount * v2[0],
                o[1] + gridCount * v1[1] + gridCount * v2[1],
                o[2] + gridCount * v1[2] + gridCount * v2[2]
            );
            const corner4 = new THREE.Vector3(
                o[0] - gridCount * v1[0] + gridCount * v2[0],
                o[1] - gridCount * v1[1] + gridCount * v2[1],
                o[2] - gridCount * v1[2] + gridCount * v2[2]
            );
            
            // 创建平面几何体
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                corner1.x, corner1.y, corner1.z,
                corner2.x, corner2.y, corner2.z,
                corner3.x, corner3.y, corner3.z,
                corner1.x, corner1.y, corner1.z,
                corner3.x, corner3.y, corner3.z,
                corner4.x, corner4.y, corner4.z
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const surfaceMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
                depthWrite: isEquationPlane ? false : true
            });
            const surface = new THREE.Mesh(geometry, surfaceMaterial);
            this.scene.add(surface);
            storageArray.push(surface);
        }
        
        // 添加标签（仅当提供了 label 参数时）
        if (label) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            
            ctx.fillStyle = colorHex;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 64, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            
            // 标签位置：原点位置
            sprite.position.set(o[0], o[1], o[2]);
            sprite.scale.set(1.5, 0.75, 1);
            
            this.scene.add(sprite);
            storageArray.push(sprite);
        }
    }
};

// 导出模块
window.Renderer3D = Renderer3D;
