/////////////////////////////////////////////////////////
// global variables
//var camera, renderer;
var agent;
//var markerRoot;
var artoolkitMarker;
var onRenderFcts= [];
var scene, camera, renderer, clock, deltaTime, totalTime;
var arToolkitSource, arToolkitContext;
var markerRoot1, markerRoot2;
var smoothedControls;
var stats;
var clock, deltaTime, totalTime;
var hiro_pos_x, hiro_pos_z;
// program starts here ...
init();
animate();

var counting = true;
var startTime = Date.now();
var intervalId;
var agentB, agentR;
var minute, second, msecond;

function updateCounter() {
  if(counting) {
      let currentTime = Date.now();
      msecond = ("0" + (currentTime - startTime) % 1000).substr(-3, 3);
      let counter = Math.floor((currentTime - startTime)/1000);
      //let hour = ("0" + Math.floor(counter / 3600)).substr(-2, 2);
      minute = ("0" + Math.floor((counter % 3600) / 60)).substr(-2, 2);
      second = ("0" + Math.floor(counter % 60)).substr(-2, 2);
      document.getElementById('counter').textContent = `${minute} minutes : ${second} second . ${msecond} millisecond`;
  }
}

function getRandom(min,max){
    return Math.floor(Math.random()*max)+min;
};

////////////////////////////////////////
// create an Object3D of the given object
// so that it is centered at +Y axis
function unitize (object, targetSize) {  
	// find bounding box of 'object'
	var box3 = new THREE.Box3();
	box3.setFromObject (object);
	var size = new THREE.Vector3();
	size.subVectors (box3.max, box3.min);
	var center = new THREE.Vector3();
	center.addVectors(box3.max, box3.min).multiplyScalar (0.5);
	console.log ('center: ' + center.x + ', '+center.y + ', '+center.z );
	console.log ('size: ' + size.x + ', ' +  size.y + ', '+size.z );
    
	// uniform scaling according to objSize
	var objSize = findMax (size);
	var scaleSet = targetSize/objSize;
	var theObject =  new THREE.Object3D();
    object.maxX = center.x + 6;
    object.maxY = center.z + 10;
    object.minX = center.x - 6;
    object.minY = center.z - 10;
    object.w = 20;
    object.h = 12;
    theObject.add (object);
	object.scale.set (scaleSet, scaleSet, scaleSet);
	object.position.set (-center.x*scaleSet, -center.y*scaleSet + size.y/2*scaleSet, -center.z*scaleSet);
	return theObject;
	
	// helper function
	function findMax(v) {
		if (v.x > v.y) {
			return v.x > v.z ? v.x : v.z;
		} else { // v.y > v.x
			return v.y > v.z ? v.y : v.z;
		} 
	}
}

function init() {
    initThree();//new scene

    if (counting) {
      clearInterval(intervalId);
    } else {
      clearInterval(intervalId);
      startTime = Date.now();
      intervalId = setInterval(updateCounter, 15);
    }

    //add camera
//    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera = new THREE.Camera();
    camera.position.z = 300;
    camera.position.y = 700;
    scene.add(camera)
    //end add camera

    //add light
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );//0.4
	scene.add( ambientLight );

	var pointLight = new THREE.PointLight( 0xffffff, 1 );//0.8
	camera.add( pointLight );
  
    var light = new THREE.DirectionalLight(0xffffff);//光源顏色
    light.position.set(20, 10, 5);//光源位置
    scene.add(light);//光源新增到場景中
    //end add light
  
    //add renderer
    renderer = new THREE.WebGLRenderer({
      antialias : true,
      alpha: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    document.body.appendChild( renderer.domElement );
    //end add renderer
  
    //add clock
    clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
    //end add clock

    //add controls
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);
    //end add controls
    /////////////////////////////////////////////////////////////////////
    var gridXZ = new THREE.GridHelper(800, 40, 0xff9696, 'white');
    scene.add(gridXZ);
    // in scene.js
    sceneFromJSON ( );  // using LevelDesigner
    //////////////////////////////////////////////////////////////////////////	
    let size = 10; // halfsize of agent
    agentB = new Agent("BlueArrow", new THREE.Vector3(getRandom(-400, 800), 0, getRandom(-400, 800)), size, 0xaad4ff);
    agentR = new Agent("RedArrow", new THREE.Vector3(getRandom(-400, 800), 0, getRandom(-400, 800)), size, 0xffb7dc);
    updateScoreBoard(agentB, agentR);
    
    ////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize();
        console.log(arToolkitContext.arController);
        if( arToolkitContext.arController !== null ){
          arToolkitContext.arController.addEventListener('getMarker', function(ev) {
          console.log('marker pos: ', ev.data.marker.pos);
          //******try get marker pos
          hiro_pos_x = ev.data.marker.pos[0];
          hiro_pos_z = ev.data.marker.pos[1];
          });
        };
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: '../../data/data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});
  
    //*********update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arToolkitSource.ready === false )	return

		arToolkitContext.update( arToolkitSource.domElement )
	})
    //**********
	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////
	let loader = new THREE.TextureLoader();
	let texture = loader.load( './border.png' );
		
	let patternArray = ["pattern_map_pin", "kanji", "hiro", "no_strong", "no_strong", "no_strong", "no_strong"];
	let colorArray   = [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0000ff, 0xcc00ff, 0xcccccc];
