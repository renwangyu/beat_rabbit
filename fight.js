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
	this.bulletCount = 2;
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
			if (b.role === CONFIG.ROLE.SHIP) {
				continue;
			}
			var hit = util.isHit(c1, {
				x: b.left + b.width / 2,
				y: b.top + b.height / 2,
				r: (b.width + b.height) / 4
			});
			if (hit) {
				this.hp -= b.weili;
				gameMonitor.bulletArr.splice(i, 1);
				i--;
				if(callback && typeof callback === 'function'){
					callback(this.hp);
				}
				if (this.hp <= 0) {
					this.destory();
					break;
				}
			}
		}
		return this;
	};
	this.detectRestore = function (callback) {
		var c1 = {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2,
			r: (this.width + this.height) / 4
		};
		for (var i = 0; i < gameMonitor.feedArr.length; i++) {
			var f = gameMonitor.feedArr[i];
			var hit = util.isHit(c1, {
				x: f.left + f.width / 2,
				y: f.top + f.height / 2,
				r: (f.width + f.height) / 4
			});
			if (hit) {
				this.hp += f.restore;
				this.hp = this.hp > 100 ? 100 : this.hp;
				gameMonitor.feedArr.splice(i, 1);
				i--;
				if(callback && typeof callback === 'function'){
					callback(this.hp);
				}
			}
		}
		return this;
	};
	this.detectAmmo = function (callback) {
		var c1 = {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2,
			r: (this.width + this.height) / 4
		};
		for (var i = 0; i < gameMonitor.ammoArr.length; i++) {
			var a = gameMonitor.ammoArr[i];
			var hit = util.isHit(c1, {
				x: a.left + a.width / 2,
				y: a.top + a.height / 2,
				r: (a.width + a.height) / 4
			});
			if (hit) {
				this.bulletCount += a.restore;
				gameMonitor.ammoArr.splice(i, 1);
				i--;
				if(callback && typeof callback === 'function'){
					callback(this.bulletCount);
				}
			}
		}
		return this;
	}
	this.destory = function () {
		console.error('ship has ben destory!!!!');
	};
	this.controll = function () {
		var $body = $(document.body);
		var me = this;
		//按下鼠标定位ship，并使ship可移动
		$body.on(CONFIG.EVENT_TYPE.MOUSE_DOWN, '#' + CONFIG.CANVAS_ID, function (e) {
			if (gameMonitor.status !== CONFIG.GAME_STATUS.RUN || me.hp <= 0) {
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
			if(!me.move || me.hp <= 0){
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
				if (me.bulletCount <= 0) {
					uiController.showDialog('哥，别点了，没子弹啦！省点用啊！');
				}
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
			if(me.bulletCount > 0){
				me.bulletCount--;
			}
			uiController.shipShot(me.bulletCount);

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
		if (this.hp > 0) {
			this.left -= 1 * this.speed;
			return this;
		}
	};
	this.autoAttack = function () {
		var t = util.ranBetween(1000, 3000);
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
	this.detectHit = function (callback) {
		var c1 = {
			x: this.left + this.width / 2,
			y: this.top + this.height / 2,
			r: (this.width + this.height) / 4
		};
		for (var i = 0; i < gameMonitor.bulletArr.length; i++) {
			var b = gameMonitor.bulletArr[i];
			if (b.role === CONFIG.ROLE.ENEMY) {
				continue;
			}
			var hit = util.isHit(c1, {
				x: b.left + b.width / 2,
				y: b.top + b.height / 2,
				r: (b.width + b.height) / 4
			});
			if (hit) {
				this.hp -= b.weili;
				gameMonitor.bulletArr.splice(i, 1);
				i--;
				if (callback && typeof callback === 'function') {
					callback();
				}
				if (this.hp <= 0) {
					this.destory();
					break;
				}
			}
		}
		return this;
	};
	this.destory = function () {
		if (this.hp < 0) {
			this.paint();
			setTimeout(function () {
				for (var i = 0, ii = gameMonitor.enemyArr.length; i < ii; i++) {
					if (gameMonitor.enemyArr[i] === this) {
						gameMonitor.enemyArr.splice(i, 1);
						break;
					}
				}
			}.bind(this), 250);
		}
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
 * 加血的补给
 */
function feed (ctx) {
	this._ctx = ctx;
	this.isMore = Math.random() < 0.2;
	this.width = this.isMore ? 60 : 50;
	this.height = this.isMore ? 60 : 50;
	this.left = gameMonitor.width;
	this.top = util.ranBetween(gameMonitor.height / 5, gameMonitor.height / 1.5);
	this.speed = this.isMore ? 3 : 2;
	this.restore = this.isMore ? 100 : 20;
	this.feedImg = gameMonitor.im.createImg(this.isMore ? CONFIG.IMG_PATH.MORE_CARROT : CONFIG.IMG_PATH.SINGLE_CARROT);
	this.paint = function () {
		this._ctx.drawImage(this.feedImg, this.left, this.top, this.width, this.height);
		return this;
	};
	this.move = function () {
		this.left -= 1 * this.speed;
		return this;
	};
	this.destory = function () {

	};
}
/**
 * 弹药的补给
 */
function ammo(ctx) {
	this._ctx = ctx;
	this.width = 80;
	this.height = 80;
	this.left = gameMonitor.width;
	this.top = util.ranBetween(gameMonitor.height / 5, gameMonitor.height / 1.5);
	this.speed = 3;
	this.restore = 5;
	this.ammoImg = gameMonitor.im.createImg(CONFIG.IMG_PATH.SHIP_BULLET);
	this.paint = function () {
		this._ctx.drawImage(this.ammoImg, this.left, this.top, this.width, this.height);
		return this;
	};
	this.move = function () {
		this.left -= 1 * this.speed;
		return this;
	};
	this.destory = function () {

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
		YINHEN: 'res/yinhen.png',
		SINGLE_CARROT: 'res/single_carrot.png',
		MORE_CARROT: 'res/more_carrot.png'
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
	DIALOG: [
		'宇宙霹雳无敌帅气聪明的<span style="color: red;">爆爆</span>，加油~',
		'<span style="color: red;">442574518</span>求包养啊。。。(┬＿┬)55555',
		'<span style="color: red;">爆爆</span>的飞船四不四很帅气~~',
		'绝对正品！戳！<br><a style="color:red;" target="blank" href="http://shop108155733.taobao.com/?spm=a230r.7195193.1997079397.2.HXy4wR">萌宝妈妈海淘小铺</a>',
		'丢屎你，米兔！叫你让我抢不到小米。。。',
		'来呀！(#‵ ′)凸',
		'单身，求勾引~ -。-',
		'跪求约会，躺求失身！',
		'绝对正品！戳！<br><a style="color:red;" target="blank" href="http://shop108155733.taobao.com/?spm=a230r.7195193.1997079397.2.HXy4wR">萌宝妈妈海淘小铺</a>',
		'骚连，好腻害！',
		'小心驾驶，记得保养哦~',
		'谁说<span style="color: red;">爆爆</span>不帅，我跟谁急！',
		'绝对正品！戳！<br><a style="color:red;" target="blank" href="http://shop108155733.taobao.com/?spm=a230r.7195193.1997079397.2.HXy4wR">萌宝妈妈海淘小铺</a>',
		'作者<span style="color: red;">爆爆</span>有点自恋，联系请谨慎！',
		'妹纸，约约约！！！'
	],
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
	feedArr: [],	//加血补给s
	ammoArr: [],	//子弹补给s
	bgWidth: 800,
	bgHeight: 500,
	bgDistance: 0,	//背景位置
	bgSpeed: 1,
	bgLoop: 0,
	score: {
		beat: 0,
		distance: 0,
		timePass: 0,
		bulletGet: 0,
		carrotGet: 0
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
				me.createCarrot(ctx);
				me.createAmmo(ctx);
				me.check();
				//ui初始化
				uiController.init();
				me.status = CONFIG.GAME_STATUS.RUN;
			}
		});
	},
	createEnemy: function (ctx) {
		var t = util.ranBetween(1000, 2000);
		var e = new enemy(ctx);
		e.autoAttack();
		setTimeout(function () {
			this.addEnemy(e);
			gameMonitor.createEnemy(ctx);
		}.bind(this), t);
	},
	createCarrot: function (ctx) {
		var t = util.ranBetween(4000, 6000);
		var f = new feed(ctx);
		setTimeout(function () {
			this.addFeed(f);
			this.createCarrot(ctx)
		}.bind(this), t);
	},
	createAmmo: function (ctx) {
		var t = util.ranBetween(8000,15000);
		var a = new ammo(ctx);
		setTimeout(function () {
			this.addAmmo(a);
			this.createAmmo(ctx)
		}.bind(this), t);
	},
	run: function (ctx) {
		ctx.clearRect(0, 0, this.width, this.height);
		//重绘背景
		this.bgRoll(ctx);
		//重绘ship
		this.ship.detectHit(uiController.shipHit)
				 .detectRestore(uiController.shipRestore)
				 .detectAmmo(uiController.shipAmmo)
				 .paint();
		//重绘所有bullet
		for (var i = 0, ii = this.bulletArr.length; i < ii; i++) {
			var bullet = this.bulletArr[i];
			bullet.paint().move();
		}
		//重绘所有enemy
		for (var m = 0, mm = this.enemyArr.length; m < mm; m++) {
			var enemy = this.enemyArr[m];
			enemy.detectHit().paint().move();
		}
		//重绘所有feed
		for (var n = 0, nn = this.feedArr.length; n < nn; n++) {
			var feed = this.feedArr[n];
			feed.paint().move();
		}
		//重绘所有ammo
		for (var x = 0, xx = this.ammoArr.length; x < xx; x++) {
			var ammo = this.ammoArr[x];
			ammo.paint().move();
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
	addFeed: function (feed) {
		this.feedArr.push(feed);
	},
	addAmmo: function (ammo) {
		this.ammoArr.push(ammo);
	},
	//检查bullet数组，enemy数组和carrot数组，超过canvas边框的就踢出数组
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
		//检查carrot数组
		for (var n = 0; n < this.feedArr.length; n++) {
			var f = this.feedArr[n];
			if (f.left < 0 || f.left > this.width) {
				f.destory();
				f = null;
				this.feedArr.splice(n, 1);
				n--;
			}
		}
		//检查ammo数组
		for (var x = 0; x < this.ammoArr.length; x++) {
			var a = this.ammoArr[x];
			if (x.left < 0 || x.left > this.width) {
				x.destory();
				x = null;
				this.ammoArr.splice(x, 1);
				x--;
			}
		}
		this.checkTimer = setTimeout(function () {
			gameMonitor.check();
		}, 1000);
	}
};
/**
 * 游戏UI控制对象
 */
var uiController = {
	dialogTimer: null,
	dialogCloseTimer: null,
	init: function () {
		this.dialogLoop();
		$('#bullet_num').text(gameMonitor.ship.bulletCount);
	},
	shipHit: function (hp) {
		$('.heart').addClass('pulse');
		setTimeout(function () {
			$('.heart').removeClass('pulse');
		}, 300);
		$('.curr-health').css('width', hp);
		if (hp < 30) {
			$('.curr-health').removeClass('well-status').removeClass('normal-status').addClass('danger-status');
		} else if (hp < 60) {
			$('.curr-health').removeClass('well-status').removeClass('danger-status').addClass('normal-status');
		} else {
			$('.curr-health').removeClass('danger-status').removeClass('normal-status').addClass('well-status');
		}
	},
	shipRestore: function (hp) {
		$('.curr-health').css('width', hp);
		if (hp < 30) {
			$('.curr-health').removeClass('well-status').removeClass('normal-status').addClass('danger-status');
		} else if (hp < 60) {
			$('.curr-health').removeClass('well-status').removeClass('danger-status').addClass('normal-status');
		} else {
			$('.curr-health').removeClass('danger-status').removeClass('normal-status').addClass('well-status');
		}
	},
	shipAmmo: function (num) {
		$('.myBullet').addClass('pulse');
		setTimeout(function () {
			$('.myBullet').removeClass('pulse');
		}, 300);
		$('#bullet_num').text(num);
	},
	shipShot: function (bulletCount) {
		$('#bullet_num').text(bulletCount);
		if (bulletCount === 0) {
			$('#bullet_num').css('color', '#FF0033');
		} else {
			$('#bullet_num').css('color', '#000');
		}
	},
	enemyHit: function () {

	},
	getBullet: function () {

	},
	dialogLoop: function () {
		this.showDialog();
		this.dialogTimer = setTimeout(function () {
			this.dialogLoop();
		}.bind(this), 5000);
	},
	showDialog: function (str) {
		clearTimeout(this.dialogTimer);
		if (str) {
			$('#talk>span').text(str);
			this.dialogTimer = setTimeout(function () {
				this.dialogLoop();
			}.bind(this), 5000);
		} else {
			var index = util.ranBetween(0, CONFIG.DIALOG.length - 1);
			$('#talk>span').html(CONFIG.DIALOG[index]);
		}
		$('#talk').show();
		this.dialogCloseTimer = setTimeout(function () {
			$('#talk').hide();
		}, 2000);
	}
}
/*********************** game start ********************************/
CONFIG.CANVAS_ID = 'game_stage';
var ctx = CONFIG.CANVAS_CTX();
//初始化游戏
gameMonitor.init(ctx);
// uiController.init();
