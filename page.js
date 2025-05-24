// Copyright (C) 2024 5TH Cell Media, LLC.
// @ts-nocheck

class Player {
  camPosX = 0;
  camPosY = 0;

  velocityValX = 3.5;
  velocityValY = 2;
  playerTileIndex;

  velocity = new Vector(0, 0);
  previousVelocity = new Vector(0, 0);
  gravity = 0.2;
  canMoveRight = true;
  canMoveLeft = true;
  cachedPlayerPos = undefined; //{ r: 0, c: 0, ptX: 0, ptY: 0 };
  cachedPlayerData = { vx: 0, vy: 0, sox: 0, soy: 0 };
  cachedForLeavingPlay = false;
  holeRadius = 1000;
  activePortals = [];

  inputState = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    //For Testing
    moveUp: false,
    moveDown: false,
  };

  previousInputState = {
    moveLeft: false,
    moveRight: false,
    jump: false,
  };

  colliderPadding = {
    top: 0,
    bot: 30,
    left: 5,
    right: 5,
  };

  colliderWidth = 6;
  colliderBottom = 16;
  colliderTop = 40;
  ignoreVerticalCollision = false;

  showPlayer = true;
  facingRight = true;
  isMoving = false;
  isGrounded = false;
  isFalling = false;
  hasJumped = true;
  isTeleported = false;
  doneTeleporting = true;
  portalInitialOffset = { x: 0, y: 0 }
  startPauseTimeStamp;
  outPauseTimeStamp;
  posDifForGhostX = 0;
  posDifForGhostY = 0;
  goalTileIndex;
  isDead = false;
  goalReached = false;

  constructor(x, y, facingRight) {
    //console.log('Player Constructor');
    this.worldPosX = x;
    this.worldPosY = y;
    //console.log('Player World Pos:' + this.worldPosY);
    this.facingRight = facingRight;
    this.boundRight = map.mapWidth * 0.5;
    this.boundLeft = -(map.mapWidth * 0.5);
    this.boundBot = map.mapHeight * 0.5 - (map.scaled_size * map.groundTileCount) / zoom;
    if (this.worldPosY >= this.boundBot) {
      this.worldPosY = this.boundBot;
      debugLog('Player World Pos Bounded:' + this.worldPosY);
    }

    this.boundTop = -(map.mapHeight * 0.5) + map.scaled_size;
    this.deathZ = map.mapHeight * 0.5 - (map.scaled_size * map.groundTileCount) / zoom + 200;
    this.isResettingPosition = false;
    this.animationState = 'Idle';
    this.animator = new Animator(this, playerAnimConfig, this.animationState, viewport);

    //this.pathManager = new PathManager();
  }

  onLoadNewPortion(facingRight, worldPositionOffset) {
    if (isNaN(worldPositionOffset.x)) {
      worldPositionOffset.x = 0;
      debugLog("!!INFO: Pos Bdefore Is Nan")
    }

    if (isNaN(worldPositionOffset.y)) {
      worldPositionOffset.y = 0;
      debugLog("!!INFO: Pos Bdefore Is Nan")
    }

    viewport.streamOffsetY = viewport.streamOffsetY - worldPositionOffset.y;
    if (viewport.streamOffsetY < 0) {
      console.log("!!ERROR: Attempting to shift paralax below zero");
      viewport.streamOffsetY = 0;
    }
    viewport.streamOffsetX = viewport.streamOffsetX - worldPositionOffset.x;
    debugLog("Shifting StreamOffset:", viewport.streamOffsetX, viewport.streamOffsetY);
  
    this.posDifForGhostX += worldPositionOffset.x;
    this.posDifForGhostY += worldPositionOffset.y;
    this.facingRight = facingRight;
  }

  isTileName(Id, Name) {
    return Id == map.tileNameToId[Name];
  }

  isTileNotId(Id, Name) {
    return !this.isTileName(Id, Name);
  }

  isTileBuildingBackground(Id) {
    if (Id >= map.tileNameToId.BWall1 && Id <= map.tileNameToId.BGate_Bot && Id !== map.tileNameToId.BGate_Top) {
      return true;
    }

    return false;
  }

  isTileBuildingTopType(Id) {
    if (Id >= map.tileNameToId.BWall_Top1 && Id <= map.tileNameToId.BWall_Top4) {
      return true;
    }

    if (Id === map.tileNameToId.BGate_Top) {
      return true;
    }

    return false;
  }

  isTileNoCollidsionObjectType(Id) {
    return map.isKeyId(Id) || this.isTileName(Id, 'BlockSpike') || this.isTileName(Id, 'BlockPortal') || this.isTileName(Id, 'Flag');
  }

  isTileCollidable(Id) {
    return !this.isTileBuildingBackground(Id) && !this.isTileNoCollidsionObjectType(Id) && !this.isTileName(Id, 'Bomb');
  }

  isTileIndexCollidable(index) {
    if (map.tileData[index]) {
      return this.isTileCollidable(map.tileData[index].tileType);
    }

    return true;
  }

  isTileCollidableHorizontal(Id) {
    if (this.isTileName(Id, 'BlockLadder')) {
      return false;
    }

    if (this.isTileBuildingTopType(Id)) {
      return false;
    }

    return this.isTileCollidable(Id);
  }

  isTileDataLadderCollision(TileData, TileAboveIndex) {
    if (this.isTileName(TileData.tileType, 'BlockLadder')) {
      return true;
    }

    const tileAboveType = map.tileData[TileAboveIndex].tileType;
    if (this.isTileName(tileAboveType, 'BlockLadder')) {
      return true;
    }

    return false;
  }

  clampWorldPosition() {
    if (this.isDead || game.isRestarting) {
      return;
    }

    let positionClamped = false;
    let currentBoundRight = this.boundRight;
    //console.log(`currentBoundRight = ${currentBoundRight}`);

    if (!this.showPlayer) {
      currentBoundRight -= viewport.w * 0.5;
    } else {
      currentBoundRight -= map.tile_size;
    }

    if (this.worldPosX > currentBoundRight) {
      this.worldPosX = currentBoundRight;
      positionClamped = true;
    }

    let currentBoundLeft = this.boundLeft;
    if (!this.showPlayer) {
      currentBoundLeft += viewport.w * 0.5;
    }

    if (this.worldPosX < currentBoundLeft) {
      this.worldPosX = currentBoundLeft;
      positionClamped = true;
    }

    // Clamp Y
    if (this.worldPosY >= this.boundBot) {
      //console.log("worldPosY Cap Bot:"+this.boundBot)
      this.worldPosY = this.boundBot;
      this.velocity.y = 0;
      positionClamped = true;

      if (this.velocity.x === 0 && this.isGrounded === false && this.showPlayer) {
        this.landOnGround(null);
      }
    } else {
      //console.log("worldPosY NoCap:"+this.worldPosY)
    }

    if (this.worldPosY < this.boundTop) {
      this.worldPosY = this.boundTop;
      //console.log("worldPosY Cap Top:"+this.boundTop)
      positionClamped = true;
    }
  }

  update(dt, now) {
    //console.log('player-update')
    //console.log(`game.currentMode = ${game.currentMode}`);
    if (game.currentMode == 'None' || (this.isTeleported && !this.doneTeleporting)) {
      //console.log('player update return');
      return;
    }

    if (this.goalReached || this.isDead) {
      this.drawPlayer(dt);
      stopRecordingGhostData();
      return;
    }

    //console.log(`playerTileIndex = ${this.playerTileIndex}`);
    const targetFramerate = 1000 / 60;
    const frameRatePercent = dt / targetFramerate;
    this.drawPlayer(dt);

    // Global controls, Edit Mode and Play Mode
    if (!this.isDead && this.inputState.moveLeft != this.inputState.moveRight) {
      if (this.inputState.moveLeft === true) {
        if (this.canMoveLeft && this.isLaunched === false) {
          this.velocity.x = -this.velocityValX;
        }
        this.facingRight = false;
      }

      if (this.inputState.moveRight === true) {
        if (this.canMoveRight && this.isLaunched === false) {
          this.velocity.x = this.velocityValX;
        }
        this.facingRight = true;
      }
    }

    if (!this.showPlayer) {
      if (this.pauseForwardVelocity) { 
        this.velocity.x = 0;
      } else {
        this.worldPosX += this.velocity.x * frameRatePercent;
        //console.log(`player worldPosX = ${this.worldPosX} velocity.x = ${this.velocity.x}`);
        this.worldPosY += this.velocity.y * frameRatePercent;
      }
      this.clampWorldPosition();
      return; // Early Out For Edit Mode
    }

    // Additional Play Mode Movement
    const startingVelX = this.velocity.x;
    const startingVelY = this.velocity.y;
    if (this.pauseForwardVelocity) {
      this.worldPosDiffX = 0;
      this.velocity.x = 0;
    } else {
      this.worldPosDiffX = startingVelX * frameRatePercent;
    }
    this.worldPosDiffY = startingVelY * frameRatePercent;
    this.worldPosX = this.worldPosX + this.worldPosDiffX;
    this.worldPosY = this.worldPosY + this.worldPosDiffY;

    this.isFalling = this.worldPosDiffY > 0;
    if (this.isFalling) {
      this.animationState = 'Fall';
    }

    // Clamp positions within the canvas
    this.clampWorldPosition();
    if (!buffering) {
      this.playerCollisionCalculations();
    }

    // Apply Gravity If Not Grounded
    if (game.currentMode == 'Edit' || (!this.isDead && (this.worldPosY + this.velocity.y >= this.boundBot || this.isGrounded))) {
      this.velocity.y = 0;
    } else {
      if (this.velocity.y <= 0) {
        // Higher gravity while jumping up
        this.velocity.y += this.gravity * 2 * frameRatePercent;
      } else {
        // Less gravity on fall
        this.velocity.y += this.gravity * frameRatePercent;
      }
    }

    // Terminal Velocity
    this.velocity.y = Math.max(-7.5, Math.min(this.velocity.y, 5));
    //if (this.velocity.y >= 0) {
    //  this.isLaunched = false;
    //}

    // Update animations
    if (this.isGrounded === true) {
      if (startingVelX != 0 && this.velocity.x != 0) {
        const manualMove = this.inputState.moveRight !== false || this.inputState.moveLeft !== false;
        if (this.velocity.y === 0 && manualMove) {
          this.animationState = 'Move';
        } else {
          this.animationState = 'Idle';
        }
      } else {
        this.animationState = 'Idle';
      }

      this.animator.changeAnimationState(this.animationState);
    }

    // Now that player position is finalized, update camera and ghost recording
    viewport.scrollTo(this.worldPosX, this.worldPosY, game.currentMode);

    this.updatePlayerCamPos();

    this.updatePlayerTileIndex();
    //console.log(`recordingPlayerGhostData= ${recordingPlayerGhostData}`);
    if (recordingPlayerGhostData) {
      if (game.currentMode !== 'Edit' || !inZoomOutMode) {
        //console.log(`this.worldPosX = ${this.worldPosX} this.posDifForGhostX = ${this.posDifForGhostX}`);
        this.recordPlayerGhostData((this.worldPosX + this.posDifForGhostX).toFixed(2), (this.worldPosY + this.posDifForGhostY).toFixed(2), now);
        //console.log(`recordPlayerGhostData this.worldPosY = ${this.worldPosY}`);
        //this.recordPlayerGhostData((this.worldPosX + this.posDifForGhostX).toFixed(2), (this.worldPosY + this.posDifForGhostY).toFixed(2), now);
      } else if (this.startPauseTimeStamp == undefined) {
        this.startPauseTimeStamp = now;
      }
    } else {
      this.outPauseTimeStamp = undefined;
      this.posDifForGhostX = 0;
      this.posDifForGhostY = 0;
    }
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  addActiveTeleport(tileData) {
    this.activePortals.push(tileData);
  }

  changePortalImage(tileData) {
    let tile = map.getTile(tileData);
    if (tile) {
      tile.changeTileImage(false, true);
    }

    const targetPortalRedisTarget = {
      redisDataRow: tileData.extraData.rowTarget,
      redisDataColumn: tileData.extraData.colTarget,
    };
    
    tile = map.getTile(targetPortalRedisTarget);
    if (tile) {
      tile.changeTileImage(false, true);
    } else {
      console.log('!!ERROR: Could not find target portal - addActiveTeleport')
    }
  }

  removeActiveTeleport(tileData) {
    let tileDataIndex = this.getActiveTeleportIndex(tileData);
    if (tileDataIndex >= 0) {
      this.activePortals.splice(tileDataIndex, 1);
      this.changePortalImage(tileData);
    } else {
      console.log("!!ERROR: Portal not found in active list?");
      console.log(tileData);
    }
  }

  getActiveTeleportIndex(tileDataToCheck) {
    if (tileDataToCheck['extraData']) {
      const uniqueId = tileDataToCheck['extraData']['uid'];
      for (let activeIndex in this.activePortals) {
        let activeTileData = this.activePortals[activeIndex];
        if (activeTileData['extraData']) {
          if (uniqueId == activeTileData['extraData']['uid']) {
            return activeIndex;
          }
        }
      }
    }

    return -1;
  }

  isActiveTeleport(tileDataToCheck) {
    const activeIndex = this.getActiveTeleportIndex(tileDataToCheck);
    if (activeIndex >= 0) {
      return true;
    }

    return false;
  }

  checkForObjectCollision(colidedTileIndex) {
    if (zoom != 1) {
      return;
    }

    const targetTileData = map.tileData[colidedTileIndex];

    // Check entire player collider box
    const leftOfPlayer = this.worldPosX + this.colliderWidth;
    const rightOfPlayer = this.worldPosX - this.colliderWidth;
    const bottomOfPlayer = this.worldPosY - this.colliderBottom;
    const topOfPlayer = this.worldPosY - this.colliderTop;

    let tilesToCheck = [];
    tilesToCheck.push(map.getTileIndexByPos(leftOfPlayer, bottomOfPlayer));
    tilesToCheck.push(map.getTileIndexByPos(rightOfPlayer, bottomOfPlayer));
    tilesToCheck.push(map.getTileIndexByPos(leftOfPlayer, topOfPlayer));
    tilesToCheck.push(map.getTileIndexByPos(rightOfPlayer, topOfPlayer));

    let foundTeleport = false;
    tilesToCheck.forEach((tileIndexToCheck) => {
      const tileDataToCheck = map.tileData[tileIndexToCheck];
      if (tileDataToCheck) {
        switch (tileDataToCheck.tileType) {
          case map.tileNameToId.BlockPortal: //Teleport
            foundTeleport = true;
            const activeTeleport = this.isActiveTeleport(tileDataToCheck);
            if (tileDataToCheck.extraData !== undefined && !this.isTeleported && !activeTeleport) {
              //console.log("Collided With Portal");
              //console.log("PLayer Pos:", this.worldPosX, this.worldPosY);
              // Move Player To Target
              this.isTeleported = true;
              this.doneTeleporting = false;
              this.portalInitialOffset = {
                x: tileDataToCheck.worldPosX - this.worldPosX, 
                y: tileDataToCheck.worldPosY - this.worldPosY
              }
              renderNextMapPortion(true, tileDataToCheck);
              game.playAudioIndex('sfxPortal', 5);
              map.addAnimation({
                tileData: tileDataToCheck,
                imageList: [blockPortalImg1, blockPortalImg2, blockPortalImg3],
                displayTime: [0, 100, 200],
                animationLength: 300,
              });
              
              this.addActiveTeleport(tileDataToCheck);
              setTimeout(function(){
                player.removeActiveTeleport(tileDataToCheck);
              }, 2000); //delay is in milliseconds 
            }
            break;
          case map.tileNameToId.BlockSign: // Sign
            if (targetTileData.extraData !== undefined) {
              map.addWorldObject(targetTileData);
            }
            break;
          case map.tileNameToId.BlockSpike:
            //console.log("FOUND SPIKE")
            //kill
            if (tileDataToCheck.worldPosX != undefined && tileDataToCheck.worldPosY != undefined) {
              //console.log("Collided With SPIKE", tileDataToCheck.worldPosX, tileDataToCheck.worldPosY);
              //console.log("PLayer Pos:", this.worldPosX, this.worldPosY);
              const playerCenterY = (bottomOfPlayer - topOfPlayer) * 0.5 + topOfPlayer;
              const dist = this.getDistance(tileDataToCheck.worldPosX, tileDataToCheck.worldPosY, this.worldPosX, playerCenterY);
              if (dist < 20) {
                this.onPlayerDeath();
              }
            } else {
              console.log('!!ERROR: Spike Without World Position:', tileDataToCheck.tileIndex);
              //this.onPlayerDeath();
            }
            break;
          case map.tileNameToId.BlockGoal:
            this.onGoalReached(tileIndexToCheck);
            break;
          case map.tileNameToId.BlockKey: //Key
          case map.tileNameToId.BlockKey2:
          case map.tileNameToId.BlockKey3:
            const keyCount = map.tileTypeToKeyValue[targetTileData.tileType];

            map.tileDataLocalUpdate(targetTileData, 0, '');
            map.tileDataRedisUpdate(targetTileData, 0, {});
            const tilePos = `${targetTileData.redisDataRow},${targetTileData.redisDataColumn}`;
            const foundCollectedKeyData = userInfo.collectedKeysData.find((keyData) => keyData.keyPos === tilePos);
            if (foundCollectedKeyData) {
              foundCollectedKeyData.lastCollectTime = Date.now();
            } else {
              //const tmpCollectedKeysData = new CollectedKeysData(tilePos, Date.now());
              // if (!userInfo.collectedKeysData) userInfo.collectedKeysData = [{ tmpCollectedKeysData }];
              // else
              //userInfo.collectedKeysData.push(tmpCollectedKeysData);
              userInfo.collectedKeysData.push(new CollectedKeysData(tilePos, Date.now()));
            }

            userInfo.collectedKeys += keyCount;
            redisFrontendServices.collectKey(keyCount);
            game.playAudioIndex('sfxKey', 5);
            map.addAnimation({
              tileData: targetTileData,
              imageList: [blockKeyCollectImg1, blockKeyCollectImg2, blockKeyCollectImg3],
              displayTime: [0, 100, 200],
              animationLength: 300,
            });
        }
      }
    });

    /*if (foundTeleport == false) {
      if (this.isTeleported && this.doneTeleporting) {
        this.isTeleported = false;
        console.log("teportedDone = checkForObjectCollision")
      }
    }*/
  }

  recordPlayerGhostData(posX, posY, now) {
    if (initialGhostDataTimestamp === null) {
      initialGhostDataTimestamp = now;
    }

    let recordeTimeStamp = now - initialGhostDataTimestamp;

    if (this.startPauseTimeStamp !== undefined) {
      const tmpOutTime = now - this.startPauseTimeStamp;
      if (this.outPauseTimeStamp == undefined) {
        this.outPauseTimeStamp = tmpOutTime;
      } else {
        this.outPauseTimeStamp += tmpOutTime;
      }
    }
    if (this.outPauseTimeStamp !== undefined) {
      recordeTimeStamp = now - this.outPauseTimeStamp - initialGhostDataTimestamp;
      this.startPauseTimeStamp = undefined;
    }
    //console.log(`posX = ${posX} posY = ${posY}`);
    playerGhostData.dataArray.push({
      tS: recordeTimeStamp,
      pX: posX,
      pY: posY,
      aS: this.animationState,
      fR: this.facingRight,
    });
  }

  updatePlayerCamPos() {
    this.camPosY = this.worldPosY - viewport.worldPosY;
  }

  updatePlayerTileIndex() {
    //console.log(`player worldPosX = ${this.worldPosX} player worldPosY = ${this.worldPosY}`);
    this.playerTileIndex = map.getTileIndexByPos(this.worldPosX, this.worldPosY);
    //console.log(`player playerTileIndex = ${this.playerTileIndex}`);
  }

  snapToCollision(tileData) {
    // Snap player to tile collision position
    if (tileData) {
      this.worldPosY = tileData.worldPosY + tileData.colliderH;
    }
  }

  landOnGround(tileData) {
    // Transition to ground state if need be
    if (this.isGrounded === false) {
      this.animationState = 'Idle';
      this.animator.changeAnimationState(this.animationState);
      this.isGrounded = true;
      this.isLaunched = false;
    }

    if (this.inputState.moveRight === false && this.inputState.moveLeft === false) {
      // Ground friction
      this.velocity.x -= this.velocity.x / 2;
      if (Math.abs(this.velocity.x) < 0.5) {
        this.velocity.x = 0;
        this.animationState = 'Idle';
        this.animator.changeAnimationState(this.animationState);
      }
    }

    this.snapToCollision(tileData);
    this.velocity.y = 0;
    this.hasJumped = false;
  }

  leaveTheGround(tileData) {
    this.snapToCollision(tileData);
    this.animationState = 'Jump';
    this.animator.changeAnimationState(this.animationState);
    this.isGrounded = false;
  }

  collidePositionVertical(worldX, worldY, worldDiffY) {
    const tileIndex = map.getTileIndexByPos(worldX, worldY);
    const tileData = map.tileData[tileIndex];
    const tileAboveIndex = map.getTileNeighborIndex(tileIndex, map.directions.UP);
    if (tileData === undefined) {
      return;
    }

    if (this.isTileDataLadderCollision(tileData, tileAboveIndex)) {
      if (map.tileData.hasOwnProperty(tileAboveIndex) && !this.isTileCollidable(map.tileData[tileAboveIndex].tileType)) {
        // Top of the ladder, normal ground
        this.landOnGround(tileData);
      } else {
        // Go up
        this.velocity.y = -4;
        this.isGrounded = false;
      }
    } else if (
      this.isTileCollidable(tileData.tileType) &&
      map.tileData.hasOwnProperty(tileAboveIndex) &&
      !this.isTileCollidableHorizontal(map.tileData[tileAboveIndex].tileType) &&
      worldY >= tileData.worldPosY + tileData.colliderH &&
      worldY - worldDiffY <= tileData.worldPosY + tileData.colliderH
    ) {
      // If we are collding with a tile that is empty above

      // React based on tile type
      if (this.isTileName(tileData.tileType, 'BlockSpring') && this.velocity.y >= 0) {
        // Spring Tile Reaction
        this.velocity.y = -9;
        this.leaveTheGround(tileData);
        this.startingJump = true;
        this.isLaunched = false;

        game.playAudioIndex('sfxSpring', 6);
        map.addAnimation({
          tileData: tileData,
          imageList: [blockSpringImg2],
          displayTime: [0],
          animationLength: 100,
        });
      } else if (this.isTileName(tileData.tileType, 'BlockBumper') && this.velocity.y >= 0) {
        // Bumper Tile Reaction
        this.snapToCollision(tileData);
        this.velocity.y = -8;
        this.leaveTheGround(tileData);
        this.startingJump = true;
        this.isLaunched = true;
        game.playAudioIndex('sfxSpring', 4);

        // Determine horizontal velocity
        const tileLeftIndex = map.getTileNeighborIndex(tileIndex, map.directions.LEFT);
        const tileRightIndex = map.getTileNeighborIndex(tileIndex, map.directions.RIGHT);
        const leftIsCollidable = this.isTileIndexCollidable(tileLeftIndex);
        const rightIsCollidable = this.isTileIndexCollidable(tileRightIndex);

        if (leftIsCollidable || rightIsCollidable) {
          // Bounce in direction player is facing
          if (this.facingRight) {
            this.velocity.x = 3;
          } else if (this.facingRight === false) {
            this.velocity.x = -3;
          }
          // Else bounce backwards
        } else if (tileData.worldPosX > this.worldPosX) {
          this.velocity.x = -3;
        } else {
          this.velocity.x = 3;
        }
      } else if (this.isTileName(tileData.tileType, 'BlockIce')) {
        // Ice Tile Reaction
        if (this.facingRight) {
          this.velocity.x = 5;
        } else if (this.facingRight === false) {
          this.velocity.x = -5;
        }
        this.landOnGround(tileData);
      } else {
        // Default tile reaction
        if (this.ignoreVerticalCollision === false) {
          this.landOnGround(tileData);
        } else {
          this.leaveTheGround();
        }
      }
    } else if (worldY < this.boundBot) {
      this.leaveTheGround();
      this.ignoreVerticalCollision = false;
    }
  }

  collidePositionHorrizontal(worldX, worldY, worldDiffX) {
    //console.log("WorldX:"+worldX+" WorldDiff:"+worldDiffX);

    let collidedTileData = null;
    const colliderBuffer = 0.5;

    if (worldDiffX > 0) {
      // Moving Right
      const colliderRight = worldX + this.colliderWidth;
      const tileIndexRight = map.getTileIndexByPos(colliderRight, worldY);
      const tileDataRight = map.tileData[tileIndexRight];
      if (tileDataRight === undefined) {
        return;
      }

      const tileIsCollidable = tileIndexRight !== null && tileDataRight !== null && this.isTileCollidableHorizontal(tileDataRight.tileType);
      const tileLeftIndex = map.getTileNeighborIndex(tileIndexRight, map.directions.LEFT);
      const tileLeftIsEmpty = map.tileData.hasOwnProperty(tileLeftIndex) && !this.isTileCollidableHorizontal(map.tileData[tileLeftIndex].tileType);
      //const tileDownIndex = map.getTileNeighborIndex(tileIndexRight, map.directions.DOWN);
      //const tileDownIsEmpty = map.tileData.hasOwnProperty(tileDownIndex) && !this.isTileCollidableHorizontal(map.tileData[tileDownIndex].tileType);

      if (tileIsCollidable) {
        // && (tileLeftIsEmpty || !tileDownIsEmpty)) {
        const tileLeftSide = tileDataRight.worldPosX - tileDataRight.colliderHalfW;
        if (colliderRight >= tileLeftSide && colliderRight - worldDiffX <= tileLeftSide) {
          // Stop player moving right
          this.worldPosX = tileLeftSide - this.colliderWidth - colliderBuffer;
          this.canMoveRight = false;
          if (this.velocity.x > 0) {
            this.velocity.x = 3;
            collidedTileData = tileDataRight;
          }
        }
      }
    } else if (worldDiffX < 0) {
      // Moving Left
      const colliderLeft = worldX - this.colliderWidth;
      const tileIndexLeft = map.getTileIndexByPos(colliderLeft, worldY);
      const tileDataLeft = map.tileData[tileIndexLeft];
      if (tileDataLeft === undefined) {
        return;
      }

      const tileIsCollidable = tileIndexLeft !== null && tileDataLeft !== null && this.isTileCollidableHorizontal(tileDataLeft.tileType);
      const tileRightIndex = map.getTileNeighborIndex(tileIndexLeft, map.directions.RIGHT);
      const tileRightIsEmpty = map.tileData.hasOwnProperty(tileRightIndex) && !this.isTileCollidableHorizontal(map.tileData[tileRightIndex].tileType);
      //const tileDownIndex = map.getTileNeighborIndex(tileIndexLeft, map.directions.DOWN);
      //const tileDownIsEmpty = map.tileData.hasOwnProperty(tileDownIndex) && !this.isTileCollidableHorizontal(map.tileData[tileDownIndex].tileType);

      if (tileIsCollidable) {
        // && (tileRightIsEmpty || !tileDownIsEmpty)) {
        const tileRightSide = tileDataLeft.worldPosX + tileDataLeft.colliderHalfW;

        if (colliderLeft <= tileRightSide && colliderLeft - worldDiffX >= tileRightSide) {
          // Stop player moving left
          this.worldPosX = tileRightSide + this.colliderWidth + colliderBuffer;
          this.canMoveLeft = false;
          if (this.velocity.x < 0) {
            this.velocity.x = 0;
            collidedTileData = tileDataLeft;
          }
        }
      }
    }

    if (collidedTileData && this.isTileName(collidedTileData.tileType, 'BlockBumper')) {
      // Bumper Tile Reaction
      this.velocity.y = -5;
      if (collidedTileData.worldPosX > this.worldPosX) {
        this.velocity.x = -5;
      } else {
        this.velocity.x = 5;
      }
      this.leaveTheGround();
      this.startingJump = true;
      this.isLaunched = true;

      game.playAudioIndex('sfxSpring', 4);
    }
  }

  // Temp first pass physics until path system is complete
  playerCollisionCalculations() {
    if (this.isDead || game.isRestarting || !this.doneTeleporting) {
      return;
    }

    //console.log(`playerCollisionCalculations - this.playerTileIndex = ${this.playerTileIndex}`);
    let tileAboveIndex = map.getTileNeighborIndex(this.playerTileIndex, map.directions.UP);
    if (tileAboveIndex) {
      this.checkForObjectCollision(tileAboveIndex);
    }

    // Collide Vertically
    this.inAir = !(this.isFalling || this.isGrounded);
    let tileData = map.tileData[this.playerTileIndex];

    if (!this.inAir && map.tileData.hasOwnProperty(this.playerTileIndex)) {
      this.startingJump = false;
      this.collidePositionVertical(this.worldPosX, this.worldPosY, this.worldPosDiffY);

      const playerCollisionWidth = 6;
      if (this.startingJump === false) {
        this.collidePositionVertical(this.worldPosX + this.colliderWidth, this.worldPosY, this.worldPosDiffY);
      }

      if (this.startingJump === false) {
        this.collidePositionVertical(this.worldPosX - this.colliderWidth, this.worldPosY, this.worldPosDiffY);
      }
    }

    // Collide Horizontally
    this.canMoveRight = true;
    this.canMoveLeft = true;

    const bottomOfPlayer = this.worldPosY - this.colliderBottom;
    this.collidePositionHorrizontal(this.worldPosX, bottomOfPlayer, this.worldPosDiffX);

    const topOfPlayer = this.worldPosY - this.colliderTop;
    this.collidePositionHorrizontal(this.worldPosX, topOfPlayer, this.worldPosDiffX);
    //this.drawColliders();
  }

  drawSpotlight(dt, targetX, targetY){
    // Save the current canvas context state
    context.save();

    // Create a new canvas for the spotlight effect
    const spotlightCanvas = document.createElement('canvas');
    spotlightCanvas.width = clientWidth;
    spotlightCanvas.height = getClientHeight();
    const spotCtx = spotlightCanvas.getContext('2d');

    // Fill with dark overlay
    spotCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    spotCtx.fillRect(0, 0, clientWidth, getClientHeight());

    // Create spotlight hole
    spotCtx.globalCompositeOperation = 'destination-out';
    const gradient = spotCtx.createRadialGradient(targetX, targetY, 0, targetX, targetY, this.holeRadius);

    // Sharper gradient transitions
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    spotCtx.fillStyle = gradient;
    spotCtx.beginPath();
    spotCtx.arc(targetX, targetY, this.holeRadius, 0, Math.PI * 2);
    spotCtx.fill();

    // Draw the spotlight effect on top of everything
    context.drawImage(spotlightCanvas, 0, 0);

    // Restore the canvas context
    context.restore();

    // Shrink spotlight
    this.holeRadius = Math.max(0, this.holeRadius - dt * 0.8);
  }

  drawPlayer(dt) {
    //console.log("drawPlayer");
    if (game.currentMode !== 'Play' || !this.showPlayer) {
      return;
    }

    this.CamPosX = Math.round(this.worldPosX - viewport.leftX + clientWidth * 0.5 - viewport.w * 0.5);
    this.CamPosY = Math.round(this.worldPosY - viewport.topY + getClientHeight() * 0.5 - viewport.h * 0.5);
    this.CamPosY -= this.colliderPadding.bot;

    this.animator.update(dt, this.CamPosX, this.CamPosY);

    if (this.isDead || game.isRestarting) {
      this.drawSpotlight(dt, this.CamPosX + 10, this.CamPosY + 10);
    }
  }

  drawColliders() {
    context.strokeStyle = '#3e611e';
    //let y = this.CamPosY + (map.scaled_size) - (map.sprite_size * 0.5);
    let y = this.CamPosY; // + (map.scaled_size * 0.5);
    context.rect(this.CamPosX, y, map.scaled_size, map.scaled_size);
    context.stroke();
  }

  cachePlayerPosition(cachedForLeavingPlay) {
    debugLog(`cachePlayerPosition ${cachedForLeavingPlay}`);
    if (cachedForLeavingPlay) {
      this.velocity.y = 0;
      this.velocity.x = 0;
      this.cachedForLeavingPlay = true;
    } else if (this.cachedForLeavingPlay) {
      // console.log('!!ERROR: Attempting to stomp cached player position');
      // return;
    }

    let tmpPTileIndex = this.playerTileIndex;
    if (this.playerTileIndex > bufferCollumnsCount * bufferRowsCount) {
      const upperTmpPTileIndex = map.getTileNeighborIndex(this.playerTileIndex, map.directions.UP);
      tmpPTileIndex = map.getTileNeighborIndex(upperTmpPTileIndex, map.directions.UP);
      debugLog("!!!Moivng Player UP Two Tiles???????")
    }

    const tmpPlayerTileData = map.tileData[tmpPTileIndex];
    if (tmpPlayerTileData) {
      const tmpRow = tmpPlayerTileData.redisDataRow;
      const tmpColumn = tmpPlayerTileData.redisDataColumn;
      //console.log("Old TileY:", tmpPTileIndex, tmpPlayerTileData.worldPosY);
      const posInTileY = this.worldPosY - tmpPlayerTileData.worldPosY;
      const posInTileX = this.worldPosX - tmpPlayerTileData.worldPosX;
      this.cachedPlayerPos = { row: tmpRow, column: tmpColumn, ptX: posInTileX, ptY: posInTileY };

      this.cachedPlayerData.vx = this.velocity.x;
      this.cachedPlayerData.vy = this.velocity.y;
      this.cachedPlayerData.sox = viewport.streamOffsetX;
      this.cachedPlayerData.soy = viewport.streamOffsetY;
      //console.log("Storing StreamOffsetY:", viewport.streamOffsetY);
    } else {
      console.log('!!ERROR: Unable to cache player position');
    }
    //console.log('cachePlayerPosition ', this.cachedPlayerPos);
  }

  restoreCachedPlayerPosition() {
    //console.log(`restoreCachedPlayerPosition cachedPlayerPos =`, this.cachedPlayerPos);
    let playerWorldPosBeforeRelocate = { x: this.worldPosX, y: this.worldPosY };
    //console.log("playerWorldPosBeforeRelocate", playerWorldPosBeforeRelocate)
    const targetTile = this.cachedPlayerPos != undefined ? this.cachedPlayerPos : map.mapData.flagData;

    const playerTileNewIndex = map.tileData.findIndex((tile) => tile.redisDataRow === targetTile.row && tile.redisDataColumn === targetTile.column);
    //console.log(`playerTileNewIndex = ${playerTileNewIndex}`);
    let pX = 0;
    let pY = 0;
    if (playerTileNewIndex != -1) {
      const playerNewTileData = map.tileData[playerTileNewIndex];
      pX = playerNewTileData.worldPosX;
      pY = playerNewTileData.worldPosY;
      //console.log("New TileY:", playerTileNewIndex, playerNewTileData.worldPosY);
      if (targetTile.ptX) {
        if (this.pauseForwardVelocity != true) {
          pX += targetTile.ptX;
        }
        pY += targetTile.ptY;
      }
      
    } else {
      console.log('!!ERROR: Could not find player restore tile');
    }

    this.worldPosX = pX;
    this.worldPosY = pY;
    debugLog("-----------------------------restoreCachedPlayerPosition", this.worldPosX, this.worldPosY)
    this.updatePlayerTileIndex();
    const playerTileData = map.tileData[this.playerTileIndex];
    //console.log(`restoreCachedPlayerPosition playerTileData.redisDataColumn = ${playerTileData.redisDataColumn}`);

    if (this.pauseForwardVelocity != true) {
      this.velocity.x = this.cachedPlayerData.vx;
    }
    this.velocity.y = this.cachedPlayerData.vy;

    viewport.streamOffsetX = this.cachedPlayerData.sox;
    //console.log("Restoring StreamOffsetY To:", this.cachedPlayerData.soy);
    viewport.streamOffsetY = this.cachedPlayerData.soy;

    const zoomActive = (inZoomOutMode && !reqChangeZoomState) || (!inZoomOutMode && reqChangeZoomState);
    if (this.cachedForLeavingPlay && !zoomActive && game.allowNewPortionLoad()) {
      this.cachedForLeavingPlay = false;
      debugLog("Returning World Pos")
      return { x: this.worldPosX, y: this.worldPosY };
    }

    debugLog("Returning Before Relocate")
    return playerWorldPosBeforeRelocate;
  }

  movePlayerToDestination(destinationData) {
    debugLog('movePlayerToDestination');
    const clampBeforeTeleport = { 
      x: this.worldPosX - viewport.worldPosX, 
      y: this.worldPosY - viewport.worldPosY,
    };
    let playerPosBefore = { x: this.worldPosX, y: this.worldPosY };
    let worldPositionOffset = { x: 0, y: 0 };

    debugLog('destinationData = ');
    debugLog(destinationData);
    const teleporDestinationIndex = map.tileData.findIndex(
      (tile) => tile.redisDataRow == destinationData.extraData.rowTarget && tile.redisDataColumn == destinationData.extraData.colTarget
    );
  
    if (teleporDestinationIndex != -1) {
      //console.log(`teleporDestinationIndex = ${teleporDestinationIndex} this.isTeleported = ${this.isTeleported}`);
      let sourceOffset = { x: 0, y: 0 };
      const teleporDestinationTileData = map.tileData[teleporDestinationIndex];
      if (this.isTeleported) {
        this.worldPosX = teleporDestinationTileData.worldPosX;
        this.worldPosY = teleporDestinationTileData.worldPosY + map.tile_size;
        if (this.cachedPlayerPos) {
          sourceOffset.x = this.cachedPlayerPos.ptX;
          const originalColumn = this.cachedPlayerPos.column + 1;
          sourceOffset.y -= (originalColumn - destinationData.redisDataColumn) * map.tile_size;
          debugLog('CachedTile DiffX:', originalColumn, destinationData.redisDataColumn, originalColumn - destinationData.redisDataColumn)

          sourceOffset.y = this.cachedPlayerPos.ptY;
          const originalRow = this.cachedPlayerPos.row + 1;
          sourceOffset.y -= (originalRow - destinationData.redisDataRow) * map.tile_size;
          debugLog('CachedTile DiffY:', originalRow, destinationData.redisDataRow, originalRow - destinationData.redisDataRow)
        } else {
          console.log('!!ERROR: Teleport with no Cached Player Pose!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }
        debugLog("DestinationY", teleporDestinationTileData.worldPosY, this.cachedPlayerPos.ptY, map.tile_size)
      } else {
        debugLog('!!!!! IS TELEPORTED IS FALSE');
        this.worldPosX = teleporDestinationTileData.worldPosX;
        this.worldPosY = teleporDestinationTileData.worldPosY;
        if (this.cachedPlayerPos && this.cachedPlayerPos.ptY) {
          sourceOffset.x = this.cachedPlayerPos.ptX;
          sourceOffset.y = this.cachedPlayerPos.ptY;
        }
      }
      this.updatePlayerTileIndex();
  
      debugLog('OG Pos Before:', playerPosBefore.x, playerPosBefore.y)
      debugLog('New Pos:', this.worldPosX, this.worldPosY)
      debugLog('WorldPos Diff:', playerPosBefore.x - this.worldPosX, playerPosBefore.y - this.worldPosY )
  
      const newViewport = viewport.getNewScrolPos(this.worldPosX, this.worldPosY, game.currentMode);
      const clampAfterTeleport = { 
        x: this.worldPosX - newViewport.x, 
        y: this.worldPosY - newViewport.y,
      };

      // Need to ignore clamp diff since paralax is actually based on tile movement
      //playerPosBefore.x -= clampBeforeTeleport.x - clampAfterTeleport.x;
      //playerPosBefore.y -= clampBeforeTeleport.y - clampAfterTeleport.y;
      debugLog('Clamp:', clampBeforeTeleport.x, clampBeforeTeleport.y, clampAfterTeleport.x, clampAfterTeleport.y);
      debugLog('Clamp Diff:', clampBeforeTeleport.x - clampAfterTeleport.x, clampBeforeTeleport.y - clampAfterTeleport.y);
      debugLog('ClampFormula:', map.mapWidth * 0.5 - viewport.w * 0.5);

      let tileOffsetX = destinationData.redisDataColumn - destinationData.extraData.colTarget;
      let tileOffsetY = destinationData.redisDataRow - destinationData.extraData.rowTarget;
      debugLog('tileOffset:', tileOffsetX, tileOffsetY)
      worldPositionOffset.x = -tileOffsetX * map.tile_size - sourceOffset.x;
      worldPositionOffset.y = tileOffsetY * map.tile_size - sourceOffset.y;
      debugLog('Offset1:', worldPositionOffset)

      // Add initial offset from source portal
      debugLog('portalInitialOffset', this.portalInitialOffset);
      //worldPositionOffset.x = -tileOffsetX * map.tile_size;
      //worldPositionOffset.y = tileOffsetY * map.tile_size - sourceOffset.y;
      
      
      // Remove "world pos" diff (aka position inside backbuffer)
      worldPositionOffset.y += playerPosBefore.y - this.worldPosY;
      worldPositionOffset.x += playerPosBefore.x - this.worldPosX;
      debugLog('Offset2:', worldPositionOffset, sourceOffset);
      //worldPositionOffset.y += newViewport.y - viewport.worldPosY;
      //worldPositionOffset.x += newViewport.x - viewport.worldPosX;
      //console.log("Offset3:", worldPositionOffset)

      // Ignore clamp offsets since they do not shift the tileset
      //worldPositionOffset.y += clampBeforeTeleport.y - clampAfterTeleport.y;
      //worldPositionOffset.x += clampBeforeTeleport.x - clampAfterTeleport.x;
      //console.log("Offset3:", worldPositionOffset)

      //console.log(`isRestarting = ${this.isRestarting} this.isTeleported) = ${this.isTeleported}`);
      if (this.isTeleported) {
        game.playAudioIndex('sfxPortal', 5);
        map.addAnimation({
          tileData: teleporDestinationTileData,
          imageList: [blockPortalImg1, blockPortalImg2, blockPortalImg3],
          displayTime: [0, 100, 200],
          animationLength: 300,
        });
        //console.log("Done Teleporting");
        this.doneTeleporting = true;
      } else if (game.isRestarting) {
        game.isRestarting = false;
        if (!creatingNewMap && game.showPopupOnRestart) {
          //if (!popupList.includes(splashPopup)) popupList.push(splashPopup);
          //splashPopup.show();
        }
      } else if (creatingNewMap) {
        this.cachePlayerPosition(false);
      }
    } else {
      console.log('!!ERROR: Destination Index Unknown?');
    }
  
    teleportTileData = undefined;
    return worldPositionOffset;
  }

  onPlayerDeath() {
    if (!this.goalReached && !this.isDead && !game.isRestarting) {
      game.gameTimer = undefined;
      this.clearAllVelocity();
      this.isDead = true;
      this.holeRadius = 1000;
      console.log('Player Died');
      //DO STUFF HERE FOR RESPAWNING PLAYER AND RESET THE BOOLEAN
      game.playAudioIndex('sfxPlayerDeath', 1);
      //this.playDeathSequence();
      this.animationState = 'Jump';
      this.animator.changeAnimationState(this.animationState);
      setTimeout(() => {
        //game.showPopupOnRestart = true;
        //game.restartGame();
        game.retryLevel();
      }, 1400);
    }
  }

  onGoalReached(tileIndexToCheck) {
    if (this.isDead || this.goalReached || game.isRestarting || zoom != 1 || game.isRestarting) {
      return;
    }

    this.clearAllVelocity();
    this.goalTileIndex = tileIndexToCheck;
    map.addAnimation({
      tileData: map.tileData[tileIndexToCheck],
      imageList: [blockKeyCollectImg1, blockKeyCollectImg2, blockKeyCollectImg3],
      displayTime: [0, 25, 50],
      animationLength: 100,
    });

    if (!creatingNewMap) {
      //console.log('onGoalReached------------------------------------');
      if (game.gameTimer) {
        game.finishTime = game.gameTimer.cumulativeTimeElapsed;
        redisFrontendServices.updateAndGetLeaderBoard(game.finishTime);
        redisFrontendServices.updatePostDataCount('wins');
      }
    } else {
      playTested = true;
    }
    this.goalReached = true;

    game.playAudioIndex('sfxKey', 6);
    setTimeout(() => {
      game.playAudioIndex('sfxWonGame', 1);
    }, 200);
    setTimeout(() => {
      this.playFireworks(map.directions.UP);
    }, 250);
    setTimeout(() => {
      this.playFireworks(map.directions.LEFT);
    }, 500);
    setTimeout(() => {
      this.playFireworks(map.directions.RIGHT);
      if (creatingNewMap) {
        game.restartGame();
        game.currentMode = 'Edit';
        player.showPlayer = false;
        player.clearAllVelocity();
      }
    }, 750);

    // setTimeout(() => {
    //   if (!creatingNewMap) {
    //     redisFrontendServices.updateAndGetLeaderBoard(game.finishTime);
    //   } else {
    //     game.restartGame();
    //     game.currentMode = 'Edit';
    //   }
    // }, 2000);
  }

  playFireworks(direction) {
    const tileIndex = map.getTileNeighborIndex(this.goalTileIndex, direction); //+ Math.floor(Math.random() * (2 - 1)) + 1; //Random number in range 1, 2
    const tileToSpawnAnimOn = map.tileData[tileIndex];
    map.addAnimation({
      tileData: tileToSpawnAnimOn,
      imageList: [blockKeyCollectImg1, blockKeyCollectImg2, blockKeyCollectImg3],
      displayTime: [0, 25, 50],
      animationLength: 300,
    });
  }

  clearAllVelocity() {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.inputState.moveLeft = false;
    this.inputState.moveRight = false;
    this.inputState.moveUp = false;
    this.inputState.moveDown = false;
    this.cachedPlayerData.vx = 0;
    this.cachedPlayerData.vy = 0;
  }

  clearHorizontalVelocity() {
    this.velocity.x = 0;
    this.inputState.moveLeft = false;
    this.inputState.moveRight = false;
    this.cachedPlayerData.vx = 0;
  }

  // playDeathSequence() {
  //   this.animationState = 'Jump';
  //   this.velocity.y = -9;
  //   this.leaveTheGround();
  //   this.startingJump = true;
  //   this.isLaunched = false;
  // }
}
