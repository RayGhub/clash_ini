/*
  Egern 专用 Glados 签到脚本
  
  使用方法：
  1. 在 Egern 配置中添加 Script (脚本)。
  2. 访问 https://glados.cloud/api/user/checkin 自动获取 Cookie。
  3. 配置 Cron 定时任务进行签到。
*/

const $ = {
    name: "GLaDOS 签到",
    key: "Glados_Headers_Egern", // 存储数据的 Key
    
    // 读取数据
    get: (key) => $persistentStore.read(key),
    // 写入数据
    set: (val, key) => $persistentStore.write(val, key),
    // 通知
    notify: (title, subtitle, content) => $notification.post(title, subtitle, content),
    // 发送 POST 请求
    post: (options, callback) => $httpClient.post(options, callback),
    // 结束脚本
    done: (val) => $done(val)
};

// 签到接口
const checkinUrl = "https://glados.cloud/api/user/checkin";

// 逻辑判断：如果有 $request 则为获取 Cookie 模式，否则为签到模式
if (typeof $request !== "undefined") {
    getCookie();
} else {
    checkIn();
}

// 1. 获取并存储 Cookie 和必要头部
function getCookie() {
    if ($request && $request.headers) {
        // 将 headers 转为 JSON 字符串存储
        const headers = JSON.stringify($request.headers);
        const save = $.set(headers, $.key);
        
        if (save) {
            $.notify($.name, "获取 Cookie 成功", "请在脚本配置中禁用此请求重写，以免重复写入");
            console.log(`[${$.name}] Cookie 保存成功: ${headers}`);
        } else {
            $.notify($.name, "获取 Cookie 失败", "无法写入存储");
        }
    }
    $.done({});
}

// 2. 执行签到
function checkIn() {
    const savedHeadersStr = $.get($.key);
    
    if (!savedHeadersStr) {
        $.notify($.name, "签到失败", "未找到 Cookie，请先在浏览器访问 Glados 签到页面获取");
        $.done({});
        return;
    }

    const savedHeaders = JSON.parse(savedHeadersStr);

    // 构造请求，复用抓取到的核心 Header
    // 注意：Glados 校验严格，最好复用大部分 Header
    const requestData = {
        url: checkinUrl,
        headers: {
            "Cookie": savedHeaders["Cookie"] || savedHeaders["cookie"],
            "User-Agent": savedHeaders["User-Agent"] || savedHeaders["user-agent"],
            "Authorization": savedHeaders["Authorization"] || savedHeaders["authorization"],
            "Content-Type": "application/json;charset=utf-8",
            "Origin": "https://glados.cloud",
            "Host": "glados.cloud"
        },
        body: JSON.stringify({"token": "glados.cloud"})
    };

    $.post(requestData, (error, response, data) => {
        try {
            if (error) {
                console.log(`[${$.name}] 请求失败: ${error}`);
                $.notify($.name, "请求异常", "网络错误或接口不可达");
            } else {
                const result = JSON.parse(data);
                console.log(`[${$.name}] 响应数据: ${data}`);
                
                if (result.code === 0 || result.message === "OK") {
                    // 签到成功或重复签到
                    const balance = result.list && result.list[0] ? parseInt(result.list[0].balance) : 0;
                    const msg = result.message;
                    // 判断是否是重复签到
                    const isRepeat = msg.includes("Tomorrow"); 
                    const title = isRepeat ? "重复签到" : "签到成功";
                    
                    $.notify($.name, title, `点数：${balance}，${msg}`);
                } else {
                    $.notify($.name, "签到失败", result.message);
                }
            }
        } catch (e) {
            console.log(`[${$.name}] 解析错误: ${e}`);
            $.notify($.name, "脚本错误", e.message);
        } finally {
            $.done({});
        }
    });
}
