const CONSTANTS = {}
CONSTANTS["LIMIT"] = 100
CONSTANTS["ICON_SUCCESS"] = "success"
CONSTANTS["ICON_ERROR"] = "error"
CONSTANTS["ICON_WARNING"] = "warning"
CONSTANTS["ICON_INFO"] = "info"
CONSTANTS["ICON_QUESTION"] = "question"

// COMMON function
const FUNCTIONS = {}
FUNCTIONS["getRecordWithProxy"] = (url, header, body) => {
  return new Promise(async (resolve, reject) => {
    try{
      let proxy_query = `?app=${body.app}&id=${body.id}`
      let proxy = await kintone.proxy(url + proxy_query, 'GET', header, {})
      if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
      return resolve({'success': true, 'response': JSON.parse(proxy[0])})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["getRecordsWithProxy"] = (url, header, body) => {
  let offset = 0
  let limit = CONSTANTS.LIMIT
  let records = []
  return new Promise(async (resolve, reject) => {
    try{
      let record_result = []
      do{
        let app = `?app=${body.app}`
        let query = `&query=${body.hasOwnProperty('query') && `${encodeURIComponent(body.query)}` || ""}`
        let offset_query = encodeURI(` limit ${limit} offset ${offset}`)
        let proxy_query = `${app}${query}${offset_query}`
        let proxy = await kintone.proxy(url + proxy_query, 'GET', header, {})
        if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
        record_result = JSON.parse(proxy[0]).records
        records = records.concat(record_result)
        offset += limit
      }while(record_result.length == limit)
      return resolve({'success': true, 'response': {'records': records}})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["postRecordWithProxy"] = (url, header, body) => {
  return new Promise(async (resolve, reject) => {
    try{
      let proxy = await kintone.proxy(url, 'POST', header, body)
      if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
      return resolve({'success': true, 'response': JSON.parse(proxy[0])})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["postRecordsWithProxy"] = (url, header, body) => {
  const limit = CONSTANTS.LIMIT
  const ids = []
  const revisions = []
  return new Promise(async (resolve, reject) => {
    try{
      for(let round=0; round<Math.ceil(body.records.length/limit); round++){
        let start_index = round * limit
        let end_index = (round + 1) * limit
        let proxy = await kintone.proxy(url, 'POST', header, {
          'app': body.app,
          'records': body.records.slice(start_index, end_index)
        })
        if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0]), 'response': ids})
        let res = JSON.parse(proxy[0])
        ids.push(...res.ids)
        revisions.push(...res.revisions)
      }
      resolve({'success': true, 'response': {'ids': ids, 'revisions': revisions}})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["putRecordWithProxy"] = (url, header, body) => {
  return new Promise(async (resolve, reject) => {
    try{
      let proxy = await kintone.proxy(url, 'PUT', header, body)
      if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
      return resolve({'success': true, 'response': JSON.parse(proxy[0])})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["putRecordsWithProxy"] = (url, header, body) => {
  const limit = CONSTANTS.LIMIT
  const records = []
  return new Promise(async (resolve, reject) => {
    try{
      for(let round=0; round<Math.ceil(body.records.length/limit); round++){
        let start_index = round * limit
        let end_index = (round + 1) * limit
        let proxy = await kintone.proxy(url, 'PUT', header, {
          'app': body.app,
          'records': body.records.slice(start_index, end_index)
        })
        if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0]), 'response': {'records': records}})
        let res = JSON.parse(proxy[0])
        records.push(...res.records)
      }
      resolve({'success': true, 'response': {'records': records}})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["deleteRecordsWithProxy"] = (url, header, body) => {
  const limit = CONSTANTS.LIMIT
  return new Promise(async (resolve, reject) => {
    try{
      for(let round=0; round<Math.ceil(body.ids.length/limit); round++){
        let start_index = round * limit
        let end_index   = (round + 1) * limit
        let ids_offest  = body.ids.slice(start_index, end_index).map((item, index) => `ids[${index}]=${item}`).join('&')
        let proxy_query = `?app=${body.app}&${ids_offest}`
        let proxy = await kintone.proxy(url + proxy_query, 'DELETE', header, {})
        if(JSON.parse(proxy[1]) != 200) return reject({'success': false, 'error': JSON.parse(proxy[0])})
      }
      return resolve({'success': true, 'response': {}})
    }catch(err){
      return reject({'success': false, 'error': err})
    }
  })
}

FUNCTIONS["showMessageDialog"] = (body) => {
  return new Promise((resolve) => {
    Swal.fire(body)
    .then((res) => {
      resolve(res)
    })
  })
}

FUNCTIONS["showMessage"] = (icon, title, text) => {
  return new Promise((resolve) => {
    Swal.fire({icon: icon, title: title, text: text}).then(() => resolve())
  })
}

FUNCTIONS["showErrorMessage"] = (error) => {
  let icon, title, text
  if(error.hasOwnProperty('code')){
    let error_result = FUNCTIONS.getErrorsMessageForKintone(error)
    icon = CONSTANTS.ICON_ERROR
    title = error_result[0].title
    text = error_result[0].text
  }
  else{
    icon = CONSTANTS.ICON_ERROR
    title = "Syntax Error."
    text = error.message
  }
  
  return new Promise((resolve) => {
    Swal.fire({icon: icon, title: title, text: text}).then(() => resolve())
  })
}

FUNCTIONS["getErrorsMessageForKintone"] = (error) => {
  let error_result = []
  let code = error.code

  switch (code) {
    // Missing or invalid input.
    case "CB_VA01":
      for(let [error_key, error_value] of Object.entries(error.errors)){
        let title_result, text_result
        title_result = error.message
        for(let message of error_value.messages){
          if(message == "Required."){
            text_result = `The field code (${error_key}) is required field!`
          }
          else if(message == "Required field."){
            title_result = "API Request Failed!"
            text_result = `"${error_key}" is request to call api.`
          }
          else{
            text_result = message
          }
          
          error_result.push({
            title: title_result,
            text: text_result
          })
        }
      }
      break

    // App not found
    case "GAIA_AP01":
      error_result.push({
        title: `App not found!`,
        text: error.message
      })
      break
      
    // Invalid JSON string.
    case "CB_IJ01":
      error_result.push({
        title: "API Request Failed!",
        text: error.message,
      })
      break
    
    // Other Error
    default:
      error_result.push({
        title: "API Request Failed!",
        text: error.message,
      })
      break
  }

  return error_result
}