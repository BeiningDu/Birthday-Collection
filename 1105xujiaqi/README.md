# 生日祝福

基于 IcedSoul / tiny-heart 的 birthday-mobile 整理。电脑和手机共用 `index.html`，无需安装依赖。

## 打开与修改

用浏览器打开 `index.html`。用户名、密码、祝福文字和素材引用都在 `config.js`，以该文件的当前设置为准。分享时需保留整个项目目录。

本机预览也可以在目录内运行 `python3 -m http.server 8000`，然后打开 http://localhost:8000 。通过本机服务器或 HTTPS 使用 AudioWorklet 电音效果；直接打开 HTML 时使用变速、短回跳的兼容效果。

## 页面与交互

- 验证后播放蛋糕动画；完成后显示“我很喜欢”和“我不喜欢”。点击蜡烛可熄灭、重新点亮。
- “我很喜欢”进入总起页与八个回忆栏目，共九个正式页面。底部按钮、圆点、方向键及 PageUp / PageDown / Home / End 切换栏目，滚轮和触摸滚动不会翻页。
- 白卡内的空白或文案切换同一栏目的内容；聚焦白卡后，Enter 或空格也可切换。点击图片只放大，点击虚化背景或按 Esc 退出。
- 文件夹 4 的三张连续抓拍紧密拼接居中，无备注；同栏另外两张依次切换。
- “甜甜甜”只有一个栏目。首组图片从左到右依次出现，再切换婚纱照、角色对照图，内部切换不增加页码。
- 视频手动播放。播放时暂停背景音乐，暂停、结束或离开视频后恢复此前的音乐状态。
- “我不喜欢”展示全屏虚焦、放大和重影约 3.8 秒，音乐变为颗粒电音，主音量保持不变；结束或按 Esc 后回到蛋糕。若这段期间意外重载，同一标签页在一分钟内可恢复到完成状态的蛋糕页，不保存用户名和密码。
- 最后一页继续翻页弹出“比心”彩蛋，不计页码；爆开、回弹后约四秒返回完成状态的蛋糕页。点击或 Esc 可提前结束。
- 图片加载失败时统一显示“啊唷？图片不见了～”。入口保留输入与错误提示，其余界面不额外添加操作说明。系统启用减少动态效果时使用静态或缩短的展示。

## 配置

`config.js` 使用纯文本配置，不解析 HTML：

- `recipient`、`greeting`、`subtitle`：姓名、祝福标题和入口副标题。
- `entry.name`、`entry.password`：用户名和密码；`entry.enabled: false` 取消验证。
- `music`：背景音乐路径，空字符串关闭音乐按钮。
- `introTitle`、`intro`：总起页标题和段落；`intro: []` 取消总起页。
- `unlikeImage`、`unlikeDuration`：怪图路径和持续时间（毫秒）。
- `memories`：各栏目，含 `date`、`title` 和 `cards`。栏目内每个卡片可含 `text` 段落数组、`image` 图片，或 `video` 与 `poster` 视频封面。没有文案时可省略 `text`。
- 卡片 `images` 配合 `layout: "triptych"` 显示紧密并排三图；`layout: "sweet-collage"` 配合 `reveal: true` 显示逐张出现的叠图。栏目 `layout: "sweet-gallery"` 使用甜甜甜排版。
- `bonus.image`、`bonus.title`：彩蛋图片和无障碍名称。

当前通过配置文件编辑，未加入可视化编辑器。

## 文件与素材

`index.html` 包含页面和 SVG 蛋糕，`styles.css` 管理布局动画，`app.js` 管理交互，`glitch-worklet.js` 处理音频。运行不依赖 jQuery、fullPage、D3 或外部接口。

`music.mp3` 为原版音乐。`memory-video.mp4` 是原始 MOV 的浏览器兼容副本，`video-poster.jpg` 是封面。`media/` 保留全部原始素材；未引用的原图和 MOV 也保留，方便后续替换。

原项目：https://github.com/IcedSoul/tiny-heart 。作者 IcedSoul，birthday-mobile 贡献者 weingxing；保留 MIT `LICENSE`。

这是静态贺卡，入口验证用于仪式感，不能保护私密素材。没有账号系统、数据库或上传服务。
