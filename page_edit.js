// Copyright (C) 2024 5TH Cell Media, LLC.
// @ts-nocheck
document.body.style.overflow = 'hidden';
document.body.style.padding = 0;
document.body.style.margin = 0;

const mapBackBufferCanvas = document.createElement('canvas');
const mapObjectsBackBufferCanvas = document.createElement('canvas');
const mapDotsBackBufferCanvas = document.createElement('canvas');
const mapBackBuffer = mapBackBufferCanvas.getContext('2d');
const mapObjectsBackBuffer = mapObjectsBackBufferCanvas.getContext('2d');
const mapDotsBackBuffer = mapDotsBackBufferCanvas.getContext('2d');

const gridSize = 250;
let possibleBufferAreas = 0;
let lastBufferDestinationData;
let currentKeyAmount = 0;
let inRealm = true;
let loadingBuildMode = false;
let creatingNewMap = false;
let waitingForNewMap = false;
let zoom = 1;
let lastZoom = 1;
let inZoomOutMode = false;
let reqChangeZoomState = false;
let zoomProgressing = false;
let bufferCollumnsCount = 50 * zoom;
let bufferRows = 50;
let bufferRowsCount = bufferRows * zoom;
let originalMapDataArray;
const redisFrontendServices = new RedisFrontendServices();
let userInfo = new UserInfo();
let postInfo = new PostInfo();
let coolDowns = [];
let debugFunctionCount = 0;
const autoBufferIsActive = false; //true;
const autoBufferTimr = 5000;
const keyRespawnCoolDown = 10000;
let nextRequiredKeyAmount = 0;
//const ghostDataTime = 5000;
//let ghostDataTimer;
let recordingPlayerGhostData = false;
let playingGhostData = false;
let loadingGhostData = false;
const ghostSystemIsEnable = false;
let currentPostGhostData;
let playerGhostData;
let ghostPlayer = [];
let watchedGhostData = [];
//let initGhostSystemDelay;
//let waitForGroundedGhostTimer;
let initialGhostDataTimestamp = null;
let loaderTimer;
let buffering = false;
let atRedisMapBottom = false;
let lastUpdate;
//let keyUpdateTimer;
//let autoBufferTimer;
let newPortionLoaded = false;
let teleportTileData;
let teleportTimer;
let lastResivedMsg;
let playTested = false;
let seenTutoral = false;

let receivedInitialState = false;
let activePostIDs = [];
let touchesToIgnore = [];

//#region Images
let imageLoadCountTotal = 0;
let imageLoadCount = 0;
function loadRequiredImage(src) {
  let newImage = new Image();
  imageLoadCountTotal++;
  newImage.onload = () => {
    imageLoadCount++;
  };
  newImage.src = src;
  return newImage;
}

const goldImg = loadRequiredImage('./webassets/icon_gold_fill.png');
const bombImg = loadRequiredImage('./webassets/grid_x.png');

// Dev Blocks
const blockIndes = new Image();
blockIndes.src = './webassets/tsa_indes.png';

const blockKeyImg = loadRequiredImage('./webassets/tsa_thekey.png');
const blockKeyImg1 = new Image();
blockKeyImg1.src = './webassets/tsa_key_1.png';

const blockKeyImg2 = new Image();
blockKeyImg2.src = './webassets/tsa_key_2.png';

const blockKeyImg3 = new Image();
blockKeyImg3.src = './webassets/tsa_key_3.png';

// const blockKey2Img1 = new Image();
// blockKey2Img1.src = './webassets/tsa_key2_1.png';

// const blockKey2Img2 = new Image();
// blockKey2Img2.src = './webassets/tsa_key2_2.png';

// const blockKey2Img3 = new Image();
// blockKey2Img3.src = './webassets/tsa_key2_3.png';

// const blockKey3Img1 = new Image();
// blockKey3Img1.src = './webassets/tsa_key3_1.png';

// const blockKey3Img2 = new Image();
// blockKey3Img2.src = './webassets/tsa_key3_2.png';

// const blockKey3Img3 = new Image();
// blockKey3Img3.src = './webassets/tsa_key3_3.png';

// Key Collect Animation
const blockKeyCollectImg1 = new Image();
blockKeyCollectImg1.src = './webassets/tsa_thekey1.png';

const blockKeyCollectImg2 = new Image();
blockKeyCollectImg2.src = './webassets/tsa_thekey2.png';

const blockKeyCollectImg3 = new Image();
blockKeyCollectImg3.src = './webassets/tsa_thekey3.png';

// Tilset 1 Tiles
const blockImg = loadRequiredImage('./webassets/ts1_ground_top.png');
const blockFloorImg = new Image();
blockFloorImg.src = './webassets/floor_Ground.png';

const blockFloorDirtImg = new Image();
blockFloorDirtImg.src = './webassets/floor_Ground_dirt.png';

const groundBotImg = new Image();
groundBotImg.src = './webassets/ts1_ground_bot.png';

const blockSpringImg = loadRequiredImage('./webassets/ts1_spring_top.png');

const blockSpringImg2 = new Image();
blockSpringImg2.src = './webassets/ts1_spring_top2.png';

const blockSignImg = new Image();
blockSignImg.src = './webassets/ts1_sign.png';

const blockSpikeImg = new Image();
blockSpikeImg.src = './webassets/spike.png';

const blockGoalImg = new Image();
blockGoalImg.src = './webassets/tsa_key_3.png';

// All Tileset Tiles
const blockIceImg = loadRequiredImage('./webassets/tsa_gound_ice.png');
const blockPortalImg = loadRequiredImage('./webassets/tsa_portal.png');
const blockPortalDisabledImg = loadRequiredImage('./webassets/tsa_portal_disabled.png');

const blockPortalImg1 = new Image();
blockPortalImg1.src = './webassets/tsa_portal1.png';

const blockPortalImg2 = new Image();
blockPortalImg2.src = './webassets/tsa_portal2.png';

const blockPortalImg3 = new Image();
blockPortalImg3.src = './webassets/tsa_portal3.png';

const blockFlagImg = loadRequiredImage('./webassets/tsa_flag.png');
const blockLadderImg = loadRequiredImage('./webassets/tsa_ladder.png');
const blockBumperImg = loadRequiredImage('./webassets/tsa_bumper.png');

