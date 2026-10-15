async (page) => {
  const results=[];
  const check=(condition,label)=>{if(!condition)throw new Error(label);results.push(label);};
  const scene=()=>page.locator('canvas').evaluate(el=>JSON.parse(el.dataset.scene));
  const settle=async()=>{await page.waitForFunction(()=>{const c=document.querySelector('canvas');return c?.dataset.scene&&JSON.parse(c.dataset.scene).triangles>0;});await page.waitForTimeout(400);};
  const base=page.url().replace(/\/$/,'');
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await settle();
  check(await page.title()==='Ranveer Singh — Silicon 3D Model','Exact document title');
  for(const mass of [28,29,30]){
    await page.getByRole('button',{name:`Si-${mass}`,exact:true}).click();await page.waitForTimeout(400);
    const s=await scene();check(s.isotope===mass&&s.counts.Proton===14&&s.counts.Neutron===mass-14&&s.counts.Electron===14,`Si-${mass} rendered particle counts`);
    check(JSON.stringify(s.shells)==='[2,8,4]',`Si-${mass} electron shells`);
    check(s.triangles>0&&s.triangles<100000,`Si-${mass} triangle budget (${s.triangles})`);
    check(await page.getByRole('heading',{name:`Silicon-${mass}`,exact:true}).count()===1,`Si-${mass} visible information`);
  }
  await page.getByRole('button',{name:'Si-28',exact:true}).click();await page.waitForTimeout(300);
  await page.getByRole('button',{name:'Si-30',exact:true}).click();await page.waitForTimeout(35);
  const mid=await page.getByTestId('active-indicator').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
  check(mid>0&&mid<184,'Indicator physically slides through an intermediate position');
  const fading=await scene();check(fading.opacity<1,'Model fades during isotope change');
  await page.getByRole('button',{name:'Si-29',exact:true}).click();await page.getByRole('button',{name:'Si-28',exact:true}).click();await page.waitForTimeout(400);
  check((await scene()).isotope===28,'Rapid switching settles on latest requested isotope');
  check(await page.getByRole('status',{name:'Loading 3D model'}).count()===0,'No skeleton during ordinary isotope switching');
  const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();
  const b=await canvas.boundingBox();const before=(await scene()).camera;
  await page.mouse.move(b.x+b.width*.7,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.7+90,b.y+b.height*.5+35,{steps:12});await page.mouse.up();await page.waitForTimeout(400);
  check(JSON.stringify((await scene()).camera)!==JSON.stringify(before),'Mouse drag orbits camera');
  check((await scene()).selection===null,'Dragging does not select a particle');
  const preZoom=(await scene()).camera;await page.mouse.wheel(0,-300);await page.waitForTimeout(400);
  check(JSON.stringify((await scene()).camera)!==JSON.stringify(preZoom),'Mouse wheel zooms camera');
  for(const kind of ['Electron','Proton','Neutron']){
    await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(550);
    const s=await scene();const targets=s.projected.filter(p=>p.kind===kind).sort((a,b)=>a.z-b.z);
    let hit=false;
    for(const target of targets.slice(0,10)){
      const bb=await canvas.boundingBox();await page.mouse.click(bb.x+target.x,bb.y+target.y);await page.waitForTimeout(80);
      if((await scene()).selection===kind){hit=true;break;}
      await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(500);
    }
    check(hit,`Actual 3D sphere picking identifies ${kind}`);await page.waitForTimeout(500);
    const focused=await scene();check(focused.target.some(v=>Math.abs(v)>.001),`${kind} selection focuses camera`);
  }
  await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(600);
  check((await scene()).selection===null&&(await scene()).target.every(v=>Math.abs(v)<.001),'Reset clears particle and restores origin');
  await page.getByRole('group',{name:/3D atom/}).focus();const kb=(await scene()).camera;
  await page.keyboard.press('ArrowLeft');await page.waitForTimeout(400);check(JSON.stringify((await scene()).camera)!==JSON.stringify(kb),'Keyboard arrow rotates camera');
  await page.keyboard.press('Escape');await page.waitForTimeout(500);
  await page.getByRole('button',{name:'Si-29',exact:true}).focus();check(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle)!=='none','Keyboard focus ring is visible');
  await page.getByRole('button',{name:'Select a neutron',exact:true}).click();await page.waitForTimeout(500);check((await scene()).selection==='Neutron','Keyboard-accessible particle alternative');
  await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(550);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  for(const width of [320,390,768,1024]){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(250);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow at ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await settle();
  await page.getByRole('button',{name:'Si-30',exact:true}).click();await page.waitForTimeout(100);
  check((await scene()).isotope===30,'Reduced-motion isotope switch completes');
  const indicator=await page.getByTestId('active-indicator').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);check(indicator===184,'Reduced-motion indicator is correctly aligned');
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  // Chrome's touch input emulation verifies OrbitControls' one- and two-finger paths.
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await canvas.scrollIntoViewIfNeeded();const tb=await canvas.boundingBox();let s0=await scene();
  const x=Math.round(tb.x+tb.width/2),y=Math.round(tb.y+tb.height/2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+50,y:y+30,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
  check(JSON.stringify((await scene()).camera)!==JSON.stringify(s0.camera),'Emulated touch drag rotates camera');s0=await scene();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-55,y,id:1},{x:x+55,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
  check(JSON.stringify((await scene()).camera)!==JSON.stringify(s0.camera),'Emulated two-finger pinch zooms camera');await cdp.detach();
  const loadingPage=await page.context().newPage();await loadingPage.route('**/*AtomViewport*',async route=>{await new Promise(r=>setTimeout(r,650));await route.continue();});
  await loadingPage.goto(base,{waitUntil:'domcontentloaded'});await loadingPage.getByRole('status',{name:'Loading 3D model'}).waitFor({state:'visible'});results.push('Initial loading skeleton appears while scene module loads');
  await loadingPage.getByRole('status',{name:'Loading 3D model'}).waitFor({state:'hidden'});results.push('Initial skeleton disappears after scene readiness');await loadingPage.close();
  const fallbackPage=await page.context().newPage();await fallbackPage.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.includes('webgl'))return null;return original.call(this,type,...args);};});
  await fallbackPage.goto(base);await fallbackPage.getByText('3D rendering is unavailable.').waitFor();check(await fallbackPage.getByRole('status',{name:'Loading 3D model'}).count()===0,'WebGL failure shows fallback instead of endless skeleton');await fallbackPage.close();
  const legend=await page.locator('.legend i').evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundColor));check(JSON.stringify(legend)==='["rgb(255, 113, 133)","rgb(167, 139, 250)","rgb(101, 217, 255)"]','Legend matches exact particle material palette');
  return {passed:results.length,checks:results,scope:'Google Chrome; touch is emulated, not physical-device verification'};
}

