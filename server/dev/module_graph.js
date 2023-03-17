import _ from 'lodash'

export const moduleDependencies = {}
export const moduleDependents = {}
export const lastUpdatedMap = {}

export function registerModule(path, deps) {
  // remove any module dependents that are no longer in the dependency list
  const removed = _.difference(moduleDependencies[path] || [], deps)
  removed.forEach(dep => {
    delete moduleDependents[dep][path]
  })

  moduleDependencies[path] = deps
  deps.forEach(dep => {
    moduleDependents[dep] = moduleDependents[dep] || {}
    moduleDependents[dep][path] = true
  })
}

export function updateModule(path) {
  console.log('updated:', path)
  lastUpdatedMap[path] = Date.now()
}

export function getLastUpdated(path) {
  return lastUpdatedMap[path]
}