// Animations
const blockBombImg1 = new Image();
blockBombImg1.src = './webassets/tsa_bomb1.png';

const blockBombImg2 = new Image();
blockBombImg2.src = './webassets/tsa_bomb2.png';

const blockBombImg3 = new Image();
blockBombImg3.src = './webassets/tsa_bomb3.png';

const boundaryRightTileImg = new Image();
boundaryRightTileImg.src = './webassets/boundarytile.png';
const boundaryLeftTileImg = new Image();
boundaryLeftTileImg.src = './webassets/boundarytile-left.png';

// Test Blocks
// const blockImg2 = new Image();
// blockImg2.src = './webassets/ts1_ground_top.png';
// const groundBotImg2 = new Image();
// groundBotImg2.src = './webassets/ts1_ground_bot.png';

// Object Images
const signBubbleImg = new Image();
signBubbleImg.src = './webassets/sign_bubble.png';

// Edit Images
// const snapTile = new Image();
// snapTile.src = "./webassets/grid_dot.png";
const gridDot = new Image();
gridDot.src = './webassets/grid_dot.png';
const gridCross = new Image();
gridCross.src = './webassets/grid_x.png';
//#endregion Images

// Play Images
const moveLeft = new Image();
moveLeft.src = './webassets/LeftArrow_New.png';
const moveRight = new Image();
moveRight.src = './webassets/RightArrow_New.png';
const moveUp = new Image();
moveUp.src = './webassets/UpArrow_New.png';
const moveDown = new Image();
moveDown.src = './webassets/DownArrow_New.png';


function getTileSwapUIShift() {
  let documentHeight = document.documentElement.clientHeight;
  if (isIOSUI()) {
    let documentWidth = document.documentElement.clientWidth;
    if (documentHeight / documentWidth > 2.0) {
      console.log("!!ERROR: Document aspect ratio is above 2.0, capping");
      return 200;
    }
  }
  return 0;
}

function getClientHeight() {
  let documentHeight = document.documentElement.clientHeight;
  if (isIOS()) {
    let documentWidth = document.documentElement.clientWidth;
    if (documentHeight / documentWidth > 2.0) {
      console.log("!!ERROR: Document aspect ratio is above 2.0, capping");
      documentHeight -= 250;
    }
  }

  return documentHeight;
}

const viewport = new Viewport(0, 0, document.documentElement.clientWidth, getClientHeight());
const game = new Game();
const map = new MapManager(viewport, game);
const player = new Player(0, 0, false);

function debugLog() {
  //console.log.apply(console, arguments);
}

