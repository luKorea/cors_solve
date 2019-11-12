$.ajax({
    url: 'http://127.0.0.1:8080/jsonpList',
    method: 'GET',
    dataType: 'jsonp',
    success: (data) => {
        console.log(data)
    }
})