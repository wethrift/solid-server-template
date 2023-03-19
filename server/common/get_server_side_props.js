// Run the getServerSide function on the page
import fs from 'fs'

export default async function getServerSideProps(filePath, request) {
  const dataFilePath = `${filePath.split('.')[0]}.data.js`
  if (fs.existsSync(dataFilePath)) {
    const dataFunc = (await import(`file:///${dataFilePath}`)).default
    if (dataFunc) {
      return dataFunc(request)
    }
  }
  return {}
}