function isMobile() {
  //return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOS() {
  //console.log('userAgent:', navigator.userAgent);
  return /iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function printTileTypes() {
  let currentRow = '';
  map.tileData.forEach((tData, index) => {
    currentRow = currentRow + ',' + tData.tileType;
    if ((parseInt(index) + 1) % 50 == 0) {
      debugLog(currentRow);
      currentRow = '';
    }
  });
}

function getFlagData() {
  let flagData = postInfo.flagData;
  if (creatingNewMap) {
    flagData = map.mapData.goalData;
  }
  return flagData;
}

function getFlagIndex() {
  let flagData = this.getFlagData();
  let returnFlagIndex = map.tileData.findIndex(
    (tile) => tile.redisDataRow == flagData.row && tile.redisDataColumn == flagData.column
  );

  if (returnFlagIndex < 0 || map.tileData[returnFlagIndex].tileType != map.tileNameToId.Flag) {
    console.log('!!ERROR: Flag is Not At FlagData Position:' + returnFlagIndex);
    const foundFlagIndex = map.tileData.findIndex((tile) => tile.tileType === map.tileNameToId.Flag);
    if (foundFlagIndex >= 0) {
      console.log('!!INFO: Found A Flag At:', foundFlagIndex);
      returnFlagIndex = foundFlagIndex;
    } else {
      console.log('!ERROR: NO FLAG IN TILE DATA:', returnFlagIndex);
      if (returnFlagIndex < 0) {
        returnFlagIndex = 0;
      }
    }
  }

  return returnFlagIndex;
}

function getKeyIndex() {
  let goalData = postInfo.goalData;
  if (creatingNewMap) {
    goalData = map.mapData.goalData;
  }
  let returnKeyIndex = map.tileData.findIndex(
    (tile) => tile.redisDataRow == goalData.row && tile.redisDataColumn == goalData.column
  );

  if (returnKeyIndex < 0 || map.tileData[returnKeyIndex].tileType != map.tileNameToId.BlockGoal) {
    console.log('!!INFO: Key is Not At GoalData Position:', returnKeyIndex, goalData.row, goalData.column);
    const foundKeyIndex = map.tileData.findIndex((tile) => tile.tileType === map.tileNameToId.BlockGoal);
    if (foundKeyIndex >= 0) {
      returnKeyIndex = foundKeyIndex;
    } else {
      
      // Update Tile Data
      if (returnKeyIndex > 0 && returnKeyIndex < map.tileData.length) {
        console.log('!ERROR: NO KEY IN TILE DATA - Overriding Tile Type');
        map.tileData[returnKeyIndex].tileType = map.tileNameToId.BlockGoal;
      } else {
        console.log('!ERROR: No Tile at KeyIndex');
        //this.printTileTypes();
        returnKeyIndex = 0;
      }
        
      // Update AllTiles
      const gridDataIndex = map.allTiles.findIndex(
        (tile) => tile.redisDataRow === goalData.row && tile.redisDataColumn === goalData.column
      );
      if (gridDataIndex > 0) {
        console.log("Updating AllTiles At KeyIndex:", gridDataIndex);
        map.allTiles[gridDataIndex].tileType = map.tileNameToId.BlockGoal;
        map.allTiles[gridDataIndex].tileStyle = 1;
      } else {
        console.log("Adding Tile At KeyIndex");
        map.allTiles.push({
          redisDataColumn: goalData.column,
          redisDataRow: goalData.row,
          tileStyle: 1,
          tileType: map.tileNameToId.BlockGoal,
        })
      }
    } 
  }

  return returnKeyIndex;
}

async function startGame(destinationData) {
  console.log('startGame');
  await map.createTileDataArray(destinationData);
  //console.dir(userInfo);
  lastUpdate = Date.now();

  game.setupUIForCurrentGameMode();
  
  //soundButton.changePos(startX + 10, startY + 10);
  /*map.addAnimation({
    tileType: map.tileNameToId.BlockKey,
    imageList: [blockKeyImg1, blockKeyImg2, blockKeyImg3],
    displayTime: [0, 200, 400],
    animationLength: 600,
    looping: true,
  });
  map.addAnimation({
    tileType: map.tileNameToId.BlockKey2,
    imageList: [blockKey2Img1, blockKey2Img2, blockKey2Img3],
    displayTime: [0, 200, 400],
    animationLength: 600,
    looping: true,
  });
  map.addAnimation({
    tileType: map.tileNameToId.BlockKey3,
    imageList: [blockKey3Img1, blockKey3Img2, blockKey3Img3],
    displayTime: [0, 200, 400],
    animationLength: 600,
    looping: true,
  });*/

  beginLoop();
}

function beginLoop() {
  setTimeout(function () {
    //console.log("!!!!!!BEGINLOOP TIMEOUT - imageLoadCount:", imageLoadCount, imageLoadCountTotal)
    if (imageLoadCount == imageLoadCountTotal)
    {
      try {
        if (game.currentMode != 'Edit') {
          const playerGoalIndex = this.getKeyIndex();
        }
      } catch (error) {
        console.log('Error Finding Key:', error);
      }
      map.preRender();

      const playerFlagIndex = this.getFlagIndex();

      //console.log(`playerFlagIndex = ${playerFlagIndex} worldPosX = ${map.tileData[playerFlagIndex].worldPosX}`);
      player.worldPosX = map.tileData[playerFlagIndex].worldPosX;
      player.worldPosY = map.tileData[playerFlagIndex].worldPosY;
      player.flagRedisCol = map.tileData[playerFlagIndex].redisDataColumn;
      player.flagRedisRow = map.tileData[playerFlagIndex].redisDataRow;
      player.facingRight = isGoalRightOfFlag();
      player.animator.changeAnimationState(player.animationState);
      // console.log('Facing Right:' + player.facingRight);
      // console.log('Player Flag Index:' + playerFlagIndex);
      // console.log('Player World PosY:' + player.worldPosY);
      // console.log('Player World PosX:' + player.worldPosX);
      //game.updatePlayerRefrence(player);
      buffering = false;
      game.isQuiting = false;
      gameLoop();
      //game.uiObjects.push(splashPopup);
      //splashPopup.show();
  
      game.uiObjects.push(soundButton);
      soundButton.show();
      if (currentPostGhostData && !creatingNewMap) {
        setupGhostPlayerSystem();
      }
    } else {
      // Not Ready, Try Again
      beginLoop();
    }
  }, 1);
}

function setupGhostPlayerSystem() {
  if (!ghostSystemIsEnable) {
    return;
  }
  
  ghostPlayer = [];
  for (const [key, value] of Object.entries(currentPostGhostData)) {
    let tmpGhosData;
    // console.log('value = ');
    // console.dir(value);
    if (!value) continue;

    tmpGhosData = JSON.parse(value);
    console.log('tmpGhosData = ');
    console.dir(tmpGhosData);
    //userInfo.lastGhostDataStartPos = tmpGhosData.startPos;
    if (tmpGhosData) {
      // && Array.isArray(tmpGhosData)) {
      playingGhostData = true;
      // loadingGhostData = false;
      // const dataArray = tmpGhosData.startPos.split(',');
      // const startGridRowId = dataArray[0];
      // const startGridColId = dataArray[1];
      // const startRow = dataArray[2];
      // const startCol = dataArray[3];
      // const posInTileX = dataArray[4];
      // const posInTileY = dataArray[5];
      const ghostStartIndex = map.tileData.findIndex(
        (tile) => tile.redisDataRow === map.mapData.flagData.row && tile.redisDataColumn === map.mapData.flagData.column
      );
      //console.log(`ghostStartIndex = ${ghostStartIndex} map = ${map}`);
      if (ghostStartIndex === -1 || map === undefined) {
        // console.log(
        //   `ghostStartIndex = ${ghostStartIndex} owner = ${ghostDataResponse.result.owner[i]}`
        // );
        // console.log(
        //   "No ghost data available to play in this portion will retry in 15s"
        // );
        // loaderTimer = new Timer(15000, "Timer", Date.now(), playGhostData);
        // loadingGhostData = false;
      } else {
        //console.log('map.tileData[ghostStartIndex]', map.tileData[ghostStartIndex]);
        //console.log('map.tileData[ghostStartIndex].worldPosX', map.tileData[ghostStartIndex].worldPosX);
        const startPosX = map.tileData[ghostStartIndex].worldPosX;
        const startPosY = map.tileData[ghostStartIndex].worldPosY;
        const exactStartPosX = startPosX; // + parseFloat(posInTileX);
        const exactStartPosY = startPosY; // + parseFloat(posInTileY);
        //console.log(`startPosX = ${startPosX} exactStartPosX = ${exactStartPosX}`);
        ghostPlayer.push(new GhostPlayer(exactStartPosX, exactStartPosY, key, JSON.parse(value), 0));
        loadingGhostData = false;
      }
    } else {
      console.error('Received ghost data is not acceptable'); //an array:', tmpGhosData.dataArray);
    }
  }

  if (ghostPlayer.length == 0) {
    debugLog('Ghost Player Empty, No GhostData to Show '); //Get New Data In 2 Secs")
    // playingGhostData = false;
    // loaderTimer = new Timer(2000, 'CountDown', Date.now(), playGhostData);
    // loadingGhostData = false;
  }
}

function isGoalRightOfFlag() {
  //console.log(postInfo);
  if (map.mapData.goalData && map.mapData.flagData) {
    const columnGoal = parseInt(map.mapData.goalData.column);
    const columnFlag = parseInt(map.mapData.flagData.column);
    if (columnGoal > columnFlag) {
      return true;
    } else {
      return false;
    }
  }

  return true;
}

async function onLoadNewPortion(destinationData) {
  debugLog(`onLoadNewPortion game.currentMode = ${game.currentMode}`);

  if (!inZoomOutMode && game.allowNewPortionLoad()) {
    player.cachePlayerPosition(false);
  }

  if (ghostPlayer) {
    ghostPlayer.forEach((element) => {
      if (!element.bufferPos) {
        element.SetbufferPos();
      }
    });
  }

  //!!!!!!!!WARNING - This Await Causes renderNextMapPortion to return execution to main loop
  await map.createTileDataArray(destinationData);
  //!!!!!!!!WARNING - Update Loop Running In Parallel But Early Outs Due To Buffering Flag

  map.preRender();
  let pFacingRight = player.facingRight;

  //console.log(`teleportTileData = ${teleportTileData} game.isRestarting = ${game.isRestarting}`);
  let worldPositionOffset = { x: 0, y: 0 };
  if (teleportTileData && (player.isTeleported || game.isRestarting || creatingNewMap)) {
    debugLog('TELEPORT NEW LOAD')
    worldPositionOffset = player.movePlayerToDestination(teleportTileData);
    if (game.isRestarting || creatingNewMap) {
      pFacingRight = isGoalRightOfFlag();
      game.isRestarting = false;
    }

    debugLog('worldPositionOffset:',worldPositionOffset);

  } else {
    debugLog("not teleported")
    const playerPosBefore = player.restoreCachedPlayerPosition();
    worldPositionOffset.x = playerPosBefore.x - player.worldPosX;
    worldPositionOffset.y = playerPosBefore.y - player.worldPosY;
  }

  player.onLoadNewPortion(pFacingRight, worldPositionOffset);
  game.setupUIForCurrentGameMode();

  if (ghostPlayer) {
    ghostPlayer.forEach((element) => {
      if (element.bufferPos !== undefined) {
        element.loadGhostPos();
      }
    });
  }

  if (reqChangeZoomState) {
    inZoomOutMode = !inZoomOutMode;
    //if (inZoomOutMode) recenterButton.show();
    //else recenterButton.hide();
  }
  //console.log(`inZoomOutMode = ${inZoomOutMode} reqChangeZoomState = ${reqChangeZoomState}`);
  reqChangeZoomState = false;
  zoomProgressing = false;
  if (!inZoomOutMode && game.currentMode != 'Edit') {
    player.showPlayer = true;
  }

  if (inZoomOutMode) {
    player.worldPosY = viewport.h + map.scaled_size * 0.5;
    //console.log(`viewport.h = ${viewport.h} player.worldPosY = ${player.worldPosY}`);
  }

  /*if (player.isTeleported) {
    console.log("teportedDone = StartTimer");
    if (teleportTimer) {
      console.log('!!ERROR: STomping Teleport Timer......')
    }
    teleportTimer = new Timer(2000, 'CountDown', Date.now(), () => {
      console.log("teportedDone = Timer Executed")
      player.doneTeleporting = true;
      player.isTeleported = false;
      teleportTimer = undefined;
    });
  }*/
  player.isTeleported = false;
  buffering = false;
}

function gameLoop() {
  //console.log(`game - buffering:`,buffering);
  viewport.scrollTo(player.worldPosX, player.worldPosY, game.currentMode);

  renderNextMapPortion(false);
  if (buffering) {
    requestAnimationFrame(gameLoop);
    return;
  }

  // if (keyUpdateTimer === undefined || keyUpdateTimer.secondsRemaining <= 0) {
  //   keyUpdateTimer = new Timer(2000, 'CountDown', Date.now(), async () => {
  //     currentKeyAmount = await redisFrontendServices.getKeyAmount();
  //   });
  // }

  contextCanvas.width = clientWidth;
  contextCanvas.height = clientHeight;

  // To ensure there is no anti-aliasing when drawing to the canvas
  mapBackBuffer.imageSmoothingEnabled = false;
  mapObjectsBackBuffer.imageSmoothingEnabled = false;
  mapDotsBackBuffer.imageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false; // prevent antialiasing of drawn image
  viewport.clearBackground();

  const maxFrameRate = 30;
  const now = Date.now();
  const dt = Math.min(now - lastUpdate, maxFrameRate);

  if (!game.isQuiting) lastUpdate = now;
  coolDowns.forEach((cD) => {
    cD.update(now);
  });

  map.update(dt);
  player.update(dt, now);
  viewport.update(dt);
  game.update(dt);

  if (ghostPlayer != undefined && ghostPlayer.length > 0) {
    let donePlaying = 0;
    ghostPlayer.forEach((gP) => {
      gP.update(dt, now);
      if (!gP.isPlaying) {
        donePlaying++;
      }
    });
    if (donePlaying == ghostPlayer.length) {
      playingGhostData = false;
      playGhostData();
      ghostPlayer = [];
    }
  }

  if (game.currentMode !== 'Edit') {
    // if (autoBufferIsActive && (autoBufferTimer === undefined || autoBufferTimer.secondsRemaining <= 0)) {
    //   autoBufferTimer = new Timer(autoBufferTimr, 'CountDown', Date.now(), async () => {
    //     if (!inZoomOutMode) {
    //       console.log('autoBuffer');
    //       renderNextMapPortion(true);
    //     }
    //   });
    // }

    // if (ghostDataTimer != undefined) {
    //   ghostDataTimer.update(now);
    //   if (ghostDataTimer.secondsRemaining <= 0 && recordingPlayerGhostData) {
    //     stopRecordingGhostData();
    //   }
    // }
    //if (keyUpdateTimer != undefined) keyUpdateTimer.update(now);

    //if (autoBufferTimer != undefined) autoBufferTimer.update(now);

    if (teleportTimer != undefined) {
      teleportTimer.update(now);
    }

    if (game.gameTimer != undefined) {
      game.gameTimer.update(now);
    }
    // if (initGhostSystemDelay != undefined) {
    //   initGhostSystemDelay.update(now);
    //   if (initGhostSystemDelay && initGhostSystemDelay.secondsRemaining <= 0) {
    //     initGhostSystemDelay = undefined;
    //   }
    // }
    // if (waitForGroundedGhostTimer != undefined) {
    //   waitForGroundedGhostTimer.update(now); //, player.isGrounded);
    //   if (waitForGroundedGhostTimer && waitForGroundedGhostTimer.done) {
    //     waitForGroundedGhostTimer = undefined;
    //   }
    // }
    if (loaderTimer !== undefined) {
      loaderTimer.update(now);
      if (loaderTimer.secondsRemaining <= 0) {
        loaderTimer = undefined;
      }
    }
  }

  if (!game.isQuiting) {
    requestAnimationFrame(gameLoop);
  }
}

function renderNextMapPortion(forceRebuffer, portalData = null, overrideCheckCorrected = false) {
  //return;

  // Store destination data for when buffering is finished, even if already buffering
  let destinationData = { row: 0, column: 0 };
  if (portalData !== null) {
    destinationData = {
      row: portalData.extraData.rowTarget,
      column: portalData.extraData.colTarget,
    };
    teleportTileData = portalData;
  }

  // Early out if load in progress
  if (buffering || !game.allowNewPortionLoad(forceRebuffer) || (inZoomOutMode && !forceRebuffer)) {
    // || newPortionLoaded) {
    return;
  }

  const horizontalLoadBoarder = map.mapWidth * 0.5 - 300;
  const verticalLoadBoarder = map.mapHeight * 0.5 - 300;
  const horizontalCondition = viewport.rightX >= horizontalLoadBoarder || viewport.leftX <= -horizontalLoadBoarder;
  const verticalCondition = viewport.topY <= -verticalLoadBoarder || (viewport.botY >= verticalLoadBoarder && !atRedisMapBottom);
  if (portalData === null) {
    if (forceRebuffer || horizontalCondition || verticalCondition) {
      const playerTileData = map.tileData[player.playerTileIndex];
      if (playerTileData == undefined) return;

      destinationData = {
        row: playerTileData.redisDataRow,
        column: playerTileData.redisDataColumn,
      };
    } else return;
  }
  const correctedDestinationData = correctDestinationData(destinationData);

  if (lastBufferDestinationData && !overrideCheckCorrected) {
    if (lastBufferDestinationData.forcedRow == true && correctedDestinationData.forcedRow == true && !horizontalCondition) {
      debugLog("!!!!!!!!!!!WARNING: Early Out Due To Forced Row");
      return;
    }
    if (lastBufferDestinationData.forcedCol == true && correctedDestinationData.forcedCol == true && !verticalCondition) {
      debugLog("!!!!!!!!!!!WARNING: Early Out Due To Forced Col");
      return;
    }
  }

  lastBufferDestinationData = correctedDestinationData;
  buffering = true;
  newPortionLoaded = true;
  onLoadNewPortion(correctedDestinationData.tmpDesData);
}

function correctDestinationData(destinationData) {
  let tmpDesData = {
    row: destinationData.row,
    column: destinationData.column,
  };

  forcedRow = false;
  forcedCol = false;

  let nextGR = 0;
  if (parseInt(tmpDesData.row) + bufferRowsCount * 0.5 > gridSize - 1) nextGC = 1;
  if (nextGR > possibleBufferAreas) {
    const lastPossibleRow = gridSize - 1 - bufferRowsCount * 0.5;
    tmpDesData.row = lastPossibleRow;
    forcedRow = true;
  }
  let nextGC = 0;
  if (parseInt(tmpDesData.column) - bufferCollumnsCount * 0.5 < 0) nextGC = -1;
  else if (parseInt(tmpDesData.column) + bufferCollumnsCount * 0.5 > gridSize - 1) nextGC = 1;
  if (Math.abs(nextGC) > possibleBufferAreas) {
    const lastPossibleCol = nextGC > 0 ? gridSize - 1 - bufferCollumnsCount * 0.5 : 0 + bufferCollumnsCount * 0.5;
    tmpDesData.column = lastPossibleCol;
    forcedCol = true;
  }

  return { tmpDesData, forcedRow, forcedCol };
}

async function playGhostData() {
  if (!ghostSystemIsEnable) {
    return;
  }

  // console.log(
  //    `playGhostData playingGhostData = ${playingGhostData} loadingGhostData = ${loadingGhostData}`
  // );
  if (playingGhostData || loadingGhostData) {
    //console.log("Already PLaying:"+playingGhostData)
    return;
  }
  loadingGhostData = true;
  try {
    //const playerTile = map.tileData[player.playerTileIndex];
    //const playerPos = `${playerTile.redisDataGridRowId},${playerTile.redisDataGridColId},${playerTile.redisDataRow},${playerTile.redisDataColumn}`;
    //console.log("Awaiting")
    //await redisFrontendServices.getGhostData(playerPos);
    //console.log("Ghost Data Retrieved")
  } catch (error) {
    // console.log('Error playing ghost data:', error);
    // console.log('will retry in 15s');
    //loaderTimer = new Timer(5000, 'CountDown', Date.now(), playGhostData);
    //loadingGhostData = false;
  }
}

function startRecordGhostData() {
  //console.log(`ghostSystemIsEnable = ${ghostSystemIsEnable} recordingPlayerGhostData= ${recordingPlayerGhostData}`);
  if (!ghostSystemIsEnable) {
    return;
  }

  if (recordingPlayerGhostData) {
    return;
  }

  let playerTilePosX = 0;
  let playerTilePosY = 0;
  let posInTileX = map.scaled_size * 0.5;
  let posInTileY = map.scaled_size * 0.5;

  function checkPosInTileY() {
    //ghostDataTimer = new Timer(ghostDataTime, 'CountDown', Date.now());
    //player.updatePlayerTileIndex();
    //const targetTileData = map.tileData[player.playerTileIndex];
    //console.log(`-------player.playerTileIndex = ${player.playerTileIndex}`);
    // if (map.tileData[player.playerTileIndex]) {
    //   playerTilePosX = map.tileData[player.playerTileIndex].worldPosX;
    //   playerTilePosY = map.tileData[player.playerTileIndex].worldPosY;
    //   posInTileX = player.worldPosX - playerTilePosX;
    //   posInTileY = player.worldPosY - playerTilePosY;

    // Continue checking until posInTileY becomes 0
    // if (posInTileY > 1 || posInTileY < -1) {
    //   //if (posInTileY !== 0) {
    //   //console.log(`IN posInTileY = ${posInTileY}`);
    //   setTimeout(checkPosInTileY, 100); // check again after 100 ms
    //   return;
    // }

    //console.log(`posInTileY = ${posInTileY}`);

    // if (targetTileData == undefined) {
    //   console.dir('new ghostData record Error');
    //   initGhostSystemDelay = new Timer(5000, 'CountDown', Date.now(), () => {
    //     startRecordGhostData();
    //   });
    //   return;
    // }

    //const startPos = `${targetTileData.redisDataRow},${targetTileData.redisDataColumn},${posInTileX},${posInTileY}`;

    playerGhostData = new GhostData(); //startPos);
    initialGhostDataTimestamp = null;
    recordingPlayerGhostData = true;
    //}
  }

  // Start checking posInTileY
  checkPosInTileY();
}

function stopRecordingGhostData() {
  // console.log(
  //   "stopRecordingGhostData recordingPlayerGhostData = " +
  //     recordingPlayerGhostData
  // );
  if (recordingPlayerGhostData) {
    // console.log(`saving length = ${playerGhostData.dataArray.length}`);
    //if (playerGhostData.dataArray.length > 600) {
    //console.log("+++setUserGhostData");
    //redisFrontendServices.setUserGhostData(JSON.stringify(playerGhostData));
    recordingPlayerGhostData = false;
    // } else {
    //   startRecordGhostData();
    // }
  }
}

function tryJumpPlayer() {
  if (!inZoomOutMode && player.velocity.y >= 0 && player.hasJumped === false) {
    if (player.inputState.jumpDown && player.isGrounded) {
      player.ignoreVerticalCollision = true;
    } else {
      player.velocity.y = -20;
      player.leaveTheGround();
      player.hasJumped = true;
      game.playAudioIndex('sfxJump', 5);
    }
  }
}

async function switchZoomState(zoomIn, renderMap) {
  if ((zoomIn && !inZoomOutMode) || player.goalReached) {
    debugLog('switchZoom Early Out', zoomIn, inZoomOutMode)
    return;
  }
  
  zoomProgressing = true;
  await waitForCondition(() => buffering, false);
  game.playAudioIndex('sfxZoom', 2);
  lastZoom = zoom;
  const maxZoom = 2;
  if (zoomIn || (!zoomIn && zoom == maxZoom)) {
    zoom = 1;
    reqChangeZoomState = true;
  } else {
    if (!inZoomOutMode) {
      reqChangeZoomState = true;
      if (game.allowNewPortionLoad()) {
        player.cachePlayerPosition(true);
      }
    }
    player.showPlayer = false;
    player.clearAllVelocity();

    const zoomMap = {
      1: 2,
      //2: 4,
      //4: 1,
    };
    zoom = zoomMap[zoom] || zoom;
  }
  zoomButton.changeIcon(zoom == maxZoom);
  zoomButton.displayName = zoom == maxZoom ? 'Zoom In' : 'Zoom Out';
  bufferCollumnsCount = 50 * zoom;
  bufferRowsCount = bufferRows * zoom;
  map.scaled_size = 32 / zoom;
  map.sprite_size = 16 / zoom;
  map.mapWidth = bufferCollumnsCount * map.scaled_size;
  map.mapHeight = bufferRowsCount * map.scaled_size;
  player.boundBot = map.mapHeight * 0.5 - map.scaled_size / zoom;
  if (renderMap) {
    renderNextMapPortion(true, null, true);
  }
}

function waitForCondition(conditionFn, expectedValue = true, interval = 100) {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (conditionFn() === expectedValue) {
        clearInterval(check);
        resolve();
      }
    }, interval);
  });
}

