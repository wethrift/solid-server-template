import glob from 'glob'
import path from 'path'

export function defaultConversionFunction(filePath) {
  return (
    '/' + filePath.replace(/(^index.jsx?$|.jsx?$|\])/g, '').replace(/^\[/, ':')
  )
}

export default async function filesToRoutes(
  baseDir,
  globPath = '**/*.{js,jsx}',
  conversionFunc = defaultConversionFunction
) {
  const dir = path.resolve(process.cwd(), baseDir)
  return new Promise((resolve, reject) => {
    glob(globPath, { cwd: dir }, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(
          files.map(filePath => ({
            route: conversionFunc(filePath),
            filePath: path.resolve(dir, filePath),
          }))
        )
      }
    })
  })
}
