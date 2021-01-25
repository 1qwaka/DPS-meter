const DPSmeter = extendContent (Block,"dps-meter",{
  /*
  bounds(x, y, rect){
    var size = Vars.world.tile(x,y).build.getS();
    var offset = ((size + 1) % 2) * tilesize / 2;
    return rect.setSize(size * 8).setCenter(x * 8 + offset, y * 8 + offset);
  }
  */
  setStats(){
    this.super$setStats();
    this.stats.remove(Stat.health);
  }
});
DPSmeter.flags = EnumSet.of(BlockFlag.unitModifier);
var lastConfig = {
  unitMode: false,
  _team: null
};

var textSize = 0.23;
var scrollPos = 0;

/*
1.добавить изменение периода считывания урона ✓
2.сделать изменяемый размер ×
3.сделать изменение лимита юнитов для команды ✓
4.сделать возможность отображения урона как по юнитам✓
5.сделать возможность увеличения области "ловли" пуль, чтоб иммитировать щит
*/

DPSmeter.buildType = () => extend(Building,{
  deltaHealth: 0,
  _team: null,
  t: 60,
  _unitMode: lastConfig.unitMode,
  //_s: DPSmeter.size,
  load (){
    this.super$load();
    this.teamRegion = Core.atlas.find(this.name+"-team");
  },
  update(){
    
    
    if(this._team != null){
      this.team = this._team;
    } else {
      this._team = this.team;
    }
    
    if(this.timer.get(0,this.t)){
      //print(this._s)
      this.deltaHealth = this.block.health-this.health;
      if(this.deltaHealth<5){
        this.deltaHealth = this.deltaHealth.toFixed(2);
      } else {
        this.deltaHealth = Mathf.round(this.deltaHealth);
      }
      this.health = this.block.health;
      
      //this.deltaHealth = 0;
    }
    
  },
  damage(amount){
    //this.deltaHealth += amount;
    this.health -= amount;
  },
  placed(){
    this.super$placed();
    this._team = lastConfig._team;
  },
  draw(){
    //Draw.rect(this.block.region,this.tile.drawx(),this.tile.drawy(),this.size,this.size)
    this.super$draw();
    
    var amount = this.deltaHealth+"";
    for(var i = 0; i < 9 - (amount.length - (amount.indexOf(".",0) == -1 ? 0 : 1)); i++ ){
      amount = "0" + amount;
    }
    
    var font = Fonts.outline;
    var ints = font.usesIntegerPositions();
    font.getData().setScale(textSize/Scl.scl(1.0));
    font.setUseIntegerPositions(false);
    
    font.setColor(Color.white);
    
    var z = Draw.z();
    Draw.z(300);
    font.draw(amount,this.x-this.block.size*4, this.y+1);
    Draw.z(z);
    
    font.setUseIntegerPositions(ints);
    font.getData().setScale(1);
    
  },
  addButton(cont,team){
    cont.button(new TextureRegionDrawable(Core.atlas.find("dps-meter-team")).tint(team.color),Styles.clearToggleTransi,run(()=>{
      this._team = team;
      this.team = team;
      lastConfig._team = team;
      Vars.indexer.updateIndices(this.tile);
      Vars.control.input.frag.config.hideConfig();
    }));
  },
  buildConfiguration (table){
    try{
      
      //var group = new ButtonGroup();
      //group.setMinCheckCount(0);
      //table.background(new TextureRegionDrawable(Core.atlas.white()).tint(new Color(0,0,0,0.6)));
      table.background(Styles.black6);
      var cont = new Table();
      cont.defaults().size(50);
      
      for(var i in Team.all){
        
        var team = Team.all[i];
        /*
        var button = cont.button(Tex.whiteui, Styles.clearToggleTransi, 24, run(() => Vars.control.input.frag.config.hideConfig())).group(group).get();
        button.changed(run(()=>{
          print(team)
          print(button.isChecked())
          this._team = button.isChecked() ? team : null;
        }));
        button.getStyle().imageUp = new TextureRegionDrawable(Core.atlas.find("dps-meter-team")).tint(team.color);
        button.update(run(() => button.setChecked(this._team == team)));
        */
        
        this.addButton(cont,team);

        if(i++ % 4 == 3){
          cont.row();
        }
        
      }
      
      var pane = new ScrollPane(cont, Styles.smallPane);
      pane.setScrollingDisabled(true, false);
      pane.setScrollYForce(scrollPos);
      pane.update(run(() => {
        scrollPos = pane.getScrollY();
      }));
      pane.setOverscroll(false, false);
      table.add(pane).maxHeight(Scl.scl(40));
      
      table.button(Icon.units,run(()=>{
        this._unitMode = !this._unitMode;
        lastConfig.unitMode = this._unitMode;
      }));
      
      table.row();
      table.add(Core.bundle.get("dpsmeter.time"));
      table.row();
      var a = table.area(this.t/60,cons(t=>{
        try {
          this.t = Mathf.clamp(Mathf.round(60*t),60,36000);
        } catch(e){
          this.t = 60;
        }
      })).width(100);
      //a.setMaxLength(5);
      table.add(Core.bundle.format("setting.seconds",""));
      //table.row();
      
    } catch (e){
      print(e);
      print(e.stack);
    }
  },
  /*
  setS(v){
    this._s = v;
  },
  getS(){
     return this._s;
  },
  hitbox (out){
    print(this._s)
    out.setCentered(this.x, this.y, this._s*8,this._s*8);
  },
  */
  write(write){
     write.bool(this._unitMode);
     write.f(this.t);
     //write.i(this._team.id);
  },
  read(read,revision){
    this._unitMode = read.bool();
    this.t = read.f();
    //this._team = Team.all[read.i()];
  },
  drawCracks(){
    
  },
  collision(other){
    this.damage(other.damage*other.damageMultiplier()*
    (this._unitMode ? 1 : other.type.buildingDamageMultiplier));
    return true;
  },
  drawTeamTop(){
    Draw.color(this.team.color);
    Draw.rect(this.block.teamRegion, this.x,this.y);
    if(this._unitMode) Draw.rect(Icon.units.getRegion(),this.x,this.y+7,9,7);
    Draw.color();
  },
  drawTeam(){
    
  },
  icons(){
    return [Core.atlas.find(this.name)];
  },
  interactable(){
    return true;
  }
});