function handleWindowChange() {
  game.updateUIScale();
  uiManagerOnWindowResize();
  viewport.OnWindowsResize();
}
// Trigger on resize
window.addEventListener('resize', handleWindowChange, true);

function handleWindowFocus(event) {
  //console.log('!!handleWindowFocus:');
  //console.log(event);
}

function handleWindowBlur(event) {
  //console.log('!!handleWindowBlur:');
  //console.log(event);
}

function handleMouseMove(event) {
  //console.log('!!handleMouseMove:');
  //console.log(event);
}

// Trigger when the window is maximized, minimized, or restored
window.addEventListener('focus', handleWindowFocus);
window.addEventListener('blur', handleWindowBlur);
window.addEventListener('mousemove', handleMouseMove);

function clearTouchMovment() {
  player.velocity.x = 0;
  if (game.currentMode !== 'Play' || !player.showPlayer) {
    player.velocity.y = 0;
  }
  player.inputState.moveRight = false;
  player.inputState.moveLeft = false;
}

function refreshTouchMovement(touches) {
  const buttonSize = game.moveButtonSize * game.uiScale;
  const buttonBuffer = game.moveButtonBuffer * game.uiScale;
  const movementPosY = clientHeight - buttonSize - buttonBuffer;
  const moveAnchorX = clientWidth * 0.25;

  clearTouchMovment();
  for (let touchIndex = 0; touchIndex < touches.length; touchIndex++) {
    const clientX = touches[touchIndex].clientX;
    const clientY = touches[touchIndex].clientY;
    const identifier = touches[touchIndex].identifier;
    if (touchesToIgnore.indexOf(identifier) !== -1) {
      continue;
    }

    if (game.currentMode !== 'Play' || !player.showPlayer) {
      // Edit Mode Camera Movement
      const arrowIndex = game.getCameraArrowIndex(clientX, clientY); 
      //game.toolTip = arrowIndex+' c('+Math.floor(clientX)+','+Math.floor(clientY)+') m('+context.mouse.x+','+context.mouse.y+')'
      //console.log(game.toolTip)
      switch (arrowIndex) {
        case 0: // Left
          player.velocity.x = -3;
          break;
        case 1: // Right
          player.velocity.x = 3;
          break;
        case 2: // Up
          player.velocity.y = -3;
          break;
        case 3: // Down
          player.velocity.y = 3;
          break;
      }
    } else if (clientY >= clientHeight * 0.25) {
      // Player Gameplay Movement
      if (clientX < moveAnchorX) {
        // Move Left Is Pressed
        if (player.canMoveLeft && !player.isLaunched) {
          player.inputState.moveLeft = true;
        }
      } else if (clientX < clientWidth * 0.5) {
        // Move Right Is Pressed
        if (player.canMoveRight && !player.isLaunched) {
          player.inputState.moveRight = true;
        }
      } else {
        // Jump is Pressed
        this.tryJumpPlayer();
      }
    }
  }
}

