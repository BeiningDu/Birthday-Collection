/**
 * ============================================================================
 * 视觉小说剧情数据：十月十一日 (October 11)
 * 结构说明：
 * - speaker: 说话人名称（留空或"旁白"）
 * - text: 显示文本
 * - bg: 场景背景图文件名（存放在 resources/images/ 下）
 * - sfx: 节点进入时播放的音效（resources/audio/ 下）
 * - next: 线性点击推进时的下一节点 ID
 * - choices: 分支选项数组 [{ text: "选项文字", target: "目标节点ID" }]
 * - isEnding: 是否为结局终点
 * - endingId: 结局编号 (1 ~ 5)
 * ============================================================================
 */

const ENDINGS_DATA = {
  "1": {
    "number": "结局 ①",
    "title": "及时送达",
    "desc": "在校道的路灯下，明信片当面交到了收件人手中。秋风卷起落叶，两个人共同庆祝了属于自己专属的一天。"
  },
  "2": {
    "number": "结局 ②",
    "title": "独自收信",
    "desc": "潮湿的空气有了些温暖的气息，虽然信使已经离开，但那张承载祝福的明信片依然完成了它的使命。"
  },
  "3": {
    "number": "结局 ③",
    "title": "邻桌的生日",
    "desc": "在小巷深处的餐馆里，一份甜点、一句轻声的道贺。"
  },
  "4": {
    "number": "结局 ④",
    "title": "宿舍的傍晚",
    "desc": "明信片等待着第二天的到来。舍友的兄弟们为你疯狂地庆祝了一个难忘的生日。"
  },
  "5": {
    "number": "结局 ⑤",
    "title": "回家之后",
    "desc": "忙碌的一天结束了，在安静的房间里摆上蛋糕，点燃蜡烛。你深吸一口气，许下了许许多多美好的愿望。"
  }
};

