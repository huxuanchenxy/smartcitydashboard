<template>
  <div :style="wrapperStyle">
    <div
      ref="containerRef"
      :width="wrapperStyle.width"
      :height="wrapperStyle.height"
      @click="modelTap"
    ></div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  toRef,
  CSSProperties,
  ref,
  onMounted,
  onUnmounted,
  watch,
  getCurrentInstance,
} from 'vue'
import { useDataCenter, getFieldMap } from '@/mixins/data-center'
import { ApiModule } from '@/store/modules/api'
import {
  ThreedModelConfig,
  ThreedViewer,
  ThreedModelEventArgs,
  ThreedModelEventType,
  modelNodeMapping,
  LightType,
  ThreedLightEventArgs,
  LightConfig,
  AmbientLightConfig,
  BackgroundType,
  GroundConfig,
  FogConfig,
  BackgroundConfig,
  mapPointSetting,
} from './threed-viewer'
import { useEventCenter } from '@/mixins/event-center'
import * as THREE from 'three'
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js'
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  TransformControls,
  TransformControlsMode,
} from 'three/examples/jsm/controls/TransformControls.js'
/*import { ElButton } from 'element-plus'*/
import { getFile, getModel } from '@/api/threed'
import { HandleItemField, IcHandleItemField } from '@/components/data-handle'
import { NodeDataType, convertNodeTypeToDataType, computeDataType } from '@/utils/threed-node'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { EditorModule } from '@/store/modules/editor'
import { mapPoint } from './mapPoint'
import dcRequest from '@/utils/dc-request'

interface modelInfo {
  wrapper: THREE.Group
  materialWrapper: THREE.Group
  config: ThreedModelConfig
}