function cancelTouchMovement(touches) {
  for (let touchIndex = 0; touchIndex < event.touches.length; touchIndex++) {
    const identifier = touches[touchIndex].identifier;
    if (touchesToIgnore.indexOf(identifier) === -1) {
      console.log('!!IGNORE TOUCH:' + identifier);
      touchesToIgnore.push(identifier);
    }
  }
}

function cleanCanceledTouches(touches) {
  identifiersToRemove = [];
  for (let ignoreIndex = 0; ignoreIndex < touchesToIgnore.length; ignoreIndex++) {
    const removeIdentifier = touchesToIgnore[ignoreIndex];
    let shouldRemove = true;
    for (let touchIndex = 0; touchIndex < event.touches.length; touchIndex++) {
      const identifier = touches[touchIndex].identifier;
      if (removeIdentifier == identifier) {
        // Still an active touch, don't stop ignoring
        shouldRemove = false;
      }
    }

    if (shouldRemove) {
      identifiersToRemove.push(removeIdentifier);
      console.log('!!REMOVE IGNORE TOUCH:' + removeIdentifier);
    }
  }

  // Remove touches from ignore list
  for (let removeIndex = 0; removeIndex < identifiersToRemove.length; removeIndex++) {
    touchesToIgnore.splice(touchesToIgnore.indexOf(identifiersToRemove[removeIndex]), 1);
  }
}

