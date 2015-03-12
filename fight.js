function imgMonitor() {
	var imgArr = [];
	return {
		createImg: function (url) {
			return typeof imgArr[url] != 'undefined' ? imgArr[url] : (imgArr[url] = new Image(), imgArr[url].src = url, imgArr[url]);
		},
		loadImgs: function (arr, callback) {
			for (var i = 0, ii = arr.length; i < ii; i++) {
				var url = arr[i];
				imgArr[url] = new Image();
				imgArr[url].onload = function (e) {
					if (i === (ii - 1) && typeof callback === 'function') {
						callback();
					}
				};
				imgArr[url].src = url;
			}
		}
	}
}
/**
 * 飞船
 */
function ship(ctx) {
	this._ctx = ctx;
	this.width = 80;
	this.height = 80;
	this.left = gameMonitor.width / 5 - this.width;
	this.top = gameMonitor.height / 2 - this.height / 2;
	this.shipImg = gameMonitor.im.createImg(CONFIG.IMG_PATH.SHIP);
	this.bulletCount = 9999;
	this.hp = 100;
	this.move = false;
	this.paint = function () {
		this._ctx.drawImage(this.shipImg, this.left, this.top, this.width, this.height);
		return this;
	};
	this.setMove = function (v) {
		this.move = !!v;
		return this;
	};
	this.setPosition = function (pos) {
		this.top = pos.top;
		this.left = pos.left;
		//在canvas周围做一个限制，让飞船不会显示在背景之外
		if (this.top < 0) {
			this.top = 0;
		} else if (this.top > (gameMonitor.height - this.height)) {
			this.top = gameMonitor.height - this.height;
		}
		if (this.left < 0) {
			this.left = 0;
		} else if (this.left > (gameMonitor.width - this.width)) {
			this.left = gameMonitor.width - this.width;
		}
		return this;
	};
	this.detectHit = function (callback) {
		var c1 = {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2,
			r: (this.width + this.height) / 4
		};
		for (var i = 0; i < gameMonitor.bulletArr.length; i++) {
			var b = gameMonitor.bulletArr[i];
			var hit = util.isHit(c1, {
				x: b.left + b.width / 2,
				y: b.top + b.height / 2,
				r: (b.width + b.height) / 4
			});
			if (hit) {
				if(callback && typeof callback === 'function'){
					callback();
				}
				this.hp -= b.weili;
				gameMonitor.bulletArr.splice(i, 1);
				i--;
			}
			if (this.hp <= 0) {
				this.destory();
				break;
			}
		}
		return this;
	};
	this.destory = function () {
		console.error('ship has ben destory!!!!');
	};
	this.controll = function () {
		var $body = $(document.body);
		var me = this;
		//按下鼠标定位ship，并使ship可移动
		$body.on(CONFIG.EVENT_TYPE.MOUSE_DOWN, '#' + CONFIG.CANVAS_ID, function (e) {
			if (gameMonitor.status !== CONFIG.GAME_STATUS.RUN) {
				return;
			}
			me.setMove(true);
			//除以2是为了让鼠标在飞船中间
			me.setPosition({
				top: e.offsetY - me.height / 2,
				left: e.offsetX - me.width / 2
			}).paint();
		});
		//放开鼠标使ship不可以移动
		$body.on(CONFIG.EVENT_TYPE.MOUSE_UP, '#' + CONFIG.CANVAS_ID, function (e) {
			me.setMove(false);
		});
		//移动鼠标让ship移动
		$body.on(CONFIG.EVENT_TYPE.MOUSE_MOVE, '#' + CONFIG.CANVAS_ID, function (e) {
			e.preventDefault();
			if(!me.move){
				return;
			}
			//除以2是为了让鼠标在飞船中间
			me.setPosition({
				top: e.offsetY - me.height / 2,
				left: e.offsetX - me.width / 2
			}).paint();
		});
		//按space键攻击
		$body.on(CONFIG.EVENT_TYPE.KEY_DOWN, function (e) {
			if (gameMonitor.status !== CONFIG.GAME_STATUS.RUN || e.keyCode !== CONFIG.KEY_CODE.SPACE || me.bulletCount <= 0) {
				return;
			}
			//创建子弹
			var b = new bullet({
				ctx: me._ctx,
				role: CONFIG.ROLE.SHIP,
				left: me.left,
				top: me.top
			})
			//子弹发射函数
			b.lunch({
				left: me.left,
				top: me.top
			});
			//ship子弹数减1
			me.bulletCount--;
		});
		return this;
	};
}
/**
 * 敌人(可恶的米兔)
 */
