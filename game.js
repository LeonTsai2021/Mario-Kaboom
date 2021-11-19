kaboom({
  global: true,
  fullscreen: true,
  scale: 2, //遊戲長寬縮放2倍
  debug: true, //當錯誤發生時，會在網頁上出現錯誤訊息
  clearColor: [0, 0, 0, 1], //設定值為[紅,綠,藍,透明度]，當畫布所有顏色清除時，在畫面呈現該顏色來提示
});
const MOVE_SPEED = 120; //移動速度
const JUMP_FORCE = 350; //跳躍高度
const BIG_JUMP_FORCE = 550; //變大之後的跳躍高度
let CURRENT_JUMP_FORCE = JUMP_FORCE;
let isJumping = true; //判斷是否踩扁敵人的時候會用到
const FALL_DEATH = 400;

const ENEMY_SPEED = 30;
const MUSHROOM_SPEED = 40;
const COIN_SPEED = 40; 
//-------------level 0的sprite-------------//
loadRoot("https://i.imgur.com/"); //載入路徑
loadSprite("coin", "wbKxhcd.png"); //載入金幣，要有上方的路徑
loadSprite("evil-mushroom", "KPO3fR9.png"); //載入敵人香菇
loadSprite("bricks", "pogC9x5.png"); //載入磚塊
loadSprite("blocks", "M6rwarW.png"); //載入無法頂開的磚塊
loadSprite("mario", "Wb1qfhK.png"); //載入馬里奧
loadSprite("mushroom", "0wMd92p.png"); //載入可以吃的蘑菇
loadSprite("suprise-box", "gesQ1KP.png"); //載入問號箱
loadSprite("unboxed", "bdrLpi6.png"); //載入無法頂開的磚塊
loadSprite("pipe-top-left", "ReTPiWY.png"); //載入上面左邊的水管
loadSprite("pipe-top-right", "hj2GK4n.png"); //載入上面右邊的水管
loadSprite("pipe-bottom-left", "c1cYSbt.png"); //載入底部左邊的水管
loadSprite("pipe-bottom-right", "nqQ79eI.png"); //載入底部右邊的水管
//-------------level 1的sprite-------------//
loadSprite("blue-block", "fVscIbn.png");
loadSprite("blue-brick", "3e5YRQd.png");
loadSprite("blue-steel", "gqVoI2b.png");
loadSprite("blue-evil-shroom", "SvV4ueD.png");
loadSprite("blue-surprise-box", "RMqCc1G.png");

