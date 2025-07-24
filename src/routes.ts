import {remixRoutesOptionAdapter} from '@react-router/remix-routes-option-adapter'
import {createRoutesFromFolders} from '@remix-run/v1-route-convention'

export default remixRoutesOptionAdapter(defineRoutes => {
  return createRoutesFromFolders(defineRoutes)
})
