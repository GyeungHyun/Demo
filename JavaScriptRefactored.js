// ==========================================
// 1. InputManager - 모든 입력을 한곳에서 관리
// ==========================================
class InputManager {
  constructor() {
    this.downkeys = {
      KeyA: false,
      KeyS: false,
      KeyD: false,
      ShiftLeft: false,
      Space: false,
    };
    this.pressedkeys = {
      w: false,
    };
    this.mouse = {
      x: 0,
      y: 0,
    };

    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    if (this.downkeys.hasOwnProperty(e.code)) {
      if (e.code === "Space" && !this.downkeys["Space"]) {
        console.log("이새끼 문제는 아님");
        GameEvents.emit("spacePressed");
      }
      this.downkeys[e.code] = true;
      this.pressedkeys[e.code] = true;
    }
    // E 키 입력 (상호작용)
    if (e.code === "KeyE") {
      GameEvents.emit("interactPressed");
    }
  }

  handleKeyUp(e) {
    if (this.downkeys.hasOwnProperty(e.code)) {
      this.downkeys[e.code] = false;
      this.pressedkeys[e.code] = false;
      console.log(e.code + "떼짐");
    }
  }

  isKeyDown(key) {
    return this.downkeys[key] || false;
  }

  getMousePos() {
    return this.mouse;
  }

  setMousePos(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }
}

// ==========================================
// 2. GameEvents - 간단한 이벤트 시스템
// ==========================================
class GameEvents {
  static listeners = {};

  static on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  static emit(eventName, data = null) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((cb) => cb(data));
    }
  }
}

// ==========================================
// 3. GameWorld - 게임 객체 관리
// ==========================================
class GameWorld {
  constructor(gameFrame) {
    this.gameFrame = gameFrame;
    this.enemies = [];
    this.interactables = [];
    this.projectiles = [];
    this.effects = [];
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  addInteractable(interactable) {
    this.interactables.push(interactable);
  }

  addProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  getEnemies() {
    return this.enemies;
  }

  getInteractables() {
    return this.interactables;
  }

  getProjectiles() {
    return this.projectiles;
  }

  getEffects() {
    return this.effects;
  }
}

// ==========================================
// 4. GameSystems - 매 프레임 실행할 시스템 관리
// ==========================================
class GameSystems {
  constructor() {
    this.systems = [];
  }

  register(system) {
    this.systems.push(system);
  }

  updateAll(deltaTime) {
    this.systems.forEach((system) => {
      if (system.update) {
        system.update(deltaTime);
      }
    });
  }
}

// ==========================================
// 5. RenderSystems - 매 프레임 그릴 것 관리
// ==========================================
class RenderSystems {
  constructor() {
    this.renderers = [];
  }

  register(renderer) {
    this.renderers.push(renderer);
  }

  drawAll(ctx) {
    this.renderers.forEach((renderer) => {
      if (renderer.draw) {
        renderer.draw(ctx);
      }
    });
  }
}

// ==========================================
// 6. PlayerSystem - 플레이어 이동 및 상태 관리
// ==========================================
class PlayerSystem {
  constructor(playerElement, gameFrame, input) {
    this.player = playerElement;
    this.gameFrame = gameFrame;
    this.input = input;

    // 기존 플레이어 변수들
    this.playerRect = this.player.getBoundingClientRect();
    this.velocityX = 0;
    this.velocityY = 0;
    this.playerX = 20;
    this.playerY = 20;
    this.MoveSpeed = 100;
    this.MoveDamping = 0.85;
    this.currnetSpeedLimit = 150;
    this.walkSpeedLimit = 150;
    this.runMulitiplier = 1;
    this.runSpeedLimit = 300;
    this.totalForceX = 0;
    this.totalForceY = 0;
    this.playerMass = 0.2;

    // 경계값
    this.leftEnd = 0;
    this.rightEnd = this.gameFrame.clientWidth;
    this.topEnd = 0;
    this.bottomEnd = this.gameFrame.clientHeight;

    this.playerPos = {
      x: this.playerRect.left + this.player.offsetWidth / 2,
      y: this.playerRect.top + this.player.offsetHeight / 2,
    };
  }

