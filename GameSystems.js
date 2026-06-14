// ========== GameSystems ==========
// 매 프레임 실행할 시스템들을 등록하고 실행하는 관리자
class GameSystems {
  constructor() {
    this.systems = [];
  }

  // 시스템 등록 (update 메서드를 가진 객체)
  register(system) {
    if (system && typeof system.update === 'function') {
      this.systems.push(system);
    } else {
      console.warn('System must have an update(deltaTime) method');
    }
  }

  // 모든 시스템의 update를 순서대로 호출
  updateAll(deltaTime) {
    for (let system of this.systems) {
      system.update(deltaTime);
    }
  }

  // 시스템 제거
  unregister(system) {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
    }
  }
}

const gameSystems = new GameSystems();
