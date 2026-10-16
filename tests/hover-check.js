async (page) => {
 const checks=[]; const check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.scene);await page.waitForTimeout(650);
 const scene=()=>page.locator('canvas').evaluate(e=>JSON.parse(e.dataset.scene));
 const moveTo=async(p)=>{const b=await page.locator('canvas').boundingBox();await page.mouse.move(b.x+p.x,b.y+p.y);};
 const candidates=async(kind)=>(await scene()).projected.filter(p=>p.kind===kind).sort((a,b)=>a.z-b.z);
 await moveTo((await candidates('Proton'))[0]);await page.waitForTimeout(750);check(await page.getByRole('tooltip').count()===0,'Overview does not show dwell labels');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(350);await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(650);
 const hoverCamera=(await scene()).camera;
 for(const kind of ['Proton','Neutron']){
  let found=false;
  for(const p of (await candidates(kind)).slice(0,12)){
   await page.mouse.move(250,100);await moveTo(p);await page.waitForTimeout(200);check(await page.getByRole('tooltip').count()===0,`${kind} label waits before appearing`);await page.waitForTimeout(550);
   if(await page.getByRole('tooltip').count()&&await page.getByRole('tooltip').textContent()===kind){found=true;break;}
  }
  check(found,`Dwell identifies ${kind} while zoomed`);check((await scene()).selection===null&&JSON.stringify((await scene()).camera)===JSON.stringify(hoverCamera),'Hover does not select or move camera');
  if(kind==='Neutron')await page.screenshot({path:'outputs/silicon-hover-detail.png',fullPage:true});
  await page.mouse.move(250,100);await page.waitForTimeout(100);check(await page.getByRole('tooltip').count()===0,'Leaving removes label');
 }
 await moveTo((await candidates('Proton'))[0]);await page.waitForTimeout(200);await page.mouse.move(250,100);await page.waitForTimeout(650);check(await page.getByRole('tooltip').count()===0,'Leaving before dwell cancels timer');
 await moveTo((await candidates('Proton'))[0]);await page.waitForTimeout(750);await page.mouse.down();await page.mouse.move(790,520,{steps:8});await page.mouse.up();await page.waitForTimeout(100);check(await page.getByRole('tooltip').count()===0,'Orbit clears hover label');
 await page.getByRole('button',{name:'Si-30',exact:true}).click();await page.waitForTimeout(400);check(await page.getByRole('tooltip').count()===0,'Isotope change clears hover');
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(600);await page.screenshot({path:'outputs/silicon-refined-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(450);await page.screenshot({path:'outputs/silicon-refined-mobile.png',fullPage:true});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile has no overflow');
 check((await scene()).triangles<100000,'Refined geometry stays under triangle budget');
 return {passed:checks.length,checks};
}