  update(deltaTime) {
    this.totalForceX = 0;
    this.totalForceY = 0;

    this.checkDownKeys();
    this.applyGravity();
    this.calcForce(deltaTime);
    this.framing();
    this.updatePlayerPos();
  }

  checkDownKeys() {
    if (this.input.isKeyDown("ShiftLeft")) {
      this.runMulitiplier = 1.5;
      this.currnetSpeedLimit = this.runSpeedLimit;
    } else {
      this.runMulitiplier = 1;
      this.currnetSpeedLimit = this.walkSpeedLimit;
    }

    if (this.input.isKeyDown("KeyD")) {
      this.totalForceX += this.MoveSpeed * this.runMulitiplier;
    }

    if (this.input.isKeyDown("KeyA")) {
      this.totalForceX -= this.MoveSpeed * this.runMulitiplier;
    }

    if (!this.input.isKeyDown("KeyD") && !this.input.isKeyDown("KeyA")) {
      this.applyDamping();
    }
  }

  applyDamping() {
    this.velocityX = this.velocityX * this.MoveDamping;
    this.velocityY = this.velocityY * this.MoveDamping;
  }

  applyGravity() {
    this.totalForceY += 2500;
  }

  calcForce(deltaTime) {
    let accelerationX = this.totalForceX / this.playerMass;
    let accelerationY = this.totalForceY / this.playerMass;
    this.velocityX += accelerationX * deltaTime;
    this.velocityY += accelerationY * deltaTime;

    if (this.velocityX > this.currnetSpeedLimit) {
      this.velocityX = this.currnetSpeedLimit;
    } else if (this.velocityX < -this.currnetSpeedLimit) {
      this.velocityX = -this.currnetSpeedLimit;
    }

    this.playerX += this.velocityX * deltaTime;
    this.playerY += this.velocityY * deltaTime;
  }

  updatePlayerPos() {
    this.player.style.left = this.playerX + "px";
    this.player.style.top = this.playerY + "px";
  }

  framing() {
    if (this.playerX > this.rightEnd - this.player.offsetWidth) {
      this.playerX = this.rightEnd - this.player.offsetWidth;
    }
    if (this.playerX < this.leftEnd) {
      this.playerX = this.leftEnd;
    }
    if (this.playerY < this.topEnd) {
      this.playerY = this.topEnd;
    }
    if (this.playerY > this.bottomEnd - this.player.offsetHeight) {
      this.playerY = this.bottomEnd - this.player.offsetHeight;
      this.velocityY = 0;
    }
  }

  getPos() {
    return {
      x: this.playerX + this.player.offsetWidth / 2,
      y: this.playerY + this.player.offsetHeight / 2,
    };
  }

  getCenterX() {
    return this.playerX + this.player.offsetWidth / 2;
  }

  getCenterY() {
    return this.playerY + this.player.offsetHeight / 2;
  }
}

// ==========================================
// 7. AimSystem - 조준점 관리
// ==========================================
class AimSystem {
  constructor(canvas, gameFrame, playerSystem, input) {
    this.canvas = canvas;
    this.gameFrame = gameFrame;
    this.playerSystem = playerSystem;
    this.input = input;

    this.dot = null;
    this.accuracy = 0;
    this.range = 500;
    this.bulletDmg = 5;
    this.hitPosX = 0;
    this.hitPosY = 0;

    this.setupCanvasListener();
  }