function runDebugFunction() {
  console.log("DEBUG FUNCTION EXECTUED")
  redisFrontendServices.unlockPrincess('AmbitiousVast9451');
}

window.addEventListener('touchstart', (event) => {
  //console.log('!!touchstart:');
  //console.log(event);
  cleanCanceledTouches(event.touches);
  if (popupIsActive) {
    clearTouchMovment();
    return;
  }
  refreshTouchMovement(event.touches);
});

window.addEventListener('touchend', (event) => {
  //console.log('!!touchend:');
  //console.log(event);
  cleanCanceledTouches(event.touches);
  refreshTouchMovement(event.touches);
});

window.addEventListener('touchmove', (event) => {
  //console.log('!!touchmove:');
  //console.log(event);
  //clearTouchMovment();
  refreshTouchMovement(event.touches);
});

window.addEventListener('touchcancel', (event) => {
  //console.log('!!touchcancel:');
  //console.log(event);
  cancelTouchMovement(event.touches);
  clearTouchMovment();
});

window.addEventListener('keydown', (event) => {
  //console.log('keydown', event);
  if (popupIsActive) return;
  inputVector = new Vector(0, 0);
  switch (event.key) {
    case 'd':
    case 'D':
    case 'ArrowRight':
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.x = 3;
      } else if (player.canMoveRight && !player.isLaunched) {
        player.inputState.moveRight = true;
      }
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.x = -3;
      } else if (player.canMoveLeft && !player.isLaunched) {
        player.inputState.moveLeft = true;
      }
      break;
    case 'ArrowDown':
    case 'S':
    case 's':
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.y = 3;
      } else {
        player.inputState.jumpDown = true;
      }
      break;
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.y = -3;
      } else {
        this.tryJumpPlayer();
      }
      break;
    case ' ':
      if (game.currentMode === 'Play') {
        this.tryJumpPlayer();
      }
      break;
    case 'r':
    case 'R':
      if (game.currentMode === 'Play' && player.goalReached == false) {
        //console.log("RETRYING LEVEL!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        game.retryLevel();
      }
    break;
    case '4':
      debugFunctionCount++;
    break;
    case 'G':
      if (debugFunctionCount == 4) {
        this.runDebugFunction();
      }
    break;
  }
  // player.processMovementInput(inputVector);
});