function enemy(ctx) {
	this._ctx = ctx;
	this.width = 80;
	this.height = 80;
	this.left = gameMonitor.width;
	this.top = gameMonitor.height / 1.5;
	this.speed = util.ranBetween(1, 5);
	this.attackTimer = null;
	this.runImg = gameMonitor.im.createImg(CONFIG.IMG_PATH.ENEMY);
	this.cryImg = gameMonitor.im.createImg(CONFIG.IMG_PATH.ENEMY_DESTORY);
	this.hp = 1;
	this.paint = function () {
		this._ctx.drawImage((this.hp > 0 ? this.runImg : this.cryImg), this.left, this.top, this.width, this.height);
		return this;
	};
	this.move = function () {
		this.left -= 1 * this.speed;
		return this;
	};
	this.autoAttack = function () {
		var t = util.ranBetween(1000, 2000);
		this.attackTimer = setTimeout(function () {
			var b = new bullet({
				ctx: this._ctx,
				role: CONFIG.ROLE.ENEMY,
				left: this.left,
				top: this.top
			});
			b.lunch({
				left: gameMonitor.ship.left,
				top: gameMonitor.ship.top
			});
			this.autoAttack();
		}.bind(this), t);
		return this;
	};
	this.detectHit = function () {

		return this;
	};
	this.destory = function () {
		this.paint();
		clearTimeout(this.attackTimer);
	}
}
/**
 * 子弹
 */
function bullet(info) {
	this._ctx = info.ctx;
	this.bigone = Math.random() < 0.2;
	this.width = !!info.role ? 40 : (this.bigone ? 80 : 40);
	this.height = !!info.role ? 40 : (this.bigone ? 80 : 40);
	this.left = info.left;
	this.top = info.top;
	this.role = info.role;
	this.speed = !!info.role ? 10 : 1; //ship子弹速度为10，enemy子弹速度为1
	this.weili = this.bigone ? 50 : 30;
	this.bulletImg = gameMonitor.im.createImg(!!info.role ? CONFIG.IMG_PATH.SHIP_BULLET : CONFIG.IMG_PATH.ENEMY_BULLET);
	this.targetPos = null;
	this.paint = function () {
		this._ctx.drawImage(this.bulletImg, this.left, this.top, this.width, this.height);
		return this;
	}
	this.lunch = function (targetPos) {
		this.targetPos = targetPos;
		if (this.role === CONFIG.ROLE.ENEMY) {
			this.isAtShipLeft = this.left < targetPos.left;
			this.isUnderShip = this.top > targetPos.top;
		}
		gameMonitor.addBullet(this);
	};
	this.destory = function () {

	};
	this.move = function () {
		if (this.role === CONFIG.ROLE.SHIP) { //ship子弹轨迹是弧形的
			arcTrack.call(this);
		} else { //enemy子弹轨迹是瞄准ship的直线
			lineTrack.call(this);
		}
		return this;
	};
	function arcTrack() {
		var r = 500 - this.targetPos.top;
		this.left += 1 * this.speed;
		this.top = 500 - Math.sqrt(Math.pow(r, 2) - Math.pow(this.left - this.targetPos.left, 2));

	};
	function lineTrack() {
		// var k = (this.top - this.targetPos.top) / (this.left - this.targetPos.left);
		// this.left -= 1 * this.speed;
		// this.top = k * this.left;
		if (this.isAtShipLeft) {
			this.left += util.ranBetween(1, 5) * this.speed;
		} else {
			this.left -= util.ranBetween(1, 5) * this.speed;
		}
		if (this.isUnderShip) {
			this.top -= util.ranBetween(1, 3) * this.speed;
		} else {
			this.top += util.ranBetween(1, 3) * this.speed;
		}
	};
}
/**
 * 工具对象
 */
var util = {
	//返回min至max之间的随机整数
	ranBetween: function (min, max) {
		return min + Math.round((max - min) * Math.random());
	},
	//撞击判断，采用两圆心间距和两元半径之和的比较
	isHit: function (c1, c2) {
		var dist = Math.sqrt(Math.pow((c1.x || 0) - (c2.x || 0), 2) + Math.pow((c1.y || 0) - (c2.y || 0), 2));
		return dist < ((c1.r || 0) + (c2.r || 0));
	}
};
/**
 * 配置对象
 */
var CONFIG = {
	CANVAS_ID: '',
	CANVAS_CTX: function () {
		var canvas = document.querySelector('#' + this.CANVAS_ID);
		return canvas.getContext('2d');
	},
	IMG_PATH: {
		BG: 'res/bg.jpg',
		SHIP: 'res/ship.png',
		ENEMY: 'res/miturun.gif',
		ENEMY_DESTORY: 'res/mitucry.png',
		SHIP_BULLET: 'res/mc_rainbow.png',
		ENEMY_BULLET: 'res/mc_wr.png',
		GEILI: 'res/geili.png',
		YINHEN: 'res/yinhen.png'
	},
	ROLE: {
		SHIP: 1,
		ENEMY: 0
	},
	GAME_STATUS: {
		WAIT: 'wait',
		READY: 'ready',
		RUN: 'run',
		OVER: 'over'
	},
	EVENT_TYPE: {
		CLICK: 'click',
		KEY_DOWN: 'keydown',
		KEY_UP: 'keyup',
		KEY_PRESS: 'keypress',
		MOUSE_MOVE: 'mousemove',
		MOUSE_DOWN: 'mousedown',
		MOUSE_UP: 'mouseup'
	},
	KEY_CODE: {
		W: 119,
		S: 115,
		A: 97,
		D: 100,
		ENTER: 13,
		SPACE: 32,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40
	},
	START_TIME: null,
	END_TIME: null
};
/**
 * 游戏管理对象
 */
