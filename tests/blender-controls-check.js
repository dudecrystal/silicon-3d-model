async(page)=>{
 const checks=[];const check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
 await page.setViewportSize({width:1440,height:1000});await page.reload();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.scene);await page.waitForTimeout(600);
 const scene=()=>page.locator('canvas').evaluate(e=>JSON.parse(e.dataset.scene));
 const distance=(s)=>Math.hypot(...s.camera.map((v,i)=>v-s.target[i]));
 const drag=async(key)=>{if(key)await page.keyboard.down(key);const b=await page.locator('canvas').boundingBox();await page.mouse.move(b.x+b.width*.75,b.y+b.height*.5);await page.mouse.down({button:'middle'});await page.mouse.move(b.x+b.width*.75+60,b.y+b.height*.5+65,{steps:10});await page.mouse.up({button:'middle'});if(key)await page.keyboard.up(key);await page.waitForTimeout(550);};
 let a=await scene();await drag();let b=await scene();check(JSON.stringify(a.camera)!==JSON.stringify(b.camera)&&b.target.every(v=>Math.abs(v)<.001),'Middle-drag orbits around target');
 a=b;await drag('Shift');b=await scene();check(JSON.stringify(a.target)!==JSON.stringify(b.target),'Shift + middle-drag pans target');check(Math.abs(distance(a)-distance(b))<.02,'Panning preserves zoom distance');
 a=b;await drag('Control');b=await scene();check(Math.abs(distance(a)-distance(b))>.1,'Ctrl + middle-drag dollies camera');
 check(b.selection===null,'Blender gestures do not select particles');
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(550);check((await scene()).target.every(v=>Math.abs(v)<.001),'Reset recenters after pan');
 return {passed:checks.length,checks};
}