window.addEventListener('keyup', (event) => {
  //console.log('keyup', event);
  inputVector = new Vector(0, 0);
  switch (event.key) {
    case 'd':
    case 'D':
    case 'ArrowRight':
      player.inputState.moveRight = false;
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.x = 0;
      } else if (player.isLaunched === false) {
        player.velocity.x = 0;
      }
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      player.inputState.moveLeft = false;
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.x = 0;
      } else if (player.isLaunched === false) {
        player.velocity.x = 0;
      }
      break;
    case 'ArrowUp':
    case 'W':
    case 'w':
      player.inputState.moveUp = false;
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.y = 0;
      }
      break;
    case 'ArrowDown':
    case 'S':
    case 's':
      player.inputState.moveDown = false;
      player.inputState.jumpDown = false;
      if (game.currentMode !== 'Play' || !player.showPlayer) {
        player.velocity.y = 0;
      }
      break;
  }
});

// Disable context menu
window.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
});

// Saftey Check For Starting Game - Needed For iOS until Reddit Fixes Their Bugs
setTimeout(function () {
  if (receivedInitialState == false) {
    console.log(`!!ERROR: - No Initial State After 2 Sec Timeout - page.js`);
    //redisFrontendServices.getUserData();
  }
}, 2000); //delay is in milliseconds

window.addEventListener('load', () => {
  //console.log("----------------------------------------------------------------------------Webview LOAD!!")
  parent.postMessage({ type: 'webViewReady' }, '*');
});

