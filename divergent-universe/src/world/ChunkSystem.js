import { MainContinent } from './MainContinent.js';
import { IslandOne } from './IslandOne.js';
import { IslandTwo } from './IslandTwo.js';
import { IslandThree } from './IslandThree.js';
import { IslandFour } from './IslandFour.js';

export class ChunkSystem {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.init();
  }

  init() {
    this.mainContinent = new MainContinent(this.scene);
    this.islandOne = new IslandOne(this.scene);
    this.islandTwo = new IslandTwo(this.scene);
    this.islandThree = new IslandThree(this.scene);
    this.islandFour = new IslandFour(this.scene);

    this.chunks.push(this.mainContinent);
    this.chunks.push(this.islandOne);
    this.chunks.push(this.islandTwo);
    this.chunks.push(this.islandThree);
    this.chunks.push(this.islandFour);
  }

  getIslands() {
    return [this.islandOne, this.islandTwo, this.islandThree, this.islandFour];
  }

  update(deltaTime) {
    if (this.mainContinent.update) this.mainContinent.update(deltaTime);
    if (this.islandFour.update) this.islandFour.update(deltaTime);
  }
}