const STORY_DATA = {
  "A_start": {
    "speaker": "旁白",
    "text": "十月十一日，下午。教学楼里人来人往，你背着包走上楼，现在离上课还有十几分钟。秋天已然到来，窗外的树叶渐渐泛黄。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_start_2"
  },
  "A_start_2": {
    "speaker": "旁白",
    "text": "这个课还挺重要的，如果不早点到，就没有好的座位坐了。想到这，你不禁加快了脚步。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_start_3"
  },
  "A_start_3": {
    "speaker": "旁白",
    "text": "好久之前，有个朋友说寄来了一张明信片，只是一直没有消息。你突然想起了这件事，会不会已经到了堆积在收发室的信件里？",
    "bg": "corridor_dusk.jpeg",
    "next": "A_start_4"
  },
  "A_start_4": {
    "speaker": "陈羿帆",
    "text": "（还有点时间，要不要先去看看明信片到了没有？）",
    "bg": "corridor_dusk.jpeg",
    "choices": [
      {
        "text": "直接去阶梯教室占座",
        "target": "A_class_1"
      },
      {
        "text": "折返去收发室看一眼",
        "target": "A_mailroom_1"
      }
    ]
  },
  "A_mailroom_1": {
    "speaker": "旁白",
    "text": "收发室的柜台上堆着一沓沓新送到的信件。阿姨戴着老花镜，正一件件核对名字。你在门口的领取通知上找了一遍，却没看到自己的名字。",
    "bg": "mailroom.jpeg",
    "next": "A_mailroom_2"
  },
  "A_mailroom_2": {
    "speaker": "陈羿帆",
    "text": "阿姨好，请问这里有我的明信片吗？我叫陈羿帆，后羿的羿，帆船的帆。",
    "bg": "mailroom.jpeg",
    "next": "A_mailroom_3"
  },
  "A_mailroom_3": {
    "speaker": "收发室阿姨",
    "text": "我看看……暂时没有，下午这几批我还没分完。如果到了的话，我会给你打电话的。",
    "bg": "mailroom.jpeg",
    "next": "A_mailroom_4"
  },
  "A_mailroom_4": {
    "speaker": "陈羿帆",
    "text": "好的，谢谢阿姨。",
    "bg": "mailroom.jpeg",
    "next": "A_mailroom_5"
  },
  "A_mailroom_5": {
    "speaker": "旁白",
    "text": "你顺手帮从收发室搬东西的同学扶住门，随后往教学楼走去。走廊里的人少了很多了，教室里却几乎坐满了，真是难得啊。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_class_1"
  },
  "A_class_1": {
    "speaker": "旁白",
    "text": "你从后门溜进去，在两个人之间找了个座位，把教材和电脑放好。上课铃响起，教室渐渐安静下来。",
    "bg": "classroom.jpeg",
    "next": "A_class_2"
  },
  "A_class_2": {
    "speaker": "旁白",
    "text": "讲课的是个严谨的老头子，不愿意用ppt。黑板上写满了推导的板书，你尝试着把板书都记在笔记本上，可是有些地方还是跟不上。",
    "bg": "classroom.jpeg",
    "next": "A_class_3"
  },
  "A_class_3": {
    "speaker": "老师",
    "text": "大家休息几分钟，回来再讲后面的题。",
    "bg": "classroom.jpeg",
    "next": "A_class_4"
  },
  "A_class_4": {
    "sfx": "vibrate.wav",
    "speaker": "旁白",
    "text": "课间，你还在整理刚刚记下来的笔记。口袋里的手机忽然震动，屏幕上出现了一个陌生号码。",
    "bg": "classroom.jpeg",
    "next": "A_class_5"
  },
  "A_class_5": {
    "speaker": "陈羿帆",
    "text": "（010开头的，会是谁呢？感觉像是骚扰电话呢...）",
    "bg": "classroom.jpeg",
    "choices": [
      {
        "text": "从后门出去接听电话",
        "target": "A_call_1"
      },
      {
        "text": "把来电静音，继续整理笔记",
        "target": "A_ignore_1"
      }
    ]
  },
  "A_ignore_1": {
    "speaker": "旁白",
    "text": "你挂断了电话，照着黑板，把那几幅复杂的示意图画在笔记本上。很快上课铃又响了",
    "bg": "classroom.jpeg",
    "next": "A_after_class_1"
  },
  "A_call_1": {
    "speaker": "旁白",
    "text": "你从后门走出教室，在走廊边接起电话。阵风从窗台吹进来，这是秋天的气息。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_call_2"
  },
  "A_call_2": {
    "speaker": "陈羿帆",
    "text": "喂，您好。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_call_3"
  },
  "A_call_3": {
    "speaker": "听筒另一端",
    "text": "你好，请问是陈羿帆吗？我是学校的邮递员，这里有一张你的明信片。我现在在教学楼的车棚旁边，你方便下来拿吗？",
    "bg": "corridor_dusk.jpeg",
    "next": "A_call_4"
  },
  "A_call_4": {
    "speaker": "旁白",
    "text": "那张等了好久的明信片终于到了。你向楼下望去，车棚就在一棵大树后面。你看到老师从走进了门口，快要继续上课了。",
    "bg": "corridor_dusk.jpeg",
    "choices": [
      {
        "text": "“我马上下来，麻烦您等两分钟！”",
        "target": "A_end1_1"
      },
      {
        "text": "“不好意思要上课了，麻烦直接帮我放收发室吧。”",
        "target": "A_drop_request_1"
      }
    ]
  },
  "A_drop_request_1": {
    "speaker": "听筒另一端",
    "text": "好的，那我放在收发室的篓子里。你有空记得去取。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_drop_request_2"
  },
  "A_drop_request_2": {
    "speaker": "旁白",
    "text": "你道了谢，在手机上设了个提醒，回到座位。老师已经开始讲下一章里，你赶紧拿起了笔。",
    "bg": "classroom.jpeg",
    "next": "A_after_class_1"
  },
  "A_after_class_1": {
    "speaker": "旁白",
    "text": "下课时，窗外的天空已经染上了晚霞。你拍下没抄完的板书，收好书包，随着人流走出教学楼。",
    "bg": "campus_evening.jpeg",
    "next": "A_after_class_2"
  },
  "A_after_class_2": {
    "speaker": "旁白",
    "text": "教学楼门口的校道全是单车和人，一部分是去饭堂的，一部分是去校门口的。你突然觉得有些饿了。",
    "bg": "campus_evening.jpeg",
    "next": "A_after_class_3"
  },
  "A_after_class_3": {
    "speaker": "陈羿帆",
    "text": "（先吃饭吧。去吃饭堂，还是去校外常去的那家店呢？）",
    "bg": "campus_evening.jpeg",
    "choices": [
      {
        "text": "去校外吃",
        "target": "A_end3_1"
      },
      {
        "text": "吃饭堂",
        "target": "A_canteen_1"
      }
    ]
  },
  "A_canteen_1": {
    "speaker": "旁白",
    "text": "你点了一碗热汤面，选了个靠窗的位置坐下。热腾腾的水汽让人感到温暖，玻璃上映着你自己的模样。",
    "bg": "canteen_night.jpeg",
    "next": "A_canteen_2"
  },
  "A_canteen_2": {
    "speaker": "旁白",
    "text": "吃过饭，你发了会呆。窗外的天已经黑了，可是食堂仍然是络绎不绝。",
    "bg": "canteen_night.jpeg",
    "next": "A_canteen_3"
  },
  "A_canteen_3": {
    "speaker": "旁白",
    "text": "走出食堂，已经过了七点。收发室已经关门了，不过篓子是在收发室外面的，可以随时拿，宿舍则几步路就到了。你停了下来。",
    "bg": "canteen_night.jpeg",
    "choices": [
      {
        "text": "散步走去收发室取信，就当消食",
        "target": "A_end2_1"
      },
      {
        "text": "今天太累了，不想走那么远，直接回宿舍",
        "target": "A_end4_1"
      }
    ]
  },
  "A_end1_1": {
    "speaker": "旁白",
    "text": "你走下楼梯，在车棚旁看见一个正在等候的人。他站在自行车边，手里拿着一张卡片。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_2"
  },
  "A_end1_2": {
    "speaker": "陈羿帆",
    "text": "你好，我是陈羿帆。不好意思，让你久等了。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_3"
  },
  "A_end1_3": {
    "speaker": "窦一杰",
    "text": "没关系。这是你的明信片，寄件人特意说要今天送到，所以我就先打电话问了问。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_4"
  },
  "A_end1_4": {
    "speaker": "旁白",
    "text": "你接过明信片，翻到背面。那熟悉的字迹写着“生日快乐”，旁边是十月十一日的日期。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_5"
  },
  "A_end1_5": {
    "speaker": "陈羿帆",
    "text": "原来今天已经是十一号了……最近忙着上课，差点忘了自己的生日。不过，谢谢你啊。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_6"
  },
  "A_end1_6": {
    "speaker": "窦一杰",
    "text": "生日快乐。说来也巧，今天也是我的生日。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_7"
  },
  "A_end1_7": {
    "speaker": "陈羿帆",
    "text": "真的吗？那也祝你生日快乐！今天真是辛苦了。",
    "bg": "bike_shed.jpeg",
    "next": "A_end1_8"
  },
  "A_end1_8": {
    "sfx": "leaves.wav",
    "speaker": "旁白",
    "text": "对方笑着向你道别，骑着车驶过落叶。你愣了一会，随后把明信片装进口袋里里，回到教室。",
    "bg": "corridor_dusk.jpeg",
    "next": "A_end1_9"
  },
  "A_end1_9": {
    "speaker": "旁白",
    "text": "你重新坐下，却有些心不在焉，可能是有些“突然”的生日，抑或是那份意外的祝福。",
    "bg": "classroom.jpeg",
    "next": "A_end1_10"
  },
  "A_end1_10": {
    "speaker": "旁白",
    "text": "下课后，校道的路灯亮了。你又想起了那张明信片，拿出来再看了一次，原来祝福后面还画着一个漂亮的小蛋糕。",
    "bg": "campus_night.jpeg",
    "next": "A_end1_11"
  },
  "A_end1_11": {
    "speaker": "旁白",
    "text": "你告诉朋友明信片已经收到，又提起那位同样在今天过生日的邮递员。收好手机后，你往饭堂走去，想着晚饭要饱食一餐。",
    "bg": "campus_night.jpeg",
    "isEnding": true,
    "endingId": 1
  },
  "A_end2_1": {
    "speaker": "旁白",
    "text": "收发室的灯还亮着，不过大门已经关闭了，阿姨正在整理柜台。卷帘门降下了一小截，你走上前，庆幸自己来得还不算太晚。",
    "bg": "mailroom.jpeg",
    "next": "A_end2_2"
  },
  "A_end2_2": {
    "speaker": "陈羿帆",
    "text": "阿姨，您好。我来取明信片，陈羿帆。现在还能取吗？",
    "bg": "mailroom.jpeg",
    "next": "A_end2_3"
  },
  "A_end2_3": {
    "speaker": "收发室阿姨",
    "text": "同学，这里已经关门了。如果是平信的话，在外面的篓子里找找看。",
    "bg": "mailroom.jpeg",
    "next": "A_end2_4"
  },
  "A_end2_4": {
    "speaker": "旁白",
    "text": "第一张就是你的明信片。身后的卷帘门缓缓落下，你走到门外的灯下，把卡片翻过来看。",
    "bg": "mailroom_night.jpeg",
    "next": "A_end2_5"
  },
  "A_end2_5": {
    "speaker": "旁白",
    "text": "“生日快乐。”看到这几个字，你才想起今天的日期。",
    "bg": "mailroom_night.jpeg",
    "next": "A_end2_6"
  },
  "A_end2_6": {
    "speaker": "陈羿帆",
    "text": "（原来今天是我生日啊……这么巧也是今天到。）",
    "bg": "mailroom_night.jpeg",
    "next": "A_end2_7"
  },
  "A_end2_7": {
    "speaker": "旁白",
    "text": "晚风非常凉爽，你在灯下把明信片仔细读了两遍。拍照告诉朋友已经收到后，你小心地把它夹进文件夹里。",
    "bg": "mailroom_night.jpeg",
    "next": "A_end2_8"
  },
  "A_end2_8": {
    "speaker": "旁白",
    "text": "回宿舍的路上，你在便利店买了些喜欢的零食，还有一把最爱吃的香蕉。",
    "bg": "campus_night.jpeg",
    "isEnding": true,
    "endingId": 2
  },
  "A_end3_1": {
    "speaker": "旁白",
    "text": "傍晚六点半，走到小巷里熟悉的便当店。客人不多，毕竟这是你的宝藏小店。你推开门，店员领你到里面坐下。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_2"
  },
  "A_end3_2": {
    "speaker": "旁白",
    "text": "你翻过菜单，还是点了那份炒饭。你把书包放到脚边，看着窗外的纷繁的人影一次次经过。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_3"
  },
  "A_end3_3": {
    "speaker": "旁白",
    "text": "饭菜端了上来，你才回过神来，慢慢开始吃。店里有人在聊着天，同时厨房偶尔传来碗碟相碰的声音。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_4"
  },
  "A_end3_4": {
    "speaker": "旁白",
    "text": "吃完饭，你没有着急离开。看到店员走向了邻桌，随后传来了店员的声音。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_5"
  },
  "A_end3_5": {
    "speaker": "店员",
    "text": "这是您点的生日舒芙蕾。祝您生日快乐。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_6"
  },
  "A_end3_6": {
    "speaker": "旁白",
    "text": "邻桌的人轻声道谢。你听见“生日”两个字，下意识拿出手机看了一眼：十月十一日，19:17。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_7"
  },
  "A_end3_7": {
    "speaker": "陈羿帆",
    "text": "（原来今天是我的生日啊……差点就忘了……我这记性）",
    "bg": "restaurant.jpeg",
    "next": "A_end3_8"
  },
  "A_end3_8": {
    "speaker": "旁白",
    "text": "你想起了那张明信片，好久之前朋友就说寄出来了。会不会里面也是生日的祝福呢？",
    "bg": "restaurant.jpeg",
    "next": "A_end3_9"
  },
  "A_end3_9": {
    "speaker": "陈羿帆",
    "text": "你好，麻烦再加一份焦糖布丁。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_10"
  },
  "A_end3_10": {
    "speaker": "店员",
    "text": "好的，稍等。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_11"
  },
  "A_end3_11": {
    "speaker": "旁白",
    "text": "你收拾了一下餐具，邻桌的客人正好也起身结账。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_12"
  },
  "A_end3_12": {
    "speaker": "旁白",
    "text": "布丁端了上来，你尝了一口，mmm有点苦。你拍了张照发给朋友，告诉对方这是今晚的生日甜点，他很快就回复了。",
    "bg": "restaurant.jpeg",
    "next": "A_end3_13"
  },
  "A_end3_13": {
    "speaker": "旁白",
    "text": "你把手机放在一边，继续吃那份布丁。既然是生日，就要好好庆祝一下。至于那张明信片，明天再去收发室取也不迟。",
    "bg": "restaurant.jpeg",
    "isEnding": true,
    "endingId": 3
  },
  "A_end4_1": {
    "speaker": "旁白",
    "text": "你直接回了宿舍。一推开门，室友们就抬起头和你打招呼。",
    "bg": "dorm.jpeg",
    "next": "A_end4_2"
  },
  "A_end4_2": {
    "speaker": "陈羿帆",
    "text": "（唔啊，真是累死了，今天还是先休息吧。）",
    "bg": "dorm.jpeg",
    "next": "A_end4_3"
  },
  "A_end4_3": {
    "speaker": "旁白",
    "text": "洗漱之后，你坐回桌子前。你看到手机里有几条未读消息，点开第一条，就是一句生日快乐。",
    "bg": "dorm.jpeg",
    "next": "A_end4_4"
  },
  "A_end4_4": {
    "speaker": "微信消息",
    "text": "羿帆，生日快乐！最近还顺利吧？",
    "bg": "dorm.jpeg",
    "next": "A_end4_5"
  },
  "A_end4_5": {
    "speaker": "旁白",
    "text": "你看了眼日期，顿时才反应过来。室友恰巧经过桌边，看见屏幕上的祝福，问你：“原来今天是你生日？”",
    "bg": "dorm.jpeg",
    "next": "A_end4_6"
  },
  "A_end4_6": {
    "speaker": "陈羿帆",
    "text": "是啊，我自己都差点忘了。",
    "bg": "dorm.jpeg",
    "next": "A_end4_7"
  },
  "A_end4_7": {
    "speaker": "室友",
    "text": "生日快乐！你怎么不早说，等着，我们出去买点吃的。",
    "bg": "dorm.jpeg",
    "next": "A_end4_8"
  },
  "A_end4_8": {
    "speaker": "旁白",
    "text": "没过多久，几个人提着零食和饮料回来了。你把桌上的杂物挪开，给他们腾出地方。",
    "bg": "dorm.jpeg",
    "next": "A_end4_9"
  },
  "A_end4_9": {
    "speaker": "旁白",
    "text": "你们聚在一起，唱起了生日歌。到了许愿的环节，他们起哄着要你找到true love。",
    "bg": "dorm.jpeg",
    "next": "A_end4_10"
  },
  "A_end4_10": {
    "speaker": "旁白",
    "text": "宿舍里热闹了好一阵。你拆开了零食，和大家聊着白天的课和夜晚的生活……",
    "bg": "dorm_night.jpeg",
    "isEnding": true,
    "endingId": 4
  },
  "B_start": {
    "speaker": "旁白",
    "text": "下午，学校的邮件刚送到。你先是把要送往各栋楼的报纸整理好，之后收发室里还有几沓等着派送的信件和明信片。",
    "bg": "mailroom.jpeg",
    "next": "B_start_2"
  },
  "B_start_2": {
    "speaker": "旁白",
    "text": "今天是你的生日。早上出门时，你想着送完信以后，就找个地方吃顿漂亮饭。",
    "bg": "mailroom.jpeg",
    "next": "B_start_3"
  },
  "B_start_3": {
    "speaker": "窦一杰",
    "text": "（似乎送完这一趟，就可以收工了。）",
    "bg": "mailroom.jpeg",
    "next": "B_start_4"
  },
  "B_start_4": {
    "speaker": "旁白",
    "text": "分拣台上还留着一张明信片，收件人是学校的学生。你拿起投递单，发现这张明信片是个生日祝福。",
    "bg": "mailroom.jpeg",
    "choices": [
      {
        "text": "仔细查看这张明信片",
        "target": "B_postcard_1"
      },
      {
        "text": "按常规件处理，准备出发",
        "target": "B_other_1"
      }
    ]
  },
  "B_postcard_1": {
    "speaker": "旁白",
    "text": "收件人叫陈羿帆。备注里写着：“十月十一日是他的生日，希望当天交给本人，谢谢。”",
    "bg": "postcard_closeup.jpeg",
    "next": "B_postcard_2"
  },
  "B_postcard_2": {
    "speaker": "窦一杰",
    "text": "（原来他也是今天过生日，只是不知道现在方不方便收信。）",
    "bg": "postcard_closeup.jpeg",
    "next": "B_postcard_3"
  },
  "B_postcard_3": {
    "speaker": "旁白",
    "text": "明信片上面留了收件人的电话号码，你看了眼时间。如果能联系上，就当面送去；不方便的话，那就放到收发室外面的篓子里。",
    "bg": "postcard_closeup.jpeg",
    "choices": [
      {
        "text": "照着单子上的号码打过去确认",
        "target": "B_call_1"
      },
      {
        "text": "直接放到收发室外面的篓子里",
        "target": "B_mailroom_drop_1"
      }
    ]
  },
  "B_other_1": {
    "speaker": "旁白",
    "text": "你核对过名字和地址，把明信片放进学校的那叠信件里。卡片的边角已经被磨得毛糙了，你轻轻抚平了它，然后拉好背包。",
    "bg": "mailroom.jpeg",
    "next": "B_other_2"
  },
  "B_other_2": {
    "speaker": "旁白",
    "text": "学校的平信平时会放在收发室外面的篓子里，如果学生们有空就来找自己的。你推着自行车出了门。",
    "bg": "mailroom.jpeg",
    "next": "B_mailroom_drop_1"
  },
  "B_call_1": {
    "speaker": "旁白",
    "text": "你在教学楼的车棚旁停好车，用学校的工作电话拨出了号码。",
    "bg": "bike_shed.jpeg",
    "next": "B_call_2"
  },
  "B_call_2": {
    "speaker": "旁白",
    "text": "电话响了两声，对方接起来。他说：“喂，您好”。",
    "bg": "bike_shed.jpeg",
    "next": "B_call_3"
  },
  "B_call_3": {
    "speaker": "窦一杰",
    "text": "你好，请问是陈羿帆吗？我是学校的邮递员，这里有一张你的明信片。我现在在教学楼的车棚旁边，你方便下来拿吗？",
    "bg": "bike_shed.jpeg",
    "next": "B_call_4"
  },
  "B_call_4": {
    "speaker": "陈羿帆",
    "text": "我马上下来，麻烦您等两分钟！",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_1"
  },
  "B_mailroom_drop_1": {
    "speaker": "旁白",
    "text": "回到收发室，你把其他信件交给阿姨，又拿出那张明信片，问她是不是要放在外面的篓子里。",
    "bg": "mailroom.jpeg",
    "next": "B_mailroom_drop_2"
  },
  "B_mailroom_drop_2": {
    "speaker": "收发室阿姨",
    "text": "可以，平信就放外面吧，一般都是同学们自己来拿。如果有人来问的话，我再告诉ta。",
    "bg": "mailroom.jpeg",
    "next": "B_mailroom_drop_3"
  },
  "B_mailroom_drop_3": {
    "speaker": "旁白",
    "text": "你把明信片放到篓子里。背包终于空了，你放松了一下紧绷的肩膀，和阿姨道别。",
    "bg": "mailroom.jpeg",
    "next": "B_mailroom_drop_4"
  },
  "B_mailroom_drop_4": {
    "speaker": "窦一杰",
    "text": "（忙完了。去吃点东西，还是直接回家呢？）",
    "bg": "mailroom.jpeg",
    "choices": [
      {
        "text": "去校外随便找一家精致的餐馆",
        "target": "B_end3_1"
      },
      {
        "text": "直接骑车回家休息",
        "target": "B_end5_1"
      }
    ]
  },
  "B_end1_1": {
    "speaker": "旁白",
    "text": "你拿着明信片在车棚旁等候。不一会儿，一个学生从教学楼走下来，看见你手里的卡片，便朝这边走过来。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_2"
  },
  "B_end1_2": {
    "speaker": "陈羿帆",
    "text": "你好，我是陈羿帆。不好意思，让你久等了。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_3"
  },
  "B_end1_3": {
    "speaker": "窦一杰",
    "text": "没关系。这是你的明信片，寄件人特意说要今天送到，所以我就先打电话问了问。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_4"
  },
  "B_end1_4": {
    "speaker": "旁白",
    "text": "他接过明信片，翻到背面，停下来读了几行。你看着他有些惊讶的表情，猜想他已经看到那句生日快乐。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_5"
  },
  "B_end1_5": {
    "speaker": "陈羿帆",
    "text": "原来今天已经是十一号了……最近忙着上课，差点忘了自己的生日。不过，谢谢你啊。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_6"
  },
  "B_end1_6": {
    "speaker": "旁白",
    "text": "原来他忙得连自己的生日都忘了呀，哈哈哈，你不禁笑了笑。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_7"
  },
  "B_end1_7": {
    "speaker": "窦一杰",
    "text": "生日快乐！说来也巧，今天也是我的生日。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_8"
  },
  "B_end1_8": {
    "speaker": "陈羿帆",
    "text": "真的吗？那也祝你生日快乐！今天真是辛苦了。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_9"
  },
  "B_end1_9": {
    "speaker": "旁白",
    "text": "两个人笑着道别。他在原地愣了一会儿，随后把明信片装进口袋，转身回了教学楼。",
    "bg": "bike_shed.jpeg",
    "next": "B_end1_10"
  },
  "B_end1_10": {
    "sfx": "leaves.wav",
    "speaker": "旁白",
    "text": "你骑着车驶过落叶，回头时，他已经走上了台阶。最后这张明信片送到了，你也该回去收拾一下，准备吃晚饭了。",
    "bg": "bike_shed.jpeg",
    "isEnding": true,
    "endingId": 1
  },
  "B_end3_1": {
    "speaker": "旁白",
    "text": "你骑着车在校外兜了一圈，不知不觉拐进一条小巷。尽头有一家装修非常温馨的便当店，而且客人也不多。你立马做出了选择，于是停好车推门进去。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_2"
  },
  "B_end3_2": {
    "speaker": "旁白",
    "text": "放下背包后，你揉了揉肩膀，翻开了菜单。今天的信总算都送完了，现在好好看看晚上吃什么好吃的。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_3"
  },
  "B_end3_3": {
    "speaker": "窦一杰",
    "text": "（这份饭看着不错……那个也不错……哇还有一个叫生日舒芙蕾的甜品，今天刚好可以尝尝。）",
    "bg": "restaurant.jpeg",
    "next": "B_end3_4"
  },
  "B_end3_4": {
    "speaker": "旁白",
    "text": "你点了一份饭和生日舒芙蕾，在手机上发出了订单。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_5"
  },
  "B_end3_5": {
    "speaker": "旁白",
    "text": "饭菜端了上来，你把手机放到一边，开始大口大口吃。邻桌坐着一个学生模样的人，看样子是刚下课不久。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_6"
  },
  "B_end3_6": {
    "speaker": "店员",
    "text": "这是您点的生日舒芙蕾。祝您生日快乐。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_7"
  },
  "B_end3_7": {
    "speaker": "窦一杰",
    "text": "谢谢。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_8"
  },
  "B_end3_8": {
    "speaker": "旁白",
    "text": "没想到店员还特意说了句生日快乐，你有些不好意思地笑了笑。小瓷盘里的舒芙蕾还温热着，你拿起勺子尝了一口。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_9"
  },
  "B_end3_9": {
    "speaker": "旁白",
    "text": "邻桌的那个学生之后加了一份焦糖布丁。不过你没太在意，继续吃着自己的甜点。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_10"
  },
  "B_end3_10": {
    "speaker": "窦一杰",
    "text": "（还挺好吃的，今天这顿漂亮饭没白来。下次有空可以再来这里。）",
    "bg": "restaurant.jpeg",
    "next": "B_end3_11"
  },
  "B_end3_11": {
    "speaker": "旁白",
    "text": "吃完后，你直接起身结了账。你看到邻桌的客人正在收拾餐具，布丁还没端上来。",
    "bg": "restaurant.jpeg",
    "next": "B_end3_12"
  },
  "B_end3_12": {
    "speaker": "旁白",
    "text": "走出店门，巷口的风很凉爽，你骑上车往回走。在这个特别的夜晚，你吃上了一顿满意的晚饭。",
    "bg": "street_night.jpeg",
    "isEnding": true,
    "endingId": 3
  },
  "B_end5_1": {
    "speaker": "旁白",
    "text": "从收发室出来，你就直接骑上车往家走。等红灯的时候，看到路边的蛋糕店还亮着灯。你想着，虽然没去餐馆，生日蛋糕总还是要有的。",
    "bg": "street_night.jpeg",
    "next": "B_end5_2"
  },
  "B_end5_2": {
    "speaker": "旁白",
    "text": "柜台里还有几块漂亮的小蛋糕，你挑了一块自己喜欢的。店员问你要不要蜡烛，你回答说，要一根吧。",
    "bg": "street_night.jpeg",
    "next": "B_end5_2_1"
  },
  "B_end5_2_1": {
    "speaker": "旁白",
    "text": "你一只手提着蛋糕的袋子，一只手扶着车把，慢慢骑回了家。",
    "bg": "street_night.jpeg",
    "next": "B_end5_3"
  },
  "B_end5_3": {
    "speaker": "旁白",
    "text": "回到房间，你放下背包，脱下工作时穿的外套。桌上有些乱，于是你收拾出一块地方，把蛋糕摆了上去。",
    "bg": "room_night.jpeg",
    "next": "B_end5_4"
  },
  "B_end5_4": {
    "speaker": "窦一杰",
    "text": "（终于到家了，先洗个手吧。）",
    "bg": "room_night.jpeg",
    "next": "B_end5_5"
  },
  "B_end5_5": {
    "speaker": "旁白",
    "text": "你给自己倒了杯水，拆开了蛋糕盒。路上有些颠簸，有一点奶油蹭到了盖子。你稍微用叉子整理了一下，把蜡烛插在中间。",
    "bg": "room_night.jpeg",
    "next": "B_end5_6"
  },
  "B_end5_6": {
    "sfx": "lighter.wav",
    "speaker": "旁白",
    "text": "随着打火机的响声，蜡烛被点燃了。房间里很安静，你关掉所有的灯光，在蛋糕前坐下来。",
    "bg": "room_night.jpeg",
    "next": "B_end5_7"
  },
  "B_end5_7": {
    "speaker": "旁白",
    "text": "看着灿烂的烛光，你又想起那张生日明信片，不知道那个叫陈羿帆的同学有没有拿到。不过今天的工作已经做完了，你把目光放回蛋糕上。",
    "bg": "room_night.jpeg",
    "next": "B_end5_8"
  },
  "B_end5_8": {
    "speaker": "窦一杰",
    "text": "新的一岁，生日快乐。",
    "bg": "room_night.jpeg",
    "next": "B_end5_9"
  },
  "B_end5_9": {
    "speaker": "旁白",
    "text": "你深吸一口气，闭上眼睛，许下了很多很多美好的愿望。再睁开眼睛的时候，蜡烛已经融化了一大半。你吹灭它，用刀把蛋糕切成了小块。",
    "bg": "room_night.jpeg",
    "next": "B_end5_10"
  },
  "B_end5_10": {
    "speaker": "旁白",
    "text": "你才发现手机里有了几条朋友的生日祝福，你一边吃一边回复着。他们问你今晚打算怎么过，你顺手就把蛋糕发了过去：“我刚刚才到家呢，现在开始过生日。”",
    "bg": "room_night.jpeg",
    "next": "B_end5_11"
  },
  "B_end5_11": {
    "speaker": "旁白",
    "text": "蛋糕断断续续地吃完了，朋友们的消息在陆陆续续地发来。你靠在椅子上和他们聊了一会儿，窗外的噪声渐渐消停了，今晚终于是可以好好休息了……",
    "bg": "room_night.jpeg",
    "isEnding": true,
    "endingId": 5
  }
};