window.addEventListener('message', (ev) => {
  const msg = JSON.stringify(ev.data);
  console.log('window event listener - message');
  
  if (ev.data.type != 'devvit-message') {
    console.log('!!ERROR: unknown message type');
    console.dir(ev);
    return;
  }
  
  const {
    postID,
    userData,
    postData,
    quitCount,
    keyAmount,
    gridData,
    ghostData,
    setGhostData,
    newMapData,
    realmData,
    mapData,
    wrongRealmName,
    gridDataRealmName,
    purchase,
    leaderBoardData,
    gameMode,
    initData,
    publishComplete,
  } = ev.data.data.message;

  const isDataTheSame = (key, newData) => {
    return lastResivedMsg && lastResivedMsg[key] && JSON.stringify(newData) === JSON.stringify(lastResivedMsg[key]);
  };

  // console.log('activePostIDs');
  // console.dir(activePostIDs);
  const index = activePostIDs.indexOf(postID);

  if (initData) {
    if (receivedInitialState === false) {
      receivedInitialState = true;
      console.log(`!!!!!!!!!!!!!!INITIAL STATE ARRIVED - page.js gameMode =`, gameMode);
    } else {
      //console.log('!!INFO: Ignoring Init Data Msg');
      return;
    }
  } else if (index >= 0) {
    activePostIDs.splice(index, 1);
    //console.log('!!INFO: Processing State Update - ', postID);
  } else {
    //console.log('!!INFO: Ignoring Non Active postID -', postID);
    return;
  }

  // Handle userData
  if (userData && !isDataTheSame('userData', userData)) {
    console.log('Processing User Data!!');
    //console.dir(userData);
    userInfo = new UserInfo(userData);
  }

  //Handle PostInfo
  if (postData && !isDataTheSame('postData', postData)) {
    console.log('Processing postData');
    console.dir(postData);
    postInfo = new PostInfo(postData);
  }

  // Start build loading
  if (gameMode) {
    if (gameMode == 'Build' && game.IsWaitingForBuildMap() == false) {
      debugLog('----------------Updating Game Mode To Build---------------------------')
      game.loadBuildMode();
      return;
    }
  }
  
  // Handle mapData
  if (mapData && !isDataTheSame('mapData', mapData)) {
    console.log('processing mapData - page.js');
    console.log('mapData', mapData);
    map.mapData = mapData;
    game.buildMapArrived();
    //map.drawTileMap();
  }

  // Handle gridData
  if (gridData) {
    console.log('processing gridData - page.js');
    console.dir(gridData);
    //console.log(`loadingBuildMode = ${loadingBuildMode}`);
    if (loadingBuildMode) {
      if (splashPopup.isPopupVisible) {
        splashPopup.hide();
      }
      otherTilesButton.iconRotated = false;
      game.showOtherTiles = false;
      //console.log(`game.currentMode = ${game.currentMode}`);
      if (game.allowNewPortionLoad()) {
        player.cachePlayerPosition(true);
      }
      game.currentMode = 'Edit';
      game.playAudioIndex('sfxMenuClick', 1);
      game.refreshUI = true;
      if (!zoomProgressing) {
        if (leaderBoardPopup.isPopupVisible) {
          leaderBoardPopup.hide();
        }

        if (seenTutoral == false) {
          seenTutoral = true;
          tutorialPopUp.show();
        }
      }
    }
    
    if (creatingNewMap && player.isDead) {
      player.isDead = false;
      game.gameTimer = new Timer(null, 'Counter', Date.now());
    }

    if (postInfo.postName != 'NEW MAP' && realmsPopUp.isPopupVisible) 
    {
      closeTileSwapUI();
    }
    map.allTiles = gridData;
    //console.log(`lastUpdate = ${lastUpdate}`);

    if (lastUpdate != undefined) {
      onLoadNewPortion(map.mapData.flagData);
    } else {
      window.focus();
      startGame(map.mapData.flagData);
      // initGhostSystemDelay = new Timer(5000, 'CountDown', Date.now(), () => {
      //   startRecordGhostData();
      //   playGhostData();
      // });
    }
    // } else if (Array.isArray(gridData)) {
    //   console.log('!!!!Ignored Grid Data', Array.isArray(gridData));
    //   buffering = false;
    // }
  }

  // Load play mode
  if (gameMode) {
    if (gameMode == 'Play') {
      debugLog('----------------Updating Game Mode To Play---------------------------')
      redisFrontendServices.updatePostDataCount('tries');
      game.currentMode = 'Play';
      game.gameTimer = new Timer(null, 'Counter', Date.now());
      game.setupUIForCurrentGameMode();
      startRecordGhostData();
    }
  }

  // Handle play ghostData
  if (ghostData && !isDataTheSame('ghostData', ghostData)) {
    debugLog(`Received Ghost Data`);
    debugLog(ghostData);

    if (ghostData) {
      currentPostGhostData = ghostData;
    } else {
      debugLog('No ghost data available to play');
      playingGhostData = false;
      loadingGhostData = false;
    }
  }

  // Handle purchase
  if (purchase && !isDataTheSame('purchase', purchase)) {
    console.log(`purchase`);
    console.dir(purchase);
    const tileStyleData = tilesConfig.styles.find((st) => st.name === purchase);
    currentTileStyleId = tileStyleData.styleId;
    closeTileSwapUI();
    userInfo.purchasedTileStyles.push(purchase);
  }

  // Handle creating new map
  if (publishComplete) {
    game.updatePopupText("PUBLISHING COMPLETE!!  Quit To View New Map");
  }

  // Handle leaderBoardData
  if (leaderBoardData) {
    //console.log("leaderBoardData!!!")
    //console.log(leaderBoardData)

    // Since sometimes we get back a cached version of the leaderboard, need to manually update
    let currentIndex = undefined;
    for (let lbIndex in leaderBoardData) {
      let entry = leaderBoardData[lbIndex];
      if (entry.member == userInfo.username) {
        currentIndex = parseInt(lbIndex);
      }
    }

    // Setup roomAtEnd based on current list size
    let roomAtEnd = leaderBoardData.length < 5 ? true : false;
    
    // Remove player if already in the list
    let allowInsert = true;
    if (currentIndex !== undefined && !isNaN(currentIndex)) {
      if (leaderBoardData[currentIndex].score >= game.finishTime) {
        leaderBoardData.splice(currentIndex, 1);
      } else {
        allowInsert = false; // Already at a higher rank
      }
    }

    // Insert player if greater then current scores
    let insertIndex = undefined;
    for (let lbIndex in leaderBoardData) {
      const entry = leaderBoardData[lbIndex];
      if (entry.score > game.finishTime && insertIndex === undefined && allowInsert) {
        insertIndex = parseInt(lbIndex);
      }
    }

    if (roomAtEnd && insertIndex === undefined && allowInsert) {
      insertIndex = leaderBoardData.length;
    }

    if (insertIndex !== undefined && !isNaN(insertIndex)) {
      const scoreEntry = {
        member: userInfo.username,
        score: game.finishTime
      }
      leaderBoardData.splice(insertIndex, 0, scoreEntry);
    }

    // Show leadeboard popup
    leaderBoardTimes = new Map();
    leaderBoardData.forEach((LData) => {
      if (LData.score >= 0 && leaderBoardTimes.size < 8) {
        leaderBoardTimes.set(LData.member, LData.score);
      }
    });
    lastRunTime = game.finishTime;
    leaderBoardPopup.show();
    game.addPopupToShowList(leaderBoardPopup);
  }

  lastResivedMsg = ev.data.data;
});
