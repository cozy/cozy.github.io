const mergeSets = (s1, s2) => {
  const s3 = new Set()
  s1.forEach(item => s3.add(item))
  s2.forEach(item => s3.add(item))
  return s3
}

export default mergeSets
