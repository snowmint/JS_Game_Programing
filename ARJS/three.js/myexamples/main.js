/////////////////////////////////////////////////////////
// global variables
//var camera, renderer;
var agent;
var markerRoot;
var artoolkitMarker;
var onRenderFcts= [];
var scene, camera, renderer, clock, deltaTime, totalTime;
var arToolkitSource, arToolkitContext;
var markerRoot1, markerRoot2;
var smoothedControls;
var stats;

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
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 300;
    camera.position.y = 700;
    scene.add(camera)
    //end add camera

    //add renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    document.body.appendChild( renderer.domElement );
    //end add renderer

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
		onResize()
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
		
	let patternArray = ["no_strong", "kanji", "hiro", "no_strong", "no_strong", "no_strong", "no_strong"];
	let colorArray   = [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0000ff, 0xcc00ff, 0xcccccc];
	for (let i = 0; i < 3; i++)
	{
		markerRoot = new THREE.Group();
		scene.add(markerRoot);
		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
			type : 'pattern', patternUrl : "../../data/data/patt." + patternArray[i],
		});
	
		let mesh = new THREE.Mesh( 
			new THREE.CylinderGeometry( 0.5, 0.5, 0.2, 32 ),//new THREE.CubeGeometry(1.25,1.25,1.25), 
			new THREE.MeshBasicMaterial({color:colorArray[i], map:texture, transparent:true, opacity:0.5}) 
		);
		mesh.position.y = 1.25/2;
		markerRoot.add( mesh );
        ////////////////////////////////////////////////////////////
        // load obj
        ////////////////////////////////////////////////////////////
        // model
        var onProgress = function(xhr) {
            if (xhr.lengthComputable) {
              var percentComplete = xhr.loaded / xhr.total * 100;
              console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };
        var onError = function(xhr) {};
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('lighthouse/');
        mtlLoader.load('lighthouse.mtl', function(materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('lighthouse/');
            objLoader.load('lighthouse.obj', function(object) {
                //var theObject =  unitize (object, 20);
                theObjectAll = unitize (object, 20);
                //yellow_box = new THREE.BoxHelper (theObjectAll);
                scene.add (theObjectAll);				
                //scene.add (yellow_box);
                //////// MATERIAL ADJUSTMENT for porsche ///////////////
                // transparent window: double-side fix
                object.traverse (
                    function(mesh) {
                        if (mesh instanceof THREE.Mesh) {
                            mesh.material.side = THREE.DoubleSide;
                        }
                    }
                );
            }, onProgress, onError);
        });
        /*function onProgress(xhr) { console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ); }
        function onError(xhr) { console.log( 'An error happened' ); }

        new THREE.MTLLoader()
            .setPath( './lighthouse/' )
            .load( 'lighthouse.mtl', function ( materials ) {
                materials.preload();
                new THREE.OBJLoader()
                    .setMaterials( materials )
                    .setPath( './models/' )
                    .load( 'lighthouse.obj', function ( group ) {
                        mesh0 = group.children[0];
                        mesh0.material.side = THREE.DoubleSide;
                        mesh0.position.y = 0.25;
                        mesh0.scale.set(0.25,0.25,0.25);
                        markerRoot.add(mesh0);
                    }, onProgress, onError );
            });*/
    }
    
    
    ////////////////////////////////////////////////////////////
	// setup smoothedRoot
	////////////////////////////////////////////////////////////
    // interpolates from last position to create smoother transitions when moving.
	// parameter lerp values near 0 are slow, near 1 are fast (instantaneous).
	let smoothedRoot = new THREE.Group();
	scene.add(smoothedRoot);
	smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.8,
		lerpQuaternion: 0.8,
		lerpScale: 1,
		// minVisibleDelay: 1,
		// minUnvisibleDelay: 1,
	});

	let geometry1	= new THREE.CubeGeometry(1,1,1);
	let material1	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.3,
		side: THREE.DoubleSide
	}); 
	
	mesh1 = new THREE.Mesh( geometry1, material1 );
	mesh1.position.y = 0.5;
	
	// markerRoot1.add( mesh1 );
	smoothedRoot.add( mesh1 );
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
		
	// additional code for smoothed controls
	smoothedControls.update(markerRoot);
  
    console.log("here?");
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
  update();
  render();
  updateScoreBoard(agentB, agentR);
}

function render() {
  renderer.render(scene, camera);
}