  setupCanvasListener() {
    this.gameFrame.addEventListener("mousemove", (e) => {
      let rect = this.gameFrame.getBoundingClientRect();
      this.input.setMousePos(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.gameFrame.addEventListener("mousedown", (e) => {
      if (this.input.isKeyDown("Space")) {
        this.fire();
      }
    });

    GameEvents.on("spacePressed", () => {
      this.spawnDot();
    });
  }

  update(deltaTime) {
    this.followMouse();
    this.circleFraming();
  }

  spawnDot() {
    const radius = 120;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const mouse = this.input.getMousePos();

    this.dot = {
      x: mouse.x + Math.cos(angle) * distance,
      y: mouse.y + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      size: 6,
      spring: 0.01,
      damping: 0.9,
    };
  }

  followMouse() {
    if (!this.dot) return;

    const mouse = this.input.getMousePos();
    const dx = mouse.x - 6 - this.dot.x;
    const dy = mouse.y - 6 - this.dot.y;

    this.dot.vx += dx * this.dot.spring;
    this.dot.vy += dy * this.dot.spring;

    this.dot.vx += (Math.random() - 0.5) * this.accuracy;
    this.dot.vy += (Math.random() - 0.5) * this.accuracy;

    this.dot.vx *= this.dot.damping;
    this.dot.vy *= this.dot.damping;

    this.dot.x += this.dot.vx;
    this.dot.y += this.dot.vy;
  }

  circleFraming() {
    const playerPos = this.playerSystem.getPos();
    const mouse = this.input.getMousePos();

    const aimDistanceX = mouse.x - playerPos.x;
    const aimDistanceY = mouse.y - playerPos.y;
    let curDistance = magnitude(aimDistanceX, aimDistanceY);

    if (curDistance > this.range) {
      let playerToAim = normalize(aimDistanceX, aimDistanceY);
      this.input.setMousePos(
        playerPos.x + playerToAim.x * this.range,
        playerPos.y + playerToAim.y * this.range
      );
    }
  }

  fire() {
    if (!this.dot) return;
    this.hitPosX = this.dot.x;
    this.hitPosY = this.dot.y;
    GameEvents.emit("fire", { x: this.hitPosX, y: this.hitPosY });
  }

  getDot() {
    return this.dot;
  }

  getHitPos() {
    return { x: this.hitPosX, y: this.hitPosY };
  }

  isSpaceDown() {
    return this.input.isKeyDown("Space");
  }
}

// ==========================================
// 8. HitSystem - 피격 판정 처리
// ==========================================
class HitSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    GameEvents.on("fire", (data) => {
      this.handleFire(data);
    });
  }

  handleFire(data) {
    const { x, y } = data;
    this.gameWorld.getEnemies().forEach((enemy) => {
      enemy.hitCheck(x, y);
    });
  }
}

// ==========================================
// 9. InteractionSystem - 상호작용 처리
// ==========================================
class InteractionSystem {
  constructor(playerSystem, gameWorld, input) {
    this.playerSystem = playerSystem;
    this.gameWorld = gameWorld;
    this.input = input;
    this.currentInteractable = null;
    this.interactRange = 130;

    const interactionHint = document.getElementById("interactionHint");
    this.interactionHint = interactionHint;

    GameEvents.on("interactPressed", () => {
      this.tryInteract();
    });
  }

  update(deltaTime) {
    this.findNearestInteractable();
  }

  findNearestInteractable() {
    this.currentInteractable = null;
    const playerCenter = this.playerSystem.getPos();

    let closestDistance = Infinity;
    this.gameWorld.getInteractables().forEach((item) => {
      const center = item.center();
      const distance = getDistance(
        playerCenter.x,
        playerCenter.y,
        center.x,
        center.y
      );
      if (distance <= this.interactRange && distance < closestDistance) {
        closestDistance = distance;
        this.currentInteractable = item;
      }
    });

    this.updateInteractionHint();
  }

  updateInteractionHint() {
    if (!this.interactionHint) return;
    if (this.currentInteractable) {
      this.interactionHint.textContent =
        "E : " + this.currentInteractable.name + " 상호작용";
    } else {
      this.interactionHint.textContent = "";
    }
  }

  tryInteract() {
    if (this.currentInteractable) {
      this.currentInteractable.tryInteract();
    }
  }
}

// ==========================================
// 10. AimRenderer - 조준점 그리기
// ==========================================
class AimRenderer {
  constructor(aimSystem) {
    this.aimSystem = aimSystem;
  }