export default defineComponent({
  name: 'VThreedViewer',
  props: {
    com: {
      type: Object as PropType<ThreedViewer>,
      required: true,
    },
  },
  setup(props) {
    useDataCenter(props.com)
    useEventCenter(props.com)

    const mitter = getCurrentInstance()?.appContext.config.globalProperties.mitter

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')

    const containerRef = ref<HTMLDivElement | null>(null) //容器

    let objControl: TransformControls | null = null //模型控制器
    let scene: THREE.Scene //场景
    let renderer: THREE.WebGLRenderer //渲染器
    let currentCamera: THREE.PerspectiveCamera //相机
    let cameraLight: THREE.DirectionalLight //相机辅助光
    let cameraControl: ArcballControls
    //let cameraControl: OrbitControls;

    //let tempModel: THREE.Object3D | null = null
    //let currentModel: THREE.Object3D | null = null

    let selectObject: any //选中的模型
    //let groupList: THREE.Group[] = [] //模型组
    let objList: modelInfo[] = [] //模型列表
    const mouse = new THREE.Vector2() //鼠标

    let animationActions: Record<string, THREE.AnimationAction> = {}
    let mixers: THREE.AnimationMixer[] = []
    const animationClock = new THREE.Clock()
    let ambientLight: THREE.AmbientLight

    let ground:THREE.Mesh
    let cameraPointGroup:THREE.Group

    const dv_data = computed(() => {
      return ApiModule.dataMap[props.com.id]?.source ?? {}
    })

    const dv_field = computed(() => {
      return getFieldMap(props.com.apis.source.fields)
    })

    const wrapperStyle = computed(() => {
      return {
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
      } as CSSProperties
    })

    const mapPointList = ref<mapPoint[]>([])

    function parseNumberPair(
      input: string | number | null | undefined
    ): { code: number; angle: number;bonename:string } {
      if (input == null) return { code: 0, angle: 20,bonename:'' }

      const arr = String(input).split(',').slice(0, 3) // 只拿前两项
      const n1 = Number(arr[0])
      const n2 = Number(arr[1])
      const n3 = arr[2]

      return {
        code: Number.isFinite(n1) ? n1 : 0,
        angle: Number.isFinite(n2) ? n2 : 20,
        bonename: n3
      }
    }

    function findEnabledBone(boneName: string): Record<string, any> | null {
        const models = props.com?.config?.models || [];
        console.log('models', models)
        for (const model of models) {
          //TODO:id: "cd596f41-47b8-4cda-9852-65d715180307"这里的model还不知道是哪个，先默认只有一个
          for (const mapping of model.modelNodeMappings || []) {
            for (const bone of mapping.boneData || []) {
              if (bone.name === boneName && bone.enable === true) {
                return bone;
              }
            }
          }
        }

        return null;
    }

    const boneMap: Record<string, THREE.Bone> = {}   // 骨骼名字 -> Bone 对象
    let CurrentDeg = 0  
    let DELTA_PER_CALL = -20        // 每次再转 2°
    const ROT_DURATION   = 500      // 毫秒，越小越快
    //nodeValueChange
    mitter.on(props.com.id, (field: IcHandleItemField) => {
      // console.log('field', field)//这个是外面操作时传来的值
      // console.log('field.targetMethodName', field.targetMethodName)
      switch (field.targetMethodName) {
        case 'nodeValueChange':
          // console.log('onNodeValueChange', field.value, field)

          const device = field.icDevice
          const node = field.icName

          const { code, angle,bonename } = parseNumberPair(field.value)
            /* ===== 新增：用 value 区分指令类型 ===== */
            if (code == 3800) {
              let findedbone = findEnabledBone(bonename)
              console.log('[arm] 启动3800',findedbone)
              if (!findedbone) {
                console.warn('[arm] '+bonename+' 不存在或者没有配置')
                return
              }
              const bone = boneMap[findedbone.name]

              DELTA_PER_CALL = angle

              
              const newDeg = CurrentDeg + DELTA_PER_CALL
              const axis = findedbone.rotate         // "x"|"y"|"z"
              const startRad = bone.rotation[axis]       // 当前弧度
              const endRad   = THREE.MathUtils.degToRad(newDeg)

              // 创建平滑 tween
              new TWEEN.Tween({ rad: startRad })
                .to({ rad: endRad }, ROT_DURATION)
                .onUpdate(obj => {
                  // bone.rotation.x = obj.rad
                  bone.rotation[axis] = obj.rad
                  render()          // 每一帧都画一次
                })
                .start()

              // 记下来，下次继续累加
              CurrentDeg = newDeg
              return
            }

            /* ====================================== */

          const stopList: THREE.AnimationAction[] = []
          const playList: THREE.AnimationAction[] = []
          props.com.config.models.forEach(r =>
            r.modelNodeMappings
              .filter(m => m.deviceCode == device && m.nodeCode == node)
              .forEach(nm => {
                let judge = judgePlayAnimation(nm, field.value)
                if (judge) {
                  if (animationActions[nm.modelKey]) {
                    playList.push(animationActions[nm.modelKey])
                  }
                }
                else {
                  if (animationActions[nm.modelKey]) {
                    stopList.push(animationActions[nm.modelKey])
                  }
                }
              }),
          )

          stopList.forEach(r => r.reset().fadeOut(0.2).stop())
          // console.log('playList.forEach start')
          playList.forEach(r => r.reset().fadeIn(0.2).play())
          // console.log('playList.forEach end')
          break
        case 'navigatorStart':
          cameraNavigatorStart()
          break
        case 'navigatorStop':
          cameraNavigatorStop()
          break
        case 'cameraReset':
          cameraReset()
          break
        case 'changeMeshMaterialColor':
          //console.log('changeMeshMaterialColor', field.value, field)
          changeMeshMaterialColor(JSON.parse(field.params))
          break
        case 'setMapPoint':
          const pointSource = JSON.parse(field.params) as mapPointSetting[]
          setMapPoint(pointSource)
          break
        case 'clearMapPoint':
          clearMapPoint()
          break
        case 'resetMapPoint':
          let resetMapPointSource = JSON.parse(field.params) as mapPointSetting[]
          resetMapPoint(resetMapPointSource)
          break
      }
    })

    const comEvent = (fields: HandleItemField[],e:mapPoint) => {
      //fileds.forEach(r=>r.value=inputValue.value)
      fields.forEach(field => {
        field.value=e
        field.params=JSON.stringify(e)
        // emit自定义事件
        mitter.emit(field.targetComId, field)
      })
    }

    const comIcEvent = (targetMethodName:string,e:any) => {
      //fileds.forEach(r=>r.value=inputValue.value)
      // fields.forEach(field => {
      //   field.value=e
      //   field.params=JSON.stringify(e)
      //   // emit自定义事件
      //   mitter.emit(field.targetComId, field)
      // })
      props.com.ichandles.event.fields.forEach(field => {
        if (field.targetMethodTriggle == 'event' && field.targetMethodName == targetMethodName) {
          //field.value = e
          // emit自定义事件
          mitter.emit(field.targetComId, field)
        }
      })
    }


    //判断是否播放动画
    const judgePlayAnimation = (nodeMapping: modelNodeMapping, value: any) => {
      let result = false
      let dataType = convertNodeTypeToDataType(nodeMapping.nodeType)

      result = computeDataType(dataType, nodeMapping.operator1, nodeMapping.value1, value)
      if (
        result &&
        nodeMapping.operator2 &&
        nodeMapping.value2 != undefined && nodeMapping.value2 != null && nodeMapping.value2 != ''
      ) {
        result = computeDataType(dataType, nodeMapping.operator2, nodeMapping.value2, value)
      }

      return result
    }

    const addModelToScene = (
      threedModel: GLTF,
      modelConfig: ThreedModelConfig,
    ) => {
      let group: THREE.Group

      let model: modelInfo = objList.find(r => r.config.id == modelConfig.id)

      if (model) {
        group = model.wrapper
        group.clear()
        if (model.materialWrapper) {
          model.materialWrapper.clear()
        }

        model.config = modelConfig
      } else {
        group = new THREE.Group()
        scene.add(group)

        model = {
          wrapper: group,
          materialWrapper: null,
          config: modelConfig,
        }
        objList.push(model)
      }

      //let loader = new THREE.ObjectLoader()

      if (threedModel != null) {
        //const currentModel = loader.parse(threedModel)
        const currentModel = threedModel.scene
        group.add(currentModel)
        rotateCurrentModel(group, model.config)
        changeCurrentModelPosition(group, model.config)
        changeCurrentModelScale(group, model.config)
        loadAnimations(currentModel, threedModel.animations)

        addMaterial(model)
        // console.log('currentModel',currentModel)
        // ========= 新增：缓存骨骼 =========
        currentModel.traverse(obj => {
          if ((obj as any).isBone) {
            const bone = obj as THREE.Bone
            boneMap[bone.name] = bone
            // console.log('[arm] cached bone ->', bone.name)
          }
        })
        // ===================================
      }

      render()
      console.log(group)
    }

    const getNodeMapping = (clip: THREE.AnimationClip) => {
      for (let i = 0; i < props.com.config.models.length; i++) {
        let model = props.com.config.models[i]
        for (let j = 0; j < model.modelNodeMappings.length; j++) {
          let nodeMapping = model.modelNodeMappings[j]
          if (nodeMapping.modelKey == clip.name) {
            return nodeMapping
          }
        }
      }
      return null
    }

    const loadAnimations = (threedModel: THREE.Object3D, animations: THREE.AnimationClip[]) => {
      let mixer = new THREE.AnimationMixer(threedModel)
      mixers.push(mixer)

      if (animations && animations.length > 0) {
        animations.forEach(r => {
          animationActions[r.name] = mixer.clipAction(r)
          animationActions[r.name].loop = THREE.LoopOnce
          animationActions[r.name].clampWhenFinished = true

          let nodeMapping = getNodeMapping(r)
          if (nodeMapping && nodeMapping.loop) {
            animationActions[r.name].loop = THREE.LoopRepeat
          }
        })
      }
    }

    // 创建场景
    const initScene = () => {
      scene = new THREE.Scene()
    }

    // 创建渲染器
    const initRenderer = () => {
      renderer = new THREE.WebGLRenderer({ antialias: true })
      //renderer.setClearColor(config.value.render.clearColor)
      //renderer.setSize(attr.value.w, attr.value.h)
      //renderer.setClearColor(0xffffff, 0)
      //renderer.setRenderTarget(null)
      renderer.setPixelRatio(config.value.render.pixelRatio)
    }

    //实例化一个透视投影相机
    const initCamera = () => {
      currentCamera = new THREE.PerspectiveCamera(config.value.camera.fov, attr.value.w / attr.value.h, config.value.camera.near, config.value.camera.far)
      setCameraPosition()
    }

    const setCameraPosition = () => {
      currentCamera.position.set(
        config.value.camera.position.x,
        config.value.camera.position.y,
        config.value.camera.position.z,
      )
      //相机观察目标指向Threejs 3D空间中某个位置
      //camera.lookAt(mesh.position); //指向mesh对应的位置
      currentCamera.lookAt(
        config.value.camera.lookAt.x,
        config.value.camera.lookAt.y,
        config.value.camera.lookAt.z,
      )
    }

    //设置光源
    const initCameraLight = () => {
      cameraLight = new THREE.DirectionalLight(
        config.value.camera.light.color,
        config.value.camera.light.intensity,
      )
      if (currentCamera) {
        cameraLight.position.set(
          currentCamera.position.x,
          currentCamera.position.y,
          currentCamera.position.z,
        )
      }

      scene.add(cameraLight)
    }

    const initLight = () => {
      config.value.light.forEach(lightConfig => {
        addLight(lightConfig)
      })
    }


    // 设置相机控件轨道控制器
    const initCameraControl = () => {
      cameraControl = new ArcballControls(currentCamera, renderer.domElement)
      cameraControl.addEventListener('change', function () {
        if (cameraLight) {
          cameraLight.position.set(
            currentCamera.position.x,
            currentCamera.position.y,
            currentCamera.position.z,
          )
          render()
        }
      })
      cameraControl.update()
    }

    //设置物体控制器
    const initObjectControl = () => {
      objControl = new TransformControls(currentCamera, renderer.domElement)
      objControl.addEventListener('change', render)

      objControl.addEventListener('dragging-changed', function (event) {
        if (cameraControl) {
          cameraControl.enabled = !event.value
        }
      })
      objControl.setSpace('local')

      if (config.value.transform != null) {
        if (config.value.transform != 'none') {
          objControl.setMode(config.value.transform as TransformControlsMode)
          objControl.enabled = true
        } else {
          objControl.enabled = false
        }
      }

      // scene.add(objControl)
    }

    const addLight = (config: LightConfig) => {
      let light: THREE.Light
      switch (config.lightType) {
        case LightType.DirectionalLight:
          light = new THREE.DirectionalLight(config.color, config.intensity)
          break
        case LightType.AmbientLight:
          light = new THREE.AmbientLight(config.color, config.intensity)
          break
      }

      light.uuid = config.id
      light.position.set(
        config.x,
        config.y,
        config.z,
      )

      scene.add(light)
    }

    const initAmbientLight = () => {
      ambientLight = new THREE.AmbientLight(config.value.scene.ambientLight.color, config.value.scene.ambientLight.intensity)
      scene.add(ambientLight)
    }


    const initBackground = (item: BackgroundConfig) => {
      //const backgroundConfig = config.value.scene.background
      switch (item.type) {
        case BackgroundType.none:
          scene.background = null
          break
        case BackgroundType.Color:
          scene.background = new THREE.Color(item.color)
          break
        case BackgroundType.Day:
          item.pic1 = 'images/3d/day_1.jpg'
          item.pic2 = 'images/3d/day_2.jpg'
          item.pic3 = 'images/3d/day_3.jpg'
          item.pic4 = 'images/3d/day_4.jpg'
          item.pic5 = 'images/3d/day_5.jpg'
          item.pic6 = 'images/3d/day_6.jpg'
          const textureCubeDay = new THREE.CubeTextureLoader().load([
            item.pic1,
            item.pic2,
            item.pic3,
            item.pic4,
            item.pic5,
            item.pic6,
          ])
          scene.background = textureCubeDay // 作为背景贴图
          break
        case BackgroundType.Night:
          item.pic1 = 'images/3d/night_1.jpg'
          item.pic2 = 'images/3d/night_2.jpg'
          item.pic3 = 'images/3d/night_3.jpg'
          item.pic4 = 'images/3d/night_4.jpg'
          item.pic5 = 'images/3d/night_5.jpg'
          item.pic6 = 'images/3d/night_6.jpg'
          const textureCubeNight = new THREE.CubeTextureLoader().load([
            item.pic1,
            item.pic2,
            item.pic3,
            item.pic4,
            item.pic5,
            item.pic6,
          ])
          scene.background = textureCubeNight // 作为背景贴图
          break
        case BackgroundType.Texture:
          const textureCube = new THREE.CubeTextureLoader().load([
            item.pic1,
            item.pic2,
            item.pic3,
            item.pic4,
            item.pic5,
            item.pic6,
          ])
          scene.background = textureCube // 作为背景贴图
          break
      }
    }

    const initGround = (item: GroundConfig) => {
      //const groundConfig = config.value.scene.ground

      ground = scene.getObjectByName('bigscreen_3dViewer_ground') as THREE.Mesh
      if (ground) {
        scene.remove(ground)
      }

      if (item.enabled) {
        const groundGeo = new THREE.PlaneGeometry(item.width, item.height)
        const groundMat = new THREE.MeshLambertMaterial({ color: item.color })

        ground = new THREE.Mesh(groundGeo, groundMat)
        ground.name = 'bigscreen_3dViewer_ground'
        ground.visible = item.enabled
        ground.position.x = item.position.x
        ground.position.y = item.position.y
        ground.position.z = item.position.z


        ground.rotation.x = THREE.MathUtils.degToRad(item.rotation.x) //- Math.PI / 2
        ground.rotation.y = THREE.MathUtils.degToRad(item.rotation.y)
        ground.rotation.z = THREE.MathUtils.degToRad(item.rotation.z)

        //ground.rotation.x = - Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)
      }
    }


    const initFog = (item: FogConfig) => {
      //const fogConfig = config.value.scene.fog
      if (item.enabled) {
        scene.fog = new THREE.Fog(item.color, item.near, item.far)
      }
      else {
        scene.fog = null
      }
    }

    //渲染场景
    const render = () => {
      const time = animationClock.getDelta()

      mixers.forEach(mixer => {
        mixer.update(time)
      })

      // 定义threejs输出画布的尺寸(单位:像素px)
      renderer.setSize(attr.value.w, attr.value.h) //设置three.js渲染区域的尺寸(像素px)
      renderer.setRenderTarget(null)
      renderer.setPixelRatio(config.value.render.pixelRatio)
      renderer.render(scene, currentCamera) //执行渲染操作
      renderer.setClearAlpha(0)
      //requestAnimationFrame(render)
    }

    const addMaterial = (model: modelInfo) => {

      if (model.materialWrapper) {
        model.materialWrapper.clear()
      }

      model.materialWrapper = new THREE.Group()

      rotateCurrentModel(model.materialWrapper, model.config)
      changeCurrentModelPosition(model.materialWrapper, model.config)
      changeCurrentModelScale(model.materialWrapper, model.config)

      scene.add(model.materialWrapper)

      const config: ThreedModelConfig = model.config
      model.wrapper.traverse(child => {

        if (child instanceof THREE.Mesh) {
          config.materials.forEach(materialConfig => {

            if ([materialConfig.meshName].includes(child.name) || (!materialConfig.meshName && !child.name)) {
              const material = new THREE.MeshStandardMaterial({
                color: materialConfig.color,
                opacity: materialConfig.opacity,
                emissive: new THREE.Color('#000000'),
              })

              const mesh = new THREE.Mesh(child.geometry, material)
              mesh.rotateX(THREE.MathUtils.degToRad(materialConfig.rotation.x))
              mesh.rotateY(THREE.MathUtils.degToRad(materialConfig.rotation.y))
              mesh.rotateZ(THREE.MathUtils.degToRad(materialConfig.rotation.z))

              //mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z)

              mesh.position.set(
                child.position.x,
                child.position.y,
                child.position.z,
              )
              // child.children.push(mesh)
              //scene.add(mesh)
              model.materialWrapper.add(mesh)
            }
          })
        }
      })
    }

    const loadAllModel = () => {

      config.value.models.forEach(r => {
        loadSingleModel(r)
      })
    }

    const loadSingleModel = (item: ThreedModelConfig) => {
      const loader = new GLTFLoader()

      if (item.url) {
        getFile(item.url).then(res => {
          const blob = new Blob([res.data])
          blob.arrayBuffer().then(arrayBuffer => {
            loader.parse(arrayBuffer, '', gltf => {
              addModelToScene(gltf, item)
              setCameraPosition()
              render()
            })
          })
        })
      } else {
        addModelToScene(null, item)
        render()
      }
    }

    const clearModel = () => {
      objList.forEach(r => scene.remove(r.wrapper))
      objList = []
    }

    const reloadModel = () => {
      clearModel()
      loadAllModel()
      render()
    }

    initScene()
    initRenderer()
    initCamera()
    initCameraLight()
    initCameraControl()
    initObjectControl()
    initLight()
    initAmbientLight()
    initBackground(config.value.scene.background)
    initGround(config.value.scene.ground)
    initFog(config.value.scene.fog)

    setTimeout(() => {
      render()
    }, 200)

    // onMounted(() => {
    //   reloadModel()
    //   if (containerRef.value) {
    //     containerRef.value.appendChild(renderer.domElement) //body元素中插入canvas对象
    //   }
    //   if (config.value.autoPlay && !EditorModule.editMode) {
    //     cameraNavigatorStart()
    //   }
    //   initMapPoint()
    // })

    onMounted(() => {
      reloadModel()
      if (containerRef.value) {
        containerRef.value.appendChild(renderer.domElement)
      }
      // 启动持续动画循环
      animate()

      if (config.value.autoPlay && !EditorModule.editMode) {
        cameraNavigatorStart()
      }
      initMapPoint()
    })

    onUnmounted(() => {
  cancelAnimationFrame(rafId)
})


    const rotateCurrentModel = (group: THREE.Group, modelConfig: ThreedModelConfig) => {
      group.rotation.set(
        THREE.MathUtils.degToRad(modelConfig.rotate.X),
        THREE.MathUtils.degToRad(modelConfig.rotate.Y),
        THREE.MathUtils.degToRad(modelConfig.rotate.Z),
      )
    }

    const changeCurrentModelPosition = (group: THREE.Group, modelConfig: ThreedModelConfig) => {
      group.position.set(modelConfig.postion.X, modelConfig.postion.Y, modelConfig.postion.Z)
    }

    const changeCurrentModelScale = (group: THREE.Group, modelConfig: ThreedModelConfig) => {
      group.scale.set(modelConfig.scale.X, modelConfig.scale.Y, modelConfig.scale.Z)
    }

    const changeCurrentCamera = () => {
      //相机在Three.js三维坐标系中的位置
      // 根据需要设置相机位置具体值
      if (currentCamera) {
        currentCamera.position.set(
          config.value.camera.position.x,
          config.value.camera.position.y,
          config.value.camera.position.z,
        )
        //相机观察目标指向Threejs 3D空间中某个位置
        //camera.lookAt(mesh.position); //指向mesh对应的位置
        currentCamera.lookAt(
          config.value.camera.lookAt.x,
          config.value.camera.lookAt.y,
          config.value.camera.lookAt.z,
        )
      }
    }


    const modelTap = (e: MouseEvent) => {

      mouse.x = (e.offsetX / attr.value.w) * 2 - 1
      mouse.y = -(e.offsetY / attr.value.h) * 2 + 1

      const wrapperList = objList.map(r => r.wrapper)
      wrapperList.push(cameraPointGroup)

      let raycaster: THREE.Raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, currentCamera)

      let intersects: THREE.Intersection<
        THREE.Object3D<THREE.Object3DEventMap>
      >[] = raycaster.intersectObjects(wrapperList)

      if(props.com.config.select.enable)
      {
        selectModel(intersects)
      }

      pointClick(intersects)
    }

    const selectModel = (intersects: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]) =>{

      if (!props.com.config.select.enable) {
        return
      }

      if (intersects.length > 0) {
        if (selectObject != intersects[0].object) {

          // 这里选中的物体是上一个选中物体。
          if (selectObject) {

            // 把上一个选中的物体设置为当前色。
            if (selectObject.material.emissive) {
              selectObject.material.emissive.setHex(selectObject.currentHex)
            }
            else {
              selectObject.material.color.setHex(selectObject.currentHex)
            }

          }
          // 设置当前选中的物体
          selectObject = intersects[0].object

          if (selectObject.material.emissive) {
            // 保留当前选中物体，**原本的颜色**
            selectObject.currentHex = selectObject.material.emissive.getHex()
            // 设置当前选中的物体颜色为红色
            //selectObject.material.emissive.setHex(0xff0000);
            selectObject.material.emissive.setHex(new THREE.Color(config.value.select.color).getHex())
          }
          else {
            selectObject.currentHex = selectObject.material.color.getHex()
            selectObject.material.color.setHex(new THREE.Color(config.value.select.color).getHex())
          }

          console.log('selectObject', selectObject)
        }

        if (config.value.transform != null && config.value.transform != 'none' && objControl) {
          objControl.detach()
          objControl.attach(selectObject)
        }

        renderer.render(scene, currentCamera)
      } else {
        if (selectObject) {
          selectObject.material.emissive.setHex(selectObject.currentHex)
        }
        // 清空选中物体
        selectObject = null

        if (config.value.transform != null && config.value.transform != 'none' && objControl) {
          objControl.detach()
          //objControl.attach(group)
        }

        renderer.render(scene, currentCamera)
      }
    }

    const pointClick = (intersects: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]) =>{
      if (intersects.length > 0) {
        let model = intersects[0].object
        if(model.name.startsWith('MapPoint_')) {
          console.log('pointClick', model.name)
          mapPointList.value.forEach(r => {
            if(`MapPoint_${r.type}_${r.name}` == model.name)
            {
              comEvent(props.com.handles.pointIconClick.fields,r)
              comIcEvent('pointIconClick',r)

              console.log('pointClickEventMitter', r)
            }
          })
        }
      }
    }


    if (EditorModule.editMode) {
      watch(
        () => config.value.camera.light,
        () => {
          cameraLight.intensity = config.value.camera.light.intensity
          cameraLight.color = new THREE.Color(config.value.camera.light.color)
          render()
        },
        { deep: true },
      )

      watch(
        () => config.value.camera,
        () => {
          changeCurrentCamera()
          render()
        },
        { deep: true },
      )

      //增加模型时触发
      mitter.on(
        ThreedModelEventType.AddThreedModelItem + props.com.id,
        (item: ThreedModelEventArgs) => {
          addModelToScene(null, item.config)
        },
      )

      //删除模型时触发
      mitter.on(
        ThreedModelEventType.RemoveThreedModelItem + props.com.id,
        (item: ThreedModelEventArgs) => {
          for (let i = 0; i < objList.length; i++) {
            if (objList[i].config.id == item.config.id) {
              scene.remove(objList[i].wrapper)
              render()
              objList.splice(i, 1)
              break
            }
          }
        },
      )

      //修改模型url时触发
      mitter.on(
        ThreedModelEventType.ModifyThreedModelUrlItem + props.com.id,
        (item: ThreedModelEventArgs) => {
          let model = objList.find(r => r.config.id == item.config.id)
          if (model) {
            model.config = item.config

            if (model.config.url != null) {
              const loader = new GLTFLoader()
              getFile(model.config.url).then(res => {
                const blob = new Blob([res.data])
                blob.arrayBuffer().then(arrayBuffer => {
                  loader.parse(arrayBuffer, '', gltf => {
                    addModelToScene(gltf, model.config)
                  })
                })
              })
            } else {
              addModelToScene(null, model.config)
            }
          }
        },
      )

      //修改模型参数时触发
      mitter.on(
        ThreedModelEventType.ModifyThreedModelParamItem + props.com.id,
        (item: ThreedModelEventArgs) => {
          let model = objList.find(r => r.config.id == item.config.id)
          if (model) {
            model.config = item.config
            if (model.wrapper) {
              rotateCurrentModel(model.wrapper, model.config)
              changeCurrentModelPosition(model.wrapper, model.config)
              changeCurrentModelScale(model.wrapper, model.config)
              addMaterial(model)
              render()
            }
          }
        },
      )

      //增加光
      mitter.on(ThreedModelEventType.AddThreedLightItem + props.com.id,
        (eventArgs: ThreedLightEventArgs) => {
          addLight(eventArgs.config)
          render()
        })

      //删除光
      mitter.on(ThreedModelEventType.RemoveThreedLightItem + props.com.id,
        (eventArgs: ThreedLightEventArgs) => {
          let light = scene.children.find(r => r.uuid == eventArgs.config.id)
          if (light) {
            scene.remove(light)
            render()
          }
        })

      //修改光
      mitter.on(ThreedModelEventType.ModifyThreedLightItem + props.com.id,
        (eventArgs: ThreedLightEventArgs) => {
          let light = scene.children.find(r => r.uuid == eventArgs.config.id)
          if (light) {
            scene.remove(light)
            addLight(eventArgs.config)
            render()
          }
        })

      //更新环境光
      mitter.on(ThreedModelEventType.modifyAmbientLight + props.com.id, (item: AmbientLightConfig) => {
        console.log(ThreedModelEventType.modifyAmbientLight, item)
        ambientLight.color = new THREE.Color(item.color)
        ambientLight.intensity = item.intensity
        render()
      })

      mitter.on(ThreedModelEventType.ModifyBackground + props.com.id, (item: BackgroundConfig) => {
        initBackground(item)
        setTimeout(() => {
          render()
        }, 200)
      })

      mitter.on(ThreedModelEventType.ModifyFog + props.com.id, (item: FogConfig) => {
        console.log(ThreedModelEventType.ModifyFog + props.com.id, item)
        initFog(item)
        render()
      })

      mitter.on(ThreedModelEventType.ModifyGround + props.com.id, (item: GroundConfig) => {
        initGround(item)
        render()
      })
    }

    //更新材质
    mitter.on(ThreedModelEventType.ModifyMaterial + props.com.id, (item: ThreedModelConfig) => {

      if (item) {
        let modelIndex = objList.findIndex(r => r.config.id == item.id)

        if (modelIndex != -1) {
          let model = objList[modelIndex]
          scene.remove(model.wrapper)
          objList.splice(modelIndex, 1)
          render()
          loadSingleModel(item)
        }
      }
      else {
        reloadModel()
      }

      // objList.forEach(r => {
      //   if(r.config.id == item.id)
      //   {
      //     scene.remove(r.wrapper)
      //     render()
      //     loadSingleModel(item)
      //   }
      // })
    })

    let rafId = 0
    // const animate = () => {
    //   requestAnimationFrame(animate)
    //   TWEEN.update()
    //   renderer.render(scene, currentCamera) //执行渲染操作
    // }

    const animate = () => {
      const delta = animationClock.getDelta()   // 取间隔时间
      mixers.forEach(mixer => mixer.update(delta)) // 推进全部 mixer
      TWEEN.update()   // 关键：驱动所有 tween
      renderer.render(scene, currentCamera)     // 真正画一帧
      rafId = requestAnimationFrame(animate)    // 下一帧继续
    }

    const extendPoint = (A: THREE.Vector3, B: THREE.Vector3, distance: number): THREE.Vector3 => {
      // 计算向量AB
      const AB = {
        x: B.x - A.x,
        y: B.y - A.y,
        z: B.z - A.z,
      }

      // 计算向量AB的模
      const magnitudeAB = Math.sqrt(AB.x ** 2 + AB.y ** 2 + AB.z ** 2)

      // 计算单位向量AB_unit
      const AB_unit = {
        x: AB.x / magnitudeAB,
        y: AB.y / magnitudeAB,
        z: AB.z / magnitudeAB,
      }

      const C = {
        x: A.x + (distance + magnitudeAB) * AB_unit.x,
        y: A.y + (distance + magnitudeAB) * AB_unit.y,
        z: A.z + (distance + magnitudeAB) * AB_unit.z,
      }

      return new THREE.Vector3(C.x, C.y, C.z)
    }

    let tweenList: Array<TWEEN.Tween<THREE.Vector3>> = []

    const cameraNavigatorStart = () => {
      tweenList = []

      let cameraStopList = config.value.cameraStops
      let cruisingAltitude = config.value.CruisingAltitude ?? 0

      cameraStopList.forEach((r, index) => {
        let endLookAt = new THREE.Vector3(r.x, r.y + cruisingAltitude, r.z)
        let startLookAt

        console.log('moveCamera cameraStopList index', index)

        if (index == 0) {
          startLookAt = new THREE.Vector3(0, 0, 0)
          if (cameraStopList.length > 1) {
            endLookAt = new THREE.Vector3(
              cameraStopList[1].x,
              cameraStopList[1].y + cruisingAltitude,
              cameraStopList[1].z,
            )
          }
        } else if (index == 1) {
          startLookAt = new THREE.Vector3(r.x, r.y + cruisingAltitude, r.z)
        } else {
          let preStop = cameraStopList[index - 1]
          let prePreStop = cameraStopList[index - 2]
          startLookAt = extendPoint(
            new THREE.Vector3(prePreStop.x, prePreStop.y + cruisingAltitude, prePreStop.z),
            new THREE.Vector3(preStop.x, preStop.y + cruisingAltitude, preStop.z),
            200,
          )
        }

        //移动镜头焦点
        let tween1 = new TWEEN.Tween(startLookAt)
        tween1.to(endLookAt, 1000)
        tween1.onStart(() => {
          currentCamera.up.set(0, 1, 0)
        })
        tween1.onUpdate(currentLookAt => {
          currentCamera.lookAt(currentLookAt.x, currentLookAt.y + cruisingAltitude, currentLookAt.z)
        })

        //移动相机位置
        let tween2 = new TWEEN.Tween(currentCamera.position)
        tween2.to({ x: r.x, y: r.y + cruisingAltitude, z: r.z }, 3000)
        tween2.onUpdate(function () {
          currentCamera.lookAt(endLookAt.x, endLookAt.y, endLookAt.z)
          cameraLight.position.set(
            currentCamera.position.x,
            currentCamera.position.y,
            currentCamera.position.z,
          )
        })

        if (index > 0) {
          tweenList[tweenList.length - 1].chain(tween1)
          tween1.chain(tween2)
        } else {
          tween1.chain(tween2)
        }
        tweenList.push(tween1)
        tweenList.push(tween2)
      })

      if (tweenList.length > 0) {
        let lastStop = cameraStopList[cameraStopList.length - 1]
        let startLookAt = new THREE.Vector3(lastStop.x, lastStop.y, lastStop.z)
        let tween1 = new TWEEN.Tween(startLookAt)
        tween1.to({ x: 0, y: 0, z: 0 }, 1000)
        tween1.onUpdate(currentLookAt => {
          currentCamera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z)
        })

        let tween2 = new TWEEN.Tween(currentCamera.position)
        tween2.to({ x: config.value.camera.position.x, y: config.value.camera.position.y, z: config.value.camera.position.z }, 1000)
        tween2.onUpdate(() => {
          cameraLight.position.set(
            currentCamera.position.x,
            currentCamera.position.y,
            currentCamera.position.z)
        })

        tweenList[tweenList.length - 1].chain(tween1, tween2)
        tweenList.push(tween1)
        tweenList.push(tween2)

        if (config.value.loopPlay) {
          tween2.chain(tweenList[0])
        }

        tweenList[0].start()
        animate()
      }
    }

    const cameraNavigatorStop = () => {
      tweenList.forEach(tween => {
        tween.stop()
      })
    }

    const cameraReset = () => {
      cameraNavigatorStop()
      let tween1 = new TWEEN.Tween(currentCamera.position)
      tween1.to({ x: config.value.camera.position.x, y: config.value.camera.position.y, z: config.value.camera.position.z }, 1000)
      tween1.onUpdate(() => {
        cameraLight.position.set(
          currentCamera.position.x,
          currentCamera.position.y,
          currentCamera.position.z)
      })

      let tween2 = new TWEEN.Tween({ x: cameraControl.target.x, y: cameraControl.target.y, z: cameraControl.target.z })
      tween2.to({ x: 0, y: 0, z: 0 }, 1000)
      tween2.onUpdate(currentLookAt => {
        currentCamera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z)
      })

      tween1.chain(tween2)
      tween1.start()
    }


    const changeMeshMaterialColor = (params: { index: number; meshName: string; materialColor: string; }) => {
      let hasConfig = false
      // config.value.models.forEach(model => {
      //   model.materials.forEach(material => {
      //     if(material.meshName === params.meshName && material.color != params.materialColor){
      //       material.color = params.materialColor
      //       mitter.emit(ThreedModelEventType.ModifyMaterial + props.com.id,model)
      //       hasConfig = true
      //       return false
      //     }
      //   })
      // })
      let model = config.value.models[params.index]

      if (model) {
        model.materials.forEach(material => {
          if (material.meshName === params.meshName && material.color != params.materialColor) {
            material.color = params.materialColor
            mitter.emit(ThreedModelEventType.ModifyMaterial + props.com.id, model)
            hasConfig = true
            return false
          }
        })

        if (!hasConfig && !EditorModule.editMode) {
          model.materials.push({
            meshName: params.meshName,
            color: params.materialColor,
            opacity: 1,
            rotation: {
              x: -90,
              y: 0,
              z: 0,
            },
          })
          loadSingleModel(model)
        }
      }

    }

    const initMapPoint = () =>{
      mapPointList.value = []
      clearMapPoint()
      setMapPoint(config.value.pointConfigs)
      // config.value.pointConfigs.forEach(pc=>{
      //   if(pc.apiUrl) {
      //     dcRequest.post(pc.apiUrl,{ days: 7 }).then(r=>{
      //       let result= r.data as mapPoint[]
      //       if(result && result.length>0){
      //         result.forEach(r=>{
      //           r.iconUrl=pc.iconUrl
      //         })
      //         mapPointList.value.push(...result)
      //       }
      //     })
      //   }
      // })
    }

    const setMapPoint = (settings:mapPointSetting[]) =>{

      // if(cameraPointGroup){
      //   scene.remove(cameraPointGroup)
      // }
      // cameraPointGroup = new THREE.Group()
      // scene.add(cameraPointGroup)
      if(!cameraPointGroup)
      {
        cameraPointGroup = new THREE.Group()
        scene.add(cameraPointGroup)
        render()
      }
      if(settings && settings.length > 0){
        settings.forEach(setting => {
          setSingleTypeMapPoint(setting)
        })
      }
    }

    const setSingleTypeMapPoint = (setting:mapPointSetting) => {
      dcRequest.post(setting.apiUrl, setting.params? setting.params : {} ).then(r => {
        let result = r.data as mapPoint[]

        for(let i = mapPointList.value.length - 1 ;i >=0 ; i--)
        {
          if(mapPointList.value[i].type == setting.type){
            mapPointList.value.splice(i, 1)
          }
        }

        if(result && result.length > 0) {
          const icon = new THREE.TextureLoader().load(setting.iconUrl)
          const material = new THREE.SpriteMaterial( { map: icon } )

          cameraPointGroup.children.forEach(r => {
            if(r.name.startsWith(`MapPoint_${setting.type}`)){
              cameraPointGroup.remove(r)
            }
          })

          result.forEach(r => {
            r.iconUrl = setting.iconUrl
            r.params = setting.params
            r.iconWidth = setting.iconWidth
            r.iconHeight = setting.iconHeight
            //let point = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
            //let point = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
            const point = new THREE.Sprite(material)
            point.name = `MapPoint_${r.type}_${r.name}`
            point.position.set(r.x, r.y, r.z)
            point.scale.set(r.iconWidth, r.iconHeight, 1)
            cameraPointGroup.add(point)

            // const ballGeometry = new THREE.SphereGeometry(setting.iconWidth, 32, 16)
            // const ballMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 })
            // const ballSphere = new THREE.Mesh( ballGeometry, ballMaterial )
            // ballSphere.position.set(r.x, r.y, r.z)
            // ballSphere.name = `MapPoint_${r.name}`
            // cameraPointGroup.add(ballSphere)
            setTimeout(() => {
              render()
            }, 100)
            //render()
          })
          mapPointList.value.push(...result)
        }
      })
    }

    const clearMapPoint = () =>{
      if(cameraPointGroup){
        scene.remove(cameraPointGroup)
        cameraPointGroup = null
        render()
      }
    }

    const resetMapPoint = (settings:mapPointSetting[]) =>{
      clearMapPoint()
      setMapPoint(settings)
    }

    return {
      containerRef,
      wrapperStyle,
      config,
      modelTap,
      dv_data,
      dv_field,
    }
  },
})
</script>