scene("game", ({ level, score }) => {
  layers(["bg", "obj", "ui"], "obj"); //定義好圖層

  const maps = [
    //兩關的地圖
    [
      "                                      ",
      "                                      ",
      "                                      ",
      "                                      ",
      "                                      ",
      "     %   ~*~%~                        ",
      "                                      ",
      "                            -+        ",
      "                    ^   ^   ()        ",
      "==============================   =====",
    ],
    [
        "                                      ",
        "          ^                           ",
        "       %%~~%                          ",
        "                                      ",
        "                                      ",
        "           ^                ~         ",
        "       ~*~%~                ~         ",
        "                       ~~   ~      -+ ",
        "             ~  ~      ^ ^  ~      () ",
        "==============  =============   ===== ",
    ],
    [
      "£                                       £",
      "£                                       £",
      "£                                       £",
      "£                                       £",
      "£                            z          £",
      "£       @@@@@@               x          £",
      "£                         x  x          £",
      "£                      x  x  x    x   -+£",
      "£             z   z x  x  x  x    x   ()£",
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    ],
  ];

  const levelCfg = {
    //把上面的map從字元轉換為圖像
    width: 20,
    height: 20,
    '~': [sprite('bricks'), solid()],
    "=": [sprite("blocks"), solid()], //地板磚塊，solid():讓磚塊無法被穿過
    "$": [sprite("coin"), "coin",body()],
    "%": [sprite("suprise-box"), solid(), "coin-suprise"],
    "*": [sprite("suprise-box"), solid(), "mushroom-suprise"],
    "}": [sprite("unboxed"), solid()],
    "(": [sprite("pipe-bottom-left"), solid(), scale(0.5)],
    ")": [sprite("pipe-bottom-right"), solid(), scale(0.5)],
    "-": [sprite("pipe-top-left"), solid(), scale(0.5), "pipe"],
    "+": [sprite("pipe-top-right"), solid(), scale(0.5), "pipe"],
    "^": [sprite("evil-mushroom"), solid(), "dangerous", body()],
    "#": [sprite("mushroom"), solid(), "mushroom", body()],

    "!": [sprite("blue-block"), solid(), scale(0.5)],
    "£": [sprite("blue-brick"), solid(), scale(0.5)],
    "z": [sprite("blue-evil-shroom"), solid(), scale(0.5), "dangerous"],
    "@": [sprite("blue-surprise-box"), solid(), scale(0.5), "coin-suprise"],
    "x": [sprite("blue-steel"), solid(), scale(0.5)],
  };
  const gameLevel = addLevel(maps[level], levelCfg); //載入繪製好的地圖

  const scoreLabel = add([
    //記分板
    text("score:" + score),
    pos(30, 6),
    layer("ui"), //加入到ui圖層
    {
      value: score,
    },
  ]);
  add([text("level" + parseInt(level + 1)), pos(30, 20)]);
  function big() {
    //判斷馬里奧是否變大
    let timer = 0;
    let isBig = false;
    return {
      update() {
        if (isBig) {
          timer -= dt(); //kaboom的函式，秒/幀
          if (timer <= 0) {
            this.smallify(); //當時間結束，馬里奧變小
          }
        }
      },
      isBig() {
        return isBig;
      },
      smallify() {
        this.scale = vec2(1); //二維陣列,馬里奧大小
        CURRENT_JUMP_FORCE = JUMP_FORCE;
        timer = 0;
        isBig = false;
      },
      biggify(time) {
        this.scale = vec2(2); //二維陣列,馬里奧大小
        CURRENT_JUMP_FORCE = BIG_JUMP_FORCE;
        timer = time;
        isBig = true;
      },
    };
  }

  const player = add([
    //加入玩家腳色
    sprite("mario"),
    solid(),
    pos(30, 10), //初始位置
    body(), //kaboom設置好的函式，給人物物理性質，有重力
    big(),
    origin("bot"), //以免身體出現bug
  ]);

  action("mushroom", (m) => {
    //讓香菇移動
    m.move(MUSHROOM_SPEED, 0);
  });
  action("coin", (c) => {
    //讓金幣移動
    c.move(COIN_SPEED, 0);
  });


  player.on("headbump", (obj) => {
    //當玩家在往上頂
    if (obj.is("coin-suprise")) {
      gameLevel.spawn("$", obj.gridPos.sub(0, 1)); //執行一個命令，不會回傳結果。頂到問號箱，生成金幣
      destroy(obj); //讓問號箱消失
      gameLevel.spawn("}", obj.gridPos.sub(0, 0)); //變成磚塊
    }
    if (obj.is("mushroom-suprise")) {
      gameLevel.spawn("#", obj.gridPos.sub(0, 1)); //執行一個命令，不會回傳結果。頂到問號箱，生成香菇
      destroy(obj); //讓問號箱消失
      gameLevel.spawn("}", obj.gridPos.sub(0, 0)); //變成磚塊
    }
  });

  player.collides("mushroom", (m) => {
    //玩家碰撞香菇
    destroy(m); //香菇消失
    player.biggify(6); //玩家變大
  });

  player.collides("coin", (c) => {
    //玩家碰撞金幣
    destroy(c); //讓金幣消失
    scoreLabel.value++; //加分
    scoreLabel.text = 'score:'+scoreLabel.value; //顯示分數
  });
  action("dangerous", (d) => {
    //敵人動作
    d.move(-ENEMY_SPEED, 0);
  });

  player.collides("dangerous", (d) => {
    //當玩家碰到敵人，collides表玩家身體邊界
    if (isJumping) {
      //踩扁敵人
      destroy(d);
    } else {
      go("lose", { score: scoreLabel.value }); //輸了，並顯示分數
    }
  });

  player.action(() => {
    camPos(player.pos); //鏡頭位置。跟隨玩家
    if (player.pos.y >= FALL_DEATH) {
      //如果玩家墜崖
      go("lose", { score: scoreLabel.value });
    }
  });

  player.collides("pipe", () => {
    //通過管子
    keyPress("down", () => {
      CURRENT_JUMP_FORCE = JUMP_FORCE;
      go("game", {
        level: level + 1,
        score: scoreLabel.value,
      });
    });
  });

  keyDown("left", () => {
    //kaboom內建的函式, (按鍵,function=>....)
    player.move(-MOVE_SPEED, 0); //(x,y)
  });

  keyDown("right", () => {
    //kaboom內建的函式, (按鍵,function=>....)
    player.move(MOVE_SPEED, 0); //(x,y)
  });

  player.action(() => {
    if (player.grounded()) {
      isJumping = false;
    }
  });
  keyPress("space", () => {
    if (player.grounded()) {
      isJumping = true;
      player.jump(CURRENT_JUMP_FORCE);
    }
  });
});

scene("lose", ({ score }) => {
  add([
    text("score:" + score, 32),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
});
start("game", { level: 0, score: 0 });
