import request from '@/utils/request'
import { getApiUrl2 } from '@/utils/apiUrl'

export function getModelList(projectId:number) {
  // console.log(`aaa${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_APP_API_Port}/device/server/mgt/threedModel/query`)
  let url = getApiUrl2('device/server/mgt/threedModel/query')
  console.log(`requrl--- ${url}`)
  // return request.post(`${import.meta.env.VITE_APP_API_Host}/device/server/mgt/threedModel/query`,{ projectId })
  return request.post(url,{ projectId })

}

export function getThumbnail(id: string) {
  let url = getApiUrl2('threed/thumbnail')
  // return request.get<string>(`${import.meta.env.VITE_APP_API_Host}/threed/thumbnail?id=${id}`)
  return request.get<string>(url + `?id=${id}`)
}

export function getModel(id: string) {
  let url = getApiUrl2('threed/model')
  // return request.get(`${import.meta.env.VITE_APP_API_Host}/threed/model?id=${id}`)
  return request.get(url +`?id=${id}`)
}

export function getFile(id: string) {
  // return request.get(`${import.meta.env.VITE_APP_API_Host}/threed/file?id=${id}`,{ responseType: 'blob' })
  let url = getApiUrl2('threed/file')
  return request.get(url + `?id=${id}`,{ responseType: 'blob' })
}

export function getMesh(modelId:string) {
  let url = getApiUrl2('device/server/mgt/threedModelMesh/query')
  // return request.post(`${import.meta.env.VITE_APP_API_Host}/device/server/mgt/threedModelMesh/query`,{ modelId })
  return request.post(url,{ modelId })
}

