let _showWallsEW = false

Hooks.once('init', async () => {
  // Register custom module settings
  game.settings.register('showwalls', 'showDoor', {
    name: "showwalls.tools.showDoor.name",
    hint: "showwalls.tools.showDoor.hint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: x => window.location.reload()
  });
});

Hooks.once('ready', () => {
	// Do anything once the module is ready
	if (!game.modules.get("lib-wrapper")?.active && game.user.isGM){
    ui.notifications.error(`The '${MODULE_NAME}' module requires to install and activate the 'libWrapper' module.`);
    return;
  }

  //@ts-ignore
  libWrapper.register(MODULE_NAME, 'ControlsLayer.prototype.drawDoors', ControlsLayerPrototypeDrawDoorsHandler, 'WRAPPER');
  //@ts-ignore
  //libWrapper.register(MODULE_NAME, 'Wall.prototype._onModifyWall', WallPrototypeOnModifyWallHandler, 'WRAPPER');
  //@ts-ignore
  libWrapper.register(MODULE_NAME, 'WallsLayer.prototype.activate', WallsLayerPrototypeActivate, 'WRAPPER');

});

Hooks.on("getSceneControlButtons", (controls, b, c) => {
  if (game.user.isGM) {
    basictools = controls.find((x) => x["name"] == "tiles").tools;
    basictools.push({
      active: _showWallsEW,
      icon: "fas fa-landmark",
      name: "showwallsToggle",
      title: game.i18n.localize("showwalls.tools.toggle.hint"),
      onClick: (toggle) => {
        _showWallsEW = toggle;
        _toggleShowWallsEverywhere(toggle)
      },
      toggle: true,
    });
  }
});

function _toggleShowWallsEverywhere(toggle){
  if(toggle){
    let g = new PIXI.Graphics()
    g.name = "_showWallsEW"
    canvas.walls.placeables.forEach((c)=>{
    g.beginFill(c.children[1]._fillStyle.color).lineStyle(5,c.children[1]._fillStyle.color).drawPolygon(c.coords).endFill()
    })
    canvas.effects.addChild(g)
  }else{
    canvas.effects.children.forEach((c)=>{
      if(c.name == "_showWallsEW") c.destroy()
    })
  }
}

async function ControlsLayerPrototypeDrawDoorsHandler(wrapped, ...args) {
  if(!game.settings.get('showwalls', 'showDoor')){
    return;
  }
  // Create the container
  if ( this.doors ) {
    this.doors.destroy({children: true});
    this.doors = null;
  }
  const doors = new PIXI.Container();

  // Iterate over all walls, selecting the doors
  for ( let w of canvas.walls.placeables ) {
    if ( w.data.door === CONST.WALL_DOOR_TYPES.NONE ) {
      continue;
    }
    if ( (w.data.door === CONST.WALL_DOOR_TYPES.SECRET) && !game.user.isGM ){
      continue;
    }
    let dc = doors.addChild(new DoorControl(w));
    if(game.settings.get(MODULE_NAME,'enabled')===true){
      dc.visible = true;
    }else {
      dc.visible = false; // Start door controls as initially not visible and reveal them later
    }

    if(dc.transform.scale){
      await dc.draw();
    }
  }
  this.doors = this.addChild(doors);

  // Toggle visibility for the set of door control icons
  if(game.settings.get(MODULE_NAME,'enabled')!==true){
    this.doors.visible = !canvas.walls._active;
  }
  return wrapped(...args);
};

//Overwrite Activate call to prevent doors from going invisible.
function WallsLayerPrototypeActivate(wrapped, ...args) {
  if(!game.settings.get('showwalls', 'showDoor')){
    return;
  }
  //PlaceablesLayer.prototype.activate.call(this)
  //Force Show Doors is set to True
  if(game.settings.get(MODULE_NAME,'enabled')===false){
    if (canvas.controls){
      canvas.controls.doors.visible = false;
    }
  }
  return wrapped(...args);
}