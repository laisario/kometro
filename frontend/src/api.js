import _axios from 'axios';
import humps from 'humps';

const createAxiosInstance = ({ file = false } = {}) => {
  const instance = _axios.create({
    withCredentials: true,
    baseURL: process.env.API_URL,
  });


  const contentType = file ? 'multipart/form-data' : 'application/json'

  instance.defaults.headers.post['Content-Type'] = contentType
  instance.defaults.headers.patch['Content-Type'] = contentType
  instance.defaults.headers.put['Content-Type'] = contentType

  instance.interceptors.request.use((request) => {
    const token = window.localStorage.getItem('token')
    request.headers.Authorization = token ? `Bearer ${token}` : '';
    if (request.data && !file) {
        request.data = JSON.stringify(humps.decamelizeKeys(request.data))
    }
    return request
  })

  instance.interceptors.response.use(
    (response) => {
      if (response.data && response.headers?.['content-type'] === 'application/json') {
      response.data = humps.camelizeKeys(response.data)
    }
      return response
    }
    ,
    (error) => {
      if (error.response.data && error.response.headers?.['content-type'] === 'application/json') {
        const newError = { response: { data: {} } }
        newError.response.data = humps.camelizeKeys(error.response.data)
      }
      return Promise.reject(error)
    })

  return instance
}

export const axios = createAxiosInstance()

export const axiosForFiles = createAxiosInstance({ file: true })
