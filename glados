/**
 * Glados Egern 单脚本版
 * - http-request：捕获签到请求，保存 Header
 * - cron：自动签到
 * 保留原脚本通知文案
 */

const STORE_KEY = "glados_userSignKey";
const NAME = "Glados";

/* ========== http-request 阶段：抓 Cookie ========== */
if (typeof $request !== "undefined") {
  if (/https?:\/\/glados\.[a-z]+\/api\/user\/checkin/.test($request.url)) {
    const data = {
      url: $request.url,
      headers: $request.headers
    };

    const ok = $persistentStore.write(
      JSON.stringify(data),
      STORE_KEY
    );

    $notification.post(
      NAME,
      ok ? "获取Glados会话: 成功!" : "获取Glados会话: 失败!",
      ""
    );
  }

  $done({});
  return;
}

/* ========== cron 阶段：执行签到 ========== */

const cache = $persistentStore.read(STORE_KEY);
if (!cache) {
  $notification.post(
    NAME,
    "签到失败",
    "未获取到会话信息，请先手动签到一次"
  );
  $done();
  return;
}

const saved = JSON.parse(cache);
const headers = saved.headers || {};

const req = {
  url: "https://glados.cloud/api/user/checkin",
  method: "POST",
  headers: {
    Cookie: headers.Cookie,
    Authorization: headers.Authorization,
    "User-Agent": headers["User-Agent"],
    "Accept-Language": "zh-TW,zh-Hant;q=0.9",
    "Content-Type": "application/json;charset=utf-8",
    Accept: "application/json, text/plain, */*",
    Origin: "https://glados.cloud"
  },
  body: JSON.stringify({ token: "glados.cloud" })
};

$httpClient.post(req, (err, resp, body) => {
  if (err) {
    $notification.post(NAME, "签到失败", err);
    return $done();
  }

  let subtitle = "签到失败";
  let message = "";

  try {
    if (resp.status === 200) {
      const data = JSON.parse(body);

      subtitle = /Tomorrow/.test(data.message)
        ? "重复签到，"
        : "签到成功，";

      if (data.list && data.list.length > 0) {
        subtitle += "总共点数：" + Math.round(data.list[0].balance);
      }
    }
  } catch (e) {
    message = "响应解析失败";
  }

  $notification.post(NAME, subtitle, message);
  $done();
});