//    markerRoot = new THREE.Group();
//    scene.add(markerRoot);
	for (let i = 0; i < 4; i++)
	{	
        let markerRoot = new THREE.Group();
		scene.add(markerRoot);
		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
			type : 'pattern', patternUrl : "../../data/data/patt." + patternArray[i],
		});
	
		let mesh = new THREE.Mesh( 
			new THREE.CylinderGeometry( 30, 30, 0.2, 32 ),
            //new THREE.CubeGeometry(1.25,1.25,1.25),
            //new THREE.PlaneBufferGeometry(1,1, 4,4),
			new THREE.MeshBasicMaterial({color:colorArray[i], transparent:true, opacity:0.5})// map:texture,
		);
        if(patternArray[i] == "hiro"){
          mesh.position.x = hiro_pos_x;
          mesh.position.z = hiro_pos_z;
        }
		mesh.position.y = 1.25/2;
		markerRoot.add( mesh );
        ////////////////////////////////////////////////////////////
        // load obj
        ////////////////////////////////////////////////////////////
        // model
        ///*
        function onProgress(xhr) { console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ); }
        function onError(xhr) { console.log( 'An error happened' ); }

        new THREE.MTLLoader()
            .setPath( './pawn/' )
            .load( 'pawn.mtl', function ( materials ) {
                materials.preload();
                new THREE.OBJLoader()
                    .setMaterials( materials )
                    .setPath( './pawn/' )
                    .load( 'pawn.obj', function ( group ) {
                        //var theObject =  unitize (group, 20);
                        mesh0 = group.children[0];
                        mesh0.material.side = THREE.DoubleSide;
                        //mesh0.rotation.x= -Math.PI/2;
                        //mesh0.rotation.y= 1.5*Math.PI;
                        mesh0.position.y = 40;
                        mesh0.scale.set(10,10,10);
                        markerRoot.add(mesh0);
                    }, onProgress, onError );
            });//*/
    }
    
//    //**********build a smoothedControls
//	var smoothedRoot = new THREE.Group()
//	scene.add(smoothedRoot)
//	var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
//		lerpPosition: 0.4,
//		lerpQuaternion: 0.3,
//		lerpScale: 1,
//	})
//	onRenderFcts.push(function(delta){
//		smoothedControls.update(markerRoot)
//	})
//    //**********
//    stats = new Stats();
//	document.body.appendChild( stats.dom );
//	// render the scene
//	onRenderFcts.push(function(){
//		renderer.render( scene, camera );
//		stats.update();
//	})
  
}

function update()
{
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
    //console.log("here?");
}

function render() {
  renderer.render(scene, camera);
}

function animate() {

  agentB.update(0.01)
  agentR.update(0.01)
  
  // check agent crossing obstacles ...
  scene.obstacles.forEach ( function (obs) { obs.checkCollision (agentB)} );
  scene.obstacles.forEach ( function (obs) { obs.checkCollision (agentR)} );

  updateScoreBoard(agentB, agentR);

  if (scene.targets.length > 0) {
  	requestAnimationFrame(animate);
    
    
    
    
	// run the rendering loop
	/*var lastTimeMsec= null;
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
        console.log("here?");
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})*/
  }
  else {
    updateScoreBoard(agentB, agentR);
    counting = false;
  	alert ('                                            << game over >>' + '\n\n                                  Time Consuming : ' + minute + ' : ' + second + ' : ' + msecond + '\n\n                                 ' + agentB.name + " : " + agentB.score + '      ' + agentR.name + ' : ' + agentR.score);
  }
  deltaTime = clock.getDelta();
  totalTime += deltaTime;
  update();
  render();
  updateScoreBoard(agentB, agentR);
}