var gameMonitor = {
	width: 800,
	height: 500,
	gameTimer: null,
	checkTimer: null,
	bg: null,	//背景
	ship: null,	//飞船
	bulletArr: [],	//子弹s
	enemyArr: [],	//敌人s
	bgWidth: 800,
	bgHeight: 500,
	bgDistance: 0,	//背景位置
	bgSpeed: 1,
	bgLoop: 0,
	score: {
		beat: 0,
		distance: 0,
		elapse: 0,
		bulletGet: 0
	},
	im: imgMonitor(),
	status: CONFIG.GAME_STATUS.WAIT,
	gameTimer: null,
	init: function (ctx) {
		var me = this;
		//绘制游戏背景
		var bg = new Image();
		bg.onload = function () {
			ctx.drawImage(bg, 0, 0, me.bgWidth, me.bgHeight);
		}
		bg.src = CONFIG.IMG_PATH.BG;
		me.bg = bg;
		//创建游戏飞船
		var myShip = new ship(ctx);
		myShip.controll();
		me.ship = myShip;
		//绑定游戏事件
		me.bindEvents(ctx);
		me.status = CONFIG.GAME_STATUS.READY;
	},
	bindEvents: function (ctx) {
		var me = this;
		var $body = $(document.body);
		//enter键开始游戏
		$body.on(CONFIG.EVENT_TYPE.KEY_PRESS, function (e) {
			if (me.status === CONFIG.GAME_STATUS.RUN) {
				return;
			}
			if (e.keyCode === CONFIG.KEY_CODE.ENTER) {
				me.run(ctx);
				me.createEnemy(ctx);
				me.check();
				me.status = CONFIG.GAME_STATUS.RUN;
			}
		});

	},
	createEnemy: function (ctx) {
		var t = util.ranBetween(1000, 2000);
		var e = new enemy(ctx);
		e.autoAttack();
		this.addEnemy(e);
		setTimeout(function () {
			gameMonitor.createEnemy(ctx);
		}, t);
	},
	run: function (ctx) {
		ctx.clearRect(0, 0, this.width, this.height);
		//重绘背景
		this.bgRoll(ctx);
		//重绘ship
		this.ship.paint().detectHit();
		//重绘所有bullet
		for (var i = 0, ii = this.bulletArr.length; i < ii; i++) {
			var bullet = this.bulletArr[i];
			bullet.paint().move();
		}
		//重绘所有enemy
		for (var m = 0, mm = this.enemyArr.length; m < mm; m++) {
			var enemy = this.enemyArr[m];
			enemy.paint().move();
		}
		this.gameTimer = setTimeout(function () {
			gameMonitor.run(ctx);
		}, 1000 / 60);
	},
	stop: function (ctx) {
		clearTimeout(this.gameTimer);
		this.status = CONFIG.GAME_STATUS.OVER;
	},
	bgRoll: function (ctx) {
		if (this.bgDistance >= this.bgWidth) {
			this.bgLoop = 0;
		}
		this.bgDistance = ++this.bgLoop * this.bgSpeed;
		ctx.drawImage(this.bg, this.bgWidth - this.bgDistance, 0, this.bgWidth, this.bgHeight);
		ctx.drawImage(this.bg, -this.bgDistance, 0, this.bgWidth, this.bgHeight);
	},
	addBullet: function (bullet) {
		this.bulletArr.push(bullet);
	},
	addEnemy: function (enemy) {
		this.enemyArr.push(enemy);
	},
	//检查bullet数组和enemy数组，超过canvas边框的就踢出数组
	check: function () {
		//检查bullet数组
		for (var i = 0; i < this.bulletArr.length; i++) {
			var b = this.bulletArr[i];
			if (b.left < 0 || b.top < 0 || b.left > this.width || b.top > this.height) {
				b = null;
				this.bulletArr.splice(i, 1);
				i--;
			}
		}
		//检查enemy数组
		for (var m = 0; m < this.enemyArr.length; m++) {
			var e = this.enemyArr[m];
			//enemy是水平移动，所以只需判断宽度是否出界
			if (e.left < 0 || e.left > this.width) {
				e.destory();
				e = null;
				this.enemyArr.splice(m, 1);
				m--;
			}
		}
		this.checkTimer = setTimeout(function () {
			gameMonitor.check();
		}, 1000);
	}
}
/*********************** game start ********************************/
CONFIG.CANVAS_ID = 'gameStage';
var ctx = CONFIG.CANVAS_CTX();
//初始化游戏
gameMonitor.init(ctx);
