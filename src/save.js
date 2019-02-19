import _isEqual from 'lodash/isEqual'
import { checkWillSave, getSpecInfo, getSpecKeys } from './utils'
import defaults from './defaults'


// @param fields: Stores the savables
// @param values: Stores the values fields
function storeSubField(key, rawSpec, accumulator, result, data, current) {
  const { values, fields } = accumulator
  // do nothing if undefined
  if (typeof result === 'undefined') {
    return accumulator
  }

  const { isArray, spec, keys } = getSpecInfo(rawSpec)
  const { _save } = spec

  if(isArray && _save) {
    fields[key] = result
  }
  else if (result && result._self) {
    fields[key] = result
  } else {
    if (result._self !== null) {
      const as = _save && _save.as
      values[as || key] = result
    }
  }

  return {
    values,
    fields,
  }
}

function storeArray(acc, rawSpec, result, data, current) {
  const { isArray, spec, keys } = getSpecInfo(rawSpec)
  if (result && result._self) {
    acc.push(result)
  }
  return acc
}

// RawSpec
// data: the actual modified data
// current: the original not-modified data
export function createSavingInformation(rawSpec, data, current) {
  const { isArray, spec, keys } = getSpecInfo(rawSpec)
  if (isArray) {
    if (spec._save) {
      const { _findInArray } = spec
      return Array.isArray(data) ? data.reduce((acc, d) => {
        const currentEl = typeof _findInArray === 'function'
          ? _findInArray(d, current)
          : defaults.findInArray(d, current)
        const res = createSavingInformation(spec, d, currentEl)
        return storeArray(acc, spec, res, d, currentEl)
      }, []) : []
    } else {
      return !_isEqual(data, current) ? data: undefined
    }
  }
  if (spec._name === 'dependencies') {
    console.log('data');
    console.log(spec);
    console.log(keys);
  }

  if (keys.length > 0) {
    // Results for current instance for self data
    //const { values, result } = {}
    // Results for current instances inside instance
    const extracted = keys.reduce((acc, key) => {
      const subData = data && data[key]
      const subCurrent = current && current[key]
      const subRawSpec = spec[key]
      const res = createSavingInformation(spec[key], subData, subCurrent)
      if (key === 'dependencies') {
        console.log('la put amare');
        console.log(res);
      }
      return storeSubField(key, subRawSpec, 
        acc,
        res,
        subData, subCurrent
      )
    }, { values: {}, fields: {} })
    const { values, fields } = extracted

    const { _save } = spec
    if (_save) {
      const { create } = _save
      const willSave = checkWillSave(_save, values, current)
      fields._self = null
      if (willSave && create) {
        if (Array.isArray(create)) {
          fields._self = create.map(cr => cr(values, current))
        } else {
          fields._self = create(values, current)
        }
      }
      return fields
    }
    return values
  }
  const { _save } = spec
  if (_save) {
    const { format, create } = _save
    const formattedData = format ? format(data) : data
    const formattedCurrent = format ? format(current) : current

    const willSave = checkWillSave(_save, formattedData, formattedCurrent)
    const result = {}
    result._self = null
    if (willSave) {
      if (create) {
        if (Array.isArray(create)) {
          result._self = create.map(cr => cr(formattedData, current))
        } else {
          result._self = create(formattedData, current)
        }
      } else {
        return formattedData
      }
    }
    return result
  }

  return !_isEqual(data, current) ? data: undefined
}
