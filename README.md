# 前端跨域解决方案 / 非同源策略请求 / 跨域传输

## 1. JSONP 跨域
- script
- img
- link
- iframe
> **JSONP 只支持GET请求**

## 2. CORS 跨域资源共享

```js
app.use(async (ctx, next) => {
    try {
        // 允许来自所有域名请求
        ctx.set("Access-Control-Allow-Origin", "*");
        // 这样就能只允许 http://localhost:8080 这个域名的请求了
        // ctx.set("Access-Control-Allow-Origin", "http://localhost:8080"); 

        // 设置所允许的HTTP请求方法
        ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");

        // 字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段.
        ctx.set("Access-Control-Allow-Headers", "x-requested-with, accept, origin, content-type");

        // 服务器收到请求以后，检查了Origin、Access-Control-Request-Method和Access-Control-Request-Headers字段以后，确认允许跨源请求，就可以做出回应。

        // Content-Type表示具体请求中的媒体类型信息
        ctx.set("Content-Type", "application/json;charset=utf-8");

        // 该字段可选。它的值是一个布尔值，表示是否允许发送Cookie。默认情况下，Cookie不包括在CORS请求之中。
        // 当设置成允许请求携带cookie时，需要保证"Access-Control-Allow-Origin"是服务器有的域名，而不能是"*";
        ctx.set("Access-Control-Allow-Credentials", true);

        // 该字段可选，用来指定本次预检请求的有效期，单位为秒。
        // 当请求方法是PUT或DELETE等特殊方法或者Content-Type字段的类型是application/json时，服务器会提前发送一次请求进行验证
        // 下面的的设置只本次验证的有效时间，即在该时间段内服务端可以不用进行验证
        ctx.set("Access-Control-Max-Age", 300);

        /*
        CORS请求时，XMLHttpRequest对象的getResponseHeader()方法只能拿到6个基本字段：
            Cache-Control、
            Content-Language、
            Content-Type、
            Expires、
            Last-Modified、
            Pragma。
        */
        // 需要获取其他字段时，使用Access-Control-Expose-Headers，
        // getResponseHeader('myData')可以返回我们所需的值
        ctx.set("Access-Control-Expose-Headers", "myData");

        await next();
    } catch (e) {
        ctx.throw(e);
    }
})

// 前端设置
axios.defaults.baseURL = 'http://127.0.0.1:8888';
axios.defaults.withCredentials = true;
axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = function (data) {
  if (!data) return data;
  let result = ``;
  for (let attr in data) {
    if (!data.hasOwnProperty(attr)) break;
    result += `&${attr}=${data[attr]}`;
  }
  return result.substring(1);
};
axios.interceptors.response.use(function onFulfilled(response) {
  return response.data;
}, function onRejected(reason) {
  return Promise.reject(reason);
});
axios.defaults.validateStatus = function (status) {
  return /^(2|3)\d{2}$/.test(status);
}

```



## 3. 基于 HTTP proxy 实现跨域处理

- webpack webapck-dev-server

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './client/src/proxy',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build')
    },
    devServer: {
        port: 3001,
        progress: true, // 显示加载的进度
        contentBase: path.resolve(__dirname, 'build'),
        proxy: {
            '/': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true
            }
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './client/src/proxy/index.html',
            filename: 'index.html'
        })
    ]
}

```

## 4.基于iframe的跨域解决方案

### 4.1 document.domain + iframe

只能实现：同一个主域，不同子域之间的操作
v.qq.com
sports.qq.com

父页面A  http://www.zhufengpeixun.cn/A.html

```html
<iframe src="http://school.zhufengpeixun.cn/B.html"></iframe>
<script>
    document.domain = 'zhufengpeixun.cn';
    var user = 'admin';
</script>
```

子页面B  http://school.zhufengpeixun.cn/B.html

```html
<script>
    document.domain = 'zhufengpeixun.cn';
    alert(window.parent.user);
</script>
```

### 4.2 location.hash + iframe

A和C同源
A和B非同源

页面A

```html
<iframe id="iframe" src="http://127.0.0.1:1002/B.html" style="display:none;"></iframe>
<script>
    let iframe = document.getElementById('iframe');
    //=>向B.html传hash值
    iframe.onload=function(){
       iframe.src = 'http://127.0.0.1:1002/B.html#msg=zhufengpeixun';
    }
    
    //=>开放给同域C.html的回调方法
    function func(res) {
        alert(res);
    }
</script>
```

页面B

```html
<iframe id="iframe" src="http://127.0.0.1:1001/C.html" style="display:none;"></iframe>
<script>
    let iframe = document.getElementById('iframe');
    //=>监听A传来的HASH值改变，再传给C.html
    window.onhashchange = function () {
        iframe.src = "http://127.0.0.1:1001/C.html"+ location.hash;
    }
</script>
```

页面C

```html
<script>
    //=>监听B传来的HASH值
    window.onhashchange = function () {
        //=>再通过操作同域A的js回调，将结果传回
        window.parent.parent.func(location.hash);
    };
</script>
```

### 4.3 window.name + iframe

页面A

```js
let proxy = function(url, callback) {
    let count = 0;
    let iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.onload = function() {
        if(count===0){
          iframe.contentWindow.location = 'http://www.zhufengpeixun.cn/proxy.html';
          count++;
          return;
        }
        callback(iframe.contentWindow.name);
    };
    document.body.appendChild(iframe);
};

//请求跨域B页面数据
proxy('http://www.zhufengpeixun.cn/B.html', function(data){
    alert(data);
});
```

B页面

```
window.name = 'zhufengpeixun';
```

proxy.html是空页面

=============================

### 5. postMessage

https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage

A页面

```js
<iframe src="http://www.zhufengpeixun.com/B.html"></iframe>
<script>
    let iframe = document.querySelector('iframe');
    iframe.onload = function () {
        iframe.contentWindow.postMessage('zhufengpeixun', 'http://www.zhufengpeixun.com/');
    }
    window.onmessage = function (ev) {
        console.log(ev.data);
    }
</script>
```

B页面

```js
window.onmessage = function (ev) {
    console.log(ev.data);
    ev.source.postMessage(ev.data+'@@', ev.origin);
}
```

==========================

### 6. WebSocket协议跨域

前端处理

```js
<script src="./socket.io.js"></script>
<script>
let socket = io('http://127.0.0.1:3001/');
//=>连接成功处理
socket.on('connect', function() {
    //=>监听服务端消息
    socket.on('message', function(msg) {
        console.log('data from server:' + msg); 
    });
    //=>监听服务端关闭
    socket.on('disconnect', function() { 
        console.log('server socket has closed!');
    });
});
//=>发送消息给服务器端
socket.send("zhufengpeixun");
</script>
```

服务器端处理

```js
//=>监听socket连接：server是服务器创建的服务
socket.listen(server).on('connection', function(client) {
    //=>接收信息
    client.on('message', function(msg) {
        //=>msg客户端传递的信息
        //...
        client.send(msg+'@@');
    });
    //=>断开处理
    client.on('disconnect', function() {
        console.log('client socket has closed!');
    });
});
```

==========================

### 7. nginx反向代理

www.zhufengpeixun.cn -> www.zhufengpeixun.com

```
#proxy服务器
server {
    listen       80;
    server_name  www.zhufengpeixun.com;
    location / {
        proxy_pass   www.zhufengpeixun.cn; #反向代理
        proxy_cookie_demo www.zhufengpeixun.cn www.zhufengpeixun.com;
        add_header Access-Control-Allow-Origin www.zhufengpeixun.cn;
        add_header Access-Control-Allow-Credentials true;
    }
}
```

