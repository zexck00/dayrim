/* The look of each of the 10 stages: colour grade, light, vegetation kit, scattered extras, water, weather.
   Pure data (no Three.js), so the tests can check that every stage is complete.
   Colours are DAYRIM-64 entries so the palette pass keeps them exact. */
export const THEME_KEYS=['n','grade','sat','lift','ink','sun','sky','gnd','tree','canopy','trunk','shrub','grass','flower','extras','water','weather','glow'];

export const STAGE_THEMES=[
  {n:'Sunrise Hollow',grade:[1.025,1,0.96],sat:1.05,lift:[0,0,0],ink:'#1a1626',sun:'#fff6c0',sky:'#f8f4e4',gnd:'#c8c4b0',
    tree:'oak',canopy:['#3f9048','#5a9a48','#2f7a3f'],trunk:'#4a3524',shrub:['#2f7a3f','#4f8a3f','#3f9048'],grass:['#4f8a3f','#5a9a48','#a8d060'],flower:['#f0e070','#f08ab0','#e8e4d0'],
    extras:[['stone',14],['flowerbed',30]],water:{deep:'#3d7486',shallow:'#4a879a',foam:'#e8e4d0',hi:'#a8dce4'},weather:'butterflies',glow:'#fff6c0'},
  {n:'Noonshade Thicket',grade:[1,1.015,0.97],sat:1.03,lift:[0,0,0],ink:'#1a1626',sun:'#f8f4e4',sky:'#f8f4e4',gnd:'#9c8e70',
    tree:'pine',canopy:['#2a5f38','#2f7a3f','#1f3e2a'],trunk:'#5c4c3c',shrub:['#2f7a3f','#2a5f38','#4f8a3f'],grass:['#3f9048','#4f8a3f','#a8d060'],flower:['#f0e070','#f0a040','#f8f4e4'],
    extras:[['stump',20],['fernbed',30]],water:{deep:'#3d7486',shallow:'#4a879a',foam:'#f8f4e4',hi:'#a8dce4'},weather:'pollen',glow:'#fff6c0'},
  {n:'Duskwater Fen',grade:[1.04,0.965,0.93],sat:.95,lift:[.02,0,0],ink:'#2a2438',sun:'#e8c95c',sky:'#70c0a8',gnd:'#3e6a48',
    tree:'willow',canopy:['#3e6a48','#2f6a60','#20504c'],trunk:'#4a3524',shrub:['#2f6a60','#3e6a48','#20504c'],grass:['#3e6a48','#2f6a60','#70c0a8'],flower:['#9a7ad8','#70c0a8','#f0e070'],
    extras:[['reed',90],['lily',60],['stump',10]],water:{deep:'#20504c',shallow:'#2f6a60',foam:'#70c0a8',hi:'#a8dce4'},weather:'fireflies',glow:'#f0e070'},
  {n:'Webbed Barrow',grade:[0.95,0.975,1.04],sat:.72,lift:[0,0,.02],ink:'#0d0b14',sun:'#a8dce4',sky:'#8a8678',gnd:'#4e4a5a',
    tree:'dead',canopy:['#5c4c3c','#4a3524','#6a6574'],trunk:'#4a3524',shrub:['#3e6a48','#443f54','#2a5f38'],grass:['#3e6a48','#6a6574','#8a8678'],flower:['#9a7ad8','#e8e4d0','#a8dce4'],
    extras:[['stone',40],['mound',18],['web',22],['bones',16]],water:{deep:'#1c2a4a',shallow:'#2c4470',foam:'#c8c4b0',hi:'#6aa8c8'},weather:'dust',glow:'#a8dce4'},
  {n:'Sporefall Marsh',grade:[1,1.03,0.93],sat:1,lift:[0,.01,0],ink:'#1a1626',sun:'#a8d060',sky:'#c8c4b0',gnd:'#7a7038',
    tree:'shroom',canopy:['#9a7ad8','#c25a66','#f0a040'],trunk:'#e8e4d0',shrub:['#7a7038','#4f8a3f','#3e6a48'],grass:['#7a7038','#90e040','#4f8a3f'],flower:['#90e040','#c080ff','#f0a040'],
    extras:[['glowshroom',70],['reed',40]],water:{deep:'#5c4c3c',shallow:'#7a7038',foam:'#90e040',hi:'#a8d060'},weather:'spores',glow:'#90e040'},
  {n:'Ruined Vale',grade:[1.01,0.995,0.97],sat:.88,lift:[0,0,0],ink:'#1a1626',sun:'#fff6c0',sky:'#e8e4d0',gnd:'#8a8678',
    tree:'cypress',canopy:['#2a5f38','#3e6a48','#1f3e2a'],trunk:'#4a3524',shrub:['#3e6a48','#2f7a3f','#4f8a3f'],grass:['#4f8a3f','#3e6a48','#8a8678'],flower:['#e8e4d0','#f08ab0','#f0e070'],
    extras:[['column',34],['rubble',40],['ivy',20]],water:{deep:'#3d7486',shallow:'#4a879a',foam:'#e8e4d0',hi:'#a8dce4'},weather:'leaves',glow:'#fff6c0'},
  {n:'Rustleaf Woods',grade:[1.05,0.99,0.92],sat:1.02,lift:[.01,0,0],ink:'#2a211a',sun:'#f2c9a0',sky:'#f0e070',gnd:'#a8682a',
    tree:'maple',canopy:['#c88a30','#a8682a','#f0a040'],trunk:'#e8e4d0',shrub:['#a8682a','#c88a30','#7a5a38'],grass:['#8a6840','#c88a30','#7a7038'],flower:['#e8463f','#f0a040','#f0e070'],
    extras:[['leafpile',50],['gear',16],['stump',14]],water:{deep:'#3d7486',shallow:'#4a879a',foam:'#f0e070',hi:'#a8dce4'},weather:'autumn',glow:'#f0a040'},
  {n:'Midnight Warrens',grade:[0.92,0.96,1.08],sat:.85,lift:[0,0,.03],ink:'#0d0b14',sun:'#6aa8c8',sky:'#2c4470',gnd:'#2a2438',
    tree:'root',canopy:['#20504c','#1f3e2a','#2c4470'],trunk:'#2a211a',shrub:['#20504c','#2c4470','#1f3e2a'],grass:['#20504c','#3a8a7a','#2c4470'],flower:['#70c0a8','#6aa8c8','#9a7ad8'],
    extras:[['crystal',46],['burrow',16],['stone',18]],water:{deep:'#1c2a4a',shallow:'#2c4470',foam:'#a8dce4',hi:'#6aa8c8'},weather:'mist',glow:'#70c0a8'},
  {n:'Blightmoor',grade:[1,0.94,1.05],sat:.9,lift:[.01,0,.02],ink:'#0d0b14',sun:'#9a7ad8',sky:'#6a4c9a',gnd:'#3a2f5a',
    tree:'thorn',canopy:['#4c3a70','#3a2f5a','#6a4c9a'],trunk:'#2a2438',shrub:['#3a2f5a','#4c3a70','#443f54'],grass:['#443f54','#4c3a70','#6a4c9a'],flower:['#c080ff','#ff70a0','#70e0c0'],
    extras:[['voidpool',22],['thornbush',40],['bones',14]],water:{deep:'#2c2448',shallow:'#3a2f5a',foam:'#c080ff',hi:'#9a7ad8'},weather:'ash',glow:'#c080ff'},
  {n:'The Last Night',grade:[1.03,0.92,0.92],sat:.78,lift:[.03,0,0],ink:'#0d0b14',sun:'#ff6a5f',sky:'#3a1418',gnd:'#1a1626',
    tree:'spire',canopy:['#1a1626','#2a2438','#3b3350'],trunk:'#0d0b14',shrub:['#2a2438','#3a1418','#1a1626'],grass:['#2a2438','#3a1418','#4e4a5a'],flower:['#e8463f','#ff6a5f','#f0a040'],
    extras:[['lava',34],['spike',30],['bones',16]],water:{deep:'#3a1418',shallow:'#a8302a',foam:'#f0a040',hi:'#ff6a5f'},weather:'embers',glow:'#e8463f'}
];
/* Story chapters use the stage whose ground matches their biome */
export function themeFor(stage,story,biome){
  if(!story)return STAGE_THEMES[Math.max(0,Math.min(9,(stage||1)-1))];
  return STAGE_THEMES[[0,1,2,3,6,8][biome]??0];
}