  draw(ctx) {
    const dot = this.aimSystem.getDot();

    if (dot && this.aimSystem.isSpaceDown()) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    }

    // 마우스 표시
    const mouse = this.aimSystem.input.getMousePos();
    ctx.beginPath();
    ctx.arc(mouse.x - 6, mouse.y - 6, 6, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();

    // 마지막 히트 위치 표시
    if (dot) {
      const hitPos = this.aimSystem.getHitPos();
      ctx.beginPath();
      ctx.arc(hitPos.x, hitPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "grey";
      ctx.fill();
    }
  }
}

// ==========================================
// 유틸리티 함수들 (기존 코드 유지)
// ==========================================
function magnitude(_x, _y) {
  if (Math.sqrt(_x * _x + _y * _y) == NaN) {
    console.log("caution");
  }
  return Math.sqrt(_x * _x + _y * _y);
}

function normalize(_x, _y) {
  let length = magnitude(_x, _y);

  return {
    x: _x / length,
    y: _y / length,
  };
}

function getDistance(x1, y1, x2, y2) {
  return magnitude(x1 - x2, y1 - y2);
}

// ==========================================
// 기존 Interactable 클래스 (그대로 유지)
// ==========================================
const interactableTypes = [
  {
    type: "door",
    name: "문",
    width: 100,
    height: 220,
    sprite: "",
    backgroundColor: "rgba(80, 80, 140, 0.95)",
    border: "2px solid #7f7fff",
    interaction: function () {
      console.log("door: 문이 열렸다.");
      this.root.style.backgroundColor = "rgba(100, 180, 220, 0.95)";
      this.root.textContent = "열림";
    },
  },
  {
    type: "chest",
    name: "보물상자",
    width: 120,
    height: 120,
    sprite: "",
    backgroundColor: "rgba(140, 100, 60, 0.95)",
    border: "2px solid #ffcc66",
    interaction: function () {
      console.log("chest: 아이템을 획득했다!");
      this.root.style.backgroundColor = "rgba(200, 160, 80, 0.95)";
      this.root.textContent = "획득!";
    },
  },
  {
    type: "save",
    name: "저장소",
    width: 140,
    height: 100,
    sprite: "",
    backgroundColor: "rgba(60, 120, 60, 0.95)",
    border: "2px solid #88ff88",
    interaction: function () {
      console.log("save: 게임이 저장되었습니다.");
      this.root.style.backgroundColor = "rgba(100, 200, 100, 0.95)";
      this.root.textContent = "저장됨";
    },
  },
];

function Interactable(_x, _y, _type) {
  const typeDefinition = interactableTypes.find((t) => t.type === _type);

  if (!typeDefinition) {
    console.error(`Interactable type "${_type}" not found!`);
    return;
  }

  this.x = _x;
  this.y = _y;
  this.width = typeDefinition.width;
  this.height = typeDefinition.height;
  this.type = _type;
  this.name = typeDefinition.name;
  this.sprite = typeDefinition.sprite;
  this.interaction = typeDefinition.interaction.bind(this);

  this.root = document.createElement("div");
  this.root.style.position = "absolute";
  this.root.style.left = this.x + "px";
  this.root.style.top = this.y + "px";
  this.root.style.width = this.width + "px";
  this.root.style.height = this.height + "px";
  this.root.style.display = "flex";
  this.root.style.justifyContent = "center";
  this.root.style.alignItems = "center";
  this.root.style.color = "white";
  this.root.style.fontSize = "14px";
  this.root.style.fontFamily = "Arial, sans-serif";
  this.root.style.textAlign = "center";
  this.root.style.borderRadius = "8px";
  this.root.style.boxSizing = "border-box";
  this.root.style.padding = "4px";
  this.root.style.pointerEvents = "none";
  this.root.style.zIndex = 5;

  if (this.sprite) {
    this.root.style.backgroundImage = `url('${this.sprite}')`;
    this.root.style.backgroundSize = "cover";
    this.root.style.backgroundPosition = "center";
  } else {
    this.root.style.backgroundColor = typeDefinition.backgroundColor;
    this.root.style.border = typeDefinition.border;
  }

  this.root.textContent = this.name;

  this.center = function () {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  };

  this.tryInteract = function () {
    if (this.interaction) {
      this.interaction();
    }
  };
}

// ==========================================
// 기존 SpawnEnemy 클래스 (그대로 유지)
// ==========================================
function SpawnEnemy(_width, _height, _left, _hp, gameFrame) {
  this.gameFrame = gameFrame;
  this.root = document.createElement("div");
  gameFrame.appendChild(this.root);
  this.root.style.width = _width + "px";
  this.root.style.height = _height + "px";
  this.root.style.left = _left + "px";
  this.root.style.zIndex = 1;
  this.root.style.top =
    gameFrame.clientHeight - this.root.offsetHeight + "px";
  this.root.style.position = "absolute";
  this.root.style.backgroundColor = "red";
  this.root.style.border = "5px solid yellow";
  this.root.style.borderRadius = "64px";

  this.hp = _hp;
  this.isActive = true;
  this.bulletDmg = 5;

  this.hitCheck = function (_posX, _posY) {
    if (this.isActive) {
      if (
        _posX > this.root.offsetLeft &&
        _posX < this.root.offsetLeft + this.root.offsetWidth
      ) {
        if (
          _posY > this.root.offsetTop &&
          _posY < this.root.offsetTop + this.root.offsetHeight
        ) {
          this.hp -= this.bulletDmg;
          console.log("명중! 남은체력 : " + this.hp);
          if (this.hp <= 0) {
            console.log("죽음");
            this.dead();
          }
        }
      }
    }
  };

  this.dead = function () {
    this.isActive = false;
    this.root.removeAttribute("style");
  };
}

// ==========================================
// 게임 초기화 및 실행
// ==========================================
let gameFrame = document.getElementById("gameFrame");
let Player = document.getElementById("player");
let canvas = document.getElementById("canvas");
canvas.style.zIndex = 10;
canvas.width = gameFrame.clientWidth;
canvas.height = gameFrame.clientHeight;
const ctx = canvas.getContext("2d");

// 시스템 초기화
const input = new InputManager();
const gameWorld = new GameWorld(gameFrame);
const gameSystems = new GameSystems();
const renderSystems = new RenderSystems();

// 플레이어 시스템
const playerSystem = new PlayerSystem(Player, gameFrame, input);
gameSystems.register(playerSystem);

// 조준 시스템
const aimSystem = new AimSystem(canvas, gameFrame, playerSystem, input);
gameSystems.register(aimSystem);

// 피격 시스템
const hitSystem = new HitSystem(gameWorld);

// 상호작용 시스템
const interactionSystem = new InteractionSystem(
  playerSystem,
  gameWorld,
  input
);
gameSystems.register(interactionSystem);

// 렌더러 등록
const aimRenderer = new AimRenderer(aimSystem);
renderSystems.register(aimRenderer);

// 초기 게임 객체 생성
function initializeGameWorld() {
  gameWorld.addEnemy(
    new SpawnEnemy(100, 200, 1000, 30, gameFrame)
  );

  gameFrame.appendChild(Player);
  gameFrame.appendChild(canvas);

  const bottomEnd = gameFrame.clientHeight;
  gameWorld.addInteractable(new Interactable(280, bottomEnd - 220, "door"));
  gameWorld.addInteractable(
    new Interactable(520, bottomEnd - 120, "chest")
  );
  gameWorld.addInteractable(new Interactable(780, bottomEnd - 100, "save"));

  gameWorld.getInteractables().forEach((interactable) => {
    gameFrame.appendChild(interactable.root);
  });
}

initializeGameWorld();

// ==========================================
// 메인 게임 루프
// ==========================================
let lastTime = performance.now();

function gameLoop(currentTime) {
  let deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // 업데이트 단계
  gameSystems.updateAll(deltaTime);

  // 렌더링 단계
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderSystems.drawAll(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

console.log("게임 시작!");
