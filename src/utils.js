import _isEqual from 'lodash/isEqual'
import Types from './basic'

export function getSpecKeys(specs) {
  return Object.keys(specs).filter(name => name.indexOf('_') !== 0)
}

function getBasicType(spec) {
  const typeself = typeof spec
  let type = null
  if (typeself === 'string' || _isEqual(spec, Types.string)) {
    type = Types.string
  } else if (typeself === 'number' || _isEqual(spec, Types.number)) {
    type = Types.number
  } else if (typeself === 'boolean' || _isEqual(spec, Types.bool)) {
    type = Types.bool
  } else if (typeself === 'array' || _isEqual(spec, Types.array)) {
    type = Types.array
  }

  if (type) {
    if (typeself === 'string' || typeself === 'number' || typeself === 'boolean' || typeself === 'array') {
      const newType = Object.assign({}, type)
      newType._default = spec
      return newType
    }
  }
  return null
}

export function getSpecInfo(rawSpec) {
  const isArray = Array.isArray(rawSpec)
  const spec = isArray ? rawSpec[0] : rawSpec
  const basicType = getBasicType(spec)

  if (basicType) {
    return {
      isArray,
      spec: basicType,
      keys: {},
    }
  }

  return {
    isArray,
    spec,
    keys: getSpecKeys(spec),
  }
}
